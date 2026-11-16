import { AlertIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/state/app-store";

export function DatabaseStatusNotice() {
  const status = useAppStore((state) => state.databaseStatus);
  const message = useAppStore((state) => state.databaseError);
  const initializeDatabase = useAppStore((state) => state.initializeDatabase);

  if (status !== "error") return null;

  return (
    <div
      role="alert"
      className="mb-8 flex flex-col gap-4 rounded-panel border border-danger/30 bg-danger-surface p-5 sm:flex-row sm:items-start print:hidden"
    >
      <AlertIcon className="mt-0.5 size-5 shrink-0 text-danger" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">Local records are unavailable</p>
        <p className="mt-1 text-sm leading-6 text-ink-muted">
          {message ?? "This browser could not open its local database."} Nothing has been
          uploaded. Preferences may still work.
        </p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          void initializeDatabase();
        }}
      >
        Retry
      </Button>
    </div>
  );
}
