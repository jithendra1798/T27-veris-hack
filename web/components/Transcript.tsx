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

export default function Transcript({
  attacks,
  featuredAttack,
}: TranscriptProps) {
  const exploitedCount = attacks.filter((attack) => attack.verdict?.exploited).length;
  const citationCount = attacks.reduce(
    (count, attack) => count + attack.citations.length,
    0,
  );

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
                ? "Leak visible on screen"
                : "Queue primed for evidence"}
            </p>
          </div>
        ) : null}
      </div>

      {featuredAttack ? (
        <div className="mt-4 grid gap-3 xl:grid-cols-[1.12fr_0.88fr]">
          <div
            className={`rounded-[1.6rem] border p-5 ${
              featuredAttack.verdict?.exploited
                ? "danger-card"
                : featuredAttack.verdict
                  ? "success-card"
                  : "metric-card border-white/10"
            }`}
          >
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-slate-400">
              Featured attack
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-2xl font-semibold tracking-[-0.05em] text-white">
                {featuredAttack.persona}
              </h3>
              <span className="rounded-full border border-white/12 bg-black/18 px-3 py-1 text-xs font-mono uppercase tracking-[0.18em] text-slate-200">
                {featuredAttack.attack_class.replaceAll("_", " ")}
              </span>
            </div>
            <p
              className={`editorial-copy mt-4 text-lg leading-9 text-slate-100 ${
                featuredAttack.verdict?.exploited ? "danger-strike" : ""
              }`}
            >
              {featuredAttack.text}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="metric-card rounded-[1.35rem] p-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-400">
                Exploits on screen
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-rose-50">
                {exploitedCount}
              </p>
            </div>
            <div className="metric-card rounded-[1.35rem] p-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-400">
                Research cards
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-cyan-50">
                {citationCount}
              </p>
            </div>
            <div className="metric-card rounded-[1.35rem] p-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-400">
                Evidence state
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                {featuredAttack.verdict?.evidence ? "Pinned" : "Awaiting evaluator"}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1 soft-scroll">
        {[...attacks].reverse().map((attack) => {
          const isExploited = attack.verdict?.exploited;

          return (
            <article
              className={`metric-card rounded-[1.6rem] border p-4 sm:p-5 ${
                isExploited
                  ? "danger-card"
                  : attack.verdict
                    ? "success-card"
                    : "border-white/10"
              }`}
              key={attack.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-400">
                    {attack.persona}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {verdictLabel(attack)}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs font-mono uppercase tracking-[0.18em] text-slate-200">
                    {attack.attack_class.replaceAll("_", " ")}
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
                    {isExploited
                      ? "Red strike"
                      : attack.verdict
                        ? "Green pass"
                        : "Pending"}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-400">
                  Attack script
                </p>
                <p
                  className={`editorial-copy mt-3 text-base leading-8 text-slate-100 ${
                    isExploited ? "danger-strike" : ""
                  }`}
                >
                  {attack.text}
                </p>
              </div>

              <div
                className={`mt-4 grid gap-3 ${
                  attack.audio_url && attack.verdict?.evidence
                    ? "lg:grid-cols-2"
                    : "grid-cols-1"
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
                    <audio controls preload="none" src={attack.audio_url}>
                      <track kind="captions" />
                    </audio>
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

              {attack.citations.length > 0 ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
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
              ) : (
                <div className="mt-4 rounded-[1.1rem] border border-dashed border-white/12 bg-white/3 p-4 text-sm leading-7 text-slate-300">
                  Citation slot is wired and waiting for{" "}
                  <span className="font-mono text-slate-100">
                    data/exploit-citations.json
                  </span>
                  . Fallback research cards will render automatically until the real file
                  lands.
                </div>
              )}
            </article>
          );
        })}

        {attacks.length === 0 ? (
          <div className="metric-card flex h-full min-h-[220px] items-center justify-center rounded-[1.6rem] border border-dashed border-white/12 p-6 text-center text-sm leading-7 text-slate-300">
            Transcript entries will appear here as soon as{" "}
            <span className="mx-1 font-mono text-slate-100">attack.fired</span>
            events start streaming.
          </div>
        ) : null}
      </div>
    </section>
  );
}
