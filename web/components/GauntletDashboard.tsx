"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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

  const clearDemoTimers = () => {
    for (const timer of demoTimersRef.current) {
      window.clearTimeout(timer);
    }

    demoTimersRef.current = [];
  };

  const queueSequence = (sequence: TimedEvent[]) => {
    for (const item of sequence) {
      const timer = window.setTimeout(() => {
        setDemoEvents((current) => [...current, item.event]);
      }, item.delayMs);

      demoTimersRef.current.push(timer);
    }
  };

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
  }, []);

  useEffect(() => {
    return () => {
      clearDemoTimers();

      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

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

  return (
    <div className="bg-grid min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="panel-shell panel-enter flex flex-col gap-5 p-5 lg:flex-row lg:items-end lg:justify-between lg:p-6">
          <div className="max-w-3xl space-y-3">
            <p className="capsule w-fit bg-white/5 text-white/72">
              <span className="capsule-dot bg-[var(--accent)]" />
              Voice agent red-team control room
            </p>
            <div className="space-y-2">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                GAUNTLET shows the jailbreak, then shows the fix.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                The dashboard is set up around the demo moments in{" "}
                <span className="font-mono text-slate-100">roles/fe-dashboard.md</span>:
                attack feed on the left, transcript and evidence in the middle,
                and the score swing plus CaMeL control on the right.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  streamMode === "demo"
                    ? "border-emerald-300/40 bg-emerald-300/12 text-emerald-50"
                    : "border-white/12 bg-white/4 text-slate-300 hover:border-white/22 hover:text-white"
                }`}
                onClick={startDemoRun}
                type="button"
              >
                Demo tape
              </button>
              <button
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  streamMode === "live"
                    ? "border-cyan-300/40 bg-cyan-300/12 text-cyan-50"
                    : "border-white/12 bg-white/4 text-slate-300 hover:border-white/22 hover:text-white"
                }`}
                onClick={startLiveRun}
                type="button"
              >
                Live SSE
              </button>
              <button
                className="rounded-full border border-white/12 bg-white/4 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/24 hover:bg-white/8"
                onClick={startDemoRun}
                type="button"
              >
                Replay intro
              </button>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-300">{modeMessage}</p>
          </div>
        </header>

        <main className="grid flex-1 gap-4 xl:grid-cols-[0.95fr_1.35fr_0.9fr]">
          <AttackFeed
            attacks={snapshot.attacks}
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
