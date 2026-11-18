import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AppRoutes } from "@/app/AppRoutes";
import { DatasetRegistry } from "@/features/research/DatasetRegistry";
import { EvidenceLibrary } from "@/features/research/EvidenceLibrary";
import { ResearchLandscapePanel } from "@/features/research/ResearchLandscapePanel";
import {
  RESEARCH_LANDSCAPE,
  type ResearchLandscapeEntry,
} from "@/features/research/provenance/landscape";
import { makeDatasetProvenance, makeResearchInsight } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";

function sectionFor(headingName: string): HTMLElement {
  const section = screen
    .getByRole("heading", { level: 2, name: headingName })
    .closest("section");
  if (!section) throw new Error(`Expected a section for ${headingName}.`);
  return section;
}

describe("ResearchPage", () => {
  it("shows the research intelligence center with honest empty states", async () => {
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

    const landscape = sectionFor("Research data landscape");
    expect(within(landscape).getAllByRole("article")).toHaveLength(9);
    expect(
      within(landscape).getByRole("heading", {
        level: 3,
        name: "NASA Open Science Data Repository (OSDR)",
      }),
    ).toBeInTheDocument();
    expect(within(landscape).getByText(/Showing 9 of 9 resources/)).toBeInTheDocument();
    expect(
      within(landscape).getAllByText(/Not approved\. No model was trained/),
    ).toHaveLength(9);
    expect(within(landscape).getAllByText("Partially verified").length).toBeGreaterThan(
      0,
    );

    const evidence = sectionFor("Evidence library");
    expect(
      within(evidence).getByRole("heading", {
        level: 3,
        name: "Exercise training attenuated mitochondrial gene downregulation during long-duration bed rest",
      }),
    ).toBeInTheDocument();
    expect(
      within(evidence).getByText(/Showing 1 of 1 approved insight/),
    ).toBeInTheDocument();
    expect(within(evidence).getAllByText("Moderate confidence").length).toBeGreaterThan(
      0,
    );
    expect(
      within(evidence).getAllByText(/not personalized medical advice/).length,
    ).toBeGreaterThan(0);

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: /OSD-942: Exercise Training Attenuates the Muscle Mitochondria Genomic Response to Bed Rest/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("DOI: 10.26030/2ngb-7470")).toBeInTheDocument();
    expect(screen.getAllByText("Not used for model training.").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("heading", { level: 2, name: "No datasets onboarded" }),
    ).not.toBeInTheDocument();

    const checklist = sectionFor("Dataset onboarding checklist");
    expect(within(checklist).getAllByRole("listitem")).toHaveLength(13);
    expect(
      within(checklist).getByText(/Record model-training use as not used/),
    ).toBeInTheDocument();

    const pipeline = sectionFor("Ingestion pipeline");
    expect(within(pipeline).getAllByRole("listitem")).toHaveLength(13);
    expect(within(pipeline).getByText("1 ingestion request queued.")).toBeInTheDocument();
    expect(within(pipeline).getByText("Schema validation")).toBeInTheDocument();

    const workflow = sectionFor("Source verification");
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

  it("filters the landscape by search text and health domain", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: "/research" });
    await screen.findByRole("heading", { level: 1, name: "Research" });

    const landscape = sectionFor("Research data landscape");
    const search = within(landscape).getByRole("searchbox", {
      name: "Search the landscape",
    });

    await user.type(search, "Space Apps");
    expect(within(landscape).getAllByRole("article")).toHaveLength(1);
    expect(within(landscape).getByText(/Showing 1 of 9 resources/)).toBeInTheDocument();

    await user.click(within(landscape).getByRole("button", { name: "Clear filters" }));
    expect(within(landscape).getAllByRole("article")).toHaveLength(9);

    await user.selectOptions(
      within(landscape).getByLabelText("Health domain"),
      "environmental-telemetry",
    );
    expect(within(landscape).getAllByRole("article")).toHaveLength(1);
    expect(
      within(landscape).getByRole("heading", {
        level: 3,
        name: "Human Research Roadmap (HRR)",
      }),
    ).toBeInTheDocument();

    await user.selectOptions(
      within(landscape).getByLabelText("Health domain"),
      "radiation",
    );
    expect(within(landscape).getAllByRole("article")).toHaveLength(4);
  });

  it("shows an empty result state when no landscape resource matches", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: "/research" });
    await screen.findByRole("heading", { level: 1, name: "Research" });

    const landscape = sectionFor("Research data landscape");
    await user.type(
      within(landscape).getByRole("searchbox", { name: "Search the landscape" }),
      "no such resource",
    );

    expect(
      within(landscape).getByRole("heading", { level: 2, name: "No resources match" }),
    ).toBeInTheDocument();
    expect(within(landscape).queryAllByRole("article")).toHaveLength(0);
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

  it("refuses to present an invalid landscape as verified", () => {
    const firstEntry = RESEARCH_LANDSCAPE[0];
    if (!firstEntry) throw new Error("Expected a landscape entry.");
    const invalid = [
      { ...firstEntry, modelTraining: "used" },
    ] as unknown as readonly ResearchLandscapeEntry[];

    renderWithProviders(<ResearchLandscapePanel entries={invalid} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      /does not pass its own validation gate/,
    );
    expect(screen.queryAllByRole("article")).toHaveLength(0);
  });

  it("renders an approved insight with confidence, limitations, and citation", () => {
    renderWithProviders(<EvidenceLibrary insights={[makeResearchInsight()]} />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Example research insight" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Low confidence").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/A synthetic fixture describing how an external program frames/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /The source describes sleep and circadian adaptation as an area of human spaceflight research/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Does not describe the selected user/)).toBeInTheDocument();
    expect(screen.getAllByText(/not personalized medical advice/).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getByText(/Program overview, conducted by Example Space Agency/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No sample is reported by a program overview/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Example Space Agency\. Example program overview \(accessed 2026-11-16\)/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Test fixture only\./)).toBeInTheDocument();
    expect(
      screen.getByText(/Program overview only; no result is reported\./),
    ).toBeInTheDocument();
    expect(screen.getByText(/No model was trained on this research/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Version 1\.0\.0\. Reviewed 2026-11-16 by Repository maintainer, role-level review\. Next review 2027-05-16\./,
      ),
    ).toBeInTheDocument();

    const sourceLink = screen.getByRole("link", { name: /Open source/ });
    expect(sourceLink).toHaveAttribute("target", "_blank");
    expect(sourceLink).toHaveAttribute("href", "https://example.org/program");
    expect(
      screen.queryByRole("heading", { level: 2, name: "No reviewed insights" }),
    ).not.toBeInTheDocument();
  });

  it("hides insights that are not approved", () => {
    renderWithProviders(
      <EvidenceLibrary
        insights={[makeResearchInsight({ reviewStatus: "under-review" })]}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "No reviewed insights" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 3, name: "Example research insight" }),
    ).not.toBeInTheDocument();
  });

  it("filters approved insights and reports an empty result", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EvidenceLibrary insights={[makeResearchInsight()]} />);

    expect(screen.getByText(/Showing 1 of 1 approved insight/)).toBeInTheDocument();

    await user.type(
      screen.getByRole("searchbox", { name: "Search evidence" }),
      "no such claim",
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "No insights match" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Evidence library" })).queryAllByRole(
        "article",
      ),
    ).toHaveLength(0);
  });
});
