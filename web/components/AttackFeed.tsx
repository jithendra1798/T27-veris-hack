import type { DashboardAttack } from "@/lib/events";

type AttackFeedProps = {
  attacks: DashboardAttack[];
};

const statusTone = {
  contained: "border-emerald-300/22 bg-emerald-300/10 text-emerald-50",
  exploited: "border-rose-300/26 bg-rose-300/10 text-rose-50",
  pending: "border-amber-300/24 bg-amber-300/10 text-amber-50",
} as const;

function getAttackState(attack: DashboardAttack) {
  if (!attack.verdict) {
    return "pending";
  }

  return attack.verdict.exploited ? "exploited" : "contained";
}

export default function AttackFeed({
  attacks,
}: AttackFeedProps) {
  return (
    <section className="panel-shell panel-enter flex min-h-[320px] flex-col p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
            Attack feed
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
            Active roster
          </h2>
        </div>

        <div className="capsule bg-white/4 text-slate-200">{attacks.length} queued</div>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1 soft-scroll">
        {[...attacks].reverse().map((attack, index) => {
          const state = getAttackState(attack);
          const slot = (attacks.length - index).toString().padStart(2, "0");
          const frameTone =
            state === "exploited"
              ? "border-rose-300/20 bg-[linear-gradient(180deg,rgba(255,92,116,0.14),rgba(7,13,22,0.75))]"
              : state === "contained"
                ? "border-emerald-300/20 bg-[linear-gradient(180deg,rgba(53,213,166,0.12),rgba(7,13,22,0.75))]"
                : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(7,13,22,0.72))]";
          const slotTone =
            state === "exploited"
              ? "border-rose-300/28 bg-rose-300/12 text-rose-50"
              : state === "contained"
                ? "border-emerald-300/28 bg-emerald-300/12 text-emerald-50"
                : "border-amber-300/28 bg-amber-300/12 text-amber-50";

          return (
            <article
              className={`metric-card group rounded-[1.55rem] border p-4 transition duration-200 ${frameTone}`}
              key={attack.id}
            >
              <div className="flex gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border font-mono text-sm font-semibold tracking-[0.12em] ${slotTone}`}
                >
                  {slot}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-slate-400">
                        {index === 0 ? "Latest slot" : "Queued persona"}
                      </p>
                      <h3 className="mt-2 text-base font-semibold text-white">
                        {attack.persona}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone[state]}`}
                    >
                      {state === "exploited"
                        ? "Exploit landed"
                        : state === "contained"
                          ? "Contained"
                          : "Streaming"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs font-mono uppercase tracking-[0.18em] text-slate-200">
                      {attack.attack_class.replaceAll("_", " ")}
                    </span>
                    {attack.audio_url ? (
                      <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-xs font-mono uppercase tracking-[0.18em] text-cyan-50">
                        Speaker armed
                      </span>
                    ) : null}
                    {attack.verdict?.evidence ? (
                      <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs font-mono uppercase tracking-[0.18em] text-slate-200">
                        Evidence ready
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {attacks.length === 0 ? (
          <div className="metric-card flex h-full min-h-[220px] items-center justify-center rounded-[1.5rem] border border-dashed border-white/12 p-6 text-center text-sm leading-7 text-slate-300">
            Choose an attack to populate the feed.
          </div>
        ) : null}
      </div>
    </section>
  );
}
