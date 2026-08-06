// The one place a breakpoint is defined.
//
// Anything that needs the breakpoint in JS must read it from here, so a
// media query and a Tailwind class can never drift apart. `wide` is Tailwind's
// default `md` (48rem); keep them in step if either ever moves.

export const WIDE_PX = 768;

/** Matches Tailwind's `md:` exactly — same viewport-width semantics. */
export const WIDE_QUERY = `(min-width: ${WIDE_PX}px)`;

/** True when the `md:` variant is active. Client-only. */
export const isWideViewport = () => window.matchMedia(WIDE_QUERY).matches;
