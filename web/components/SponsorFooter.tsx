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
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
            Sponsor wall
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Required for the demo. Text placeholders are visible now so we do not
            ship without all four logos on screen.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {sponsors.map((sponsor) => (
            <div
              className="metric-card rounded-[1.2rem] px-4 py-3 text-left"
              key={sponsor.label}
            >
              <p className="text-lg font-semibold tracking-[-0.04em] text-white">
                {sponsor.label}
              </p>
              <p className="mt-1 text-sm text-slate-300">{sponsor.role}</p>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
