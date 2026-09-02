"use client";

import { useEffect, useState } from "react";

/**
 * Tracks `prefers-reduced-motion`. Starts `false` so server and first client
 * render agree; the effect corrects it before paint on the client.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}
