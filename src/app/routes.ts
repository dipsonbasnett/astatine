import type { ComponentType, SVGProps } from "react";

import {
  AboutIcon,
  BriefIcon,
  CheckInIcon,
  CrewIcon,
  MissionIcon,
  OverviewIcon,
  RecoveryIcon,
  ReportsIcon,
  ResearchIcon,
  SettingsIcon,
  VitalsIcon,
} from "@/components/icons";

export type NavGroup = "Mission" | "Review" | "System";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface RouteDefinition {
  path: string;
  label: string;
  documentTitle: string;
  summary: string;
  group: NavGroup;
  icon: IconComponent;
  featured: boolean;
}

export const NAV_GROUPS: readonly NavGroup[] = ["Mission", "Review", "System"];

export const routeDefinitions: readonly RouteDefinition[] = [
  {
    path: "/",
    label: "Dashboard",
    documentTitle: "Dashboard for HMC · Astatine",
    summary:
      "Human Monitoring & Analytics Center: explicitly simulated mission context, separate from personal records.",
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
    group: "Mission",
    icon: RecoveryIcon,
    featured: true,
  },
  {
    path: "/crew",
    label: "Crew",
    documentTitle: "Crew readiness · Astatine",
    summary:
      "A privacy-conscious crew summary of recorded adherence, logging, workload and fatigue, recovery bands, and data gaps. One local profile, no roster.",
    group: "Mission",
    icon: CrewIcon,
    featured: true,
  },
  {
    path: "/vitals",
    label: "Vitals",
    documentTitle: "Vitals · Astatine",
    summary:
      "Recorded self-report, labeled simulated vitals, and research context with procedural organ illustrations. No sensors.",
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
    group: "Review",
    icon: BriefIcon,
    featured: false,
  },
  {
    path: "/reports",
    label: "Reports",
    documentTitle: "Reports · Astatine",
    summary:
      "Review a recorded 7- or 14-day mission-health report, download Markdown or JSON, or print it locally. Never clinical, never uploaded.",
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
    group: "Review",
    icon: ResearchIcon,
    featured: true,
  },
  {
    path: "/settings",
    label: "Settings",
    documentTitle: "Settings · Astatine",
    summary: "Local display preferences and a clear view of what this browser stores.",
    group: "System",
    icon: SettingsIcon,
    featured: false,
  },
  {
    path: "/profile",
    label: "Profile",
    documentTitle: "Profile · Astatine",
    summary:
      "Local identity, mission assignment, source boundaries, and privacy controls.",
    group: "System",
    icon: CrewIcon,
    featured: false,
  },
  {
    path: "/about",
    label: "About",
    documentTitle: "About · Astatine",
    summary:
      "The problem, principles, data boundaries, and provenance policy behind Astatine.",
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
