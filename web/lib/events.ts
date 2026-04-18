import type { Citation, CitationLookup } from "./citation-types";

// ---------------------------------------------------------------------------
// SSE event shapes — mirrors docs/sse-contract.md
// ---------------------------------------------------------------------------

export type AttackFiredEvent = {
  type: "attack.fired";
  id: string;
  persona: string;
  text: string;
  attack_class: string;
  audio_url: string | null;
};

export type VerdictReadyEvent = {
  type: "verdict.ready";
  attack_id: string;
  exploited: boolean;
  class: string;
  evidence: string;
};

export type ReportReadyEvent = {
  type: "report.ready";
  score: number;
  vulnerabilities: number;
  top_classes: string[];
};

export type SSEEvent = AttackFiredEvent | VerdictReadyEvent | ReportReadyEvent;

// ---------------------------------------------------------------------------
// Type guard — used by useSSE to validate incoming payloads
// ---------------------------------------------------------------------------

export function isSSEEvent(payload: unknown): payload is SSEEvent {
  if (typeof payload !== "object" || payload === null) return false;

  const obj = payload as Record<string, unknown>;

  if (typeof obj.type !== "string") return false;

  switch (obj.type) {
    case "attack.fired":
      return (
        typeof obj.id === "string" &&
        typeof obj.persona === "string" &&
        typeof obj.text === "string" &&
        typeof obj.attack_class === "string"
      );
    case "verdict.ready":
      return (
        typeof obj.attack_id === "string" &&
        typeof obj.exploited === "boolean" &&
        typeof obj.class === "string"
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

// ---------------------------------------------------------------------------
// Dashboard projection — turns a flat event list into panel-ready state
// ---------------------------------------------------------------------------

export type DashboardAttack = {
  id: string;
  persona: string;
  text: string;
  attack_class: string;
  audio_url: string | null;
  verdict: {
    exploited: boolean;
    class: string;
    evidence: string;
  } | null;
  citations: Citation[];
};

export type DashboardSnapshot = {
  attacks: DashboardAttack[];
  exploitedCount: number;
  containedCount: number;
  pendingCount: number;
  currentReport: ReportReadyEvent | null;
  previousReport: ReportReadyEvent | null;
  evidenceAttacks: DashboardAttack[];
};

export function buildDashboardSnapshot(
  events: SSEEvent[],
  citationLookup: CitationLookup,
): DashboardSnapshot {
  const attackMap = new Map<string, DashboardAttack>();
  const reports: ReportReadyEvent[] = [];

  for (const event of events) {
    switch (event.type) {
      case "attack.fired": {
        const citations = citationLookup[event.attack_class] ?? [];
        attackMap.set(event.id, {
          id: event.id,
          persona: event.persona,
          text: event.text,
          attack_class: event.attack_class,
          audio_url: event.audio_url,
          verdict: null,
          citations,
        });
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
        }
        break;
      }
      case "report.ready": {
        reports.push(event);
        break;
      }
    }
  }

  const attacks = Array.from(attackMap.values());
  const exploitedCount = attacks.filter((a) => a.verdict?.exploited).length;
  const containedCount = attacks.filter(
    (a) => a.verdict && !a.verdict.exploited,
  ).length;
  const pendingCount = attacks.filter((a) => !a.verdict).length;
  const evidenceAttacks = attacks.filter(
    (a) => a.verdict?.exploited && a.verdict.evidence,
  );

  return {
    attacks,
    exploitedCount,
    containedCount,
    pendingCount,
    currentReport: reports.at(-1) ?? null,
    previousReport: reports.length >= 2 ? reports.at(-2)! : null,
    evidenceAttacks,
  };
}
