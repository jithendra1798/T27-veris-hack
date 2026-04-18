import type { DashboardAttack } from "@/lib/events";

type AttackFeedProps = {
  attacks: DashboardAttack[];
  streamMode: "demo" | "live";
  streamStatus: "connecting" | "demo" | "error" | "idle" | "live";
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
  streamMode,
  streamStatus,
}: AttackFeedProps) {
  return (
    <section className="panel-shell panel-enter flex min-h-[320px] flex-col p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
            Attack feed
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
            Personas and attacks
          </h2>
        </div>

        <div className="capsule bg-white/4 text-slate-200">
          <span
            className={`capsule-dot ${
              streamStatus === "live"
                ? "bg-emerald-300"
                : streamStatus === "connecting"
                  ? "bg-amber-300"
                  : streamStatus === "error"
                    ? "bg-rose-300"
                    : "bg-cyan-300"
            }`}
          />
          {streamMode === "demo" ? "Demo" : streamStatus}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
        <span>{attacks.length} attacks loaded</span>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
          left panel
        </span>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {[...attacks].reverse().map((attack, index) => {
          const state = getAttackState(attack);

          return (
            <article
              className="metric-card rounded-[1.4rem] p-4 transition hover:border-white/16 hover:bg-white/8"
              key={attack.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
                    Slot {(attacks.length - index).toString().padStart(2, "0")}
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
                    Audio armed
                  </span>
                ) : null}
              </div>

              <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-300">
                {attack.text}
              </p>
            </article>
          );
        })}

        {attacks.length === 0 ? (
          <div className="metric-card flex h-full min-h-[220px] items-center justify-center rounded-[1.5rem] border border-dashed border-white/12 p-6 text-center text-sm leading-7 text-slate-300">
            Waiting for the first persona stream. Use Demo tape to rehearse the visual
            flow before BE1 starts emitting SSE.
          </div>
        ) : null}
      </div>
    </section>
  );
}
