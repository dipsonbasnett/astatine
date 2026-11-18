import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

describe("form fields", () => {
  it("associates an input with its label, hint, and error", () => {
    render(
      <Input
        label="Callsign"
        hint="Optional and local only."
        error="Use 32 characters or fewer."
        defaultValue=""
      />,
    );

    const input = screen.getByLabelText("Callsign");
    expect(input).toHaveAccessibleDescription(
      "Optional and local only. Use 32 characters or fewer.",
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("supports a labelled native select", () => {
    render(
      <Select label="Motion" defaultValue="system">
        <option value="system">Use system preference</option>
        <option value="reduced">Reduce motion</option>
      </Select>,
    );

    const select = screen.getByLabelText("Motion");
    expect(select).toHaveValue("system");
    expect(select).toHaveAccessibleDescription("");
  });
});

describe("state surfaces", () => {
  it("renders an empty state with a clear heading", () => {
    render(
      <EmptyState
        icon={<span />}
        title="Nothing recorded"
        description="This surface is not available yet."
        action={<a href="/">Return to overview</a>}
      />,
    );

    expect(screen.getByRole("heading", { name: "Nothing recorded" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to overview" })).toBeVisible();
  });

  it("announces an error state as an alert", () => {
    render(<ErrorState title="Unexpected error" description="Nothing was uploaded." />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Unexpected error" })).toBeInTheDocument();
  });
});

describe("inline alerts", () => {
  it("keeps static informational notices out of the live regions", () => {
    render(<InlineAlert tone="info" title="Recorded review" />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("announces success and danger updates", () => {
    const { rerender } = render(<InlineAlert tone="success" title="Saved" />);
    expect(screen.getByRole("status")).toBeInTheDocument();

    rerender(<InlineAlert tone="danger" title="Not saved" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("lets a dynamic info notice opt into a live region", () => {
    render(<InlineAlert tone="info" live title="No check-ins" />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
