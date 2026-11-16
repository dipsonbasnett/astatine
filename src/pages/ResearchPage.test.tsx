import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppRoutes } from "@/app/AppRoutes";
import { DatasetRegistry } from "@/features/research/DatasetRegistry";
import { makeDatasetProvenance } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";

describe("ResearchPage", () => {
  it("shows the integrity workflow and an honest empty registry", async () => {
    renderWithProviders(<AppRoutes />, { route: "/research" });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Research" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Research · Astatine");

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Research context, not personal data",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/never merged with recorded check-ins or simulated telemetry/),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { level: 2, name: "No datasets onboarded" }),
    ).toBeInTheDocument();

    const checklist = screen
      .getByRole("heading", { level: 2, name: "Dataset onboarding checklist" })
      .closest("section");
    if (!checklist) throw new Error("Expected the onboarding checklist section.");
    expect(within(checklist).getAllByRole("listitem")).toHaveLength(13);
    expect(
      within(checklist).getByText(/Record model-training use as not used/),
    ).toBeInTheDocument();

    const workflow = screen
      .getByRole("heading", { level: 2, name: "Source verification" })
      .closest("section");
    if (!workflow) throw new Error("Expected the source verification section.");
    expect(within(workflow).getAllByRole("listitem")).toHaveLength(5);
    expect(within(workflow).getByText("File checksum")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Research-context UI patterns",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Citation and attribution requirements",
      }),
    ).toBeInTheDocument();
  });

  it("renders a complete provenance record without personalizing it", () => {
    renderWithProviders(<DatasetRegistry datasets={[makeDatasetProvenance()]} />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Example research dataset" }),
    ).toBeInTheDocument();
    expect(screen.getByText("DOI: 10.0000/example")).toBeInTheDocument();
    expect(screen.getByText("Not used for model training.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Verified 2026-11-16 by Repository maintainer, role-level review.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Credit the dataset creators/)).toBeInTheDocument();

    const sourceLink = screen.getByRole("link", { name: /Open dataset page/ });
    expect(sourceLink).toHaveAttribute("target", "_blank");
    expect(sourceLink.getAttribute("rel")).toContain("noopener");
    expect(sourceLink).toHaveAttribute("href", "https://example.org/datasets/example");

    expect(
      screen.getByText(/does not describe the selected crew member or astronaut/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: "No datasets onboarded" }),
    ).not.toBeInTheDocument();
  });
});
