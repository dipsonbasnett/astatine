import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { PreferencesContext } from "@/preferences/preferences-context";
import {
  clearStoredPreferences,
  DEFAULT_PREFERENCES,
  normalizeCallsign,
  readPreferences,
  savePreferences,
  type Preferences,
} from "@/preferences/preferences";

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(readPreferences);
  const preferencesRef = useRef(preferences);

  const updatePreferences = useCallback((patch: Partial<Preferences>) => {
    const current = preferencesRef.current;
    const next: Preferences = {
      callsign:
        patch.callsign === undefined
          ? current.callsign
          : normalizeCallsign(patch.callsign),
      motion: patch.motion ?? current.motion,
    };

    preferencesRef.current = next;
    setPreferences(next);
    savePreferences(next);
  }, []);

  const clearPreferences = useCallback(() => {
    const next = { ...DEFAULT_PREFERENCES };
    preferencesRef.current = next;
    setPreferences(next);
    clearStoredPreferences();
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (preferences.motion === "reduced") {
      root.dataset.motion = "reduced";
    } else {
      delete root.dataset.motion;
    }

    return () => {
      delete root.dataset.motion;
    };
  }, [preferences.motion]);

  const value = useMemo(
    () => ({ preferences, updatePreferences, clearPreferences }),
    [preferences, updatePreferences, clearPreferences],
  );

  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  );
}
