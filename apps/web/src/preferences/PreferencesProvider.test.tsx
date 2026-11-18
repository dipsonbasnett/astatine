import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PreferencesProvider } from "@/preferences/PreferencesProvider";
import { PREFERENCES_STORAGE_KEY, type Preferences } from "@/preferences/preferences";
import { usePreferences } from "@/preferences/usePreferences";

function PreferencesHarness() {
  const { preferences, updatePreferences, clearPreferences } = usePreferences();

  return (
    <div>
      <label>
        Callsign
        <input
          aria-label="Callsign"
          value={preferences.callsign}
          maxLength={32}
          onChange={(event) => {
            updatePreferences({ callsign: event.target.value });
          }}
        />
      </label>
      <label>
        Motion
        <select
          aria-label="Motion"
          value={preferences.motion}
          onChange={(event) => {
            updatePreferences({
              motion: event.target.value === "reduced" ? "reduced" : "system",
            });
          }}
        >
          <option value="system">System</option>
          <option value="reduced">Reduced</option>
        </select>
      </label>
      <button type="button" onClick={clearPreferences}>
        Reset
      </button>
    </div>
  );
}

function storedPreferences(): Preferences {
  return JSON.parse(
    window.localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? "null",
  ) as Preferences;
}

describe("PreferencesProvider", () => {
  it("loads stored browser-local preferences and applies reduced motion", () => {
    window.localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ callsign: "HALO", motion: "reduced" }),
    );

    render(
      <PreferencesProvider>
        <PreferencesHarness />
      </PreferencesProvider>,
    );

    expect(screen.getByLabelText("Callsign")).toHaveValue("HALO");
    expect(screen.getByLabelText("Motion")).toHaveValue("reduced");
    expect(document.documentElement).toHaveAttribute("data-motion", "reduced");
  });

  it("persists updates and removes the motion attribute for system motion", async () => {
    const user = userEvent.setup();

    render(
      <PreferencesProvider>
        <PreferencesHarness />
      </PreferencesProvider>,
    );

    const callsign = screen.getByLabelText("Callsign");
    await user.type(callsign, "VEGA");
    expect(storedPreferences()).toMatchObject({ callsign: "VEGA" });

    await user.selectOptions(screen.getByLabelText("Motion"), "reduced");
    expect(storedPreferences()).toMatchObject({ motion: "reduced" });
    expect(document.documentElement).toHaveAttribute("data-motion", "reduced");

    await user.selectOptions(screen.getByLabelText("Motion"), "system");
    expect(storedPreferences()).toMatchObject({ motion: "system" });
    expect(document.documentElement).not.toHaveAttribute("data-motion");
  });

  it("falls back to defaults for malformed storage", () => {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, "{not json");

    render(
      <PreferencesProvider>
        <PreferencesHarness />
      </PreferencesProvider>,
    );

    expect(screen.getByLabelText("Callsign")).toHaveValue("");
    expect(screen.getByLabelText("Motion")).toHaveValue("system");
  });

  it("clears the stored key and resets preferences", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ callsign: "ORION", motion: "reduced" }),
    );

    render(
      <PreferencesProvider>
        <PreferencesHarness />
      </PreferencesProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(window.localStorage.getItem(PREFERENCES_STORAGE_KEY)).toBeNull();
    expect(screen.getByLabelText("Callsign")).toHaveValue("");
    expect(screen.getByLabelText("Motion")).toHaveValue("system");
    expect(document.documentElement).not.toHaveAttribute("data-motion");
  });
});
