import type { DashboardAttack } from "@/lib/events";

type AttackFeedProps = {
  attacks: DashboardAttack[];
};

type EntryState = "contained" | "exploited" | "pending";

function getEntryState(attack: DashboardAttack): EntryState {
  if (!attack.verdict) return "pending";
  return attack.verdict.exploited ? "exploited" : "contained";
}

function stateHeadline(state: EntryState) {
  if (state === "exploited") return "Exploit landed";
  if (state === "contained") return "Attack held";
  return "In flight";
}

function entryChip(state: EntryState) {
  if (state === "exploited") return "chip chip-red";
  if (state === "contained") return "chip chip-green";
  return "chip";
}

function entryRule(state: EntryState) {
  if (state === "exploited") return "liveblog-entry-red";
  if (state === "contained") return "liveblog-entry-green";
  return "liveblog-entry-amber";
}

export default function AttackFeed({ attacks }: AttackFeedProps) {
  const filed = attacks.length.toString().padStart(2, "0");

  return (
    <section className="paper-card-stage panel-enter flex min-h-[320px] flex-col p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4 pb-4">
        <div>
          <p className="overline">Live roster</p>
          <h2
            className="display-tight mt-1 text-[color:var(--paper)]"
            style={{ fontSize: "1.55rem", lineHeight: 1.1 }}
          >
            Attack feed
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="byline">{filed} filed</span>
        </div>
      </div>

      <hr className="rule-h m-0 border-0" />

      <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1 soft-scroll">
        {[...attacks].reverse().map((attack, index) => {
          const state = getEntryState(attack);
          const slot = (attacks.length - index).toString().padStart(2, "0");

          return (
            <article
              className={`liveblog-entry ${entryRule(state)}`}
              key={attack.id}
            >
              <div className="liveblog-timestamp">
                <div>#{slot}</div>
                <div className="mt-1 font-mono text-[0.6rem] text-[color:var(--paper-mute)]">
                  {index === 0 ? "latest" : "queued"}
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="byline mb-1 truncate">
                      {attack.persona}
                    </p>
                    <h3
                      className="display-tight text-[color:var(--paper)]"
                      style={{ fontSize: "1.02rem", lineHeight: 1.25 }}
                    >
                      {stateHeadline(state)}
                    </h3>
                  </div>

                  <span className={entryChip(state)}>
                    {state === "exploited"
                      ? "Landed"
                      : state === "contained"
                        ? "Held"
                        : "Streaming"}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="chip">
                    {attack.attack_class.replaceAll("_", " ")}
                  </span>
                  {attack.audio_url ? (
                    <span className="chip chip-gold">Audio</span>
                  ) : null}
                  {attack.verdict?.evidence ? (
                    <span className="chip">Evidence</span>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}

        {attacks.length === 0 ? (
          <div className="flex h-full min-h-[220px] items-center justify-center rounded-lg border border-dashed border-[color:var(--rule)] p-6 text-center text-sm leading-7 text-[color:var(--paper-dim)]">
            Choose an attack to populate the feed.
          </div>
        ) : null}
      </div>
    </section>
  );
}
