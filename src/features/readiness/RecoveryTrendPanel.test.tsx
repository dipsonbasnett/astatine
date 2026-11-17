import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { SimulatedTrendPoint } from "@/types/health";

import { buildSimulatedRecoveryTrend } from "./recovery-trend";
import { RecoveryTrendPanel } from "./RecoveryTrendPanel";

const TREND = buildSimulatedRecoveryTrend({ windowDays: 7 });

function pointAt(index: number): SimulatedTrendPoint {
  const point = TREND.points.at(index);
  if (!point) throw new Error("Expected a simulated trend point.");
  return point;
}

function dayButton(point: SimulatedTrendPoint) {
  return screen.getByRole("button", {
    name: `${point.label}: simulated recovery ${point.value} of 100`,
  });
}

describe("RecoveryTrendPanel", () => {
  it("lets the user inspect each simulated day with pointer or keyboard", async () => {
    const user = userEvent.setup();
    render(<RecoveryTrendPanel trend={TREND} />);

    const list = screen.getByRole("list", {
      name: "Simulated daily recovery values",
    });
    expect(within(list).getAllByRole("button")).toHaveLength(7);

    const latest = pointAt(-1);
    expect(dayButton(latest)).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByText(`${latest.label} · ${latest.value} of 100`),
    ).toBeInTheDocument();

    const target = pointAt(2);
    await user.click(dayButton(target));
    expect(dayButton(target)).toHaveAttribute("aria-pressed", "true");
    expect(dayButton(latest)).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByText(`${target.label} · ${target.value} of 100`),
    ).toBeInTheDocument();

    const focused = pointAt(0);
    act(() => {
      dayButton(focused).focus();
    });
    expect(dayButton(focused)).toHaveFocus();
    expect(
      screen.getByText(`${focused.label} · ${focused.value} of 100`),
    ).toBeInTheDocument();
  });
});
