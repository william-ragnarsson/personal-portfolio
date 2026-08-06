<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# The responsive contract

This site is one long scroll-driven page. Nearly every layout bug it has had came
from breaking one of the rules below. After touching anything here, walk the
viewport matrix in the README — none of these fail a typecheck.

### One breakpoint, defined once

`src/lib/breakpoints.ts` is the only place a breakpoint number lives. It matches
Tailwind's `md` (768px). If JS needs to know the breakpoint, import
`isWideViewport()` from there — never write a second `matchMedia("(min-width: …)")`
string, and never assume `window.innerWidth` agrees with a CSS media query
(scrollbars make them differ).

### A breakpoint changes CSS, never the tree

Crossing `md` must not mount or unmount anything. Wide and narrow are the same
DOM with different classes — `MapJourney` flips its map region and card column
from stacked grid rows to overlapping absolute boxes purely in CSS.

Rendering two different trees behind a JS boolean is the bug this page shipped:
the boolean started `false` on the server, so the section remounted at hydration
and again on every drag across 768px, invalidating framer's scroll measurements
mid-scroll. If you need the viewport in JS for *geometry*, read it inside the
measurement pass — not during render.

### Scroll-linked sections size their track in the same unit as their travel

A sticky section's scroll track and the distance its content moves must be in the
same unit, or they only agree at one viewport size.

`MapJourney` measures its tallest card, derives `spacing` from it, and sets the
track to `calc(100dvh + travel)` where `travel = (cities - 1 + LEAD_IN) * spacing`.
That's why one card-pitch of scrolling always moves the carousel exactly one
card-pitch. The old code sized the track in `vh` and the cards in `px`, which is
what made cards drift and overlap on short screens.

### `dvh`, not `vh`

Mobile browsers change `vh` when the URL bar collapses. On a scroll-linked page
that silently resizes the track mid-scroll and invalidates every `useScroll`
measurement. Use `dvh` anywhere a height is load-bearing.

### A sticky container must fit the viewport

If a `sticky` element is taller than the viewport it stops sticking and its
contents run into the next section. Size sticky containers `h-[100dvh]` and let
an inner `grid-rows-[minmax(0,1fr)_auto]` divide the space, so no combination of
content can push past the bottom.

### Measure once per frame, in one pass

Use `useResizeEffect` (`src/hooks/`), not `window.addEventListener("resize")`. It
coalesces into a single rAF and also catches reflows a resize listener misses
(font swap, image load). Do all DOM reads and commit **one** state update: two
effects where the second depends on the first's state costs two layout passes and
paints a visibly wrong intermediate frame.

Prefer deriving values arithmetically over re-reading the DOM after a write —
`MapJourney` computes pin positions from the map offset it just calculated rather
than measuring the moved element.

### Animate only `transform` and `opacity`

Anything else repaints every scroll frame. Two traps specific to this page:
interpolating a `box-shadow` string (use a static shadow on an overlay and fade
its opacity), and animating SVG geometry attributes like `r` or `y1` (scale with
a transform instead — geometry attributes re-run SVG layout).

### Reveal-on-scroll can be skipped

An `IntersectionObserver` reports threshold *crossings*. Go from below the
viewport to above it between two samples — a fast flick, an anchor jump, a reload
that restores scroll position — and no callback ever fires, leaving the element
invisible forever. `useInView` handles this with a `scrollend` sweep; keep it if
you touch that code.
