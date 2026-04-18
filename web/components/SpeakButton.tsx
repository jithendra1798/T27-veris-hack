"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeakButtonProps = {
  text: string;
  tone?: "red" | "green";
  label?: string;
};

export default function SpeakButton({
  text,
  tone = "red",
  label = "Listen to attack",
}: SpeakButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(() => {
    if (isSpeaking) {
      stop();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [text, isSpeaking, stop]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const borderColor =
    tone === "green"
      ? "border-[color:rgba(0,196,140,0.4)]"
      : "border-[color:rgba(255,59,71,0.4)]";
  const bgColor =
    tone === "green"
      ? "bg-[color:var(--signal-green-soft)] hover:bg-[rgba(0,196,140,0.22)]"
      : "bg-[color:var(--signal-red-soft)] hover:bg-[rgba(255,59,71,0.22)]";
  const textColor =
    tone === "green"
      ? "text-[color:var(--signal-green)]"
      : "text-[color:var(--signal-red)]";

  return (
    <button
      aria-label={isSpeaking ? "Stop audio" : label}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[0.78rem] font-semibold transition ${borderColor} ${bgColor} ${textColor}`}
      onClick={speak}
      type="button"
    >
      {isSpeaking ? (
        <>
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="3" y="2" width="3.5" height="12" fill="currentColor" />
            <rect x="9.5" y="2" width="3.5" height="12" fill="currentColor" />
          </svg>
          Stop
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 2 L14 8 L3 14 Z" fill="currentColor" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
