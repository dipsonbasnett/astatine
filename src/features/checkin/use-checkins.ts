import { useEffect, useState } from "react";

import { toDataLayerError } from "@/lib/db";
import { useAppStore } from "@/state/app-store";
import type { CheckInRecord } from "@/types/health";

import { listCheckIns } from "./checkin-repository";

export interface CheckInsState {
  records: CheckInRecord[];
  loading: boolean;
  error: string | null;
}

interface LoadedCheckIns {
  key: string;
  records: CheckInRecord[];
  error: string | null;
}

export function useCheckIns(limit = 20): CheckInsState {
  const revision = useAppStore((state) => state.dataRevision);
  const key = `${revision}:${limit}`;
  const [loaded, setLoaded] = useState<LoadedCheckIns | null>(null);

  useEffect(() => {
    let active = true;

    listCheckIns(limit)
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
