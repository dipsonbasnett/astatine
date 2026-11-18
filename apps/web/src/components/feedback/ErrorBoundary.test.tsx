import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";

function BrokenView(): never {
  throw new Error("Synthetic render failure");
}

describe("ErrorBoundary", () => {
  it("contains a render failure and explains that nothing was uploaded", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BrokenView />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "The interface encountered an unexpected error",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No data was uploaded/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload page" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Go to overview" })).toBeVisible();
  });
});
