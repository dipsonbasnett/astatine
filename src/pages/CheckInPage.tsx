import { CheckInIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Skeleton } from "@/components/ui/Skeleton";
import { CheckInForm } from "@/features/checkin/CheckInForm";
import { useCheckIns } from "@/features/checkin/use-checkins";
import { buildCountermeasurePlan } from "@/features/countermeasures/countermeasure-engine";
import { ReadinessDetails } from "@/features/readiness/ReadinessDetails";
import { assessReadiness } from "@/features/readiness/readiness-engine";

export default function CheckInPage() {
  const { records, loading, error } = useCheckIns(20);
  const assessment = assessReadiness({ checkIns: records });
  const countermeasures = assessment ? buildCountermeasurePlan(assessment) : null;

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Crew self-observation" title="Check-in" />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:items-start">
        <CheckInForm />

        <div className="space-y-4" aria-busy={loading}>
          {loading && records.length === 0 && (
            <Card className="space-y-4 p-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-24 w-full" />
            </Card>
          )}

          {error && (
            <InlineAlert tone="danger" title="Readiness view unavailable">
              <p>{error}</p>
            </InlineAlert>
          )}

          {!loading && !error && (!assessment || !countermeasures) && (
            <EmptyState
              icon={<CheckInIcon className="size-5" />}
              title="No readiness view yet"
              description="Save your first check-in to see a fixed-rubric readiness view with its inputs, confidence, missing data, and explainable suggestions."
            />
          )}

          {assessment && countermeasures && (
            <Card className="p-6 sm:p-7">
              <ReadinessDetails
                assessment={assessment}
                countermeasures={countermeasures}
              />
              <p className="mt-6 border-t border-line pt-5 text-xs leading-5 text-ink-subtle">
                This panel uses the latest recorded check-in only. Simulated telemetry and
                research context are never mixed into readiness.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
