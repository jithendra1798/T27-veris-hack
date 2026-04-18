"use client";

import { startTransition, useEffect, useState } from "react";
import { isSSEEvent, type SSEEvent } from "@/lib/events";

export type StreamStatus = "connecting" | "error" | "idle" | "live";

export function useSSE(url: string, enabled: boolean) {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const stream = new EventSource(url);
    const markConnecting = window.setTimeout(() => {
      setStatus("connecting");
      setError(null);
    }, 0);

    stream.onopen = () => {
      setStatus("live");
      setError(null);
    };

    stream.onmessage = (message) => {
      try {
        const payload: unknown = JSON.parse(message.data);

        if (!isSSEEvent(payload)) {
          throw new Error("Unexpected SSE payload.");
        }

        startTransition(() => {
          setEvents((current) => [...current, payload]);
        });
      } catch {
        setStatus("error");
        setError("Live event stream returned an unsupported payload.");
      }
    };

    stream.onerror = () => {
      setStatus("error");
      setError("Live event stream unavailable.");
    };

    return () => {
      window.clearTimeout(markConnecting);
      stream.close();
      setEvents([]);
      setError(null);
      setStatus("idle");
    };
  }, [enabled, url]);

  return {
    error: enabled ? error : null,
    events,
    status: enabled ? status : "idle",
  };
}
