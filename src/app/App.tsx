import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";

import { AppRoutes } from "@/app/AppRoutes";
import { PreferencesProvider } from "@/preferences/PreferencesProvider";
import { useAppStore } from "@/state/app-store";

export default function App() {
  const initializeDatabase = useAppStore((state) => state.initializeDatabase);

  useEffect(() => {
    void initializeDatabase();
  }, [initializeDatabase]);

  return (
    <BrowserRouter>
      <PreferencesProvider>
        <AppRoutes />
      </PreferencesProvider>
      <SpeedInsights />
    </BrowserRouter>
  );
}
