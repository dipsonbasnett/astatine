import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { makeCheckIn } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";

import { VitalsExplorer } from "./VitalsExplorer";
import { buildVitalsSnapshot } from "./vitals-engine";

const NOW = new Date("2026-11-16T12:00:00.000Z");

const CHECK_INS = [
  makeCheckIn({
    id: "checkin-a",
    observedAt: "2026-11-13T08:00:00.000Z",
    sleepHours: 5,
    exercisePlannedMinutes: 30,
    exerciseCompletedMinutes: 20,
    nutritionEntries: 2,
  }),
  makeCheckIn({
    id: "checkin-b",
    observedAt: "2026-11-15T08:00:00.000Z",
    sleepHours: 7.5,
    exercisePlannedMinutes: 40,
    exerciseCompletedMinutes: 35,
    hydrationEntries: 2,
    nutritionEntries: 3,
  }),
];

function renderExplorer() {
  const snapshot = buildVitalsSnapshot({ checkIns: CHECK_INS, now: NOW });
  if (!snapshot) throw new Error("Expected a vitals snapshot.");

  return renderWithProviders(<VitalsExplorer snapshot={snapshot} />);
}

describe("VitalsExplorer", () => {
  it("exposes seven views, defaults to heart rate, and separates simulated values", () => {
    renderExplorer();

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(7);
    expect(screen.getByRole("tab", { name: "Heart rate" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Heart rate" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByRole("tab", { name: "SpO2" })).toHaveAttribute("tabindex", "-1");

    const panel = screen.getByRole("tabpanel");
    expect(
      within(panel).getByRole("heading", { level: 3, name: "Heart rate" }),
    ).toBeInTheDocument();
    expect(within(panel).getAllByText("Not recorded")).toHaveLength(2);
    expect(
      within(panel).getByText("No recorded value in this window"),
    ).toBeInTheDocument();
    expect(within(panel).getByText("Not recorded data")).toBeInTheDocument();
    expect(within(panel).getByText("13 simulated samples")).toBeInTheDocument();
    expect(
      within(panel).getByText(/astatine\.vitals-simulation · v1 · seed 20261116/),
    ).toBeInTheDocument();
    expect(
      within(panel).getByRole("img", {
        name: /Heart rate, simulated demonstration values/,
      }),
    ).toBeInTheDocument();
    expect(
      within(panel).getByRole("heading", { level: 5, name: "Missing or partial data" }),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText(/2 recorded check-ins in this window do not include/),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText(/No verified research source is linked for this view/),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText(/Astatine is not affiliated with, endorsed by/),
    ).toBeInTheDocument();
  });

  it("wires tabs, panels, and chart data for assistive technology", () => {
    renderExplorer();

    const tablist = screen.getByRole("tablist", { name: "Vital signs" });
    expect(tablist).toHaveAttribute("aria-orientation", "horizontal");

    const heartRate = screen.getByRole("tab", { name: "Heart rate" });
    const panel = screen.getByRole("tabpanel");
    expect(heartRate).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", heartRate.id);

    const simulatedFigure = within(panel).getByRole("figure", {
      name: "Heart rate, simulated demonstration values",
    });
    expect(within(simulatedFigure).getAllByRole("listitem")).toHaveLength(13);
    expect(
      within(simulatedFigure).getByRole("img", {
        name: /13 simulated values/,
      }),
    ).toBeInTheDocument();
  });

  it("shows recorded sleep with benchmark context and a verified research link", async () => {
    const user = userEvent.setup();
    renderExplorer();

    await user.click(screen.getByRole("tab", { name: "Sleep and recovery" }));
    const panel = screen.getByRole("tabpanel");

    expect(within(panel).getByText("7.5 h")).toBeInTheDocument();
    expect(
      within(panel).getByText(/Recorded on 2 of 7 days in this window/),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText("Rubric benchmark, not a clinical range"),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText(/readiness rubric scores sleep duration/),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText(/No simulated series is shown for this view/),
    ).toBeInTheDocument();

    const researchLink = within(panel).getByRole("link", {
      name: /NASA Human Research Program/,
    });
    expect(researchLink).toHaveAttribute("href", "https://www.nasa.gov/hrp/");
    expect(researchLink).toHaveAttribute("target", "_blank");
    expect(within(panel).getByText(/Limitations:/)).toBeInTheDocument();
    expect(
      within(panel).getByText(/does not describe the selected crew member/),
    ).toBeInTheDocument();

    const related = within(panel).getByRole("navigation", {
      name: "Related surfaces for Sleep and recovery",
    });
    for (const label of ["Check-in", "Readiness", "Brief", "Research"]) {
      expect(within(related).getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("supports roving keyboard navigation and wraps at the ends", async () => {
    const user = userEvent.setup();
    renderExplorer();

    const heartRate = screen.getByRole("tab", { name: "Heart rate" });
    heartRate.focus();
    expect(heartRate).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    const spo2 = screen.getByRole("tab", { name: "SpO2" });
    expect(spo2).toHaveAttribute("aria-selected", "true");
    expect(spo2).toHaveFocus();

    await user.keyboard("{End}");
    const nutrition = screen.getByRole("tab", { name: "Nutrition" });
    expect(nutrition).toHaveAttribute("aria-selected", "true");
    expect(nutrition).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Heart rate" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.keyboard("{ArrowLeft}");
    expect(nutrition).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Heart rate" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
