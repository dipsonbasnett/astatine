import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { TelemetryDemo } from "@/features/telemetry/TelemetryDemo";

export default function VitalsPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Simulated telemetry"
        title="Vitals"
        description="A deliberately synthetic telemetry surface. Astatine does not connect to sensors, devices, or wearable services; it generates a labeled demonstration sample locally so the simulated data boundary can be reviewed."
        meta={
          <>
            <Badge>Available · Simulated only</Badge>
            <span className="font-mono text-label text-ink-subtle uppercase">
              No sensors · No automatic capture
            </span>
          </>
        }
      />

      <TelemetryDemo />
    </div>
  );
}
