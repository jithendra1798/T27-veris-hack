import type { Citation, CitationLookup } from "./citation-types";

export type AttackKind =
  | "prompt_injection"
  | "system_extract"
  | "tool_hijack";

type RunScopedEvent = {
  run_id?: string | null;
};

export type RunStartedEvent = {
  type: "run.started";
  run_id: string;
  attack_class?: AttackKind;
};

export type RunCompleteEvent = {
  type: "run.complete";
  run_id: string;
};

export type AttackFiredEvent = RunScopedEvent & {
  type: "attack.fired";
  id: string;
  persona: string;
  text: string;
  attack_class: AttackKind;
  audio_url: string | null;
};

export type VerdictReadyEvent = RunScopedEvent & {
  type: "verdict.ready";
  attack_id: string;
  exploited: boolean;
  class: AttackKind;
  evidence: string;
};

export type ReportReadyEvent = RunScopedEvent & {
  type: "report.ready";
  score: number;
  vulnerabilities: number;
  top_classes: AttackKind[];
};

export type SSEEvent =
  | RunStartedEvent
  | RunCompleteEvent
  | AttackFiredEvent
  | VerdictReadyEvent
  | ReportReadyEvent;

export function isSSEEvent(payload: unknown): payload is SSEEvent {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const obj = payload as Record<string, unknown>;

  if (typeof obj.type !== "string") {
    return false;
  }

  switch (obj.type) {
    case "run.started":
      return typeof obj.run_id === "string";
    case "run.complete":
      return typeof obj.run_id === "string";
    case "attack.fired":
      return (
        typeof obj.id === "string" &&
        typeof obj.persona === "string" &&
        typeof obj.text === "string" &&
        typeof obj.attack_class === "string" &&
        (typeof obj.audio_url === "string" ||
          obj.audio_url === null ||
          typeof obj.audio_url === "undefined")
      );
    case "verdict.ready":
      return (
        typeof obj.attack_id === "string" &&
        typeof obj.exploited === "boolean" &&
        typeof obj.class === "string" &&
        typeof obj.evidence === "string"
      );
    case "report.ready":
      return (
        typeof obj.score === "number" &&
        typeof obj.vulnerabilities === "number" &&
        Array.isArray(obj.top_classes)
      );
    default:
      return false;
  }
}

export type DashboardAttack = {
  id: string;
  persona: string;
  text: string;
  attack_class: AttackKind;
  audio_url: string | null;
  run_id: string | null;
  verdict: {
    exploited: boolean;
    class: AttackKind;
    evidence: string;
  } | null;
  citations: Citation[];
};

export type DashboardSnapshot = {
  activeAttackKind: AttackKind | null;
  activeRunId: string | null;
  attacks: DashboardAttack[];
  containedCount: number;
  currentReport: ReportReadyEvent | null;
  evidenceAttacks: DashboardAttack[];
  exploitedCount: number;
  pendingCount: number;
  previousReport: ReportReadyEvent | null;
};

function belongsToActiveRun(event: RunScopedEvent, activeRunId: string | null) {
  if (!activeRunId) {
    return true;
  }

  return !event.run_id || event.run_id === activeRunId;
}

export function buildDashboardSnapshot(
  events: SSEEvent[],
  citationLookup: CitationLookup,
): DashboardSnapshot {
  const latestRunStartIndex = events.findLastIndex(
    (event) => event.type === "run.started",
  );
  const scopedEvents =
    latestRunStartIndex >= 0 ? events.slice(latestRunStartIndex) : events;
  const pendingVerdicts = new Map<string, VerdictReadyEvent>();
  const attackMap = new Map<string, DashboardAttack>();
  const reports: ReportReadyEvent[] = [];
  let activeRunId: string | null = null;
  let activeAttackKind: AttackKind | null = null;

  for (const event of scopedEvents) {
    if (event.type === "run.started") {
      activeRunId = event.run_id;
      activeAttackKind = event.attack_class ?? null;
      attackMap.clear();
      pendingVerdicts.clear();
      reports.length = 0;
      continue;
    }

    if (event.type === "run.complete") {
      if (activeRunId && event.run_id !== activeRunId) {
        continue;
      }

      continue;
    }

    if (!belongsToActiveRun(event, activeRunId)) {
      continue;
    }

    switch (event.type) {
      case "attack.fired": {
        const citations = citationLookup[event.attack_class] ?? [];
        const attack: DashboardAttack = {
          id: event.id,
          persona: event.persona,
          text: event.text,
          attack_class: event.attack_class,
          audio_url: event.audio_url,
          run_id: event.run_id ?? activeRunId,
          verdict: null,
          citations,
        };

        if (!activeAttackKind) {
          activeAttackKind = event.attack_class;
        }

        const pendingVerdict = pendingVerdicts.get(event.id);
        if (pendingVerdict) {
          attack.verdict = {
            exploited: pendingVerdict.exploited,
            class: pendingVerdict.class,
            evidence: pendingVerdict.evidence,
          };
          pendingVerdicts.delete(event.id);
        }

        attackMap.set(event.id, attack);
        break;
      }
      case "verdict.ready": {
        const existing = attackMap.get(event.attack_id);

        if (existing) {
          existing.verdict = {
            exploited: event.exploited,
            class: event.class,
            evidence: event.evidence,
          };
        } else {
          pendingVerdicts.set(event.attack_id, event);
        }
        break;
      }
      case "report.ready":
        reports.push(event);
        break;
    }
  }

  const attacks = Array.from(attackMap.values());
  const exploitedCount = attacks.filter((attack) => attack.verdict?.exploited).length;
  const containedCount = attacks.filter(
    (attack) => attack.verdict && !attack.verdict.exploited,
  ).length;
  const pendingCount = attacks.filter((attack) => !attack.verdict).length;
  const evidenceAttacks = attacks.filter(
    (attack) => attack.verdict?.exploited && attack.verdict.evidence,
  );

  return {
    activeAttackKind,
    activeRunId,
    attacks,
    containedCount,
    currentReport: reports.at(-1) ?? null,
    evidenceAttacks,
    exploitedCount,
    pendingCount,
    previousReport: reports.length >= 2 ? (reports.at(-2) ?? null) : null,
  };
}
