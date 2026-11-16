import { PageHeader } from "@/components/layout/PageHeader";
import { MissionMonitor } from "@/features/mission/MissionMonitor";

export default function MissionPage() {
  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Simulated mission context" title="Mission" />

      <MissionMonitor />
    </div>
  );
}
