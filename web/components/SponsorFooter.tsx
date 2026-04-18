const sponsors = [
  { label: "Veris", role: "Scenario generation" },
  { label: "Baseten", role: "LLM + TTS inference" },
  { label: "VoiceRun", role: "Voice orchestration" },
  { label: "You.com", role: "Exploit research" },
];

export default function SponsorFooter() {
  return (
    <footer className="panel-shell panel-enter px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
          Partner stack
        </p>

        <div className="sponsor-row">
          {sponsors.map((sponsor) => (
            <div
              className={`sponsor-wordmark ${
                sponsor.label === "Veris" ? "sponsor-wordmark-primary" : ""
              }`}
              key={sponsor.label}
            >
              <span className="text-base font-semibold tracking-[-0.04em] text-white">
                {sponsor.label}
              </span>
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                {sponsor.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
