"use client";

import { useEffect, useRef, useState } from "react";
import AttackFeed from "@/components/AttackFeed";
import AttackPicker from "@/components/AttackPicker";
import GauntletMark from "@/components/GauntletMark";
import RiskReport from "@/components/RiskReport";
import SponsorFooter from "@/components/SponsorFooter";
import Transcript from "@/components/Transcript";
import { useSSE } from "@/hooks/useSSE";
import type { CitationLookup } from "@/lib/citation-types";
import {
  attackChoiceLookup,
  attackChoices,
  buildCamelRunSequence,
  buildDemoRunSequence,
  type TimedEvent,
} from "@/lib/demo-data";
import {
  buildDashboardSnapshot,
  type AttackKind,
  type DashboardAttack,
  type ReportReadyEvent,
  type SSEEvent,
} from "@/lib/events";

type StreamMode = "demo" | "live";
type TargetMode = "vulnerable" | "camel";

type GauntletDashboardProps = {
  citationLookup: CitationLookup;
  modeToggleUrl: string;
  sseUrl: string;
};

export default function GauntletDashboard({
  citationLookup,
  modeToggleUrl,
  sseUrl,
}: GauntletDashboardProps) {
  const attackRunUrl = sseUrl.replace(/\/events\/?$/, "/attack/run");

  const [streamMode, setStreamMode] = useState<StreamMode>("demo");
  const [targetMode, setTargetMode] = useState<TargetMode>("vulnerable");
  const [demoEvents, setDemoEvents] = useState<SSEEvent[]>([]);
  const [selectedAttackKind, setSelectedAttackKind] = useState<AttackKind | null>(
    null,
  );
  const [comparisonReport, setComparisonReport] = useState<ReportReadyEvent | null>(
    null,
  );
  const [isApplyingCaMeL, setIsApplyingCaMeL] = useState(false);
  const [fixMomentActive, setFixMomentActive] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const demoTimersRef = useRef<number[]>([]);
  const flashTimerRef = useRef<number | null>(null);

  const liveStream = useSSE(sseUrl, streamMode === "live");
  const events = streamMode === "demo" ? demoEvents : liveStream.events;
  const snapshot = buildDashboardSnapshot(events, citationLookup);

  const edition = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  function clearDemoTimers() {
    for (const timer of demoTimersRef.current) {
      window.clearTimeout(timer);
    }

    demoTimersRef.current = [];
  }

  function clearFlashTimer() {
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
  }

  function queueSequence(sequence: TimedEvent[]) {
    for (const item of sequence) {
      const timer = window.setTimeout(() => {
        setDemoEvents((current) => [...current, item.event]);
      }, item.delayMs);

      demoTimersRef.current.push(timer);
    }
  }

  useEffect(() => {
    return () => {
      clearDemoTimers();
      clearFlashTimer();
    };
  }, []);

  function handleStartAttack(kind: AttackKind) {
    clearDemoTimers();
    clearFlashTimer();
    setFixMomentActive(false);
    setStreamMode("demo");
    setTargetMode("vulnerable");
    setDemoEvents([]);
    setSelectedAttackKind(kind);
    setComparisonReport(null);
    setIsApplyingCaMeL(false);
    setStatusNotice(null);
    queueSequence(buildDemoRunSequence(kind));
  }

  async function handleStartLiveAttack(kind: AttackKind) {
    clearDemoTimers();
    clearFlashTimer();
    setFixMomentActive(false);
    setStreamMode("live");
    setTargetMode("vulnerable");
    setDemoEvents([]);
    setSelectedAttackKind(kind);
    setComparisonReport(null);
    setIsApplyingCaMeL(false);
    setStatusNotice(null);

    try {
      await fetch(attackRunUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attack_class: kind, max_attacks: 10 }),
      });
    } catch {
      setStatusNotice("Could not reach the attack service.");
    }
  }

  function handleStartLive() {
    clearDemoTimers();
    clearFlashTimer();
    setFixMomentActive(false);
    setStreamMode("live");
    setTargetMode("vulnerable");
    setDemoEvents([]);
    setSelectedAttackKind(null);
    setComparisonReport(null);
    setIsApplyingCaMeL(false);
    setStatusNotice(null);
  }

  function handleReset() {
    clearDemoTimers();
    clearFlashTimer();
    setFixMomentActive(false);
    setStreamMode("demo");
    setTargetMode("vulnerable");
    setDemoEvents([]);
    setSelectedAttackKind(null);
    setComparisonReport(null);
    setIsApplyingCaMeL(false);
    setStatusNotice(null);
  }

  const handleApplyCaMeL = async () => {
    const activeKind = snapshot.activeAttackKind ?? selectedAttackKind;

    if (
      isApplyingCaMeL ||
      !activeKind ||
      !snapshot.currentReport ||
      targetMode === "camel"
    ) {
      return;
    }

    setIsApplyingCaMeL(true);
    setComparisonReport(snapshot.currentReport);
    setTargetMode("camel");
    setFixMomentActive(true);
    setStatusNotice(null);
    clearFlashTimer();

    flashTimerRef.current = window.setTimeout(() => {
      setFixMomentActive(false);
    }, 1800);

    let requestSucceeded = false;

    try {
      const response = await fetch(modeToggleUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: "camel" }),
      });

      requestSucceeded = response.ok;
    } catch {
      requestSucceeded = false;
    }

    if (streamMode === "demo") {
      clearDemoTimers();
      setDemoEvents([]);
      queueSequence(buildCamelRunSequence(activeKind));
    } else if (!requestSucceeded) {
      setTargetMode("vulnerable");
      setStatusNotice("Defense control is unavailable.");
    } else {
      setStatusNotice("Defense rerun requested.");
      try {
        await fetch(attackRunUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attack_class: activeKind, max_attacks: 10 }),
        });
      } catch {
        setStatusNotice("Defense rerun could not be triggered.");
      }
    }

    setIsApplyingCaMeL(false);
  };

  // --- Keyboard shortcuts: 1/2/3 pick attacks, C apply CaMeL, R reset ---
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (event.key === "1" || event.key === "2" || event.key === "3") {
        const option = attackChoices[Number(event.key) - 1];
        if (option) {
          if (streamMode === "live") {
            handleStartLiveAttack(option.kind);
          } else {
            handleStartAttack(option.kind);
          }
        }
      } else if (event.key.toLowerCase() === "c") {
        handleApplyCaMeL();
      } else if (event.key.toLowerCase() === "r") {
        handleReset();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamMode, selectedAttackKind, targetMode, snapshot.activeAttackKind]);

  const featuredAttack: DashboardAttack | null =
    [...snapshot.attacks].reverse().find((attack) => attack.verdict?.exploited) ??
    snapshot.attacks.at(-1) ??
    null;
  const activeAttackKind = snapshot.activeAttackKind ?? selectedAttackKind;
  const attackTitle = activeAttackKind
    ? attackChoiceLookup[activeAttackKind].title
    : null;
  const runKey =
    snapshot.activeRunId ??
    `${streamMode}-${selectedAttackKind ?? "idle"}-${targetMode}`;
  const reportBaseline = snapshot.previousReport ?? comparisonReport;
  const statusLine = (() => {
    if (statusNotice) return statusNotice;

    if (streamMode === "live") {
      if (liveStream.error) return liveStream.error;
      if (liveStream.status === "connecting")
        return "Connecting to the live event stream.";
      if (liveStream.status === "live") {
        return attackTitle
          ? `Live ${attackTitle.toLowerCase()} events arriving.`
          : "Listening for live attack events.";
      }
      return "Switch to live when the runtime is ready.";
    }

    if (!selectedAttackKind && snapshot.attacks.length === 0) {
      return "Choose an attack to begin.";
    }

    if (targetMode === "camel") return "Defense rerun active.";
    if (attackTitle) return `Running ${attackTitle.toLowerCase()}.`;
    return "Choose an attack to begin.";
  })();

  return (
    <div className="bg-grid min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="masthead-plate panel-enter flex flex-col gap-5">
          {/* Masthead — newspaper-style: wordmark left, edition right, rule below */}
          <div className="flex items-end justify-between gap-4 pb-4">
            <div className="flex items-center gap-4">
              <GauntletMark size="md" />
              <span className="hidden h-6 w-px bg-[color:var(--rule-strong)] sm:inline-block" />
              <p className="byline hidden sm:block">
                Voice-agent red team, on the record.
              </p>
            </div>

            <div className="flex flex-col items-end gap-1 text-right">
              <p className="overline">Dispatch № 01</p>
              <p className="byline" suppressHydrationWarning>
                {edition}
              </p>
            </div>
          </div>

          <hr className="rule-double m-0 border-0" />

          {/* Editorial headline block */}
          <div className="grid gap-6 pt-2 lg:grid-cols-[1.55fr_1fr]">
            <div>
              <h1
                className="display editorial-copy text-[color:var(--paper)]"
                style={{
                  fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
                  lineHeight: 1.02,
                }}
              >
                Choose the attack.<br />
                <span className="display-italic">Show the exploit.</span><br />
                Harden the rerun.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-[color:var(--paper-dim)] sm:text-lg sm:leading-8">
                Three columns keep the opening move, the evidence, and the score
                swing in view from the first click. Pick a scenario, watch it
                land, then deploy the trusted-boundary fix and rerun live.
              </p>
            </div>

            {/* Status byline */}
            <aside className="flex flex-col gap-3 rounded-xl border border-[color:var(--rule)] bg-[color:var(--ink-2)]/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    streamMode === "live"
                      ? "capsule capsule-cold"
                      : "capsule"
                  }
                >
                  <span
                    className={`capsule-dot ${
                      streamMode === "live"
                        ? liveStream.status === "live"
                          ? "bg-[color:var(--signal-green)]"
                          : liveStream.status === "connecting"
                            ? "bg-[color:var(--signal-amber)]"
                            : "bg-[color:var(--signal-red)]"
                        : "bg-[color:var(--paper-dim)]"
                    }`}
                  />
                  {streamMode === "demo" ? "Demo run" : "Live run"}
                </span>
                <span
                  className={
                    targetMode === "camel"
                      ? "capsule capsule-green"
                      : "capsule capsule-red"
                  }
                >
                  <span
                    className={`capsule-dot ${
                      targetMode === "camel"
                        ? "bg-[color:var(--signal-green)]"
                        : "bg-[color:var(--signal-red)]"
                    }`}
                  />
                  {targetMode === "camel" ? "CaMeL active" : "Vulnerable path"}
                </span>
              </div>

              <p className="min-h-[1.5rem] text-sm leading-6 text-[color:var(--paper)]">
                {statusLine}
              </p>

              <div className="flex flex-wrap items-center gap-2 border-t border-[color:var(--rule)] pt-3">
                <button
                  className={`rounded-full border px-3.5 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] transition ${
                    streamMode === "demo"
                      ? "border-[color:var(--gold-line)] bg-[color:var(--gold-soft)] text-[color:#f0d49b]"
                      : "border-[color:var(--rule-strong)] bg-transparent text-[color:var(--paper-dim)] hover:border-[color:var(--rule-strong)] hover:text-[color:var(--paper)]"
                  }`}
                  onClick={() => setStreamMode("demo")}
                  type="button"
                >
                  Demo
                </button>
                <button
                  className={`rounded-full border px-3.5 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] transition ${
                    streamMode === "live"
                      ? "capsule-cold border-[color:rgba(123,174,255,0.4)] bg-[rgba(123,174,255,0.12)] text-[#d7e4ff]"
                      : "border-[color:var(--rule-strong)] bg-transparent text-[color:var(--paper-dim)] hover:text-[color:var(--paper)]"
                  }`}
                  onClick={handleStartLive}
                  type="button"
                >
                  Live
                </button>
                <button
                  className="rounded-full border border-[color:var(--rule-strong)] bg-transparent px-3.5 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--paper-dim)] transition hover:text-[color:var(--paper)]"
                  onClick={handleReset}
                  type="button"
                >
                  Reset
                </button>

                <span className="ml-auto flex items-center gap-2 text-[color:var(--paper-mute)]">
                  <span className="kbd">1</span>
                  <span className="kbd">2</span>
                  <span className="kbd">3</span>
                  <span className="hidden font-mono text-[0.64rem] uppercase tracking-[0.18em] sm:inline">
                    attacks
                  </span>
                  <span className="kbd ml-1">C</span>
                  <span className="hidden font-mono text-[0.64rem] uppercase tracking-[0.18em] sm:inline">
                    camel
                  </span>
                  <span className="kbd ml-1">R</span>
                  <span className="hidden font-mono text-[0.64rem] uppercase tracking-[0.18em] sm:inline">
                    reset
                  </span>
                </span>
              </div>
            </aside>
          </div>

          <AttackPicker
            activeKind={selectedAttackKind}
            onSelect={
              streamMode === "live" ? handleStartLiveAttack : handleStartAttack
            }
            options={attackChoices}
          />
        </header>

        <main className="grid flex-1 items-start gap-4 xl:grid-cols-[0.94fr_1.3fr_0.96fr]">
          <AttackFeed attacks={snapshot.attacks} />
          <Transcript
            key={runKey}
            attacks={snapshot.attacks}
            featuredAttack={featuredAttack}
          />
          <RiskReport
            currentReport={snapshot.currentReport}
            comparisonReport={reportBaseline}
            exploitedCount={snapshot.exploitedCount}
            fixMomentActive={fixMomentActive}
            isApplyingCaMeL={isApplyingCaMeL}
            onApplyCaMeL={handleApplyCaMeL}
            pendingCount={snapshot.pendingCount}
            targetMode={targetMode}
          />
        </main>

        <SponsorFooter />
      </div>
    </div>
  );
}
