"use client";

import { useEffect, useRef, useState } from "react";
import ApplyCaMeLButton from "@/components/ApplyCaMeLButton";
import type { ReportReadyEvent } from "@/lib/events";

type RiskReportProps = {
  currentReport: ReportReadyEvent | null;
  comparisonReport: ReportReadyEvent | null;
  exploitedCount: number;
  isApplyingCaMeL: boolean;
  onApplyCaMeL: () => Promise<void> | void;
  pendingCount: number;
  targetMode: "vulnerable" | "camel";
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
  comparisonReport,
  exploitedCount,
  isApplyingCaMeL,
  onApplyCaMeL,
  pendingCount,
  targetMode,
}: RiskReportProps) {
  const score = currentReport?.score ?? 0;
  const vulnerabilities = currentReport?.vulnerabilities ?? 0;
  const riskPercent = Math.max(0, Math.min(score * 10, 100));
  const scoreDelta =
    currentReport && comparisonReport
      ? Number((currentReport.score - comparisonReport.score).toFixed(1))
      : null;
  const topClasses = currentReport?.top_classes ?? [];
  const ringStyle = {
    background: `conic-gradient(${
      score >= 6 ? "rgba(255,92,116,0.95)" : score >= 3 ? "rgba(255,180,81,0.95)" : "rgba(53,213,166,0.95)"
    } 0 ${riskPercent}%, rgba(255,255,255,0.08) ${riskPercent}% 100%)`,
  };

  return (
    <section className="panel-shell panel-enter flex min-h-[320px] flex-col p-4 sm:p-5">
      <div className="border-b border-white/10 pb-4">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
          Risk report
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
              Risk posture
            </h2>
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

      {currentReport ? (
        <div className="mt-4 rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(6,15,27,0.76))] p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="score-ring" style={ringStyle}>
              <div className="score-ring-core">
                <p className="text-4xl font-semibold tracking-[-0.08em] text-white">
                  {score.toFixed(1)}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                  score / 10
                </p>
              </div>
            </div>

            <div className="flex-1">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-slate-400">
                Current posture
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {targetMode === "camel" ? "Defense rerun scored" : "Exploit run scored"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {vulnerabilities === 0
                  ? "No vulnerabilities surfaced in the current rerun."
                  : `${vulnerabilities} ${vulnerabilities === 1 ? "vulnerability" : "vulnerabilities"} surfaced in the current run.`}
              </p>
              <div
                className={`mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                  scoreDelta === null
                    ? "bg-white/8 text-slate-200"
                    : scoreDelta <= 0
                      ? "bg-emerald-300/12 text-emerald-50"
                      : "bg-rose-300/12 text-rose-50"
                }`}
              >
                {scoreDelta === null
                  ? "Awaiting comparison"
                  : scoreDelta > 0
                    ? `+${scoreDelta} vs prior run`
                    : `${scoreDelta} vs prior run`}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex min-h-[240px] items-center justify-center rounded-[1.7rem] border border-dashed border-white/12 bg-black/18 p-6 text-center text-sm leading-7 text-slate-300">
          Run an attack to generate a risk report.
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <AnimatedMetric label="Exploits" value={exploitedCount} />
        <AnimatedMetric label="Pending" value={pendingCount} />
      </div>

      <div className="mt-4 metric-card rounded-[1.4rem] p-4">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-slate-400">
          Top classes
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {topClasses.length > 0 ? (
            topClasses.map((attackClass) => (
              <span
                className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-mono uppercase tracking-[0.18em] text-slate-100"
                key={attackClass}
              >
                {attackClass.replaceAll("_", " ")}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-mono uppercase tracking-[0.18em] text-slate-200">
              No dominant class
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-[1.7rem] border border-emerald-300/18 bg-[linear-gradient(180deg,rgba(53,213,166,0.14),rgba(7,18,28,0.8))] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-emerald-100">
              Defensive move
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              Apply the CaMeL fix
            </h3>
            <p className="mt-2 text-sm leading-7 text-emerald-50/85">
              Re-run the selected attack through the trusted boundary and watch the
              score collapse.
            </p>
          </div>
        </div>

        <ApplyCaMeLButton
          active={targetMode === "camel"}
          busy={isApplyingCaMeL}
          disabled={!currentReport || targetMode === "camel"}
          onClick={onApplyCaMeL}
        />
      </div>
    </section>
  );
}
