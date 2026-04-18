import GauntletDashboard from "@/components/GauntletDashboard";
import { loadCitations } from "@/lib/citations";

export default async function Home() {
  const citationLookup = await loadCitations();

  return (
    <GauntletDashboard
      citationLookup={citationLookup}
      modeToggleUrl={
        process.env.NEXT_PUBLIC_MODE_TOGGLE_URL ??
        "http://localhost:8001/target/mode"
      }
      sseUrl={process.env.NEXT_PUBLIC_SSE_URL ?? "http://localhost:8000/events"}
    />
  );
}
