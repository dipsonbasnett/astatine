import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeCheckIn } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";

import { assessReadiness } from "@/features/readiness/readiness-engine";

import { CountermeasureCoach } from "./CountermeasureCoach";
import { buildCountermeasureCoach } from "./countermeasure-engine";

const NOW = new Date("2026-11-16T10:00:00.000Z");

function renderCoach() {
  const assessment = assessReadiness({ checkIns: [makeCheckIn()], now: NOW });
  if (!assessment) throw new Error("Expected a readiness fixture.");
  const coach = buildCountermeasureCoach(assessment);
  renderWithProviders(<CountermeasureCoach coach={coach} />);
  const heading = screen.getByRole("heading", {
    level: 2,
    name: "Countermeasure coach",
  });
  const section = heading.closest("section");
  if (!section) throw new Error("Expected the coach section.");
  return { coach, section };
}

describe("CountermeasureCoach", () => {
  it("renders one labelled item per coach domain", () => {
    const { section } = renderCoach();
    const view = within(section);

    expect(view.getAllByRole("heading", { level: 3 })).toHaveLength(6);
    for (const title of [
      "Exercise adherence",
      "Sleep duration and regularity",
      "Hydration logging gaps",
      "Nutrition logging gaps",
      "Workload and recovery balance",
      "Check-in completion",
    ]) {
      expect(view.getByRole("heading", { level: 3, name: title })).toBeInTheDocument();
    }
  });

  it("shows status, current value, missing data, and recorded sources", () => {
    const { section } = renderCoach();
    const view = within(section);

    expect(view.getAllByText("Missing data").length).toBeGreaterThan(0);
    expect(view.getAllByText("Attention").length).toBeGreaterThan(0);
    expect(
      view.getByText(/No planned or completed exercise minutes/),
    ).toBeInTheDocument();
    expect(view.getAllByText(/Recorded · crew check-ins/).length).toBeGreaterThan(0);
    expect(view.getByText(/No hydration entries in this window/)).toBeInTheDocument();
  });

  it("links cited research only where a verified source exists", () => {
    const { section } = renderCoach();
    const view = within(section);

    const researchLinks = view.getAllByRole("link", {
      name: /NASA Human Research Program/,
    });
    expect(researchLinks).toHaveLength(2);
    for (const link of researchLinks) {
      expect(link).toHaveAttribute("href", "https://www.nasa.gov/hrp/");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
      expect(link.getAttribute("rel")).toContain("noreferrer");
    }
    expect(
      view.getAllByText(/No verified research source is linked for this item/),
    ).toHaveLength(4);
  });

  it("keeps the non-diagnostic boundary visible", () => {
    const { section } = renderCoach();
    const view = within(section);

    expect(view.getByText("Non-diagnostic")).toBeInTheDocument();
    expect(view.getByText(/Monitoring support, not diagnosis/)).toBeInTheDocument();
    expect(view.getByText(/do not establish fitness for duty/)).toBeInTheDocument();
    expect(
      view.getAllByText(/general program overviews, not clinical guidance/).length,
    ).toBeGreaterThan(0);
  });
});
