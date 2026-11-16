import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import * as data from "./dashboard-data";
import { HmcDashboard } from "./HmcDashboard";
import { Astronaut } from "./Astronaut";
import { OrbitalBackground } from "./OrbitalBackground";
import { TelemetryChart } from "./TelemetryChart";

afterEach(() => vi.useRealTimers());

describe("HMC dashboard", () => {
  it("labels simulated metrics and keeps personal profile health unassessed", () => {
    renderWithProviders(<HmcDashboard />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Dashboard for HMC" }),
    ).toBeVisible();
    expect(screen.getByText("Simulated session active")).toBeVisible();
    expect(screen.getByText("Health status").nextElementSibling).toHaveTextContent(
      "Not assessed",
    );
    expect(screen.getByText(/No live sensors/)).toBeVisible();
    expect(screen.queryByText("System Online")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /concept astronaut/ })).toHaveAttribute(
      "src",
      "/hmc/astronaut.svg",
    );
  });
  it("changes real time windows, shows channel scales and exposes numerical samples", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HmcDashboard />);
    await user.click(screen.getByRole("button", { name: "15 minutes" }));
    expect(screen.getByRole("button", { name: "15 minutes" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText(/16 one-minute samples/)).toBeVisible();
    expect(
      screen.getByRole("img", { name: /Blood Pressure overview: 16 simulated samples/ }),
    ).toHaveAccessibleName(/Scale 60–140 mmHg.*Systolic|Scale 60–140 mmHg.*systolic/);
    fireEvent.click(screen.getByText("View numerical samples"));
    expect(screen.getByRole("columnheader", { name: "Diastolic (mmHg)" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "24 hours" }));
    expect(screen.getByText(/1441 one-minute samples/)).toBeVisible();
  });
  it("shows inputs, source and limitations in metric and recovery details", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HmcDashboard />);
    await user.click(screen.getByRole("button", { name: "View Blood Pressure details" }));
    let dialog = screen.getByRole("dialog", { name: "Blood Pressure details" });
    expect(within(dialog).getByText(/not an ECG/)).toBeVisible();
    expect(within(dialog).getByText(/astatine.vitals-simulation/)).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "Close dialog" }));
    await user.click(screen.getByRole("button", { name: "View Recovery Trend details" }));
    dialog = screen.getByRole("dialog", { name: "Recovery Trend details" });
    expect(
      within(dialog).getByText(
        /no clinical thresholds, confidence, or predictive meaning/,
      ),
    ).toBeVisible();
    expect(
      within(dialog).getByRole("link", { name: "Review recorded readiness" }),
    ).toHaveAttribute("href", "/readiness");
  });
  it("opens a private local profile without fabricating a role or health assessment", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HmcDashboard />);
    await user.click(screen.getByRole("button", { name: "View Details" }));
    const dialog = screen.getByRole("dialog", { name: "Profile details" });
    expect(within(dialog).getByText("Not assigned")).toBeVisible();
    expect(
      within(dialog).getByText(/Dashboard vitals belong to fictional simulation/),
    ).toBeVisible();
    expect(
      within(dialog).getByRole("link", { name: "Manage local data and privacy" }),
    ).toHaveAttribute("href", "/settings");
  });
  it("ticks, pauses, resumes, and restarts the local session without changing observations", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T12:00:00Z"));
    renderWithProviders(<HmcDashboard />);
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole("timer")).toHaveTextContent("T+ 00:00:03");
    fireEvent.click(screen.getByRole("button", { name: "Pause session" }));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole("timer")).toHaveTextContent("T+ 00:00:03");
    expect(screen.getByText("Local system ready · simulation paused")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Resume session" }));
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("timer")).toHaveTextContent("T+ 00:00:05");
    fireEvent.click(screen.getByRole("button", { name: "New simulated session" }));
    expect(screen.getByRole("timer")).toHaveTextContent("T+ 00:00:00");
  });
  it("reports unavailable samples without substituting other data", () => {
    const snapshot = data.buildDashboardSnapshot(new Date());
    vi.spyOn(data, "buildDashboardSnapshot").mockReturnValue({
      ...snapshot,
      series: { ...snapshot.series, heartRate: [], bloodPressure: [], spo2: [] },
    });
    renderWithProviders(<HmcDashboard />);
    expect(screen.getByText("Simulated readings unavailable")).toBeVisible();
    expect(screen.getByText(/Nothing has been substituted/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Regenerate simulation" })).toBeVisible();
  });
  it("uses the existing error boundary for generator failures", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(data, "buildDashboardSnapshot").mockImplementation(() => {
      throw new Error("Generator unavailable");
    });
    renderWithProviders(
      <ErrorBoundary>
        <HmcDashboard />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByRole("link", { name: "Go to overview" })).toBeVisible();
  });
});

describe("HMC visual fallbacks", () => {
  it("credits the modified model while retaining a meaningful no-WebGL fallback", () => {
    renderWithProviders(<Astronaut />);
    expect(screen.getByRole("img", { name: /Original concept astronaut/ })).toBeVisible();
    expect(screen.getByRole("link", { name: "Astronaut by Jungle Jim" })).toHaveAttribute(
      "href",
      "https://sketchfab.com/3d-models/astronaut-by-jungle-jim-c775a977606a4e4e990afe783c6bc845",
    );
    expect(screen.getByRole("link", { name: "CC BY 4.0" })).toHaveAttribute(
      "href",
      "https://creativecommons.org/licenses/by/4.0/",
    );
    expect(screen.getByText(/Badge and insignia meshes removed/)).toBeVisible();
  });
  it("does not mount a 3D canvas under reduced motion", () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      ...window.matchMedia(""),
      matches: true,
    });
    const { container } = renderWithProviders(<Astronaut />);
    expect(container.querySelector("canvas")).toBeNull();
    expect(screen.getByRole("img", { name: /Original concept astronaut/ })).toBeVisible();
  });
  it("retains a static original backdrop on video error", () => {
    const { container } = renderWithProviders(<OrbitalBackground />);
    fireEvent.error(container.querySelector("video")!);
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")).toHaveAttribute("src", "/hmc/orbital.svg");
    expect(screen.getByText("Static backdrop · video unavailable")).toBeVisible();
  });
  it("does not load video when the operating system requests reduced motion", () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      ...window.matchMedia(""),
      matches: true,
    });
    const { container } = renderWithProviders(<OrbitalBackground />);
    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByText("Reduced motion · static backdrop")).toBeVisible();
  });
  it("never substitutes systolic values for missing diastolic observations", () => {
    const { container } = renderWithProviders(
      <TelemetryChart
        title="Blood Pressure"
        unit="mmHg"
        domain={[60, 140]}
        pressure
        points={[{ observedAt: "2026-11-16T12:00:00Z", value: 118 }]}
      />,
    );
    expect(container.querySelector(".hmc-chart-secondary")).toHaveAttribute("d", "");
    expect(container.querySelector(".hmc-endpoint-secondary")).toBeNull();
  });

  it("leaves missing charts empty and renders a single sample without NaN", () => {
    const { rerender, container } = renderWithProviders(
      <TelemetryChart title="Heart Rate" unit="bpm" domain={[50, 90]} points={[]} />,
    );
    expect(screen.getByText("No simulated samples in this range.")).toBeVisible();
    rerender(
      <TelemetryChart
        title="Heart Rate"
        unit="bpm"
        domain={[50, 90]}
        points={[{ observedAt: "2026-11-16T12:00:00Z", value: 70 }]}
      />,
    );
    expect(container.innerHTML).not.toContain("NaN");
    expect(screen.getByRole("img")).toHaveAccessibleName(/1 simulated samples/);
  });
});
