import { useEffect, useState } from "react";

import { toDataLayerError } from "@/lib/db";
import { useAppStore } from "@/state/app-store";
import type { TelemetrySampleRecord } from "@/types/health";

import { listRecentTelemetry } from "./telemetry-repository";

export interface TelemetryState {
  records: TelemetrySampleRecord[];
  loading: boolean;
  error: string | null;
}

interface LoadedTelemetry {
  key: string;
  records: TelemetrySampleRecord[];
  error: string | null;
}

export function useRecentTelemetry(limit = 30): TelemetryState {
  const revision = useAppStore((state) => state.dataRevision);
  const key = `${revision}:${limit}`;
  const [loaded, setLoaded] = useState<LoadedTelemetry | null>(null);

  useEffect(() => {
    let active = true;

    listRecentTelemetry(limit)
      .then((records) => {
        if (active) setLoaded({ key, records, error: null });
      })
      .catch((error: unknown) => {
        if (active) {
          setLoaded({
            key,
            records: [],
            error: toDataLayerError(error).message,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [key, limit]);

  const current = loaded?.key === key ? loaded : null;

  return {
    records: current?.records ?? loaded?.records ?? [],
    loading: current === null,
    error: current?.error ?? null,
  };
}
