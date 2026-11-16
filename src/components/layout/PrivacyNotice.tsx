import { ShieldIcon } from "@/components/icons";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DATA_CATEGORIES } from "@/lib/data-policy";
import { REPOSITORY_URL } from "@/lib/constants";

import { useState } from "react";

export function PrivacyNotice() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <ShieldIcon className="mt-0.5 size-5 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-medium text-ink">Private by default</p>
            <p className="mt-1 max-w-xl text-sm leading-6 text-ink-muted">
              No accounts, no live sensors, no automatic uploads. Recorded check-ins and
              report snapshots stay in this browser; simulated telemetry is generated
              locally and labeled.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-haspopup="dialog"
          onClick={() => {
            setIsOpen(true);
          }}
          className="self-start whitespace-nowrap"
        >
          Data policy
        </Button>
      </div>

      <Modal
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        title="Data policy at a glance"
        description="Astatine strictly separates three data classes and never mixes them."
        footer={
          <Button
            onClick={() => {
              setIsOpen(false);
            }}
          >
            Close
          </Button>
        }
      >
        <ul className="space-y-5">
          {DATA_CATEGORIES.map((category) => (
            <li key={category.id} className="space-y-2">
              <Badge tone="accent">{category.label}</Badge>
              <p className="text-sm leading-6 text-ink-muted">{category.summary}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-2 border-t border-line pt-5 text-sm leading-6 text-ink-muted">
          <p>Nothing is uploaded automatically.</p>
          <p>
            Astatine does not diagnose, predict medical events, provide treatment, or
            replace a medical professional.
          </p>
          <p>
            <a
              href={`${REPOSITORY_URL}/blob/main/docs/DATA_POLICY.md`}
              target="_blank"
              rel="noreferrer"
              className="text-accent underline underline-offset-4 hover:text-accent-strong"
            >
              Read the full data policy
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </div>
      </Modal>
    </>
  );
}
