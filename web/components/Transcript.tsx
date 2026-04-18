"use client";

import { useEffect, useRef, useState } from "react";
import AudioWaveform from "@/components/AudioWaveform";
import type { DashboardAttack } from "@/lib/events";

type TranscriptProps = {
  attacks: DashboardAttack[];
  featuredAttack: DashboardAttack | null;
};

function verdictLabel(attack: DashboardAttack) {
  if (!attack.verdict) return "Evaluating";
  return attack.verdict.exploited ? "Exploit confirmed" : "Attack held";
}

function strikeClass(
  attack: DashboardAttack,
  strikingIds: Record<string, boolean>,
  settledIds: Record<string, boolean>,
) {
  if (!attack.verdict?.exploited) return "";
  if (strikingIds[attack.id]) return "danger-strike-active";
  if (settledIds[attack.id]) return "danger-strike-settled";
  return "";
}

function formatAttackClass(value: DashboardAttack["attack_class"]) {
  return value.replaceAll("_", " ");
}

function VerdictStamp({
  attack,
  featured = false,
}: {
  attack: DashboardAttack;
  featured?: boolean;
}) {
  if (!attack.verdict) {
    return (
      <span className={`verdict-stamp verdict-stamp-pending ${featured ? "" : "scale-90"}`}>
        Evaluating
      </span>
    );
  }

  if (attack.verdict.exploited) {
    return (
      <span className={`verdict-stamp verdict-stamp-exploited ${featured ? "" : "scale-90"}`}>
        Exploited
      </span>
    );
  }

  return (
    <span className={`verdict-stamp verdict-stamp-held ${featured ? "" : "scale-90"}`}>
      Held
    </span>
  );
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
    for (const timer of strikeTimersRef.current) window.clearTimeout(timer);
    for (const timer of citationTimersRef.current) window.clearTimeout(timer);
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

  function renderFeatured(attack: DashboardAttack) {
    const textClass = strikeClass(attack, strikingIds, settledIds);
    const isHeld = attack.verdict && !attack.verdict.exploited;
    const isExploited = attack.verdict?.exploited;
    const cardTone = isExploited
      ? "featured-card-exploited"
      : isHeld
        ? "featured-card-held"
        : "";

    return (
      <article className={`featured-card ${cardTone}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="overline">Stage focus</p>
            <h3
              className="display-tight mt-2 text-[color:var(--paper)]"
              style={{ fontSize: "1.65rem", lineHeight: 1.1 }}
            >
              {attack.persona}
            </h3>
            <p className="byline mt-1 text-[color:var(--paper-mute)]">
              {formatAttackClass(attack.attack_class)}
            </p>
          </div>

          <VerdictStamp attack={attack} featured />
        </div>

        <div className="mt-5">
          <span className="pull-quote-glyph">&ldquo;</span>
          <p className={`pull-quote drop-cap ${textClass}`}>{attack.text}</p>
        </div>

        <div
          className={`mt-5 grid gap-3 ${
            attack.audio_url && attack.verdict?.evidence
              ? "lg:grid-cols-[1.05fr_1fr]"
              : "grid-cols-1"
          }`}
        >
          {attack.audio_url ? (
            <AudioWaveform
              src={attack.audio_url}
              tone={isExploited ? "red" : "green"}
              label={isExploited ? "Audio evidence — exploit" : "Audio evidence — rerun"}
            />
          ) : null}

          {attack.verdict?.evidence ? (
            <div>
              <p className="overline mb-2">Editor&rsquo;s note</p>
              <p className="editor-note text-[0.95rem]">
                {attack.verdict.evidence}
              </p>
            </div>
          ) : null}
        </div>

        {attack.citations.length > 0 && visibleCitationIds[attack.id] ? (
          <div className="citation-reveal mt-5 border-t border-[color:var(--rule)] pt-4">
            <p className="overline mb-2">Footnotes · You.com research</p>
            <ol className="grid gap-3 md:grid-cols-2">
              {attack.citations.slice(0, 2).map((citation, index) => (
                <li
                  className="rounded-lg border border-[color:var(--rule)] bg-[color:var(--ink)]/50 p-3.5 transition hover:border-[color:var(--gold-line)]"
                  key={`${attack.id}-${citation.url}`}
                >
                  <a
                    className="group block"
                    href={citation.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="footnote-sup">§{index + 1}</span>
                      <h4 className="display-tight text-[0.95rem] leading-snug text-[color:var(--paper)]">
                        {citation.title}
                      </h4>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--paper-dim)]">
                      {citation.note}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="byline">{citation.source}</span>
                      <span className="footnote-link group-hover:text-[color:#f0d49b]">
                        View source →
                      </span>
                    </div>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </article>
    );
  }

  function renderSecondary(attack: DashboardAttack) {
    const textClass = strikeClass(attack, strikingIds, settledIds);
    const isExploited = attack.verdict?.exploited;

    return (
      <article
        className={`rounded-xl border p-4 ${
          isExploited
            ? "border-[color:rgba(255,59,71,0.28)] bg-[rgba(255,59,71,0.04)]"
            : attack.verdict
              ? "border-[color:rgba(0,196,140,0.28)] bg-[rgba(0,196,140,0.04)]"
              : "border-[color:var(--rule)] bg-[color:var(--ink)]/40"
        }`}
        key={attack.id}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="byline text-[color:var(--paper-mute)]">
              {attack.persona} · {formatAttackClass(attack.attack_class)}
            </p>
            <h3
              className="display-tight mt-1 text-[color:var(--paper)]"
              style={{ fontSize: "1rem", lineHeight: 1.25 }}
            >
              {verdictLabel(attack)}
            </h3>
          </div>
          <VerdictStamp attack={attack} />
        </div>

        <p
          className={`mt-3 text-[0.92rem] leading-6 text-[color:var(--paper-dim)] ${textClass}`}
        >
          {attack.text}
        </p>
      </article>
    );
  }

  return (
    <section className="paper-card-stage panel-enter flex min-h-[320px] flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4 pb-4">
        <div>
          <p className="overline">Transcript</p>
          <h2
            className="display-tight mt-1 text-[color:var(--paper)]"
            style={{ fontSize: "1.55rem", lineHeight: 1.1 }}
          >
            Attack text, evidence, footnotes
          </h2>
        </div>

        {featuredAttack ? (
          <div className="hidden flex-col items-end gap-1 text-right sm:flex">
            <p className="overline">Stage focus</p>
            <p className="byline">
              {featuredAttack.verdict?.exploited
                ? "Exploit visible"
                : featuredAttack.verdict
                  ? "Attack contained"
                  : "Awaiting verdict"}
            </p>
          </div>
        ) : null}
      </div>

      <hr className="rule-h m-0 border-0" />

      {featuredAttack ? <div className="mt-4">{renderFeatured(featuredAttack)}</div> : null}

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1 soft-scroll">
        {remainingAttacks.map((attack) => renderSecondary(attack))}

        {attacks.length === 0 ? (
          <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-dashed border-[color:var(--rule)] p-6 text-center text-sm leading-7 text-[color:var(--paper-dim)]">
            Attack text, audio, evidence, and footnotes will appear here after
            the run starts.
          </div>
        ) : null}
      </div>
    </section>
  );
}
