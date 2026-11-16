import { create } from "zustand";

import { openDatabase, toDataLayerError } from "@/lib/db";

export type DatabaseStatus = "idle" | "ready" | "error";

interface AppStore {
  dataRevision: number;
  databaseStatus: DatabaseStatus;
  databaseError: string | null;
  initializeDatabase: () => Promise<void>;
  refreshData: () => void;
  reportDatabaseError: (error: unknown) => void;
}

let initialization: Promise<void> | null = null;

export const useAppStore = create<AppStore>((set) => ({
  dataRevision: 0,
  databaseStatus: "idle",
  databaseError: null,

  initializeDatabase: () => {
    if (initialization) return initialization;

    const attempt = openDatabase()
      .then(() => {
        set({ databaseStatus: "ready", databaseError: null });
      })
      .catch((error: unknown) => {
        const mapped = toDataLayerError(error);
        set({ databaseStatus: "error", databaseError: mapped.message });
        initialization = null;
      });

    initialization = attempt;
    return attempt;
  },

  refreshData: () => {
    set((state) => ({ dataRevision: state.dataRevision + 1 }));
  },

  reportDatabaseError: (error: unknown) => {
    const mapped = toDataLayerError(error);
    set({ databaseStatus: "error", databaseError: mapped.message });
  },
}));
