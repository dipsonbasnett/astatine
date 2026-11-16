import { useEffect, useRef, useState } from "react";
import { usePreferences } from "@/preferences/usePreferences";

export function DashboardBackground() {
  const { preferences } = usePreferences();
  const video = useRef<HTMLVideoElement>(null);
  const [systemReduced, setSystemReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const reduced = systemReduced || preferences.motion === "reduced";

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const sync = () => {
      if (paused || reduced || document.hidden) element.pause();
      else void element.play().catch(() => setFailed(true));
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [paused, reduced]);

  return (
    <>
      <div className="hmc-environment" aria-hidden="true">
        <img src="/hmc/orbital.svg" alt="" width="1600" height="1000" />
        {!reduced && !failed && (
          <video
            ref={video}
            className={ready ? "hmc-video-ready" : ""}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/hmc/orbital.svg"
            onCanPlay={() => setReady(true)}
            onError={() => setFailed(true)}
            src="/hmc/dashboard-background.webm"
          />
        )}
      </div>
      <div className="hmc-environment-control">
        {reduced || failed ? (
          <span>
            {reduced
              ? "Reduced motion · static backdrop"
              : "Static backdrop · video unavailable"}
          </span>
        ) : (
          <button type="button" onClick={() => setPaused(!paused)}>
            {paused ? "Play background" : "Pause background"}
          </button>
        )}
        <span>
          {reduced || failed
            ? "Original orbital illustration"
            : "Silent background loop · Not a live feed"}
        </span>
      </div>
    </>
  );
}
