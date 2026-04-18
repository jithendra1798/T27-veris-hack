type Sponsor = {
  label: string;
  mark: React.ReactNode;
  role: string;
  tagline: string;
  url?: string;
};

/* Distinctive typographic wordmarks for each sponsor. Rendered inline so they
   stay crisp at any size and pick up theme colors. Not copies of trademarks —
   editorial-style typographic treatments. */

function VerisMark() {
  return (
    <span className="flex items-center gap-2">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M3 6 L12 20 L21 6"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span
        className="display-tight text-[color:var(--paper)]"
        style={{ fontSize: "1.2rem", letterSpacing: "-0.02em" }}
      >
        veris
      </span>
    </span>
  );
}

function BasetenMark() {
  return (
    <span className="flex items-center gap-2">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id="baseten-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff6b35" />
            <stop offset="100%" stopColor="#ffb451" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="18" height="18" rx="4" fill="url(#baseten-g)" />
        <path
          d="M8 9 L8 15 M12 9 L12 15 M16 9 L16 15"
          stroke="var(--ink)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span
        className="font-mono text-[color:var(--paper)]"
        style={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em" }}
      >
        baseten
      </span>
    </span>
  );
}

function VoiceRunMark() {
  return (
    <span className="flex items-center gap-2">
      <svg width="24" height="22" viewBox="0 0 28 22" aria-hidden="true">
        <g stroke="#7baeff" strokeWidth="1.8" strokeLinecap="round" fill="none">
          <path d="M3 11 L3 11" />
          <path d="M7 8 L7 14" />
          <path d="M11 5 L11 17" />
          <path d="M15 7 L15 15" />
          <path d="M19 3 L19 19" />
          <path d="M23 9 L23 13" />
        </g>
      </svg>
      <span
        className="display-tight text-[color:var(--paper)]"
        style={{ fontSize: "1.08rem", letterSpacing: "-0.01em" }}
      >
        VoiceRun
      </span>
    </span>
  );
}

function YouComMark() {
  return (
    <span className="flex items-center gap-1">
      <span
        className="display-tight text-[color:#8b5cf6]"
        style={{ fontSize: "1.2rem", letterSpacing: "-0.04em", fontWeight: 700 }}
      >
        You
      </span>
      <span
        className="font-mono text-[color:var(--paper-dim)]"
        style={{ fontSize: "1.05rem", fontWeight: 500 }}
      >
        .com
      </span>
    </span>
  );
}

const sponsors: Sponsor[] = [
  {
    label: "Veris",
    mark: <VerisMark />,
    role: "Scenario generation",
    tagline: "Red-team personas",
  },
  {
    label: "Baseten",
    mark: <BasetenMark />,
    role: "LLM + TTS inference",
    tagline: "Model serving",
  },
  {
    label: "VoiceRun",
    mark: <VoiceRunMark />,
    role: "Voice orchestration",
    tagline: "Live audio pipeline",
  },
  {
    label: "You.com",
    mark: <YouComMark />,
    role: "Exploit research",
    tagline: "Citation sourcing",
  },
];

export default function SponsorFooter() {
  return (
    <footer className="panel-enter">
      <hr className="rule-double m-0 mb-4 border-0" />

      <div className="flex flex-col gap-4 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="overline">Presented in partnership with</p>
          <p className="byline mt-1 text-[color:var(--paper-mute)]">
            Staged for hackathon demo &mdash; built on live infrastructure
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          {sponsors.map((sponsor) => (
            <div
              className={`flex flex-col gap-1 ${
                sponsor.label === "Veris"
                  ? "border-l-2 border-[color:var(--gold)] pl-3"
                  : "border-l border-[color:var(--rule)] pl-3"
              }`}
              key={sponsor.label}
            >
              {sponsor.mark}
              <p className="byline text-[color:var(--paper-mute)]">
                {sponsor.role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
