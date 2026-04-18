"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import GauntletMark from "@/components/GauntletMark";
import { useReducedMotion } from "@/lib/useReducedMotion";

const SEEN_KEY = "gauntlet-seen";
const FULL_DURATION_MS = 2600;
const REDUCED_DURATION_MS = 900;

function subscribeSeen(): () => void {
  /* sessionStorage does not fire StorageEvent in the same tab; no-op */
  return () => undefined;
}

function getSeenSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function getSeenServerSnapshot(): boolean {
  return false;
}

function markSeen() {
  try {
    window.sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* storage blocked — no-op */
  }
}

type LaunchSequenceProps = {
  children: React.ReactNode;
};

export default function LaunchSequence({ children }: LaunchSequenceProps) {
  const reduced = useReducedMotion();
  const alreadySeen = useSyncExternalStore(
    subscribeSeen,
    getSeenSnapshot,
    getSeenServerSnapshot,
  );
  const [phase, setPhase] = useState<"intro" | "exiting" | "done">("intro");

  const shouldShowIntro = !alreadySeen && phase !== "done";

  useEffect(() => {
    if (!shouldShowIntro) return;

    const duration = reduced ? REDUCED_DURATION_MS : FULL_DURATION_MS;
    const exitTimer = window.setTimeout(() => setPhase("exiting"), duration);
    const doneTimer = window.setTimeout(() => {
      setPhase("done");
      markSeen();
    }, duration + 380);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [shouldShowIntro, reduced]);

  useEffect(() => {
    if (phase !== "intro" || alreadySeen) return;

    const dismiss = () => {
      setPhase("exiting");
      window.setTimeout(() => {
        setPhase("done");
        markSeen();
      }, 380);
    };

    window.addEventListener("keydown", dismiss, { once: true });
    window.addEventListener("pointerdown", dismiss, { once: true });

    return () => {
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("pointerdown", dismiss);
    };
  }, [phase, alreadySeen]);

  const edition = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <>
      {children}

      {shouldShowIntro ? (
        <div
          aria-hidden="true"
          className={`launch-overlay ${phase === "exiting" ? "launch-overlay-exit" : ""}`}
          suppressHydrationWarning
        >
          <div className="flex flex-col items-center gap-8 px-6 text-center">
            <p className="overline launch-edition" suppressHydrationWarning>
              Dispatch № 01 · {edition}
            </p>

            <GauntletMark animated={!reduced} size="xl" />

            <div className="launch-tagline">
              <p className="display-italic max-w-md text-lg leading-relaxed text-[color:var(--paper-dim)] sm:text-xl">
                Voice-agent red team, on the record.
              </p>
            </div>

            <p className="byline launch-prompt mt-4">
              Press any key to begin
            </p>
          </div>

          <div className="pointer-events-none absolute bottom-10 left-1/2 h-px w-48 -translate-x-1/2 bg-[color:var(--rule)]" />
        </div>
      ) : null}
    </>
  );
}
