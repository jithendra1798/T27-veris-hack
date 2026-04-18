type ApplyCaMeLButtonProps = {
  armed: boolean;
  busy: boolean;
  onClick: () => Promise<void> | void;
};

export default function ApplyCaMeLButton({
  armed,
  busy,
  onClick,
}: ApplyCaMeLButtonProps) {
  return (
    <button
      className={`mt-4 flex w-full items-center justify-between rounded-[1.35rem] border px-4 py-4 text-left transition sm:px-5 ${
        armed
          ? "camel-pulse border-emerald-300/30 bg-emerald-300/14 text-white hover:border-emerald-200/40 hover:bg-emerald-300/18"
          : "border-white/12 bg-white/8 text-slate-100"
      }`}
      disabled={busy}
      onClick={onClick}
      type="button"
    >
      <div>
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.22em] text-emerald-100">
          {busy ? "Applying" : armed ? "Ready" : "Hardened"}
        </p>
        <p className="mt-2 text-lg font-semibold">
          {busy ? "Applying CaMeL Fix..." : "Apply CaMeL Fix"}
        </p>
      </div>

      <span className="rounded-full border border-white/14 bg-black/20 px-3 py-1 text-xs font-mono uppercase tracking-[0.2em] text-emerald-50">
        {busy ? "working" : armed ? "one click" : "active"}
      </span>
    </button>
  );
}
