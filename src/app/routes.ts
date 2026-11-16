import type { ComponentType, SVGProps } from "react";

import {
  AboutIcon,
  BriefIcon,
  CheckInIcon,
  MissionIcon,
  OverviewIcon,
  RecoveryIcon,
  ReportsIcon,
  ResearchIcon,
  SettingsIcon,
  VitalsIcon,
} from "@/components/icons";

export type RouteStatus = "available" | "planned";
export type NavGroup = "Mission" | "Review" | "System";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface RouteDefinition {
  path: string;
  label: string;
  documentTitle: string;
  summary: string;
  status: RouteStatus;
  group: NavGroup;
  icon: IconComponent;
  featured: boolean;
}

export const NAV_GROUPS: readonly NavGroup[] = ["Mission", "Review", "System"];

export const routeDefinitions: readonly RouteDefinition[] = [
  {
    path: "/",
    label: "Overview",
    documentTitle: "Astatine — Mission-ready health intelligence for human spaceflight",
    summary:
      "The calm starting point for mission context, boundaries, and planned crew-health surfaces.",
    status: "available",
    group: "Mission",
    icon: OverviewIcon,
    featured: false,
  },
  {
    path: "/check-in",
    label: "Check-in",
    documentTitle: "Check-in · Astatine",
    summary:
      "Record a structured self-observation in this browser and see a visible readiness rubric.",
    status: "available",
    group: "Mission",
    icon: CheckInIcon,
    featured: true,
  },
  {
    path: "/readiness",
    label: "Readiness",
    documentTitle: "Recovery readiness · Astatine",
    summary:
      "Explainable recovery readiness and a non-diagnostic countermeasure coach from recorded check-ins.",
    status: "available",
    group: "Mission",
    icon: RecoveryIcon,
    featured: true,
  },
  {
    path: "/vitals",
    label: "Vitals",
    documentTitle: "Vitals · Astatine",
    summary:
      "Generate clearly labeled simulated telemetry. No sensors, devices, or automatic capture.",
    status: "available",
    group: "Mission",
    icon: VitalsIcon,
    featured: true,
  },
  {
    path: "/mission",
    label: "Mission",
    documentTitle: "Mission · Astatine",
    summary:
      "A deterministic simulated mission clock and synthetic telemetry monitor. No live feed or sensors.",
    status: "available",
    group: "Mission",
    icon: MissionIcon,
    featured: true,
  },
  {
    path: "/brief",
    label: "Brief",
    documentTitle: "Mission health brief · Astatine",
    summary:
      "A read-only self-report briefing for the last seven days, built from the fixed rubric and kept explicitly non-clinical.",
    status: "available",
    group: "Review",
    icon: BriefIcon,
    featured: false,
  },
  {
    path: "/reports",
    label: "Reports",
    documentTitle: "Reports · Astatine",
    summary:
      "Freeze a recorded check-in and its visible rubric into a local, non-clinical snapshot.",
    status: "available",
    group: "Review",
    icon: ReportsIcon,
    featured: true,
  },
  {
    path: "/research",
    label: "Research",
    documentTitle: "Research · Astatine",
    summary:
      "Research integrity gate: a validated dataset registry, onboarding checklist, and provenance rules, kept separate from recorded data.",
    status: "available",
    group: "Review",
    icon: ResearchIcon,
    featured: true,
  },
  {
    path: "/settings",
    label: "Settings",
    documentTitle: "Settings · Astatine",
    summary: "Local display preferences and a clear view of what this browser stores.",
    status: "available",
    group: "System",
    icon: SettingsIcon,
    featured: false,
  },
  {
    path: "/about",
    label: "About",
    documentTitle: "About · Astatine",
    summary:
      "The problem, principles, data boundaries, and provenance policy behind Astatine.",
    status: "available",
    group: "System",
    icon: AboutIcon,
    featured: false,
  },
];

export function findRouteByPath(pathname: string): RouteDefinition | undefined {
  return routeDefinitions.find((route) => route.path === pathname);
}

export function routesForGroup(group: NavGroup): readonly RouteDefinition[] {
  return routeDefinitions.filter((route) => route.group === group);
}

export const featuredRoutes = routeDefinitions.filter((route) => route.featured);
