"use client";

import { useEffect, useRef, useState } from "react";
import ApplyCaMeLButton from "@/components/ApplyCaMeLButton";
import type { ReportReadyEvent } from "@/lib/events";

type RiskReportProps = {
  currentReport: ReportReadyEvent | null;
  evidenceCount: number;
  exploitedCount: number;
  isApplyingCaMeL: boolean;
  liveError: string | null;
  onApplyCaMeL: () => Promise<void> | void;
  pendingCount: number;
  previousReport: ReportReadyEvent | null;
  streamMode: "demo" | "live";
  streamStatus: "connecting" | "demo" | "error" | "idle" | "live";
  targetMode: "vulnerable" | "camel";
  totalAttacks: number;
};

type AnimatedMetricProps = {
  decimals?: number;
  label: string;
  value: number;
};

function AnimatedMetric({
  decimals = 0,
  label,
  value,
}: AnimatedMetricProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousTarget = useRef(value);

  useEffect(() => {
    const start = previousTarget.current;
    const durationMs = 700;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = start + (value - start) * eased;
      setDisplayValue(nextValue);

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    previousTarget.current = value;

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <div className="metric-card rounded-[1.4rem] p-4">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
        {displayValue.toFixed(decimals)}
      </p>
    </div>
  );
}

export default function RiskReport({
  currentReport,
  evidenceCount,
  exploitedCount,
  isApplyingCaMeL,
  liveError,
  onApplyCaMeL,
  pendingCount,
  previousReport,
  streamMode,
  streamStatus,
  targetMode,
  totalAttacks,
}: RiskReportProps) {
  const score = currentReport?.score ?? 0;
  const vulnerabilities = currentReport?.vulnerabilities ?? exploitedCount;
  const riskPercent = Math.max(8, Math.min(score * 10, 100));
  const scoreDelta =
    currentReport && previousReport
      ? Number((currentReport.score - previousReport.score).toFixed(1))
      : null;
  const scoreTone =
    score >= 6
      ? "from-rose-500 via-orange-300 to-amber-200"
      : score >= 3
        ? "from-amber-400 via-yellow-300 to-emerald-200"
        : "from-emerald-500 via-cyan-300 to-cyan-100";

  return (
    <section className="panel-shell panel-enter flex min-h-[320px] flex-col p-4 sm:p-5">
      <div className="border-b border-white/10 pb-4">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
          Risk report
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
              Score swing and hardening control
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              This panel is tuned around the min 60 report and the min 75 CaMeL
              flip from the hackathon plan.
            </p>
          </div>

          <div
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
            {targetMode === "camel" ? "CaMeL active" : "Vulnerable mode"}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(6,15,27,0.76))] p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-slate-400">
              Current posture
            </p>
            <div className="mt-3 flex items-end gap-3">
              <span className="text-6xl font-semibold tracking-[-0.08em] text-white">
                {score.toFixed(1)}
              </span>
              <span className="pb-2 text-lg text-slate-300">/10</span>
            </div>
          </div>

          <div
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              scoreDelta === null
                ? "bg-white/8 text-slate-200"
                : scoreDelta <= 0
                  ? "bg-emerald-300/12 text-emerald-50"
                  : "bg-rose-300/12 text-rose-50"
            }`}
          >
            {scoreDelta === null
              ? "Waiting"
              : scoreDelta > 0
                ? `+${scoreDelta} delta`
                : `${scoreDelta} delta`}
          </div>
        </div>

        <div className="mt-5">
          <div className="relative h-3 overflow-hidden rounded-full bg-white/8">
            <div
              className={`score-meter h-full rounded-full bg-gradient-to-r ${scoreTone}`}
              style={{ width: `${riskPercent}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[0.72rem] font-mono uppercase tracking-[0.2em] text-slate-400">
            <span>Contained</span>
            <span>Judge-pause danger</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <AnimatedMetric label="Vulnerabilities" value={vulnerabilities} />
        <AnimatedMetric label="Attack volume" value={totalAttacks} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <AnimatedMetric label="Exploit hits" value={exploitedCount} />
        <AnimatedMetric label="Evidence clips" value={evidenceCount} />
        <AnimatedMetric label="Pending" value={pendingCount} />
      </div>

      <div className="mt-4 grid gap-3">
        <div className="metric-card rounded-[1.4rem] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-slate-400">
                Score delta
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Red if the system is getting riskier, green when the re-run lands.
              </p>
            </div>
            <div
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                scoreDelta === null
                  ? "bg-white/8 text-slate-200"
                  : scoreDelta <= 0
                    ? "bg-emerald-300/12 text-emerald-50"
                    : "bg-rose-300/12 text-rose-50"
              }`}
            >
              {scoreDelta === null ? "Waiting" : scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
            </div>
          </div>
        </div>

        <div className="metric-card rounded-[1.4rem] p-4">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-slate-400">
            Top classes
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(currentReport?.top_classes ?? ["prompt_injection", "system_extract", "tool_hijack"]).map(
              (attackClass) => (
                <span
                  className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-mono uppercase tracking-[0.18em] text-slate-100"
                  key={attackClass}
                >
                  {attackClass.replaceAll("_", " ")}
                </span>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[1.7rem] border border-emerald-300/18 bg-[linear-gradient(180deg,rgba(53,213,166,0.14),rgba(7,18,28,0.8))] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-emerald-100">
              Defensive move
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              Apply the CaMeL trusted boundary
            </h3>
            <p className="mt-2 text-sm leading-7 text-emerald-50/85">
              The button is already wired to{" "}
              <span className="font-mono">POST /target/mode</span> and also drives a
              fullscreen flash so the fix is a visible on-stage moment.
            </p>
          </div>
          <span className="rounded-full border border-white/12 bg-black/20 px-3 py-1 text-xs font-mono uppercase tracking-[0.18em] text-emerald-50">
            {streamMode === "demo" ? "demo assist" : "runtime control"}
          </span>
        </div>

        <ApplyCaMeLButton
          armed={targetMode !== "camel"}
          busy={isApplyingCaMeL}
          onClick={onApplyCaMeL}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="metric-card rounded-[1.3rem] p-4">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-slate-400">
            Stream source
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {streamMode === "demo" ? "Demo tape" : "Live SSE"}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Status: {streamStatus}
          </p>
        </div>

        <div className="metric-card rounded-[1.3rem] p-4">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-slate-400">
            Attack volume
          </p>
          <p className="mt-2 text-lg font-semibold text-white">{totalAttacks} total</p>
          <p className="mt-1 text-sm text-slate-300">
            Ready for the 3-panel projector view.
          </p>
        </div>
      </div>

      {liveError ? (
        <div className="mt-4 rounded-[1.2rem] border border-rose-300/24 bg-rose-300/10 p-4 text-sm leading-7 text-rose-50">
          {liveError}
        </div>
      ) : null}
    </section>
  );
}
