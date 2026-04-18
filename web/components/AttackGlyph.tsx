import type { AttackKind } from "@/lib/events";

type AttackGlyphProps = {
  className?: string;
  kind: AttackKind;
  size?: number;
};

export default function AttackGlyph({
  className = "",
  kind,
  size = 36,
}: AttackGlyphProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 48 48",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  if (kind === "prompt_injection") {
    // Syringe / needle: injection motif
    return (
      <svg {...common}>
        <path d="M6 42 L18 30" />
        <path d="M16 26 L22 32" />
        <rect x="20" y="20" width="16" height="8" rx="1" transform="rotate(-45 28 24)" />
        <path d="M36 18 L42 12" />
        <path d="M38 10 L44 16" />
        <circle cx="12" cy="36" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  if (kind === "system_extract") {
    // Key with teeth: extract hidden system prompt
    return (
      <svg {...common}>
        <circle cx="15" cy="24" r="7" />
        <path d="M22 24 L42 24" />
        <path d="M34 24 L34 32" />
        <path d="M38 24 L38 30" />
        <circle cx="15" cy="24" r="2" fill="currentColor" />
      </svg>
    );
  }

  // tool_hijack — wrench bending a bolt
  return (
    <svg {...common}>
      <path d="M10 38 L22 26 M16 32 L20 36" />
      <path d="M28 12 a6 6 0 0 1 8 8 L30 26 L22 18 L28 12 Z" />
      <circle cx="13" cy="35" r="2" />
      <path d="M34 34 L40 40 M40 34 L34 40" />
    </svg>
  );
}
