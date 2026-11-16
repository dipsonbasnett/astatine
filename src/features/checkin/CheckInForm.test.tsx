import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { renderWithProviders } from "@/test/render";

import { CheckInForm } from "./CheckInForm";

async function fillAndSave() {
  const user = userEvent.setup();
  renderWithProviders(<CheckInForm />);

  await user.selectOptions(screen.getByLabelText("Fatigue"), "5");
  await user.click(screen.getByRole("button", { name: "Save check-in" }));

  return user;
}

describe("CheckInForm", () => {
  it("saves a locally recorded check-in with the chosen ratings", async () => {
    await fillAndSave();

    expect(await screen.findByText("Check-in saved in this browser")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Review recovery readiness" }),
    ).toHaveAttribute("href", "/readiness");
    expect(
      screen.getByRole("link", { name: "Create a local report snapshot" }),
    ).toHaveAttribute("href", "/reports");

    await waitFor(async () => {
      expect(await db.checkIns.count()).toBe(1);
    });
    const [record] = await db.checkIns.toArray();
    expect(record?.fatigue).toBe(5);
    expect(record?.source.category).toBe("recorded");
    expect(record?.source.origin).toBe("crew-entry");
  });

  it("stores optional daily practices without treating blanks as zero", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CheckInForm />);

    await user.selectOptions(screen.getByLabelText("Workload"), "4");
    await user.type(screen.getByLabelText("Planned exercise (minutes)"), "45");
    await user.type(screen.getByLabelText("Completed exercise (minutes)"), "30");
    await user.type(screen.getByLabelText("Hydration log entries"), "3");
    await user.type(screen.getByLabelText("Nutrition log entries"), "2");
    await user.click(screen.getByRole("button", { name: "Save check-in" }));

    await screen.findByText("Check-in saved in this browser");
    await waitFor(async () => {
      expect(await db.checkIns.count()).toBe(1);
    });
    const [record] = await db.checkIns.toArray();
    expect(record).toMatchObject({
      workload: 4,
      exercisePlannedMinutes: 45,
      exerciseCompletedMinutes: 30,
      hydrationEntries: 3,
      nutritionEntries: 2,
    });
  });

  it("leaves omitted practice fields undefined", async () => {
    await fillAndSave();

    await waitFor(async () => {
      expect(await db.checkIns.count()).toBe(1);
    });
    const [record] = await db.checkIns.toArray();
    expect(record?.workload).toBeUndefined();
    expect(record?.exercisePlannedMinutes).toBeUndefined();
    expect(record?.hydrationEntries).toBeUndefined();
  });

  it("blocks submission and explains the missing sleep duration", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CheckInForm />);

    await user.clear(screen.getByLabelText("Sleep duration (hours)"));
    await user.click(screen.getByRole("button", { name: "Save check-in" }));

    expect(
      await screen.findByText("Check the highlighted fields. Nothing was saved."),
    ).toBeInTheDocument();
    expect(await screen.findByText("Enter sleep duration in hours.")).toBeInTheDocument();
    expect(await db.checkIns.count()).toBe(0);
  });

  it("states the local-only boundaries in the form", () => {
    renderWithProviders(<CheckInForm />);

    expect(screen.getByText(/saved only in this browser/i)).toBeInTheDocument();
    expect(
      screen.getByText(/not a medical record or a fitness-for-duty assessment/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Review, export, or delete data" }),
    ).toHaveAttribute("href", "/settings");
  });
});
