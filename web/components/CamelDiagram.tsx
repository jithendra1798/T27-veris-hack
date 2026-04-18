type CamelDiagramProps = {
  className?: string;
};

export default function CamelDiagram({ className = "" }: CamelDiagramProps) {
  return (
    <svg
      aria-label="CaMeL trusted-boundary architecture"
      className={className}
      fill="none"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox="0 0 420 140"
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Attacker node (red) */}
      <g transform="translate(24, 50)">
        <rect
          width="72"
          height="44"
          rx="6"
          fill="rgba(255,59,71,0.08)"
          stroke="var(--signal-red)"
          strokeWidth="1.2"
        />
        <text
          x="36"
          y="20"
          textAnchor="middle"
          fill="var(--signal-red)"
          fontFamily="var(--font-mono), monospace"
          fontSize="8"
          letterSpacing="1.6"
        >
          ATTACKER
        </text>
        <text
          x="36"
          y="34"
          textAnchor="middle"
          fill="var(--paper-dim)"
          fontFamily="var(--font-mono), monospace"
          fontSize="7"
          letterSpacing="0.8"
        >
          voice jailbreak
        </text>
      </g>

      {/* Trusted-boundary node (gold, dashed) */}
      <g transform="translate(162, 26)">
        <rect
          width="96"
          height="88"
          rx="8"
          fill="rgba(212,166,87,0.06)"
          stroke="var(--gold)"
          strokeWidth="1.4"
          strokeDasharray="4 3"
        />
        <text
          x="48"
          y="22"
          textAnchor="middle"
          fill="var(--gold)"
          fontFamily="var(--font-mono), monospace"
          fontSize="8"
          letterSpacing="1.6"
        >
          TRUSTED
        </text>
        <text
          x="48"
          y="36"
          textAnchor="middle"
          fill="var(--gold)"
          fontFamily="var(--font-mono), monospace"
          fontSize="8"
          letterSpacing="1.6"
        >
          BOUNDARY
        </text>
        <text
          x="48"
          y="58"
          textAnchor="middle"
          fill="var(--paper-dim)"
          fontFamily="var(--font-mono), monospace"
          fontSize="7"
          letterSpacing="0.6"
        >
          treat caller input
        </text>
        <text
          x="48"
          y="68"
          textAnchor="middle"
          fill="var(--paper-dim)"
          fontFamily="var(--font-mono), monospace"
          fontSize="7"
          letterSpacing="0.6"
        >
          as untrusted data
        </text>
      </g>

      {/* Agent node (green) */}
      <g transform="translate(324, 50)">
        <rect
          width="72"
          height="44"
          rx="6"
          fill="rgba(0,196,140,0.08)"
          stroke="var(--signal-green)"
          strokeWidth="1.2"
        />
        <text
          x="36"
          y="20"
          textAnchor="middle"
          fill="var(--signal-green)"
          fontFamily="var(--font-mono), monospace"
          fontSize="8"
          letterSpacing="1.6"
        >
          AGENT
        </text>
        <text
          x="36"
          y="34"
          textAnchor="middle"
          fill="var(--paper-dim)"
          fontFamily="var(--font-mono), monospace"
          fontSize="7"
          letterSpacing="0.8"
        >
          hardened
        </text>
      </g>

      {/* Red dashed attempt — blocked at boundary */}
      <path
        className="diagram-line"
        d="M96 72 Q130 62 162 70"
        stroke="var(--signal-red)"
        strokeWidth="1.5"
        strokeDasharray="3 4"
      />
      <circle cx="160" cy="70" r="3" fill="var(--signal-red)" />
      <text
        x="128"
        y="56"
        textAnchor="middle"
        fill="var(--signal-red)"
        fontFamily="var(--font-mono), monospace"
        fontSize="6"
        letterSpacing="1"
      >
        BLOCKED
      </text>

      {/* Clean path from boundary → agent */}
      <path
        className="diagram-line diagram-line-delay"
        d="M258 70 Q290 70 324 72"
        stroke="var(--signal-green)"
        strokeWidth="1.5"
      />
      <path
        d="M318 68 L324 72 L318 76"
        stroke="var(--signal-green)"
        strokeWidth="1.5"
        fill="none"
      />
      <text
        x="290"
        y="88"
        textAnchor="middle"
        fill="var(--signal-green)"
        fontFamily="var(--font-mono), monospace"
        fontSize="6"
        letterSpacing="1"
      >
        SAFE PATH
      </text>
    </svg>
  );
}
