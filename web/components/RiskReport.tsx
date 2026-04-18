"use client";

import { useEffect, useRef, useState } from "react";
import ApplyCaMeLButton from "@/components/ApplyCaMeLButton";
import CamelDiagram from "@/components/CamelDiagram";
import type { ReportReadyEvent } from "@/lib/events";

type RiskReportProps = {
  currentReport: ReportReadyEvent | null;
  comparisonReport: ReportReadyEvent | null;
  exploitedCount: number;
  fixMomentActive: boolean;
  isApplyingCaMeL: boolean;
  onApplyCaMeL: () => Promise<void> | void;
  pendingCount: number;
  targetMode: "vulnerable" | "camel";
};

type AnimatedScoreProps = {
  decimals?: number;
  className?: string;
  value: number;
};

function scoreTier(value: number): "red" | "amber" | "green" | "neutral" {
  if (value <= 0) return "neutral";
  if (value >= 6) return "red";
  if (value >= 3) return "amber";
  return "green";
}

function panelClassFor(tier: ReturnType<typeof scoreTier>) {
  if (tier === "red") return "score-panel score-panel-red";
  if (tier === "amber") return "score-panel score-panel-amber";
  if (tier === "green") return "score-panel score-panel-green";
  return "score-panel score-panel-neutral";
}

function washClassFor(tier: ReturnType<typeof scoreTier>) {
  if (tier === "red") return "score-wash-red";
  if (tier === "amber") return "score-wash-amber";
  if (tier === "green") return "score-wash-green";
  return "score-wash-neutral";
}

function AnimatedScore({
  decimals = 1,
  className = "",
  value,
}: AnimatedScoreProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousTarget = useRef(value);

  useEffect(() => {
    const start = previousTarget.current;
    const durationMs = 1100;
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

    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className={`score-numeral ${className}`}>
      {displayValue.toFixed(decimals)}
    </span>
  );
}

function AnimatedCountMetric({
  decimals = 0,
  label,
  value,
}: {
  decimals?: number;
  label: string;
  value: number;
}) {
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

    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className="flex-1">
      <p className="overline">{label}</p>
      <p
        className="display-tight mt-1 font-mono tabular-nums text-[color:var(--paper)]"
        style={{ fontSize: "1.9rem", lineHeight: 1.05, letterSpacing: "-0.03em" }}
      >
        {displayValue.toFixed(decimals)}
      </p>
    </div>
  );
}

export default function RiskReport({
  currentReport,
  comparisonReport,
  exploitedCount,
  fixMomentActive,
  isApplyingCaMeL,
  onApplyCaMeL,
  pendingCount,
  targetMode,
}: RiskReportProps) {
  const score = currentReport?.score ?? 0;
  const vulnerabilities = currentReport?.vulnerabilities ?? 0;
  const tier = scoreTier(score);
  const scoreDelta =
    currentReport && comparisonReport
      ? Number((currentReport.score - comparisonReport.score).toFixed(1))
      : null;
  const topClasses = currentReport?.top_classes ?? [];

  const showHardened = targetMode === "camel" && currentReport !== null;

  return (
    <section className="paper-card-stage panel-enter flex min-h-[320px] flex-col p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3 pb-4">
        <div>
          <p className="overline">Risk report</p>
          <h2
            className="display-tight mt-1 text-[color:var(--paper)]"
            style={{ fontSize: "1.55rem", lineHeight: 1.1 }}
          >
            Risk posture
          </h2>
        </div>

        <span
          className={
            targetMode === "camel" ? "capsule capsule-green" : "capsule capsule-red"
          }
        >
          <span
            className={`capsule-dot ${
              targetMode === "camel"
                ? "bg-[color:var(--signal-green)]"
                : "bg-[color:var(--signal-red)]"
            }`}
          />
          {targetMode === "camel" ? "CaMeL active" : "Vulnerable mode"}
        </span>
      </div>

      <hr className="rule-h m-0 border-0" />

      {currentReport ? (
        <div
          className={`relative mt-4 p-5 ${panelClassFor(tier)} ${
            fixMomentActive ? "score-panel-flash" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="overline">
                {targetMode === "camel" ? "Hardened rerun" : "Exploit run"}
              </p>
              <p className="byline mt-1 text-[color:var(--paper-dim)]">
                {targetMode === "camel" ? "CaMeL boundary score" : "Vulnerable score"}
              </p>
            </div>

            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[0.64rem] uppercase tracking-[0.22em] ${
                scoreDelta === null
                  ? "border border-[color:var(--rule)] bg-transparent text-[color:var(--paper-mute)]"
                  : scoreDelta <= 0
                    ? "border border-[color:rgba(0,196,140,0.4)] bg-[color:var(--signal-green-soft)] text-[color:var(--signal-green)]"
                    : "border border-[color:rgba(255,59,71,0.4)] bg-[color:var(--signal-red-soft)] text-[color:var(--signal-red)]"
              }`}
            >
              {scoreDelta === null
                ? "Awaiting baseline"
                : scoreDelta > 0
                  ? `+${scoreDelta} vs prior`
                  : `${scoreDelta} vs prior`}
            </div>
          </div>

          <div className="mt-4 flex items-end gap-4">
            <AnimatedScore value={score} className={washClassFor(tier)} />
            <div className="flex h-full flex-col justify-end pb-3">
              <span className="score-out-of">Out of 10</span>
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-[color:var(--paper-dim)]">
            {vulnerabilities === 0
              ? "No vulnerabilities surfaced in the current rerun."
              : `${vulnerabilities} ${vulnerabilities === 1 ? "vulnerability" : "vulnerabilities"} surfaced in the current run.`}
          </p>

          {showHardened ? <div className="hardened-stamp">Hardened</div> : null}
        </div>
      ) : (
        <div className="mt-4 flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-[color:var(--rule)] p-6 text-center text-sm leading-7 text-[color:var(--paper-dim)]">
          Run an attack to generate a risk report.
        </div>
      )}

      {/* Before / after mini-tiles when comparison exists */}
      {currentReport && comparisonReport ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-[color:var(--rule)] bg-[color:var(--ink)]/50 px-3 py-2.5">
            <p className="byline text-[color:var(--paper-mute)]">Before</p>
            <p
              className="display-tight mt-1 tabular-nums"
              style={{
                fontSize: "1.45rem",
                color: scoreTier(comparisonReport.score) === "red" ? "var(--signal-red)" : scoreTier(comparisonReport.score) === "amber" ? "var(--signal-amber)" : "var(--signal-green)",
              }}
            >
              {comparisonReport.score.toFixed(1)}
            </p>
          </div>
          <div className="rounded-lg border border-[color:var(--rule)] bg-[color:var(--ink)]/50 px-3 py-2.5">
            <p className="byline text-[color:var(--paper-mute)]">After</p>
            <p
              className="display-tight mt-1 tabular-nums"
              style={{
                fontSize: "1.45rem",
                color: tier === "red" ? "var(--signal-red)" : tier === "amber" ? "var(--signal-amber)" : "var(--signal-green)",
              }}
            >
              {currentReport.score.toFixed(1)}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex gap-3 rounded-xl border border-[color:var(--rule)] bg-[color:var(--ink-2)]/60 px-4 py-3">
        <AnimatedCountMetric label="Exploits" value={exploitedCount} />
        <div className="w-px bg-[color:var(--rule)]" />
        <AnimatedCountMetric label="Pending" value={pendingCount} />
      </div>

      <div className="mt-3 rounded-xl border border-[color:var(--rule)] bg-[color:var(--ink-2)]/60 p-3.5">
        <p className="overline">Top classes</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {topClasses.length > 0 ? (
            topClasses.map((attackClass) => (
              <span className="chip chip-gold" key={attackClass}>
                {attackClass.replaceAll("_", " ")}
              </span>
            ))
          ) : (
            <span className="chip">No dominant class</span>
          )}
        </div>
      </div>

      {/* CaMeL fix moment block — includes the deploy button + architecture diagram */}
      <div className="mt-4 rounded-xl border border-[color:var(--gold-line)] bg-gradient-to-b from-[rgba(212,166,87,0.05)] to-[color:var(--ink-2)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="overline text-[color:var(--gold)]">Defensive move</p>
            <h3
              className="display-tight mt-1 text-[color:var(--paper)]"
              style={{ fontSize: "1.25rem", lineHeight: 1.1 }}
            >
              Apply the CaMeL fix
            </h3>
            <p className="mt-2 text-xs leading-6 text-[color:var(--paper-dim)]">
              Re-run the selected attack through the trusted boundary and watch
              the score collapse.
            </p>
          </div>

          <div className="hidden h-14 w-28 shrink-0 overflow-hidden rounded-md border border-[color:var(--rule)] bg-[color:var(--ink)] p-1 sm:block">
            <CamelDiagram />
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
