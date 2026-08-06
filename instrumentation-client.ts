import { load } from "@/lib/analytics";

// Analytics isn't worth competing with hydration for bandwidth or main-thread
// time, so the posthog-js chunk is fetched once the browser goes idle.
// `capture()` awaits the same memoised promise, so a click that lands before
// then pulls the load forward rather than losing the event.
//
// Trade-off: `capture_exceptions` only starts catching once this resolves, so
// an exception in the first second or two of page life won't be reported.
if (typeof window !== "undefined") {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => void load(), { timeout: 4000 });
  } else {
    setTimeout(() => void load(), 2000);
  }
}
