import { describe, expect, it } from "vitest";

import type { MissionPlan } from "@/types/health";

import { buildMissionTimeline, validateMissionPlan } from "./mission-engine";

const plan: MissionPlan = {
  id: "demo-mission",
  name: "Simulated mission",
  startAt: "2026-01-01T00:00:00.000Z",
  label: "simulated",
  phases: [
    {
      id: "phase-1",
      label: "Commissioning",
      durationMinutes: 60,
      summary: "Simulated setup period.",
    },
    {
      id: "phase-2",
      label: "Science block",
      durationMinutes: 120,
      summary: "Simulated science period.",
    },
  ],
};

describe("validateMissionPlan", () => {
  it("accepts a simulated plan with valid phases", () => {
    const result = validateMissionPlan(plan);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(plan);
  });

  it("requires the simulated label", () => {
    const result = validateMissionPlan({ ...plan, label: "operational" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toContainEqual({
      field: "label",
      message: "Mission plans must be labeled simulated.",
    });
  });

  it("rejects duplicate phase ids and invalid durations", () => {
    const result = validateMissionPlan({
      ...plan,
      phases: [
        plan.phases[0],
        {
          id: "phase-1",
          label: "Repeat",
          durationMinutes: 0,
          summary: "Invalid duration.",
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    const fields = result.issues.map((issue) => issue.field);
    expect(fields).toContain("phases.1.id");
    expect(fields).toContain("phases.1.durationMinutes");
  });

  it("rejects a non-object plan", () => {
    expect(validateMissionPlan("plan").ok).toBe(false);
  });
});

describe("buildMissionTimeline", () => {
  it("marks elapsed, active, and upcoming phases with progress", () => {
    const timeline = buildMissionTimeline(plan, "2026-01-01T00:30:00.000Z");

    expect(timeline).toMatchObject({
      missionId: "demo-mission",
      name: "Simulated mission",
      label: "simulated",
      currentPhaseId: "phase-1",
      elapsedMinutes: 30,
      totalMinutes: 180,
      progress: 16.7,
    });
    expect(timeline.phases[0]).toMatchObject({
      status: "active",
      progress: 50,
      startsAt: "2026-01-01T00:00:00.000Z",
      endsAt: "2026-01-01T01:00:00.000Z",
    });
    expect(timeline.phases[1]).toMatchObject({
      status: "upcoming",
      progress: 0,
      startsAt: "2026-01-01T01:00:00.000Z",
      endsAt: "2026-01-01T03:00:00.000Z",
    });
  });

  it("reports no active phase before the start", () => {
    const timeline = buildMissionTimeline(plan, "2025-12-31T23:00:00.000Z");

    expect(timeline.currentPhaseId).toBeNull();
    expect(timeline.elapsedMinutes).toBe(0);
    expect(timeline.progress).toBe(0);
    expect(timeline.phases.map((phase) => phase.status)).toEqual([
      "upcoming",
      "upcoming",
    ]);
  });

  it("marks every phase complete after the mission ends", () => {
    const timeline = buildMissionTimeline(plan, "2026-01-02T00:00:00.000Z");

    expect(timeline.currentPhaseId).toBeNull();
    expect(timeline.elapsedMinutes).toBe(180);
    expect(timeline.progress).toBe(100);
    expect(timeline.phases.map((phase) => phase.status)).toEqual([
      "complete",
      "complete",
    ]);
    expect(timeline.phases.every((phase) => phase.progress === 100)).toBe(true);
  });

  it("throws for invalid timestamps", () => {
    expect(() => buildMissionTimeline(plan, "nope")).toThrow(RangeError);
  });
});
