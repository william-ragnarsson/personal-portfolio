// PostHog, loaded lazily.
//
// posthog-js is ~200 KB and was imported at module scope in five client
// components plus the instrumentation entry, which put it on the critical path:
// the browser had to fetch and parse it before hydration finished, purely to be
// ready for a click that might never happen.
//
// Now it lives in its own chunk behind a dynamic import. `load()` is scheduled
// when the browser goes idle (see instrumentation-client.ts) and is also
// awaited by `capture()`, so a click that lands before idle just pulls the load
// forward instead of dropping the event. The promise is memoised, so init runs
// exactly once no matter which path gets there first.

type PostHog = typeof import("posthog-js").default;

let pending: Promise<PostHog> | null = null;

export function load(): Promise<PostHog> {
  pending ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
      api_host: "/ingest",
      ui_host: "https://eu.posthog.com",
      defaults: "2026-01-30",
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
    });
    return posthog;
  });
  return pending;
}

/** Fire-and-forget event capture. Never throws into the caller's click handler. */
export function capture(event: string, properties?: Record<string, unknown>) {
  void load()
    .then((posthog) => posthog.capture(event, properties))
    .catch(() => {
      // Analytics must never break a navigation.
    });
}
