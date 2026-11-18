import { lazy } from "react";
import { Route, Routes } from "react-router-dom";

import { AppLayout } from "@/app/AppLayout";

const HomePage = lazy(() => import("@/pages/HomePage"));
const CheckInPage = lazy(() => import("@/pages/CheckInPage"));
const ReadinessPage = lazy(() => import("@/pages/ReadinessPage"));
const CrewPage = lazy(() => import("@/pages/CrewPage"));
const VitalsPage = lazy(() => import("@/pages/VitalsPage"));
const MissionPage = lazy(() => import("@/pages/MissionPage"));
const BriefPage = lazy(() => import("@/pages/BriefPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const ResearchPage = lazy(() => import("@/pages/ResearchPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="check-in" element={<CheckInPage />} />
        <Route path="readiness" element={<ReadinessPage />} />
        <Route path="crew" element={<CrewPage />} />
        <Route path="vitals" element={<VitalsPage />} />
        <Route path="mission" element={<MissionPage />} />
        <Route path="brief" element={<BriefPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="research" element={<ResearchPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
