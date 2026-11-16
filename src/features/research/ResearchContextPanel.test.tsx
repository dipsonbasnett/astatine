import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  RESEARCH_CONTEXT_PANEL_NOTE,
  ResearchContextPanel,
} from "@/features/research/ResearchContextPanel";
import { LIFESTYLE_RESEARCH_DOMAINS } from "@/features/research/surfaces";
import { makeResearchInsight } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";

describe("ResearchContextPanel", () => {
  it("renders an approved insight as labeled research context", () => {
    renderWithProviders(
      <ResearchContextPanel
        domains={LIFESTYLE_RESEARCH_DOMAINS}
        insights={[makeResearchInsight()]}
        now="2026-11-16T00:00:00.000Z"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Research context" }),
    ).toBeInTheDocument();
    expect(screen.getByText(RESEARCH_CONTEXT_PANEL_NOTE)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Example research insight" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Low confidence")).toBeInTheDocument();
    expect(
      screen.getByText(
        /The source describes sleep and circadian adaptation as an area of human spaceflight research/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Does not describe the selected user/)).toBeInTheDocument();
    expect(screen.getByText("• Test fixture only.")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Example Space Agency — Example program overview\. Accessed 2026-11-16\./,
      ),
    ).toBeInTheDocument();

    const sourceLink = screen.getByRole("link", {
      name: /Open source: Example Space Agency/,
    });
    expect(sourceLink).toHaveAttribute("href", "https://example.org/program");
    expect(sourceLink).toHaveAttribute("target", "_blank");
    expect(sourceLink.getAttribute("rel")).toContain("noopener");

    expect(
      screen.getByRole("link", { name: /Open the Research center/ }),
    ).toHaveAttribute("href", "/research");
    expect(screen.queryByText(/diagnose/i)).not.toBeInTheDocument();
  });

  it("renders nothing when the insight is not approved", () => {
    const { container } = renderWithProviders(
      <ResearchContextPanel
        domains={LIFESTYLE_RESEARCH_DOMAINS}
        insights={[makeResearchInsight({ reviewStatus: "under-review" })]}
        now="2026-11-16T00:00:00.000Z"
      />,
    );
    expect(container.querySelector("section")).toBeNull();
  });

  it("renders nothing when no insight matches the surface domains", () => {
    const { container } = renderWithProviders(
      <ResearchContextPanel
        domains={["radiation"]}
        insights={[makeResearchInsight()]}
        now="2026-11-16T00:00:00.000Z"
      />,
    );
    expect(container.querySelector("section")).toBeNull();
  });

  it("omits an insight whose re-review date has passed", () => {
    const { container } = renderWithProviders(
      <ResearchContextPanel
        domains={LIFESTYLE_RESEARCH_DOMAINS}
        insights={[makeResearchInsight({ nextReviewDueAt: "2025-01-01T00:00:00.000Z" })]}
        now="2026-11-16T00:00:00.000Z"
      />,
    );
    expect(container.querySelector("section")).toBeNull();
  });

  it("keeps the insight limitations adjacent to the claim", () => {
    renderWithProviders(
      <ResearchContextPanel
        domains={LIFESTYLE_RESEARCH_DOMAINS}
        insights={[makeResearchInsight()]}
        now="2026-11-16T00:00:00.000Z"
      />,
    );

    const claim = screen.getByText(/describes sleep and circadian adaptation/);
    const item = claim.closest("li");
    if (!item) throw new Error("Expected the insight list item.");
    expect(item).toHaveTextContent("Limitations");
    expect(item).toHaveTextContent("Test fixture only.");
    expect(item).toHaveTextContent(
      "No effect size, clinical threshold, or personal applicability is claimed.",
    );
  });
});
