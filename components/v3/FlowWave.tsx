"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed, full-window host for the Flow Wave scene: the ground the whole site
 * floats over. Three.js is loaded after hydration so the type paints first.
 *
 * A fresh canvas is made per mount: teardown releases its GL context, so a
 * canvas can't be handed to a second renderer (React's dev double-mount).
 */
export default function FlowWave() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;

    const canvas = document.createElement("canvas");
    canvas.id = "scene";
    host.appendChild(canvas);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    import("./flowWaveScene")
      .then(({ createFlowWave }) => {
        if (cancelled) return;
        dispose = createFlowWave(canvas, { reducedMotion });
      })
      .catch(() => {
        // No WebGL (or the chunk failed): the host's gradient stands in.
      });

    return () => {
      cancelled = true;
      dispose?.();
      canvas.remove();
    };
  }, []);

  return <div ref={hostRef} className="flow-wave" aria-hidden="true" />;
}
