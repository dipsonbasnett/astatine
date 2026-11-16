import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeCheckIn } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";

import { buildCountermeasurePlan } from "@/features/countermeasures/countermeasure-engine";
import { assessReadiness } from "@/features/readiness/readiness-engine";

import { ReadinessDetails } from "./ReadinessDetails";

const NOW = new Date("2026-11-16T10:00:00.000Z");

function setup(overrides: Parameters<typeof makeCheckIn>[0] = {}) {
  const assessment = assessReadiness({
    checkIns: [makeCheckIn(overrides)],
    now: NOW,
  });
  if (!assessment) throw new Error("Expected a readiness fixture.");
  const countermeasures = buildCountermeasurePlan(assessment);

  return { assessment, countermeasures };
}

describe("ReadinessDetails", () => {
  it("shows the rubric inputs, confidence, and provenance in accessible form", () => {
    const { assessment, countermeasures } = setup();
    renderWithProviders(
      <ReadinessDetails assessment={assessment} countermeasures={countermeasures} />,
    );

    expect(
      screen.getByRole("heading", { name: "Recovery readiness" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Monitor")).toBeInTheDocument();
    expect(screen.getByText("69/100")).toBeInTheDocument();

    const meters = screen.getAllByRole("meter");
    expect(meters).toHaveLength(3);
    expect(
      screen.getByRole("meter", { name: "Workload and fatigue rubric score" }),
    ).toHaveAttribute("aria-valuenow", "50");

    expect(screen.getByText("Confidence: Low")).toBeInTheDocument();
    expect(screen.getByText(/Only one check-in was recorded/)).toBeInTheDocument();
    expect(screen.getByText("Provenance and formula")).toBeInTheDocument();
    expect(screen.getByText(assessment.inputs.formula)).toBeInTheDocument();
    expect(screen.getByText(/Data classes/)).toBeInTheDocument();
  });

  it("renders explainable suggestions with trigger and caution text", () => {
    const { assessment, countermeasures } = setup({ fatigue: 5 });
    renderWithProviders(
      <ReadinessDetails assessment={assessment} countermeasures={countermeasures} />,
    );

    expect(screen.getByText("Primary")).toBeInTheDocument();
    expect(screen.getByText("Supporting")).toBeInTheDocument();
    expect(
      screen.getByText(/Trigger: Workload and fatigue · limits · 0\/100/),
    ).toBeInTheDocument();
    expect(screen.getByText("Workload and recovery balance")).toBeInTheDocument();
    expect(screen.getByText(/Fatigue has many causes/)).toBeInTheDocument();
    expect(
      screen.getAllByText(/Monitoring support, not diagnosis/).length,
    ).toBeGreaterThan(0);
  });

  it("supports a nested heading level for report snapshots", () => {
    const { assessment, countermeasures } = setup();
    renderWithProviders(
      <ReadinessDetails
        assessment={assessment}
        countermeasures={countermeasures}
        headingLevel="h3"
        title="Snapshot readiness"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Snapshot readiness" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 4, name: /Inputs from the recorded window/ }),
    ).toBeInTheDocument();
  });
});
