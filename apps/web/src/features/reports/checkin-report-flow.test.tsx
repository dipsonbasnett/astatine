import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AppRoutes } from "@/app/AppRoutes";
import { db } from "@/lib/db";
import { renderWithProviders } from "@/test/render";

async function recordLowRecoveryCheckIn() {
  const user = userEvent.setup();
  renderWithProviders(<AppRoutes />, { route: "/check-in" });

  await screen.findByRole("heading", { level: 1, name: "Check-in" });
  await user.selectOptions(screen.getByLabelText("Fatigue"), "5");
  await user.selectOptions(screen.getByLabelText("Workload"), "5");
  await user.clear(screen.getByLabelText("Sleep duration (hours)"));
  await user.type(screen.getByLabelText("Sleep duration (hours)"), "5");
  await user.type(screen.getByLabelText("Planned exercise (minutes)"), "30");
  await user.type(screen.getByLabelText("Completed exercise (minutes)"), "0");
  await user.type(screen.getByLabelText("Hydration log entries"), "1");
  await user.type(screen.getByLabelText("Nutrition log entries"), "1");
  await user.click(screen.getByRole("button", { name: "Save check-in" }));

  await screen.findByText("Check-in saved in this browser");
  return user;
}

describe("check-in to readiness to coach flow", () => {
  it("records a check-in and shows an explainable coach recommendation", async () => {
    const user = await recordLowRecoveryCheckIn();

    await user.click(screen.getByRole("link", { name: "Review recovery readiness" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Recovery readiness" }),
    ).toBeInTheDocument();
    expect(document.title).toBe("Recovery readiness · Astatine");
    expect(await screen.findByText("Rest and recover")).toBeInTheDocument();
    expect(screen.getByText("Not used in readiness")).toBeInTheDocument();
    expect(
      screen.getAllByText(/Monitoring support, not diagnosis/).length,
    ).toBeGreaterThan(0);

    const coachHeading = screen.getByRole("heading", {
      level: 2,
      name: "Countermeasure coach",
    });
    const coach = coachHeading.closest("section");
    if (!coach) throw new Error("Expected the countermeasure coach section.");

    expect(within(coach).getAllByText("Attention").length).toBeGreaterThan(0);
    expect(
      within(coach).getByText(/If workload and fatigue are both high/),
    ).toBeInTheDocument();
    expect(
      within(coach).getAllByRole("link", { name: /NASA Human Research Program/ }),
    ).toHaveLength(2);
    expect(
      within(coach).getAllByText(/No verified research source is linked/),
    ).toHaveLength(4);

    await user.click(screen.getByRole("button", { name: "14 days" }));
    expect(screen.getByRole("button", { name: "14 days" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(await within(coach).findByText("14-day window")).toBeInTheDocument();

    expect(await db.checkIns.count()).toBe(1);
    expect(await db.telemetrySamples.count()).toBe(0);
  });

  it("freezes recorded readiness and its countermeasures into a local snapshot", async () => {
    const user = await recordLowRecoveryCheckIn();

    await user.click(
      screen.getByRole("link", { name: "Create a local report snapshot" }),
    );

    await screen.findByRole("heading", { level: 1, name: "Reports" });
    await user.click(
      await screen.findByRole("button", { name: "Create report snapshot" }),
    );

    expect(await screen.findByText("Snapshot saved")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { level: 3, name: "Snapshot readiness" }),
    ).toBeInTheDocument();

    const archive = screen
      .getByRole("heading", { level: 2, name: "Saved snapshots" })
      .closest("section");
    if (!archive) throw new Error("Expected the saved snapshots section.");
    expect(
      within(archive).getByRole("meter", {
        name: "Workload and fatigue rubric score",
      }),
    ).toHaveAttribute("aria-valuenow", "0");
    expect(within(archive).getByText("Rest and recover")).toBeInTheDocument();
    expect(
      within(archive).getByText("Workload and recovery balance"),
    ).toBeInTheDocument();

    expect(await db.checkIns.count()).toBe(1);
    expect(await db.reportSnapshots.count()).toBe(1);
    expect(await db.telemetrySamples.count()).toBe(0);

    const [snapshot] = await db.reportSnapshots.toArray();
    expect(snapshot).toMatchObject({
      checkInId: (await db.checkIns.toArray())[0]?.id,
      observation: { fatigue: 5, sleepHours: 5 },
      readiness: { band: "rest" },
      countermeasures: { dataClasses: ["recorded"] },
      dataClasses: ["recorded"],
      source: { category: "recorded", origin: "derived" },
    });
  });
});
