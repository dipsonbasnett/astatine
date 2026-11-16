import { useEffect, useState } from "react";

import { toDataLayerError } from "@/lib/db";
import { useAppStore } from "@/state/app-store";
import type { ReportSnapshotRecord } from "@/types/health";

import { listReportSnapshots } from "./report-repository";

export interface ReportSnapshotsState {
  records: ReportSnapshotRecord[];
  loading: boolean;
  error: string | null;
}

interface LoadedReportSnapshots {
  key: string;
  records: ReportSnapshotRecord[];
  error: string | null;
}

export function useReportSnapshots(limit = 10): ReportSnapshotsState {
  const revision = useAppStore((state) => state.dataRevision);
  const key = `${revision}:${limit}`;
  const [loaded, setLoaded] = useState<LoadedReportSnapshots | null>(null);

  useEffect(() => {
    let active = true;

    listReportSnapshots(limit)
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
