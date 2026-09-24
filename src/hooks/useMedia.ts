"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether a media query matches, kept current. The server (and hydration)
 * sees `fallback`, then the real value renders right after, so markup never
 * mismatches. For geometry, read the query inside a measurement pass instead;
 * this is for choices like "wait for a press" under reduced motion.
 */
export function useMedia(query: string, fallback = false) {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}
