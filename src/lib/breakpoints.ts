// The one place a breakpoint is defined.
//
// Anything that needs the breakpoint in JS must read it from here, so a media
// query in CSS and one in JS can never drift apart. `wide` is Tailwind's
// default `md`: 48rem, which is 768px at the browser's default font size. The
// CSS writes it as `(width >= 48rem)` / `(width < 48rem)`, and so does this,
// so the two still agree when someone has set a larger default font.

export const WIDE_QUERY = "(width >= 48rem)";

/** True when the `md:` variant is active. Client-only. */
export const isWideViewport = () => window.matchMedia(WIDE_QUERY).matches;
