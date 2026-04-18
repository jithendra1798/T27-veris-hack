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
  const label = busy
    ? "Deploying…"
    : active
      ? "CaMeL active"
      : disabled
        ? "Available after results"
        : "Deploy the fix";

  const baseClasses =
    "group relative mt-5 flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3.5 text-left transition focus:outline-none";

  const stateClasses = active
    ? "border border-[color:rgba(0,196,140,0.4)] bg-[color:var(--signal-green-soft)] text-[color:var(--paper)]"
    : disabled
      ? "cursor-not-allowed border border-[color:var(--rule)] bg-[color:var(--ink)]/60 text-[color:var(--paper-mute)]"
      : "border-0 bg-[color:var(--gold)] text-[color:var(--ink)] hover:bg-[#e0b470]";

  return (
    <button
      className={`${baseClasses} ${stateClasses}`}
      disabled={busy || disabled}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center gap-4">
        <div
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-[0.7rem] font-semibold tracking-[0.18em] ${
            active
              ? "border border-[color:rgba(0,196,140,0.5)] bg-[rgba(0,196,140,0.12)] text-[color:var(--signal-green)]"
              : disabled
                ? "border border-[color:var(--rule)] bg-[color:var(--ink)]/40 text-[color:var(--paper-mute)]"
                : "bg-[color:var(--ink)] text-[color:var(--gold)]"
          }`}
        >
          CM
        </div>

        <div>
          <p
            className={`font-mono text-[0.64rem] uppercase tracking-[0.22em] ${
              active
                ? "text-[color:var(--signal-green)]"
                : disabled
                  ? "text-[color:var(--paper-mute)]"
                  : "text-[color:var(--ink)]/70"
            }`}
          >
            {busy ? "Deploying" : active ? "Hardened" : disabled ? "Stand by" : "Ready"}
          </p>
          <p
            className={`display-tight mt-1 ${
              active || disabled ? "" : "text-[color:var(--ink)]"
            }`}
            style={{ fontSize: "1.12rem", lineHeight: 1.1 }}
          >
            {label}
          </p>
          <p
            className={`mt-1 text-xs leading-5 ${
              active
                ? "text-[color:var(--paper-dim)]"
                : disabled
                  ? "text-[color:var(--paper-mute)]"
                  : "text-[color:var(--ink)]/70"
            }`}
          >
            {active
              ? "Trusted boundary engaged for the current rerun."
              : disabled
                ? "Run an attack to unlock the defense rerun."
                : "Press C or click to rerun through the trusted boundary."}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <span
          className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.2em] ${
            active
              ? "border-[color:rgba(0,196,140,0.5)] text-[color:var(--signal-green)]"
              : disabled
                ? "border-[color:var(--rule)] text-[color:var(--paper-mute)]"
                : "border-[color:var(--ink)]/30 text-[color:var(--ink)]"
          }`}
        >
          {busy ? "working" : active ? "active" : disabled ? "locked" : "Press C"}
        </span>
      </div>
    </button>
  );
}
