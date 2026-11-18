import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppRoutes } from "@/app/AppRoutes";
import { db } from "@/lib/db";
import { renderWithProviders } from "@/test/render";

const download = vi.hoisted(() => vi.fn());

vi.mock("@/lib/download", () => ({
  downloadTextFile: download,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

async function recordCheckIn() {
  const user = userEvent.setup();
  renderWithProviders(<AppRoutes />, { route: "/check-in" });

  await screen.findByRole("heading", { level: 1, name: "Check-in" });
  await user.selectOptions(screen.getByLabelText("Fatigue"), "4");
  await user.selectOptions(screen.getByLabelText("Workload"), "5");
  await user.clear(screen.getByLabelText("Sleep duration (hours)"));
  await user.type(screen.getByLabelText("Sleep duration (hours)"), "6");
  await user.type(screen.getByLabelText("Planned exercise (minutes)"), "30");
  await user.type(screen.getByLabelText("Completed exercise (minutes)"), "20");
  await user.type(screen.getByLabelText("Hydration log entries"), "3");
  await user.type(screen.getByLabelText("Nutrition log entries"), "2");
  await user.click(screen.getByRole("button", { name: "Save check-in" }));
  await screen.findByText("Check-in saved in this browser");

  return user;
}

describe("check-in to brief to report to export flow", () => {
  it("carries recorded data through the review and exports the visible report", async () => {
    const user = await recordCheckIn();

    await user.click(screen.getByRole("link", { name: "Review recovery readiness" }));
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Recovery readiness",
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { level: 2, name: "Countermeasure coach" }),
    ).toBeInTheDocument();

    const primary = screen.getByRole("navigation", { name: "Primary navigation" });
    await user.click(within(primary).getByRole("link", { name: "Brief" }));
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Mission health brief",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/recorded check-in/).length).toBeGreaterThan(0);

    const related = await screen.findByRole("navigation", {
      name: "Related surfaces",
    });
    await user.click(within(related).getByRole("link", { name: /^Reports/ }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Reports" }),
    ).toBeInTheDocument();
    const article = await screen.findByRole("article", {
      name: "Astatine recorded mission-health review",
    });
    expect(within(article).getByText(/Last 7 days/)).toBeInTheDocument();
    expect(
      within(article).getByText(/Private notes: excluded by default/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "14 days" }));
    expect(screen.getByRole("button", { name: "14 days" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(article).getByText(/Last 14 days/)).toBeInTheDocument();

    const reportId = within(article).getByText(/^AST-RPT-/).textContent;
    if (!reportId) throw new Error("Expected a visible report ID.");

    await user.click(screen.getByRole("button", { name: "Download Markdown" }));
    const markdownCall = download.mock.calls.at(-1);
    if (!markdownCall) throw new Error("Expected a Markdown download.");
    const [markdownName, markdownMime, markdown] = markdownCall as [
      string,
      string,
      string,
    ];
    expect(markdownName).toBe(`astatine-mission-report-${reportId.toLowerCase()}.md`);
    expect(markdownMime).toBe("text/markdown");
    expect(markdown).toContain(`**Report ID:** ${reportId}`);
    expect(markdown).toContain("**Data class:** Recorded only");
    expect(markdown).toContain("**Private notes:** Excluded by default");
    expect(markdown).not.toContain("## Private notes");
    expect(markdown).toContain("## Disclaimer and limitations");
    expect(screen.getAllByText(/Astatine did not upload it/).length).toBeGreaterThan(0);

    const privateNotes = screen.getByRole("checkbox", {
      name: /Include private notes/,
    });
    await user.click(privateNotes);
    expect(privateNotes).toBeChecked();
    expect(
      within(article).getAllByText(/included by explicit consent/).length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Download JSON" }));
    const jsonCall = download.mock.calls.at(-1);
    if (!jsonCall) throw new Error("Expected a JSON download.");
    const [jsonName, jsonMime, json] = jsonCall as [string, string, string];
    expect(jsonName).toBe(`astatine-mission-report-${reportId.toLowerCase()}.json`);
    expect(jsonMime).toBe("application/json");
    const exported = JSON.parse(json) as {
      id: string;
      dataClasses: string[];
      excludedDataClasses: string[];
      privateNotes: { included: boolean; items: string[] };
      sourceSummary: { category: string; status: string }[];
    };
    expect(exported.id).toBe(reportId);
    expect(exported.dataClasses).toEqual(["recorded"]);
    expect(exported.excludedDataClasses).toEqual(["simulated", "research"]);
    expect(exported.sourceSummary).toEqual([
      expect.objectContaining({ category: "recorded", status: "included" }),
      expect.objectContaining({ category: "simulated", status: "excluded" }),
      expect.objectContaining({ category: "research", status: "excluded" }),
    ]);
    expect(exported.privateNotes).toMatchObject({ included: true, items: [] });

    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "Print or save as PDF" }));
    expect(print).toHaveBeenCalledTimes(1);

    expect(await db.checkIns.count()).toBe(1);
    expect(await db.telemetrySamples.count()).toBe(0);
    expect(await db.reportSnapshots.count()).toBe(0);
  });
});
