import { createContext } from "react";

import type { Preferences } from "@/preferences/preferences";

export interface PreferencesContextValue {
  preferences: Preferences;
  updatePreferences: (patch: Partial<Preferences>) => void;
  clearPreferences: () => void;
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);
