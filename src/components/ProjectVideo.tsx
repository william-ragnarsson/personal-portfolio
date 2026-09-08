"use client";

import { useSyncExternalStore } from "react";

/**
 * A looping muted clip for a feature block — used for the Double Pendulum's
 * phase map. Fills whatever square box the parent gives it.
 *
 * Under `prefers-reduced-motion: reduce` the `<video>` is never rendered: the
 * poster shows as a plain `<img>` and nothing autoplays. CSS can't stop
 * `autoplay`, so the preference is read here. The server and the first client
 * paint render the poster; if motion is allowed the `<video>` swaps in — no
 * layout shift, both fill the same box — and it swaps back if the preference is
 * toggled at runtime.
 *
 * This `matchMedia` is a reduced-motion query, a different axis from the
 * breakpoint query owned by `src/lib/breakpoints.ts` — no shared helper, one
 * caller.
 */
const MOTION_OK_QUERY = "(prefers-reduced-motion: no-preference)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(MOTION_OK_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export default function ProjectVideo({
  src,
  poster,
  alt,
}: {
  src: string;
  poster: string;
  alt: string;
}) {
  const motionOk = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOTION_OK_QUERY).matches,
    () => false,
  );

  if (!motionOk) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={poster} alt={alt} className="h-full w-full object-cover" />;
  }

  return (
    <video
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={alt}
      className="h-full w-full object-cover"
    />
  );
}
