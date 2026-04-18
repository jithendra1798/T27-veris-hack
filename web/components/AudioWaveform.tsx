"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

const BAR_COUNT = 36;

type AudioWaveformProps = {
  src: string;
  tone?: "red" | "green";
  label?: string;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const total = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(total / 60).toString();
  const ss = (total % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function AudioWaveform({
  src,
  tone = "red",
  label = "Audio evidence",
}: AudioWaveformProps) {
  const reduced = useReducedMotion();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const frameRef = useRef<number | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(0));

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [supportsWebAudio, setSupportsWebAudio] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return (
      typeof window.AudioContext !== "undefined" ||
      typeof (window as unknown as { webkitAudioContext?: unknown })
        .webkitAudioContext !== "undefined"
    );
  });

  const stopAnimation = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    // reset bars to idle heights
    barsRef.current.forEach((el) => {
      if (el) el.style.height = "";
    });
  }, []);

  const ensureAudioGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return null;

    if (audioCtxRef.current) {
      return audioCtxRef.current;
    }

    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      sourceRef.current = source;
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);

      return ctx;
    } catch {
      setSupportsWebAudio(false);
      return null;
    }
  }, []);

  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      const ctx = ensureAudioGraph();
      if (ctx && ctx.state === "suspended") {
        await ctx.resume();
      }
      try {
        await audio.play();
      } catch {
        /* autoplay blocked or source invalid — no-op */
      }
    } else {
      audio.pause();
    }
  }, [ensureAudioGraph]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const tick = () => {
      const analyser = analyserRef.current;
      if (!analyser) return;

      const buffer = dataRef.current;
      analyser.getByteFrequencyData(buffer);

      const step = Math.floor(buffer.length / BAR_COUNT);
      for (let i = 0; i < BAR_COUNT; i += 1) {
        const el = barsRef.current[i];
        if (!el) continue;
        const value = buffer[i * step] ?? 0;
        const height = Math.min(100, 8 + (value / 255) * 92);
        el.style.height = `${height}%`;
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    const onPlay = () => {
      setIsPlaying(true);
      if (!reduced && supportsWebAudio) {
        frameRef.current = window.requestAnimationFrame(tick);
      }
    };
    const onPause = () => {
      setIsPlaying(false);
      stopAnimation();
    };
    const onEnded = () => {
      setIsPlaying(false);
      stopAnimation();
      setCurrentTime(audio.duration || 0);
    };
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      stopAnimation();
    };
  }, [reduced, stopAnimation, supportsWebAudio]);

  useEffect(() => {
    return () => {
      stopAnimation();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => undefined);
        audioCtxRef.current = null;
        analyserRef.current = null;
        sourceRef.current = null;
      }
    };
  }, [stopAnimation]);

  const barColor =
    tone === "green" ? "text-[color:var(--signal-green)]" : "text-[color:var(--signal-red)]";

  const idle = !isPlaying;

  return (
    <div className="rounded-xl border border-[color:var(--rule)] bg-[color:var(--ink)]/60 p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-[color:var(--paper)]">
          {label}
        </p>
        <span className="byline">
          {isPlaying ? "playing" : "ready"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
            tone === "green"
              ? "border-[color:rgba(0,196,140,0.4)] bg-[color:var(--signal-green-soft)] text-[color:var(--signal-green)] hover:bg-[rgba(0,196,140,0.22)]"
              : "border-[color:rgba(255,59,71,0.4)] bg-[color:var(--signal-red-soft)] text-[color:var(--signal-red)] hover:bg-[rgba(255,59,71,0.22)]"
          }`}
          onClick={handlePlayPause}
          type="button"
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <rect x="3" y="2" width="3.5" height="12" fill="currentColor" />
              <rect x="9.5" y="2" width="3.5" height="12" fill="currentColor" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 2 L14 8 L3 14 Z" fill="currentColor" />
            </svg>
          )}
        </button>

        <div
          className={`relative flex h-11 flex-1 items-end gap-[3px] overflow-hidden px-1 ${barColor} ${
            idle ? "waveform-idle" : ""
          }`}
          aria-hidden="true"
        >
          {Array.from({ length: BAR_COUNT }).map((_, index) => (
            <span
              className="waveform-bar"
              key={index}
              ref={(element) => {
                barsRef.current[index] = element;
              }}
              style={{ animationDelay: `${(index * 31) % 400}ms` }}
            />
          ))}
        </div>

        <span className="min-w-[4.5rem] text-right font-mono text-[0.7rem] tracking-[0.08em] text-[color:var(--paper-dim)]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Hidden native audio element — we drive it via custom controls above */}
      <audio
        crossOrigin="anonymous"
        preload="metadata"
        ref={audioRef}
        src={src}
        style={{ display: "none" }}
      />
    </div>
  );
}
