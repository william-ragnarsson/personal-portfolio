"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Runs `measure` once after layout, then again whenever any observed element
 * resizes.
 *
 * Every callback is coalesced into a single `requestAnimationFrame`, so
 * dragging a window edge costs at most one measurement pass per frame — not one
 * per resize event. Use this instead of `window.addEventListener("resize")`:
 * it also catches layout changes that don't resize the window (font swap, image
 * load, content reflow), which is where stale geometry usually comes from.
 *
 * `measure` should do all of its DOM reads and commit a single state update.
 * Splitting reads across two effects forces a second layout pass and paints an
 * intermediate frame.
 */
export function useResizeEffect(
  measure: () => void,
  getTargets: () => (Element | null | undefined)[],
  // Pass a dependency when the targets can be swapped out during the
  // component's life — e.g. a layout that renders a different tree above and
  // below a breakpoint. The observer is torn down and re-established, and
  // `measure` re-runs against the elements that are actually mounted now.
  // Leave it empty when the refs live for the component's lifetime.
  deps: unknown[] = [],
) {
  // Held in a ref so a new inline callback each render doesn't tear down and
  // re-create the observer. Declared before the setup effect below, so it has
  // already been refreshed by the time that effect reads it.
  const latest = useRef({ measure, getTargets });
  useLayoutEffect(() => {
    latest.current = { measure, getTargets };
  });

  useLayoutEffect(() => {
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        latest.current.measure();
      });
    };

    const observer = new ResizeObserver(schedule);
    for (const target of latest.current.getTargets()) {
      if (target) observer.observe(target);
    }

    // Synchronously before the first paint, so nothing renders unpositioned.
    latest.current.measure();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
    };
    // Re-observes only when `deps` change. With the default empty array the
    // targets are refs held for the component's lifetime, so observing once on
    // mount is correct and avoids tearing down the observer on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are the caller's by design
  }, deps);
}
