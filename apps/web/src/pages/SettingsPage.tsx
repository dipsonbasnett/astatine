import { useState } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { LocalDataControls } from "@/components/settings/LocalDataControls";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { MAX_CALLSIGN_LENGTH, PREFERENCES_STORAGE_KEY } from "@/preferences/preferences";
import { usePreferences } from "@/preferences/usePreferences";

export default function SettingsPage() {
  const { preferences, updatePreferences, clearPreferences } = usePreferences();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="This device" title="Settings" />

      <section aria-labelledby="interface-heading" className="space-y-4">
        <div className="space-y-2">
          <p className="font-mono text-label text-ink-subtle uppercase">Interface</p>
          <h2
            id="interface-heading"
            className="text-xl font-semibold tracking-tight text-ink"
          >
            Local preferences
          </h2>
          <p className="max-w-prose text-sm leading-6 text-ink-muted">
            Changes save automatically in this browser. A callsign is optional and never
            shared.
          </p>
        </div>
        <Card className="p-6 sm:p-7">
          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="Callsign"
              hint={`Optional, up to ${MAX_CALLSIGN_LENGTH} characters. Stored only in this browser.`}
              value={preferences.callsign}
              maxLength={MAX_CALLSIGN_LENGTH}
              autoComplete="off"
              spellCheck={false}
              placeholder="Crew member"
              onChange={(event) => {
                updatePreferences({ callsign: event.target.value });
              }}
            />
            <Select
              label="Motion"
              hint="System follows your device setting. Reduced limits the loading pulse and shortens transitions."
              value={preferences.motion}
              onChange={(event) => {
                updatePreferences({
                  motion: event.target.value === "reduced" ? "reduced" : "system",
                });
              }}
            >
              <option value="system">Use system preference</option>
              <option value="reduced">Reduce motion</option>
            </Select>
          </div>
        </Card>
      </section>

      <section aria-labelledby="data-heading" className="space-y-4">
        <div className="space-y-2">
          <p className="font-mono text-label text-ink-subtle uppercase">Data</p>
          <h2 id="data-heading" className="text-xl font-semibold tracking-tight text-ink">
            What this browser stores
          </h2>
        </div>
        <Card className="p-6 sm:p-7">
          <dl className="divide-y divide-line">
            <div className="flex items-center justify-between gap-4 pb-3">
              <dt className="text-sm text-ink-muted">Callsign</dt>
              <dd className="text-right font-mono text-xs text-ink uppercase">
                Optional · local
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-ink-muted">Motion preference</dt>
              <dd className="text-right font-mono text-xs text-ink uppercase">Local</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-ink-muted">Health observations</dt>
              <dd className="text-right font-mono text-xs text-ink uppercase">
                Local · Opt-in
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-ink-muted">Simulated telemetry</dt>
              <dd className="text-right font-mono text-xs text-ink uppercase">
                Labeled · Local
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 pt-3">
              <dt className="text-sm text-ink-muted">Analytics or uploads</dt>
              <dd className="text-right font-mono text-xs text-ink uppercase">None</dd>
            </div>
          </dl>
          <p className="mt-5 border-t border-line pt-5 text-xs leading-5 text-ink-subtle">
            Storage key: <span className="font-mono">{PREFERENCES_STORAGE_KEY}</span>
          </p>
          <div className="mt-5">
            <Button
              variant="danger"
              aria-haspopup="dialog"
              onClick={() => {
                setConfirmReset(true);
              }}
            >
              Reset local preferences
            </Button>
          </div>
        </Card>

        <LocalDataControls />
      </section>

      <Modal
        open={confirmReset}
        onClose={() => {
          setConfirmReset(false);
        }}
        title="Reset local preferences?"
        description="This removes your callsign and motion choice from this browser. It cannot be undone."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmReset(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                clearPreferences();
                setConfirmReset(false);
              }}
            >
              Reset preferences
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-ink-muted">
          Resetting removes only your callsign and motion choice. Recorded check-ins,
          report snapshots, and simulated telemetry are not affected; use the local data
          controls above to delete those.
        </p>
      </Modal>
    </div>
  );
}
