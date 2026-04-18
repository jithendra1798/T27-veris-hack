"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import AttackFeed from "@/components/AttackFeed";
import AttackPicker from "@/components/AttackPicker";
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
  const [showCaMeLFlash, setShowCaMeLFlash] = useState(false);
  const [showCamelImage, setShowCamelImage] = useState(true);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const demoTimersRef = useRef<number[]>([]);
  const flashTimerRef = useRef<number | null>(null);

  const liveStream = useSSE(sseUrl, streamMode === "live");
  const events = streamMode === "demo" ? demoEvents : liveStream.events;
  const snapshot = buildDashboardSnapshot(events, citationLookup);

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
    setShowCaMeLFlash(false);
    setShowCamelImage(true);
    setStreamMode("demo");
    setTargetMode("vulnerable");
    setDemoEvents([]);
    setSelectedAttackKind(kind);
    setComparisonReport(null);
    setIsApplyingCaMeL(false);
    setStatusNotice(null);
    queueSequence(buildDemoRunSequence(kind));
  }

  function handleStartLive() {
    clearDemoTimers();
    clearFlashTimer();
    setShowCaMeLFlash(false);
    setShowCamelImage(true);
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
    setShowCaMeLFlash(false);
    setShowCamelImage(true);
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
    setShowCaMeLFlash(true);
    setShowCamelImage(true);
    setStatusNotice(null);
    clearFlashTimer();

    flashTimerRef.current = window.setTimeout(() => {
      setShowCaMeLFlash(false);
    }, 2200);

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
    }

    setIsApplyingCaMeL(false);
  };

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
    if (statusNotice) {
      return statusNotice;
    }

    if (streamMode === "live") {
      if (liveStream.error) {
        return liveStream.error;
      }

      if (liveStream.status === "connecting") {
        return "Connecting to the live event stream.";
      }

      if (liveStream.status === "live") {
        return attackTitle
          ? `Live ${attackTitle.toLowerCase()} events are arriving.`
          : "Listening for live attack events.";
      }

      return "Switch to live when the runtime is ready.";
    }

    if (!selectedAttackKind && snapshot.attacks.length === 0) {
      return "Choose an attack to begin.";
    }

    if (targetMode === "camel") {
      return "Defense rerun active.";
    }

    if (attackTitle) {
      return `Running ${attackTitle.toLowerCase()}.`;
    }

    return "Choose an attack to begin.";
  })();

  return (
    <div className="bg-grid min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="panel-shell panel-enter stage-header px-4 py-4 sm:px-5 lg:px-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="capsule w-fit bg-white/5 text-white/72">
                  <span className="capsule-dot bg-[var(--accent)] status-beacon" />
                  Veris voice agent gauntlet
                </p>
                <h1 className="editorial-copy mt-3 text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl lg:text-[3rem]">
                  Choose the attack, show the exploit, then harden the rerun.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200/88 sm:text-base">
                  Three projector-ready panels keep the opening move, the evidence,
                  and the score swing in view from the first click.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <p className="capsule bg-white/4 text-slate-200">
                  <span
                    className={`capsule-dot ${
                      streamMode === "live"
                        ? liveStream.status === "live"
                          ? "bg-emerald-300"
                          : liveStream.status === "connecting"
                            ? "bg-amber-300"
                            : "bg-rose-300"
                        : "bg-cyan-300"
                    }`}
                  />
                  {streamMode === "demo" ? "Demo" : "Live"}
                </p>
                <p
                  className={`capsule ${
                    targetMode === "camel"
                      ? "border-emerald-300/24 bg-emerald-300/10 text-emerald-50"
                      : "border-rose-300/24 bg-rose-300/10 text-rose-50"
                  }`}
                >
                  <span
                    className={`capsule-dot ${
                      targetMode === "camel" ? "bg-emerald-300" : "bg-rose-300"
                    }`}
                  />
                  {targetMode === "camel" ? "CaMeL active" : "Vulnerable path"}
                </p>
              </div>
            </div>

            <AttackPicker
              activeKind={selectedAttackKind}
              onSelect={handleStartAttack}
              options={attackChoices}
            />

            <div className="operator-strip flex flex-col gap-3 rounded-[1.35rem] border border-white/10 bg-black/18 p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-h-[1.5rem] text-sm leading-6 text-slate-200">
                {statusLine}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    streamMode === "demo"
                      ? "border-emerald-300/40 bg-emerald-300/14 text-emerald-50"
                      : "border-white/12 bg-white/4 text-slate-300 hover:border-white/22 hover:text-white"
                  }`}
                  onClick={() => setStreamMode("demo")}
                  type="button"
                >
                  Demo
                </button>
                <button
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    streamMode === "live"
                      ? "border-cyan-300/40 bg-cyan-300/14 text-cyan-50"
                      : "border-white/12 bg-white/4 text-slate-300 hover:border-white/22 hover:text-white"
                  }`}
                  onClick={handleStartLive}
                  type="button"
                >
                  Live
                </button>
                <button
                  className="rounded-full border border-white/12 bg-white/4 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/24 hover:bg-white/8"
                  onClick={handleReset}
                  type="button"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="grid flex-1 items-start gap-4 xl:grid-cols-[0.94fr_1.3fr_0.9fr]">
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
            isApplyingCaMeL={isApplyingCaMeL}
            onApplyCaMeL={handleApplyCaMeL}
            pendingCount={snapshot.pendingCount}
            targetMode={targetMode}
          />
        </main>

        <SponsorFooter />
      </div>

      {showCaMeLFlash ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(4,10,18,0.84)] p-4 backdrop-blur-md">
          <div className="panel-shell w-full max-w-4xl overflow-hidden border-emerald-300/28 bg-[linear-gradient(135deg,rgba(53,213,166,0.18),rgba(6,17,28,0.92))] p-6 shadow-[0_40px_120px_rgba(53,213,166,0.18)]">
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-3">
                <p className="capsule w-fit border-emerald-300/24 bg-emerald-300/10 text-emerald-50">
                  <span className="capsule-dot bg-emerald-300" />
                  CaMeL boundary live
                </p>
                <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white">
                  The trusted boundary is now in the loop.
                </h2>
                <p className="max-w-xl text-sm leading-7 text-emerald-50/85 sm:text-base">
                  Re-running the selected attack through CaMeL isolates the unsafe
                  instruction path before it reaches the agent.
                </p>
              </div>

              <div className="metric-card flex min-h-[220px] items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
                {showCamelImage ? (
                  <div className="relative h-full min-h-[220px] w-full overflow-hidden rounded-[1rem]">
                    <Image
                      alt="CaMeL architecture diagram"
                      className="object-cover"
                      fill
                      onError={() => setShowCamelImage(false)}
                      sizes="(min-width: 1024px) 30vw, 100vw"
                      src="/api/camel-diagram"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-[1rem] border border-dashed border-white/18 bg-black/18 p-6 text-center">
                    <p className="font-mono text-[0.72rem] uppercase tracking-[0.22em] text-emerald-100">
                      Boundary diagram
                    </p>
                    <p className="mt-3 max-w-xs text-sm leading-7 text-slate-200">
                      The rerun is moving through the trusted boundary before the next
                      verdict is scored.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
