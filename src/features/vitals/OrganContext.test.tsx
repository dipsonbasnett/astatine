import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PREFERENCES_STORAGE_KEY } from "@/preferences/preferences";
import { makeCheckIn } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";

import { OrganContext } from "./OrganContext";
import { buildSimulatedVitalsMonitor } from "./vitals-simulation";

const MONITOR = buildSimulatedVitalsMonitor(new Date("2026-11-16T12:00:00.000Z"));
const LATEST = makeCheckIn({ observedAt: "2026-11-16T08:00:00.000Z" });

function organGroup() {
  const group = document.querySelector<SVGGElement>(".organ-heartbeat");
  if (!group) throw new Error("Expected the organ animation group.");
  return group;
}

describe("OrganContext", () => {
  it("pairs the heart illustration with the simulated monitor and recorded context", () => {
    renderWithProviders(<OrganContext monitor={MONITOR} latestCheckIn={LATEST} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Organ context" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Organ context" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("tab", { name: "Heart" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    const panel = screen.getByRole("tabpanel");
    const heartTab = screen.getByRole("tab", { name: "Heart" });
    expect(heartTab).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", heartTab.id);

    const heartFigure = within(panel).getByRole("img", {
      name: /Procedural heart illustration/,
    });
    expect(heartFigure.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(
      within(panel).getByRole("heading", { level: 3, name: "Heart" }),
    ).toBeInTheDocument();
    expect(within(panel).getByText("Simulated monitor")).toBeInTheDocument();
    expect(within(panel).getByText("bpm")).toBeInTheDocument();
    expect(within(panel).getByText("breaths/min")).toBeInTheDocument();
    expect(within(panel).getByText("Not sensor data")).toBeInTheDocument();
    expect(within(panel).getByText("Recorded context")).toBeInTheDocument();
    expect(within(panel).getByText("7.5 h")).toBeInTheDocument();
    expect(within(panel).getByText(/Newest recorded check-in/)).toBeInTheDocument();
    expect(
      within(panel).getByText(/No WebGL is required; when WebGL is unavailable/),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText(/not an ECG and not an assessment of cardiac function/),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText(/No verified research source is linked for this view/),
    ).toBeInTheDocument();

    expect(organGroup().style.animationPlayState).toBe("running");
    expect(organGroup().style.animationDuration).not.toBe("");
  });

  it("switches organ views by keyboard without losing the monitor", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrganContext monitor={MONITOR} latestCheckIn={LATEST} />);

    const heart = screen.getByRole("tab", { name: "Heart" });
    heart.focus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Lungs" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    let panel = screen.getByRole("tabpanel");
    expect(
      within(panel).getByRole("img", { name: /Procedural lung illustration/ }),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText(/not spirometry or a breathing assessment/),
    ).toBeInTheDocument();
    expect(within(panel).getByText("Simulated monitor")).toBeInTheDocument();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Brain" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    panel = screen.getByRole("tabpanel");
    expect(
      within(panel).getByRole("img", { name: /Procedural brain illustration/ }),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText(/not a reading of thought, brain activity/),
    ).toBeInTheDocument();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Lungs" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Heart" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("pauses and resumes organ motion while keeping the organ visible", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrganContext monitor={MONITOR} latestCheckIn={LATEST} />);

    let panel = screen.getByRole("tabpanel");
    const pause = within(panel).getByRole("button", { name: "Pause organ motion" });
    expect(pause).toHaveAttribute("aria-pressed", "false");
    expect(organGroup().style.animationPlayState).toBe("running");

    await user.click(pause);
    panel = screen.getByRole("tabpanel");
    expect(
      within(panel).getByRole("button", { name: "Resume organ motion" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(within(panel).getByText(/Organ motion is paused/)).toBeInTheDocument();
    expect(organGroup().style.animationPlayState).toBe("paused");
    expect(
      screen.getByRole("img", { name: /Procedural heart illustration/ }),
    ).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "Resume organ motion" }));
    expect(organGroup().style.animationPlayState).toBe("running");
  });

  it("honors the in-app reduced-motion preference without hiding the organ", () => {
    window.localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ callsign: "", motion: "reduced" }),
    );

    renderWithProviders(<OrganContext monitor={MONITOR} latestCheckIn={LATEST} />);

    expect(
      within(screen.getByRole("tabpanel")).getByText(
        /Reduced motion is active from your system or in-app preference/,
      ),
    ).toBeInTheDocument();
    expect(organGroup().style.animationPlayState).toBe("paused");
    expect(
      screen.getByRole("img", { name: /Procedural heart illustration/ }),
    ).toBeVisible();
  });

  it("states the absence of recorded check-ins rather than estimating one", () => {
    renderWithProviders(<OrganContext monitor={MONITOR} latestCheckIn={null} />);

    const panel = screen.getByRole("tabpanel");
    expect(
      within(panel).getByText(/No recorded check-ins in this browser/),
    ).toBeInTheDocument();
    expect(
      within(panel).getByRole("link", { name: "Record a check-in" }),
    ).toBeInTheDocument();
  });
});
