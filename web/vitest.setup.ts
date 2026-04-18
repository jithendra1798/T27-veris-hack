import React from "react";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const nextImageProps = { ...props };
    delete nextImageProps.fill;
    delete nextImageProps.unoptimized;
    return React.createElement("img", { alt: "", ...nextImageProps });
  },
}));

afterEach(() => {
  cleanup();
});
