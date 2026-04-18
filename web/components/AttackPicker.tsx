import AttackGlyph from "@/components/AttackGlyph";
import type { DemoAttackChoice } from "@/lib/demo-data";
import type { AttackKind } from "@/lib/events";

type AttackPickerProps = {
  activeKind: AttackKind | null;
  onSelect: (kind: AttackKind) => void;
  options: DemoAttackChoice[];
};

export default function AttackPicker({
  activeKind,
  onSelect,
  options,
}: AttackPickerProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <p className="overline">Today&rsquo;s dispatches</p>
        <p className="byline hidden sm:block">
          Click or press 1&middot;2&middot;3
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {options.map((option, index) => {
          const isActive = option.kind === activeKind;
          const numeral = (index + 1).toString().padStart(2, "0");

          return (
            <button
              aria-pressed={isActive}
              className={`dispatch-card ${isActive ? "dispatch-card-active" : ""}`}
              key={option.kind}
              onClick={() => onSelect(option.kind)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="dispatch-numeral" aria-hidden="true">
                  {numeral}
                </div>
                <div
                  aria-hidden="true"
                  className={`shrink-0 ${isActive ? "text-[color:var(--gold)]" : "text-[color:var(--paper-mute)]"}`}
                >
                  <AttackGlyph kind={option.kind} size={32} />
                </div>
              </div>

              <h2
                className="display-tight mt-3 text-[color:var(--paper)]"
                style={{ fontSize: "1.55rem", lineHeight: 1.1 }}
              >
                {option.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--paper-dim)]">
                {option.summary}
              </p>

              <div className="mt-4 flex items-center gap-2">
                <span className="chip">
                  {option.kind.replaceAll("_", " ")}
                </span>
                {isActive ? (
                  <span className="chip chip-gold">Selected</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
