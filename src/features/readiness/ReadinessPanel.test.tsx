import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeCheckIn } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";

import { ReadinessPanel } from "./ReadinessPanel";
import { assessReadiness } from "./readiness-engine";

const NOW = new Date("2026-11-16T10:00:00.000Z");

function renderPanel() {
  const assessment = assessReadiness({ checkIns: [makeCheckIn()], now: NOW });
  if (!assessment) throw new Error("Expected a readiness fixture.");
  renderWithProviders(<ReadinessPanel assessment={assessment} />);
  return assessment;
}

describe("ReadinessPanel", () => {
  it("shows the band, score, confidence, and window as text", () => {
    const assessment = renderPanel();

    expect(
      screen.getByRole("heading", { level: 2, name: "Recorded readiness" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Monitor")).toBeInTheDocument();
    expect(screen.getByText("69")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("43% coverage")).toBeInTheDocument();
    expect(screen.getByText("7 days")).toBeInTheDocument();
    expect(screen.getByText(/weighted recorded score is 69 of 100/i)).toBeInTheDocument();
    expect(assessment.actions[0]?.title).toBeTruthy();
  });

  it("exposes scored factors through accessible meters and leaves missing inputs empty", () => {
    renderPanel();

    const meters = screen.getAllByRole("meter");
    expect(meters).toHaveLength(3);
    expect(meters.every((meter) => meter.getAttribute("aria-valuenow"))).toBe(true);
    expect(screen.getAllByText(/Not enough data for this input/).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText(/^Recorded/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Context and confidence only")).toHaveLength(3);
  });

  it("renders missing data, escalation guidance, and the provenance formula", () => {
    const assessment = renderPanel();

    expect(
      screen.getAllByText(/At least three check-ins in this window/).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Escalation guidance")).toBeInTheDocument();
    expect(
      screen.getByText(/contact your mission medical support channel/),
    ).toBeInTheDocument();
    expect(screen.getByText(assessment.inputs.formula)).toBeInTheDocument();
    expect(
      screen.getAllByText(/Monitoring support, not diagnosis/).length,
    ).toBeGreaterThan(0);
  });
});
