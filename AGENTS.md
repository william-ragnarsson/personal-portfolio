<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# The responsive contract

This site is one long scroll-driven page. Nearly every layout bug it has had came
from breaking one of the rules below. After touching anything here, walk the
viewport matrix in the README — none of these fail a typecheck.

### One breakpoint, defined once

`src/lib/breakpoints.ts` is the only place a breakpoint lives: Tailwind's `md`,
written `(width >= 48rem)` in CSS and in JS alike. If JS needs to know the
breakpoint, import `isWideViewport()` from there — never write a second
`matchMedia` string for it, and never compare `window.innerWidth` to a number
(scrollbars and the browser's default font size both make that disagree with
CSS).

The globe stages have one more condition shared between CSS and JS: a portrait
stage (height ≥ width) puts the globe under the text column instead of beside
it. `Stage.module.css` switches the column with `@container (orientation:
portrait)` and `placeGlobe()` in `src/components/globe/stage.ts` tests
`H >= W`. Likewise, `--u` in the CSS and `u` in `measureStage()` are the same
formula. Change either side, change both.

### A breakpoint changes CSS, never the tree

Crossing `md` must not mount or unmount anything. The hackathons and NYC
sections render **both** versions for everyone: the scroll-driven stage and the
still list with its globe. CSS shows one of them from `<html data-globe>` plus
the breakpoint. `data-globe` is set by an inline script before first paint
(`src/lib/mode.ts`), and when WebGL2 fails later, `demoteGlobe()` flips it to
`none`: again a CSS-only change.

Rendering two different trees behind a JS boolean is a bug this page has
shipped: the boolean started `false` on the server, so the section remounted at
hydration and again on every drag across 768px, throwing away its scroll
measurements mid-scroll. If you need the viewport in JS for *geometry*, read it
inside the measurement pass (`stagesActive()`), not during render.

### Scroll-linked sections size their track in the same unit as their travel

A sticky section's scroll track and the distance its content moves must be in the
same unit, or they only agree at one viewport size.

Both globe stages work in **screens**. The track is
`calc(100dvh * (1 + var(--travel)))`, and `src/lib/globe/timeline.ts` turns `p`,
the screens scrolled since the track reached the top, into a frame (camera,
card, pins, progress), as pure functions. So the same `p` is the same frame at
every window size, and the card for a stop shows at the same point of the scroll
however tall the window is. Keep timelines pure: anything that depends on the
window belongs in the measurement pass, not in `p`.

### `dvh`, not `vh`

Mobile browsers change `vh` when the URL bar collapses. On a scroll-linked page
that silently resizes the track mid-scroll and invalidates every measurement
taken from it. Use `dvh` anywhere a height is load-bearing.

### A sticky container must fit the viewport

If a `sticky` element is taller than the viewport it stops sticking and its
contents run into the next section. The stages are `height: 100dvh` with
`overflow: hidden`, and a `grid-template-rows: minmax(0, 1fr) auto` gives the
progress bar its row first, so no combination of content can push past the
bottom. The globe is placed in whatever room the text leaves, and shrinks to
fit it.

### Measure once per frame, in one pass

Use `useResizeEffect` (`src/hooks/`), not `window.addEventListener("resize")`. It
coalesces into a single rAF and also catches reflows a resize listener misses
(font swap, image load). Do all DOM reads and commit **one** state update: two
effects where the second depends on the first's state costs two layout passes and
paints a visibly wrong intermediate frame.

Scroll goes through `subscribeFrame()` (`src/lib/frame.ts`): one listener and
one rAF for the whole page. Subscribers get `scrollY` and the viewport height
and must not read layout. They draw from the geometry their `useResizeEffect`
pass measured.

Prefer deriving values arithmetically over re-reading the DOM after a write —
the stages project pins and route ends from the camera they just computed
rather than measuring anything they moved.

### Animate only `transform` and `opacity`

Anything else repaints every scroll frame. Two traps specific to this page:
interpolating a `box-shadow` string (use a static shadow on an overlay and fade
its opacity), and animating SVG geometry attributes like `r` or `y1` (scale with
a transform instead — geometry attributes re-run SVG layout).

The exceptions are deliberate, and each is bounded:

- **The globe canvases** repaint every frame. That's their job. There is one
  WebGL2 context for the whole page (`src/lib/globe/renderer.ts`), and each
  stage copies from it into its own 2D canvas. Don't create another context.
- **`font-variation-settings`** on the hero's letters (the opening, and the
  hover under a mouse) and on the stretching city names. It re-lays out text,
  so the hero's heading has `contain: layout style`, and a city name only
  animates once, when it scrolls in.
- **`mask-image`** on the hackathons text while the blue folds into the globe.
  It's set only while the iris is moving, and cleared once it's gone.

### Reveal-on-scroll can be skipped

An `IntersectionObserver` reports threshold *crossings*. Go from below the
viewport to above it between two samples — a fast flick, an anchor jump, a reload
that restores scroll position — and no callback ever fires, leaving the element
invisible forever. `useInView` handles this with a `scrollend` sweep; keep it if
you touch that code.
