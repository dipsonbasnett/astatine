import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PrivacyNotice } from "@/components/layout/PrivacyNotice";

describe("PrivacyNotice", () => {
  it("opens an accessible data-policy dialog and closes it", async () => {
    const user = userEvent.setup();

    render(<PrivacyNotice />);

    await user.click(screen.getByRole("button", { name: "Data policy" }));

    const dialog = screen.getByRole("dialog", {
      name: "Data policy at a glance",
    });
    expect(dialog).toBeVisible();
    expect(screen.getByText("Recorded")).toBeVisible();
    expect(screen.getByText("Simulated")).toBeVisible();
    expect(screen.getByText("Research")).toBeVisible();
    expect(
      screen.getByText(/does not diagnose, predict medical events/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(dialog).not.toHaveAttribute("open");
  });
});
