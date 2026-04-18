"use client";

import { useEffect, useRef, useState } from "react";
import type { DashboardAttack } from "@/lib/events";

type TranscriptProps = {
  attacks: DashboardAttack[];
  featuredAttack: DashboardAttack | null;
};

function verdictLabel(attack: DashboardAttack) {
  if (!attack.verdict) {
    return "Evaluating";
  }

  return attack.verdict.exploited ? "Exploit confirmed" : "Attack held";
}

function attackTone(attack: DashboardAttack) {
  if (!attack.verdict) {
    return "metric-card border-white/10";
  }

  return attack.verdict.exploited ? "danger-card" : "success-card";
}

function strikeClass(
  attack: DashboardAttack,
  strikingIds: Record<string, boolean>,
  settledIds: Record<string, boolean>,
) {
  if (!attack.verdict?.exploited) {
    return "";
  }

  if (strikingIds[attack.id]) {
    return "danger-strike-active";
  }

  if (settledIds[attack.id]) {
    return "danger-strike-settled";
  }

  return "";
}

function formatAttackClass(value: DashboardAttack["attack_class"]) {
  return value.replaceAll("_", " ");
}

export default function Transcript({
  attacks,
  featuredAttack,
}: TranscriptProps) {
  const [strikingIds, setStrikingIds] = useState<Record<string, boolean>>({});
  const [settledIds, setSettledIds] = useState<Record<string, boolean>>({});
  const [visibleCitationIds, setVisibleCitationIds] = useState<
    Record<string, boolean>
  >({});
  const seenExploitIdsRef = useRef<Set<string>>(new Set());
  const seenCitationIdsRef = useRef<Set<string>>(new Set());
  const strikeTimersRef = useRef<number[]>([]);
  const citationTimersRef = useRef<number[]>([]);

  function clearTrackedTimers() {
    for (const timer of strikeTimersRef.current) {
      window.clearTimeout(timer);
    }
    for (const timer of citationTimersRef.current) {
      window.clearTimeout(timer);
    }

    strikeTimersRef.current = [];
    citationTimersRef.current = [];
  }

  useEffect(() => {
    attacks.forEach((attack) => {
      if (attack.verdict?.exploited && !seenExploitIdsRef.current.has(attack.id)) {
        seenExploitIdsRef.current.add(attack.id);
        setStrikingIds((current) => ({ ...current, [attack.id]: true }));

        const timer = window.setTimeout(() => {
          setStrikingIds((current) => {
            const next = { ...current };
            delete next[attack.id];
            return next;
          });
          setSettledIds((current) => ({ ...current, [attack.id]: true }));
        }, 800);

        strikeTimersRef.current.push(timer);
      }

      if (attack.citations.length > 0 && !seenCitationIdsRef.current.has(attack.id)) {
        seenCitationIdsRef.current.add(attack.id);
        const timer = window.setTimeout(() => {
          setVisibleCitationIds((current) => ({ ...current, [attack.id]: true }));
        }, 400);

        citationTimersRef.current.push(timer);
      }
    });
  }, [attacks]);

  useEffect(() => {
    return () => {
      clearTrackedTimers();
      seenExploitIdsRef.current = new Set();
      seenCitationIdsRef.current = new Set();
    };
  }, []);

  const remainingAttacks = featuredAttack
    ? [...attacks].reverse().filter((attack) => attack.id !== featuredAttack.id)
    : [...attacks].reverse();

  function renderAttack(attack: DashboardAttack, featured = false) {
    const isExploited = attack.verdict?.exploited;
    const textClass = strikeClass(attack, strikingIds, settledIds);

    return (
      <article
        className={`rounded-[1.6rem] border p-4 sm:p-5 ${attackTone(attack)}`}
        key={attack.id}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-400">
              {featured ? "Stage focus" : attack.persona}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              {featured ? attack.persona : verdictLabel(attack)}
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs font-mono uppercase tracking-[0.18em] text-slate-200">
              {formatAttackClass(attack.attack_class)}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                isExploited
                  ? "border-rose-300/30 bg-rose-300/12 text-rose-50"
                  : attack.verdict
                    ? "border-emerald-300/26 bg-emerald-300/12 text-emerald-50"
                    : "border-amber-300/24 bg-amber-300/10 text-amber-50"
              }`}
            >
              {verdictLabel(attack)}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-400">
            Attack script
          </p>
          <p
            className={`editorial-copy mt-3 text-base leading-8 text-slate-100 ${
              featured ? "sm:text-lg sm:leading-9" : ""
            } ${textClass}`}
          >
            {attack.text}
          </p>
        </div>

        <div
          className={`mt-4 grid gap-3 ${
            attack.audio_url && attack.verdict?.evidence ? "lg:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {attack.audio_url ? (
            <div className="rounded-[1.1rem] border border-cyan-300/14 bg-cyan-300/6 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">Audio evidence</p>
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-cyan-100">
                  speaker ready
                </span>
              </div>
              <audio controls preload="none" src={attack.audio_url} />
            </div>
          ) : null}

          {attack.verdict?.evidence ? (
            <div className="rounded-[1.1rem] border border-white/10 bg-black/18 p-4">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-slate-400">
                Evaluator evidence
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-200">
                {attack.verdict.evidence}
              </p>
            </div>
          ) : null}
        </div>

        {attack.citations.length > 0 && visibleCitationIds[attack.id] ? (
          <div className="citation-reveal mt-4 grid gap-3 md:grid-cols-2">
            {attack.citations.slice(0, 2).map((citation) => (
              <a
                className="rounded-[1.1rem] border border-white/10 bg-white/6 p-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/8"
                href={citation.url}
                key={`${attack.id}-${citation.url}`}
                rel="noreferrer"
                target="_blank"
              >
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-cyan-100">
                  You.com research
                </p>
                <h4 className="mt-2 text-sm font-semibold text-white">
                  {citation.title}
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {citation.note}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">{citation.source}</p>
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-cyan-100">
                    view source
                  </p>
                </div>
              </a>
            ))}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <section className="panel-shell panel-enter flex min-h-[320px] flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
            Transcript
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
            Attack text, evidence, and citations
          </h2>
        </div>

        {featuredAttack ? (
          <div className="metric-card min-w-[220px] rounded-[1.35rem] px-4 py-4 text-right">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-slate-400">
              Stage focus
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {featuredAttack.persona}
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-300">
              {featuredAttack.verdict?.exploited
                ? "Exploit visible"
                : featuredAttack.verdict
                  ? "Attack contained"
                  : "Awaiting verdict"}
            </p>
          </div>
        ) : null}
      </div>

      {featuredAttack ? <div className="mt-4">{renderAttack(featuredAttack, true)}</div> : null}

      <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1 soft-scroll">
        {remainingAttacks.map((attack) => renderAttack(attack))}

        {attacks.length === 0 ? (
          <div className="metric-card flex h-full min-h-[220px] items-center justify-center rounded-[1.6rem] border border-dashed border-white/12 p-6 text-center text-sm leading-7 text-slate-300">
            Attack text, audio, evidence, and citations will appear here after the
            run starts.
          </div>
        ) : null}
      </div>
    </section>
  );
}
