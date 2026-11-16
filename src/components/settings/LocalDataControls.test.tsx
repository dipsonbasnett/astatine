import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";
import type { CheckInDraft } from "@/types/health";
import { renderWithProviders } from "@/test/render";

import { createCheckIn } from "@/features/checkin/checkin-repository";
import { simulateTelemetry } from "@/features/telemetry/telemetry-engine";
import { saveSimulatedTelemetry } from "@/features/telemetry/telemetry-repository";

import { LocalDataControls } from "./LocalDataControls";

const NOW = "2026-11-16T10:00:00.000Z";

const draft: CheckInDraft = {
  observedAt: "2026-11-16T08:00:00.000Z",
  sleepHours: 7.5,
  sleepQuality: 3,
  fatigue: 3,
  mood: 3,
  soreness: 2,
  stress: 2,
  hydration: 3,
};

async function seed() {
  await createCheckIn(draft, { now: NOW, id: "checkin-settings" });
  await saveSimulatedTelemetry(
    simulateTelemetry({
      scenarioId: "steady-orbit",
      seed: 5,
      startedAt: "2026-11-16T09:00:00.000Z",
    }),
    { now: NOW },
  );
}

afterEach(() => {
  Reflect.deleteProperty(URL, "createObjectURL");
  Reflect.deleteProperty(URL, "revokeObjectURL");
});

describe("LocalDataControls", () => {
  it("shows separate counts for each class and no automatic uploads", async () => {
    await seed();
    renderWithProviders(<LocalDataControls />);

    const checkIns = await screen.findByText("Recorded check-ins");
    await waitFor(() => {
      expect(checkIns.nextElementSibling).toHaveTextContent("1");
    });
    expect(
      screen.getByText("Simulated telemetry samples").nextElementSibling,
    ).toHaveTextContent("21");
    expect(screen.getByText("Automatic uploads").nextElementSibling).toHaveTextContent(
      "None",
    );
  });

  it("exports a local JSON file without uploading", async () => {
    await seed();
    const createObjectURL = vi.fn(() => "blob:astatine-test");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    const user = userEvent.setup();
    renderWithProviders(<LocalDataControls />);

    await user.click(screen.getByRole("button", { name: "Export local data" }));

    expect(await screen.findByText("Local export prepared")).toBeInTheDocument();
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:astatine-test");
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("rejects a file that is not a valid Astatine export", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LocalDataControls />);

    await user.upload(
      screen.getByLabelText("Astatine local-data export (JSON)"),
      new File(["not json"], "export.json", { type: "application/json" }),
    );

    expect(await screen.findByText("Import rejected")).toBeInTheDocument();
    expect(
      await screen.findByText("The selected file is not valid JSON."),
    ).toBeInTheDocument();
    expect(await db.checkIns.count()).toBe(0);
  });

  it("deletes only the selected data class after confirmation", async () => {
    await seed();
    const user = userEvent.setup();
    renderWithProviders(<LocalDataControls />);

    await screen.findByText("Simulated telemetry samples");
    await user.click(screen.getByRole("button", { name: "Delete simulated data" }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Delete simulated telemetry?" }),
    ).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: "Delete simulated data" }),
    );

    expect(await screen.findByText("Local data deleted")).toBeInTheDocument();
    await waitFor(async () => {
      expect(await db.telemetrySamples.count()).toBe(0);
    });
    expect(await db.checkIns.count()).toBe(1);
  });

  it("cancels a deletion without removing data", async () => {
    await seed();
    const user = userEvent.setup();
    renderWithProviders(<LocalDataControls />);

    await user.click(screen.getByRole("button", { name: "Delete all health data" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(document.querySelector("dialog")).not.toHaveAttribute("open");
    expect(await db.checkIns.count()).toBe(1);
    expect(await db.telemetrySamples.count()).toBe(21);
  });
});
