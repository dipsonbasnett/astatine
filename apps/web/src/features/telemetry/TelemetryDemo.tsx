import { useState } from "react";
import { Link } from "react-router-dom";

import { VitalsIcon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDateTime, formatDecimal } from "@/lib/format";
import { useAppStore } from "@/state/app-store";

import {
  SIMULATED_SCENARIOS,
  TELEMETRY_CHANNELS,
  findTelemetryScenario,
  simulateTelemetry,
} from "./telemetry-engine";
import { saveSimulatedTelemetry } from "./telemetry-repository";
import { useRecentTelemetry } from "./use-recent-telemetry";

export function TelemetryDemo() {
  const { records, loading, error } = useRecentTelemetry(30);
  const refreshData = useAppStore((state) => state.refreshData);
  const [scenarioId, setScenarioId] = useState(SIMULATED_SCENARIOS[0]?.id ?? "");
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const generate = async () => {
    setStatus(null);
    setGenerationError(null);
    setGenerating(true);

    try {
      const drafts = simulateTelemetry({
        scenarioId,
        seed: Date.now() >>> 0,
        startedAt: new Date().toISOString(),
      });
      const saved = await saveSimulatedTelemetry(drafts);
      setStatus(
        `Generated ${saved.length} simulated samples in this browser. They are excluded from readiness and reports.`,
      );
      refreshData();
    } catch (caught: unknown) {
      setGenerationError(
        caught instanceof Error
          ? caught.message
          : "The simulated sample could not be generated.",
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-prose">
            <p className="font-mono text-label text-ink-subtle uppercase">
              Simulated data
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
              Generate a demonstration sample
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              Values are synthesized in this browser from a fixed scenario and seed. They
              are not sensor measurements, not personal observations, and never feed
              readiness or report snapshots.
            </p>
          </div>
          <Badge>Simulated</Badge>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Select
            label="Demonstration scenario"
            hint={
              findTelemetryScenario(scenarioId)?.description ??
              "Choose a synthetic scenario."
            }
            value={scenarioId}
            onChange={(event) => {
              setScenarioId(event.target.value);
            }}
          >
            {SIMULATED_SCENARIOS.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.label}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            disabled={generating}
            onClick={() => {
              void generate();
            }}
            className="sm:mb-0.5"
          >
            {generating ? "Generating…" : "Generate simulated sample"}
          </Button>
        </div>

        {status && (
          <InlineAlert tone="success" title="Simulated sample saved" className="mt-5">
            <p>{status}</p>
          </InlineAlert>
        )}

        {generationError && (
          <InlineAlert tone="danger" title="Simulated sample not saved" className="mt-5">
            <p>{generationError}</p>
          </InlineAlert>
        )}

        <p className="mt-5 border-t border-line pt-5 text-xs leading-5 text-ink-subtle">
          Simulated samples are stored locally like other records so they can be reviewed
          and deleted. Manage them under{" "}
          <Link
            to="/settings"
            className="text-accent underline underline-offset-4 hover:text-accent-strong"
          >
            local data settings
          </Link>
          .
        </p>
      </Card>

      {loading && records.length === 0 && (
        <Card className="space-y-4 p-6" aria-busy="true">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </Card>
      )}

      {error && (
        <InlineAlert tone="danger" title="Simulated samples unavailable">
          <p>{error}</p>
        </InlineAlert>
      )}

      {!loading && !error && records.length === 0 && (
        <EmptyState
          icon={<VitalsIcon className="size-5" />}
          title="No simulated samples yet"
          description="Generate a demonstration sample to see how simulated records are labeled, stored separately, and excluded from recorded health views."
        />
      )}

      {records.length > 0 && (
        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                Recent simulated samples
              </h2>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                Newest captures first. Every row carries simulated provenance.
              </p>
            </div>
            <Badge>Simulated only</Badge>
          </div>
          <div
            role="region"
            aria-label="Recent simulated samples"
            tabIndex={0}
            className="overflow-x-auto"
          >
            <table className="w-full min-w-[38rem] text-left text-sm">
              <caption className="sr-only">
                Recent simulated telemetry samples generated in this browser
              </caption>
              <thead className="bg-raised/50 text-xs tracking-[0.08em] text-ink-subtle uppercase">
                <tr>
                  <th scope="col" className="px-6 py-3 font-medium">
                    Captured
                  </th>
                  <th scope="col" className="px-6 py-3 font-medium">
                    Channel
                  </th>
                  <th scope="col" className="px-6 py-3 font-medium">
                    Value
                  </th>
                  <th scope="col" className="px-6 py-3 font-medium">
                    Signal quality
                  </th>
                  <th scope="col" className="px-6 py-3 font-medium">
                    Scenario
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {records.slice(0, 18).map((sample) => (
                  <tr key={sample.id}>
                    <td className="px-6 py-3 text-ink-muted">
                      {formatDateTime(sample.capturedAt)}
                    </td>
                    <td className="px-6 py-3 text-ink">
                      {TELEMETRY_CHANNELS[sample.channel].label}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-ink">
                      {formatDecimal(
                        sample.value,
                        TELEMETRY_CHANNELS[sample.channel].decimals,
                      )}{" "}
                      {sample.unit}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-ink-muted">
                      {Math.round(sample.signalQuality * 100)}%
                    </td>
                    <td className="px-6 py-3 text-ink-muted">
                      {findTelemetryScenario(sample.scenarioId)?.label ??
                        sample.scenarioId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
