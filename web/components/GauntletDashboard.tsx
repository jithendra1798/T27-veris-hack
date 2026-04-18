"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import AttackFeed from "@/components/AttackFeed";
import RiskReport from "@/components/RiskReport";
import SponsorFooter from "@/components/SponsorFooter";
import Transcript from "@/components/Transcript";
import { useSSE } from "@/hooks/useSSE";
import type { CitationLookup } from "@/lib/citation-types";
import {
  demoCamelSequence,
  demoOpeningSequence,
  type TimedEvent,
} from "@/lib/demo-data";
import {
  buildDashboardSnapshot,
  type DashboardAttack,
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
  const [isApplyingCaMeL, setIsApplyingCaMeL] = useState(false);
  const [showCaMeLFlash, setShowCaMeLFlash] = useState(false);
  const [modeMessage, setModeMessage] = useState(
    "Replay the vulnerable run while the backend comes online.",
  );
  const [camelSequenceQueued, setCamelSequenceQueued] = useState(false);
  const [showCamelImage, setShowCamelImage] = useState(true);
  const demoTimersRef = useRef<number[]>([]);
  const flashTimerRef = useRef<number | null>(null);

  const liveStream = useSSE(sseUrl, streamMode === "live");
  const events = streamMode === "demo" ? demoEvents : liveStream.events;
  const snapshot = buildDashboardSnapshot(events, citationLookup);

  const clearDemoTimers = useCallback(() => {
    for (const timer of demoTimersRef.current) {
      window.clearTimeout(timer);
    }

    demoTimersRef.current = [];
  }, []);

  const queueSequence = useCallback((sequence: TimedEvent[]) => {
    for (const item of sequence) {
      const timer = window.setTimeout(() => {
        setDemoEvents((current) => [...current, item.event]);
      }, item.delayMs);

      demoTimersRef.current.push(timer);
    }
  }, []);

  const startDemoRun = () => {
    clearDemoTimers();
    setStreamMode("demo");
    setTargetMode("vulnerable");
    setDemoEvents([]);
    setCamelSequenceQueued(false);
    setShowCamelImage(true);
    setModeMessage("Demo tape is replaying the vulnerable run.");
    queueSequence(demoOpeningSequence);
  };

  const startLiveRun = () => {
    clearDemoTimers();
    setStreamMode("live");
    setModeMessage("Listening for live events from BE1's SSE stream.");
  };

  useEffect(() => {
    queueSequence(demoOpeningSequence);

    return () => {
      clearDemoTimers();
    };
  }, [queueSequence, clearDemoTimers]);

  useEffect(() => {
    return () => {
      clearDemoTimers();

      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, [clearDemoTimers]);

  const handleApplyCaMeL = async () => {
    if (isApplyingCaMeL) {
      return;
    }

    setIsApplyingCaMeL(true);
    setTargetMode("camel");
    setShowCaMeLFlash(true);
    setShowCamelImage(true);

    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
    }

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

      if (!response.ok) {
        throw new Error(`Mode toggle returned ${response.status}`);
      }

      requestSucceeded = true;
    } catch {
      requestSucceeded = false;
    }

    if (streamMode === "demo" && !camelSequenceQueued) {
      queueSequence(demoCamelSequence);
      setCamelSequenceQueued(true);
      setModeMessage(
        requestSucceeded
          ? "CaMeL applied live and the safe re-run is queued."
          : "CaMeL flash is running locally until BE2's endpoint is ready.",
      );
    } else if (requestSucceeded) {
      setModeMessage("CaMeL mode sent to BE2. Waiting for the next live verdict.");
    } else {
      setModeMessage(
        "Live mode toggle did not answer yet. The dashboard is still ready for demo styling work.",
      );
    }

    setIsApplyingCaMeL(false);
  };

  const featuredAttack: DashboardAttack | null =
    [...snapshot.attacks].reverse().find((attack) => attack.verdict?.exploited) ??
    snapshot.attacks.at(-1) ??
    null;
  const score = snapshot.currentReport?.score ?? 0;
  const vulnerabilities =
    snapshot.currentReport?.vulnerabilities ?? snapshot.exploitedCount;
  const headerStats = [
    {
      detail: vulnerabilities > 1 ? "pressure is visible" : "tightened posture",
      label: "Risk score",
      tone:
        score >= 6
          ? "text-rose-50"
          : score >= 3
            ? "text-amber-50"
            : "text-emerald-50",
      value: score.toFixed(1),
    },
    {
      detail: snapshot.pendingCount > 0 ? "still evaluating" : "all routed",
      label: "Attack volume",
      tone: "text-cyan-50",
      value: String(snapshot.attacks.length).padStart(2, "0"),
    },
    {
      detail: targetMode === "camel" ? "trusted boundary on" : "ready to flip",
      label: "Target mode",
      tone: targetMode === "camel" ? "text-emerald-50" : "text-rose-50",
      value: targetMode === "camel" ? "CaMeL" : "Hot",
    },
  ];
  const demoMoments = [
    {
      detail: "Transcript and speakers come alive",
      time: "T+0:18",
      title: "Audio attack",
    },
    {
      detail:
        featuredAttack?.verdict?.exploited
          ? featuredAttack.attack_class.replaceAll("_", " ")
          : "Awaiting the first leak",
      time: "T+0:45",
      title: "Red strike",
    },
    {
      detail: "One-click re-run and score collapse",
      time: "T+1:15",
      title: "CaMeL flip",
    },
  ];

  return (
    <div className="bg-grid min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="panel-shell hero-panel panel-enter grid gap-5 p-5 lg:grid-cols-[1.2fr_0.92fr] lg:p-6 xl:p-7">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <p className="capsule w-fit bg-white/5 text-white/72">
                <span className="capsule-dot bg-[var(--accent)] status-beacon" />
                Voice agent red-team control room
              </p>
              <p className="capsule w-fit border-cyan-300/20 bg-cyan-300/10 text-cyan-50">
                <span className="capsule-dot bg-[var(--accent-cold)]" />
                Judges see the break, then the fix
              </p>
            </div>

            <div className="space-y-3">
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-slate-300">
                Veris scenarios, Baseten chains, VoiceRun theater, You.com research
              </p>
              <h1 className="editorial-copy max-w-4xl text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl xl:text-[3.7rem]">
                GAUNTLET turns a voice-agent exploit into a stage moment, then
                hardens it live.
              </h1>
              <p className="editorial-copy max-w-3xl text-sm leading-7 text-slate-200/88 sm:text-base">
                The layout leans into the hackathon script: attack feed on the left,
                transcript and evidence in the middle, and a control-tower risk panel
                on the right with the CaMeL flip as the headline action.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {headerStats.map((stat) => (
                <div className="header-stat" key={stat.label}>
                  <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-slate-400">
                    {stat.label}
                  </p>
                  <p
                    className={`mt-3 text-3xl font-semibold tracking-[-0.05em] ${stat.tone}`}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">{stat.detail}</p>
                </div>
              ))}
            </div>

            <div className="metric-card rounded-[1.6rem] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-slate-400">
                    Demo memory hooks
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    Three beats we want judges repeating after the room clears
                  </p>
                </div>
                <span className="rounded-full border border-white/12 bg-black/18 px-3 py-1 text-xs font-mono uppercase tracking-[0.18em] text-slate-200">
                  {featuredAttack ? featuredAttack.persona : "Queue warming"}
                </span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {demoMoments.map((moment) => (
                  <div className="moment-tile" key={moment.time}>
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-cyan-100">
                      {moment.time}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {moment.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {moment.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel-shell control-panel rounded-[1.8rem] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-slate-400">
                  Demo controls
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
                  Rehearse the room while the backend wakes up
                </h2>
              </div>
              <div className="capsule border-emerald-300/22 bg-emerald-300/10 text-emerald-50">
                <span className="capsule-dot bg-emerald-300 status-beacon" />
                {streamMode === "demo" ? "Rehearsal" : "Live pipe"}
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <button
                className={`rounded-[1.1rem] border px-4 py-3 text-sm font-medium transition ${
                  streamMode === "demo"
                    ? "border-emerald-300/40 bg-emerald-300/14 text-emerald-50"
                    : "border-white/12 bg-white/4 text-slate-300 hover:border-white/22 hover:text-white"
                }`}
                onClick={startDemoRun}
                type="button"
              >
                Demo tape
              </button>
              <button
                className={`rounded-[1.1rem] border px-4 py-3 text-sm font-medium transition ${
                  streamMode === "live"
                    ? "border-cyan-300/40 bg-cyan-300/14 text-cyan-50"
                    : "border-white/12 bg-white/4 text-slate-300 hover:border-white/22 hover:text-white"
                }`}
                onClick={startLiveRun}
                type="button"
              >
                Live SSE
              </button>
              <button
                className="rounded-[1.1rem] border border-white/12 bg-white/4 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-white/24 hover:bg-white/8"
                onClick={startDemoRun}
                type="button"
              >
                Replay intro
              </button>
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-black/22 p-4">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-slate-400">
                Operator notes
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-200">{modeMessage}</p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="metric-card rounded-[1.35rem] p-4">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-slate-400">
                  Stream source
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {streamMode === "demo" ? "Local demo tape" : "BE1 event stream"}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {streamMode === "demo" ? "Stable for rehearsal" : liveStream.status}
                </p>
              </div>

              <div className="metric-card rounded-[1.35rem] p-4">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-slate-400">
                  Focus target
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {targetMode === "camel" ? "CaMeL hardened" : "Vulnerable path"}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {targetMode === "camel"
                    ? "Trusted boundary is active"
                    : "Waiting for the one-click flip"}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {demoMoments.map((moment) => (
                <div
                  className="flex items-center justify-between rounded-[1rem] border border-white/8 bg-white/4 px-4 py-3"
                  key={`queue-${moment.time}`}
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{moment.title}</p>
                    <p className="text-sm text-slate-300">{moment.detail}</p>
                  </div>
                  <p className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-cyan-100">
                    {moment.time}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <main className="grid flex-1 gap-4 xl:grid-cols-[0.98fr_1.38fr_0.92fr]">
          <AttackFeed
            attacks={snapshot.attacks}
            containedCount={snapshot.containedCount}
            exploitedCount={snapshot.exploitedCount}
            pendingCount={snapshot.pendingCount}
            streamMode={streamMode}
            streamStatus={streamMode === "demo" ? "demo" : liveStream.status}
          />
          <Transcript attacks={snapshot.attacks} featuredAttack={featuredAttack} />
          <RiskReport
            currentReport={snapshot.currentReport}
            evidenceCount={snapshot.evidenceAttacks.length}
            exploitedCount={snapshot.exploitedCount}
            isApplyingCaMeL={isApplyingCaMeL}
            liveError={liveStream.error}
            onApplyCaMeL={handleApplyCaMeL}
            pendingCount={snapshot.pendingCount}
            previousReport={snapshot.previousReport}
            streamMode={streamMode}
            streamStatus={streamMode === "demo" ? "demo" : liveStream.status}
            targetMode={targetMode}
            totalAttacks={snapshot.attacks.length}
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
                  Frontier Agent Hackathon winner, now applied mid-demo.
                </h2>
                <p className="max-w-xl text-sm leading-7 text-emerald-50/85 sm:text-base">
                  The control plane flips the target from vulnerable to a trusted
                  and untrusted boundary. Re-run the same attack and let the score
                  fall in public.
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
                  <div className="flex h-full w-full items-center justify-center rounded-[1rem] border border-dashed border-white/18 bg-black/18 p-6 text-center text-sm leading-7 text-slate-200">
                    Drop <span className="mx-2 font-mono">assets/camel-diagram.png</span>
                    into the repo and this flash panel will pick it up automatically.
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
