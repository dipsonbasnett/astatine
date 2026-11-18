import { Link } from "react-router-dom";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { buttonStyles } from "@/components/ui/button-styles";
import { usePreferences } from "@/preferences/usePreferences";

export function HelmetPortrait() {
  return (
    <div className="hmc-portrait" aria-hidden="true">
      <img src="/hmc/astronaut.svg" alt="" width="500" height="640" />
    </div>
  );
}

export function ProfileDetails() {
  const { preferences } = usePreferences();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <HelmetPortrait />
        <div>
          <SourceBadge className="hmc-source-label" category="recorded">
            Recorded · local preference
          </SourceBadge>
          <p className="mt-2 text-xl font-semibold">
            {preferences.callsign || "No callsign set"}
          </p>
        </div>
      </div>
      <dl className="hmc-profile-facts">
        <div>
          <dt>Identification</dt>
          <dd>
            {preferences.callsign
              ? "User-entered callsign; not verified identity"
              : "No personal identification entered"}
          </dd>
        </div>
        <div>
          <dt>Mission assignment</dt>
          <dd>Not assigned</dd>
        </div>
        <div>
          <dt>Mission role</dt>
          <dd>Not recorded</dd>
        </div>
        <div>
          <dt>Monitoring information</dt>
          <dd>
            No sensors connected. Dashboard vitals belong to fictional simulation
            HMC-DEMO-01, not this profile.
          </dd>
        </div>
        <div>
          <dt>Health status</dt>
          <dd>Not assessed. No diagnosis or prediction.</dd>
        </div>
      </dl>
      <p className="hmc-muted">
        The suit is an original illustration, not a real astronaut. Research context
        describes study populations, not this profile.
      </p>
      <section aria-label="Privacy controls" className="space-y-3">
        <h3 className="font-semibold">Privacy controls</h3>
        <p className="hmc-muted">
          Preferences and recorded check-ins stay in this browser. No automatic upload,
          account, or sharing. Private notes are not displayed here.
        </p>
        <Link to="/settings" className={buttonStyles({ variant: "secondary" })}>
          Manage local data and privacy
        </Link>
      </section>
    </div>
  );
}
