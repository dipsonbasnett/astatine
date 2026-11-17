import { useEffect, useRef, useState } from "react";
import { usePreferences } from "@/preferences/usePreferences";

export function Astronaut() {
  const { preferences } = usePreferences();
  const [systemReduced, setSystemReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const reduced = systemReduced || preferences.motion === "reduced";

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return <AstronautVisual key={String(reduced)} reduced={reduced} />;
}

function AstronautVisual({ reduced }: { reduced: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const showModel = ready && !reduced && !failed;

  useEffect(() => {
    const element = canvas.current;
    if (reduced || failed || !element || !("WebGL2RenderingContext" in window)) return;
    let active = true;
    let dispose: (() => void) | undefined;
    void import("./astronaut-scene")
      .then(({ mountAstronaut }) => {
        if (!active) return;
        dispose = mountAstronaut(
          element,
          () => {
            if (active) setReady(true);
          },
          () => {
            if (active) setFailed(true);
          },
        );
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      dispose?.();
    };
  }, [reduced, failed]);

  return (
    <>
      <div className="hmc-astronaut-stage" data-model-ready={showModel}>
        <img
          src="/hmc/astronaut.svg"
          width="500"
          height="640"
          alt="Original concept astronaut in a full protective suit, standing on a concentric metallic platform. Illustration, not a person being monitored."
          fetchPriority="high"
          hidden={showModel}
        />
        {!reduced && !failed && (
          <canvas
            ref={canvas}
            role="img"
            aria-label="Fictional 3D astronaut revolving slowly. Decorative model, not a person being monitored."
            aria-hidden={!showModel}
          />
        )}
      </div>
      <p className="hmc-suit-caption">
        {showModel
          ? "Concept suit · Rotating 3D scene"
          : "Concept suit · SVG fallback · No WebGL required"}
      </p>
      <p className="hmc-asset-credit">
        <a href="https://sketchfab.com/3d-models/astronaut-by-jungle-jim-c775a977606a4e4e990afe783c6bc845">
          Astronaut by Jungle Jim
        </a>
        {" · "}
        <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>
        <br />
        Badge and insignia meshes removed. No affiliation or endorsement.
      </p>
    </>
  );
}
