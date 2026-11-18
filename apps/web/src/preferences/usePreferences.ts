import { useContext } from "react";

import {
  PreferencesContext,
  type PreferencesContextValue,
} from "@/preferences/preferences-context";

export function usePreferences(): PreferencesContextValue {
  const value = useContext(PreferencesContext);

  if (!value) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }

  return value;
}
