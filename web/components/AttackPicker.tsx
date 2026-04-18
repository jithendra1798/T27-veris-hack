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
    <div className="grid gap-3 lg:grid-cols-3">
      {options.map((option, index) => {
        const isActive = option.kind === activeKind;

        return (
          <button
            aria-pressed={isActive}
            className={`attack-choice ${isActive ? "attack-choice-active" : ""}`}
            key={option.kind}
            onClick={() => onSelect(option.kind)}
            type="button"
          >
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-400">
              {(index + 1).toString().padStart(2, "0")} attack choice
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
              {option.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{option.summary}</p>
          </button>
        );
      })}
    </div>
  );
}
