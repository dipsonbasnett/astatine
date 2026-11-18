import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AppRoutes } from "@/app/AppRoutes";
import { PREFERENCES_STORAGE_KEY } from "@/preferences/preferences";
import { renderWithProviders } from "@/test/render";

describe("Settings", () => {
  it("saves a local callsign and resets preferences through a confirmation dialog", async () => {
    const user = userEvent.setup();

    renderWithProviders(<AppRoutes />, { route: "/settings" });

    await screen.findByRole("heading", { level: 1, name: "Settings" });

    const callsign = screen.getByLabelText("Callsign");
    await user.type(callsign, "ORION");

    expect(callsign).toHaveValue("ORION");
    expect(screen.getByText("ORION")).toBeInTheDocument();
    expect(window.localStorage.getItem(PREFERENCES_STORAGE_KEY)).toContain("ORION");

    await user.click(screen.getByRole("button", { name: "Reset local preferences" }));

    const dialog = screen.getByRole("dialog", {
      name: "Reset local preferences?",
    });
    expect(dialog).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Reset preferences" }));

    expect(callsign).toHaveValue("");
    expect(window.localStorage.getItem(PREFERENCES_STORAGE_KEY)).toBeNull();
  });
});
