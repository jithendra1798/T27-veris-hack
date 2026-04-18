import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { CitationLookup } from "@/lib/citation-types";
import GauntletDashboard from "./GauntletDashboard";

const citationLookup: CitationLookup = {
  prompt_injection: [],
  system_extract: [],
  tool_hijack: [],
};

describe("GauntletDashboard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true })) as unknown as typeof fetch,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("shows the picker and empty state before a run starts", () => {
    render(
      <GauntletDashboard
        citationLookup={citationLookup}
        modeToggleUrl="http://localhost:8001/target/mode"
        sseUrl="http://localhost:8001/events"
      />,
    );

    expect(
      screen.getByRole("button", { name: /prompt injection/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Choose an attack to populate the feed."),
    ).toBeInTheDocument();
  });

  test("starts a single-lane prompt injection run from the picker", () => {
    render(
      <GauntletDashboard
        citationLookup={citationLookup}
        modeToggleUrl="http://localhost:8001/target/mode"
        sseUrl="http://localhost:8001/events"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /prompt injection/i }));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getAllByText("Overhelpful contractor").length).toBeGreaterThan(0);
    expect(screen.queryByText("Impatient VIP client")).not.toBeInTheDocument();
  });

  test("resets back to the ready state", () => {
    render(
      <GauntletDashboard
        citationLookup={citationLookup}
        modeToggleUrl="http://localhost:8001/target/mode"
        sseUrl="http://localhost:8001/events"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /prompt injection/i }));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getAllByText("Overhelpful contractor").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.queryAllByText("Overhelpful contractor")).toHaveLength(0);
    expect(screen.getByText("Choose an attack to populate the feed.")).toBeInTheDocument();
  });
});
