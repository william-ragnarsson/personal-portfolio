// One scroll listener for the whole page, coalesced to one callback per frame.
//
// Every scroll-driven piece (both globe stages, the page tone, the cursor)
// subscribes here instead of listening for itself, so a scroll costs one rAF
// and one read of scrollY/innerHeight however many things depend on it.
// Subscribers must not read layout: they get the scroll position and work from
// geometry they measured in a `useResizeEffect` pass.

type Listener = (scrollY: number, viewportH: number) => void;

const listeners = new Set<Listener>();
let queued = 0;

function run() {
  queued = 0;
  const y = window.scrollY;
  const vh = window.innerHeight;
  for (const cb of listeners) cb(y, vh);
}

/** Ask for a frame, e.g. after a measurement changed what the next one draws. */
export function requestFrame() {
  if (!queued && listeners.size) queued = requestAnimationFrame(run);
}

export function subscribeFrame(cb: Listener) {
  listeners.add(cb);
  if (listeners.size === 1) {
    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", requestFrame);
  }
  requestFrame();
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) {
      window.removeEventListener("scroll", requestFrame);
      window.removeEventListener("resize", requestFrame);
      if (queued) cancelAnimationFrame(queued);
      queued = 0;
    }
  };
}
