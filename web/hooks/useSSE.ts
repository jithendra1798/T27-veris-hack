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
        setError("SSE payload could not be parsed with the current contract.");
      }
    };

    stream.onerror = () => {
      setStatus("error");
      setError(
        `Could not connect to ${url}. Switch to Demo tape while BE1's stream comes online.`,
      );
      stream.close();
    };

    return () => {
      window.clearTimeout(markConnecting);
      stream.close();
    };
  }, [enabled, url]);

  return {
    error: enabled ? error : null,
    events,
    status: enabled ? status : "idle",
  };
}
