type ApplyCaMeLButtonProps = {
  active: boolean;
  busy: boolean;
  disabled: boolean;
  onClick: () => Promise<void> | void;
};

export default function ApplyCaMeLButton({
  active,
  busy,
  disabled,
  onClick,
}: ApplyCaMeLButtonProps) {
  const title = busy
    ? "Applying CaMeL Fix..."
    : active
      ? "CaMeL Active"
      : disabled
        ? "Available after results"
        : "Apply CaMeL Fix";
  const badge = busy ? "working" : active ? "active" : disabled ? "locked" : "ready";

  return (
    <button
      className={`mt-4 flex w-full items-center justify-between gap-4 rounded-[1.45rem] border px-4 py-4 text-left transition sm:px-5 ${
        active
          ? "camel-pulse border-emerald-300/30 bg-emerald-300/14 text-white hover:border-emerald-200/40 hover:bg-emerald-300/18"
          : disabled
            ? "cursor-not-allowed border-white/12 bg-white/8 text-slate-100"
          : "border-white/12 bg-white/8 text-slate-100"
      }`}
      disabled={busy || disabled}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-white/14 bg-black/18 font-mono text-sm font-semibold tracking-[0.18em] text-emerald-50">
          CM
        </div>
        <div>
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.22em] text-emerald-100">
            {busy ? "Applying" : active ? "Hardened" : disabled ? "Stand by" : "Ready"}
          </p>
          <p className="mt-2 text-lg font-semibold">{title}</p>
          <p className="mt-1 text-sm text-emerald-50/80">
            {active
              ? "The trusted boundary is engaged for the current rerun."
              : disabled
                ? "Run an attack to unlock the defense rerun."
                : "Launch the trusted-boundary rerun for the selected scenario."}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <span className="rounded-full border border-white/14 bg-black/20 px-3 py-1 text-xs font-mono uppercase tracking-[0.2em] text-emerald-50">
          {badge}
        </span>
      </div>
    </button>
  );
}
