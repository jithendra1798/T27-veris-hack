type GauntletMarkProps = {
  animated?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeMap = {
  sm: {
    letter: "1.05rem",
    tracking: "0.28em",
    slashWidth: 2,
  },
  md: {
    letter: "1.65rem",
    tracking: "0.26em",
    slashWidth: 2.5,
  },
  lg: {
    letter: "3rem",
    tracking: "0.22em",
    slashWidth: 3,
  },
  xl: {
    letter: "clamp(3.75rem, 9vw, 6rem)",
    tracking: "0.18em",
    slashWidth: 4,
  },
} as const;

export default function GauntletMark({
  animated = false,
  className = "",
  size = "md",
}: GauntletMarkProps) {
  const s = sizeMap[size];

  return (
    <span
      aria-label="GAUNTLET"
      className={`relative inline-flex items-center ${className}`}
      style={{ lineHeight: 1 }}
    >
      <span
        className="display-tight"
        style={{
          fontSize: s.letter,
          letterSpacing: s.tracking,
          color: "var(--paper)",
          fontVariationSettings: '"opsz" 144, "SOFT" 0',
          fontWeight: 600,
        }}
      >
        GAUNTLET
      </span>

      {/* Red diagonal slash — red-team motif. Drawn as SVG so we can animate the stroke. */}
      <svg
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none ${animated ? "launch-mark-draw" : ""}`}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line
          x1="2"
          y1="88"
          x2="98"
          y2="22"
          stroke="var(--signal-red)"
          strokeWidth={s.slashWidth}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  );
}
