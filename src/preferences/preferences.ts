export type MotionPreference = "system" | "reduced";

export interface Preferences {
  callsign: string;
  motion: MotionPreference;
}

export const PREFERENCES_STORAGE_KEY = "astatine.preferences.v1";
export const MAX_CALLSIGN_LENGTH = 32;

export const DEFAULT_PREFERENCES: Preferences = {
  callsign: "",
  motion: "system",
};

export function normalizeCallsign(value: string): string {
  return value.replace(/[\p{Cc}]+/gu, " ").slice(0, MAX_CALLSIGN_LENGTH);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function readPreferences(storage: Storage = window.localStorage): Preferences {
  try {
    const raw = storage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };

    const parsed = asRecord(JSON.parse(raw) as unknown);
    if (!parsed) return { ...DEFAULT_PREFERENCES };

    return {
      callsign:
        typeof parsed.callsign === "string" ? normalizeCallsign(parsed.callsign) : "",
      motion: parsed.motion === "reduced" ? "reduced" : "system",
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(
  preferences: Preferences,
  storage: Storage = window.localStorage,
): boolean {
  try {
    storage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        callsign: normalizeCallsign(preferences.callsign),
        motion: preferences.motion,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearStoredPreferences(storage: Storage = window.localStorage): void {
  try {
    storage.removeItem(PREFERENCES_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}
