import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { MissionMonitor } from "@/features/mission/MissionMonitor";

export default function MissionPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Simulated mission context"
        title="Mission"
        description="A deterministic demonstration of a running mission clock and synthetic telemetry. Astatine receives no flight data, connects to no sensors, and makes no operational claim."
        meta={
          <>
            <Badge tone="accent">Available · Simulated only</Badge>
            <span className="font-mono text-label text-ink-subtle uppercase">
              No live feed · No sensors
            </span>
          </>
        }
      />

      <MissionMonitor />
    </div>
  );
}
