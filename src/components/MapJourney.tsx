"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { capture } from "@/lib/analytics";
import { MAP_DOTS_SRC, type MapData } from "@/lib/hackathonMap";
import { WIDE_QUERY, isWideViewport } from "@/lib/breakpoints";
import { useResizeEffect } from "@/hooks/useResizeEffect";
import { hackathons } from "@/data/content";
import { ArrowUpRight, Github, Trophy } from "@/components/ui/icons";

// The design tokens from globals.css, not copies of them. SVG `fill`/`stroke`
// resolve CSS variables just like any other property, so the map can't drift
// out of step with the rest of the palette.
const BLUE = "var(--accent)";
const CORAL = "var(--accent-2)";

// Wide layout: the card floats over the map at a fixed width. The map is
// positioned so all pins stay visible between the card and the right edge,
// centered in that space when there's room, never sliding a pin behind the
// card when there isn't. Narrow uses the same rule with no card to dodge.
const CARD_WIDTH = 480;
const CARD_GAP = 40;
const EDGE_MARGIN = 40;
// Horizontal gutter between a wide-layout card and its column edges (px).
// Must match the `md:left-10 md:right-10` on the card itself.
const CARD_INSET = 40;

// Each location is its own separate card; the cards ride vertically like a
// carousel. The whole interaction is scroll-linked: every value below is a pure
// function of the continuous journey position `t`, so each scroll tick moves
// pixels and you can rest in any in-between state. No time-based anims.
//
// Card height is NOT fixed — a blurb wraps to more lines as the column narrows,
// and a fixed height made cards overflow into each other. Instead the tallest
// card is measured and everything derives from it:
//
//   spacing    = tallest card + CARD_GAP_Y   distance between card centres
//   travel     = (n - 1 + LEAD_IN) * spacing total scroll-linked distance
//   track      = 100dvh + travel             the section's scroll length
//
// Because `track` and `spacing` are both in px, one card-pitch of scrolling
// always moves the carousel exactly one card-pitch — at any viewport size. When
// the track was sized in vh and the cards in px, the two only agreed at one
// particular window height, which is what made the cards drift and overlap.
const CARD_GAP_Y = 48;
const LEAD_IN = 0.85;
// Extra height around the focused card so its neighbours peek in (narrow).
const CARD_PEEK = 56;
// Fallbacks used for the very first paint, before the cards have been measured.
const FALLBACK_CARD_H = 300;

// Height of the full-bleed coral banner an awarded city wears across the top of
// its card. The card's own height is measured, so this needs no compensating
// arithmetic anywhere — it just makes those cards taller.
const AWARD_BANNER_H = 52;

// ── Narrow: a horizontal swipe deck instead of the vertical carousel ──
// Below `md:` the section drops the scroll-jacking entirely: the whole world
// scaled down to fit (uncropped, so the map has no hard edges), above a
// snap-scrolling deck of cards driven by its own sideways scroll offset.
const NARROW_MAP_MAX_W = 400;
const NARROW_BANNER_H = 44;
// Deck cards are a fraction of the viewport so the next one peeks. The
// scroller's side padding has to be at least half the leftover space, or a
// centre-snapped first and last card can never reach their snap position: the
// deck jams short of the end, and the browser's mandatory snapping oscillates
// forever trying to settle somewhere it can't reach. With this padding the
// maximum scroll offset lands exactly on the last card's snap point — plus a
// pixel, so it stays strictly reachable once subpixel widths are rounded.
const DECK_CARD_W = "min(86vw, 400px)";
const DECK_PAD = `max(1.5rem, calc((100vw - ${DECK_CARD_W}) / 2 + 1px))`;
// Shrinking the map shrinks its pins with it (they're drawn in viewBox units),
// so scale them back up to stay legible. Held below ~1.6: Berlin and Stockholm
// land about 8px apart at phone width, and bigger pins merge into one blob.
const NARROW_PIN_SCALE = 1.5;

// Softens cards as they enter/leave the top and bottom of the carousel window.
// The fade depth is a CSS variable rather than a fixed percentage: wide gets a
// generous 14% of a full-height column, while the narrow window is only ~350px
// tall, where 14% would fade the parked card's own edges out.
const EDGE_FADE =
  "linear-gradient(to bottom, transparent 0, #000 var(--fade), #000 calc(100% - var(--fade)), transparent 100%)";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/* Distance between two consecutive deck cards, i.e. how far the deck scrolls to
   advance one city. Measured off live rects, so it holds whatever the clamped
   `DECK_CARD_W` actually resolved to and is unaffected by how far the deck is
   currently scrolled. */
function deckStep(el: HTMLElement) {
  const a = el.children[0];
  const b = el.children[1];
  if (!a || !b) return 0;
  return b.getBoundingClientRect().left - a.getBoundingClientRect().left;
}

/* Reactive form of `isWideViewport`. The measurement pass can read the media
   query on demand, but choosing which layout to render needs it as state. Same
   `WIDE_QUERY`, so the two can't drift. */
function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY);
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return wide;
}

// Screen geometry (in sticky-container coordinates) for drawing connector
// lines. `baseY` is the resting screen-Y of a card's anchor (its centre); each
// connector offsets from it by the card's live carousel position.
type Geo = { x1: number; baseY: number; pins: { x: number; y: number }[] };

type Metrics = { cardH: number; mapLeft: number; geo: Geo | null };

// The deck's equivalent of `Geo`. The carousel's cards move vertically past a
// fixed anchor, so its connectors vary `y1`; the deck's move horizontally, so
// these vary `x1` instead. `baseX` is the resting screen-X of the focused
// card's centre and `y1` its top edge — the line hangs from there up to the pin.
type DeckGeo = { baseX: number; y1: number; step: number; pins: { x: number; y: number }[] };

const INITIAL_METRICS: Metrics = {
  cardH: FALLBACK_CARD_H,
  mapLeft: 0,
  geo: null,
};

export default function MapJourney({ data }: { data: MapData }) {
  const reduce = useReducedMotion();
  const wide = useWide();
  const n = data.pins.length;

  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const mapRegionRef = useRef<HTMLDivElement>(null);
  const cardColRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const deckRef = useRef<HTMLDivElement>(null);
  const narrowMapRef = useRef<HTMLDivElement>(null);

  // One state object, committed by one measurement pass. Previously `mapLeft`
  // and `geo` lived in separate effects where geo depended on mapLeft, so every
  // resize cost two layout passes and painted a frame with the map and its
  // connector lines disagreeing.
  const [{ cardH, mapLeft, geo }, setMetrics] = useState<Metrics>(INITIAL_METRICS);
  const [deckGeo, setDeckGeo] = useState<DeckGeo | null>(null);

  const spacing = cardH + CARD_GAP_Y;
  const travel = (n - 1 + LEAD_IN) * spacing;

  // Continuous journey position. `t === i` means "parked on city i"; fractional
  // values are the in-between states. A small negative start lets city 0 slide
  // in as you enter the section.
  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start start", "end end"],
  });
  const scrollT = useTransform(scrollYProgress, [0, 1], [-LEAD_IN, Math.max(0, n - 1)]);

  // The narrow deck produces the same journey position from its own horizontal
  // scroll offset, so the map, pins and progress dots are driven by one value in
  // both layouts and need no branching of their own.
  const deckT = useMotionValue(0);
  const t = wide ? scrollT : deckT;

  // Rounded index, updated only when it flips — for the few things that need
  // real React state (pointer-events / aria on the focused card). Wide only:
  // the deck's cards are all live and visible, so re-rendering the section as
  // the deck scrolls would be pure churn.
  const [focus, setFocus] = useState(0);
  useMotionValueEvent(t, "change", (v) => {
    if (!wide) return;
    const i = clamp(Math.round(v), 0, n - 1);
    setFocus((f) => (f === i ? f : i));
  });

  // Keep the journey position in sync with the deck's own scroll offset, so the
  // map pins and progress dots track a sideways swipe exactly as they track the
  // vertical scroll on wide. A native passive listener rather than React's
  // `onScroll`: it fires for momentum and programmatic scrolling alike.
  useEffect(() => {
    const el = deckRef.current;
    if (!el || wide || reduce) return;

    const sync = () => {
      const step = deckStep(el);
      if (step > 0) deckT.set(el.scrollLeft / step);
    };

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [wide, reduce, deckT]);

  // Drag the deck with a mouse. A native horizontal scroller only answers to
  // wheel and trackpad gestures, so on a desktop pointer the deck looks stuck.
  // Mouse only — touch keeps the browser's own momentum and snapping.
  useEffect(() => {
    const el = deckRef.current;
    if (!el || wide || reduce) return;

    let startX = 0;
    let startScroll = 0;
    let active = false;
    let dragged = false;

    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      active = true;
      dragged = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
    };

    const move = (e: PointerEvent) => {
      if (!active) return;
      const dx = e.clientX - startX;
      // Swallow the first few pixels so a click on a link stays a click.
      if (!dragged) {
        if (Math.abs(dx) < 4) return;
        dragged = true;
        // Mandatory snapping fights a hand-driven scroll; restored on release.
        el.style.scrollSnapType = "none";
        el.style.userSelect = "none";
        el.setPointerCapture(e.pointerId);
      }
      el.scrollLeft = startScroll - dx;
    };

    const up = (e: PointerEvent) => {
      if (!active) return;
      active = false;
      if (!dragged) return;
      el.style.userSelect = "";
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      // Hand the deck back to the browser on the next frame and let its own
      // snapping settle it. Driving a smooth `scrollTo` here instead fights the
      // mandatory snap being re-enabled, and the two oscillate.
      requestAnimationFrame(() => {
        el.style.scrollSnapType = "";
      });
    };

    // A drag that happens to end on a link must not also open it.
    const click = (e: MouseEvent) => {
      if (!dragged) return;
      e.preventDefault();
      e.stopPropagation();
      dragged = false;
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("click", click, true);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("click", click, true);
    };
  }, [wide, reduce]);

  // The single measurement pass. Reads layout, derives everything analytically,
  // commits once. Note it never reads the map element's own rect: the map's
  // position is `mapLeft`, which we just computed, so pin screen positions come
  // out of arithmetic rather than a second read-after-write.
  useResizeEffect(
    () => {
      const stickyEl = stickyRef.current;
      const mapEl = mapRegionRef.current;
      const colEl = cardColRef.current;
      if (!stickyEl || !mapEl || !colEl) return;

      const wide = isWideViewport();
      const stickyRect = stickyEl.getBoundingClientRect();
      const mapRect = mapEl.getBoundingClientRect();
      const colRect = colEl.getBoundingClientRect();

      const nextCardH = Math.max(
        ...cardRefs.current.map((el) => el?.offsetHeight ?? 0),
        0,
      ) || FALLBACK_CARD_H;

      // Fit every pin into the map region's free horizontal space, centered in
      // it when there's room. On wide the card column eats the left of that
      // space; on narrow the map has the region to itself.
      const mapWidth = mapRect.height * (data.vbW / data.vbH);
      const xs = data.pins.map((p) => p.x / data.vbW);
      const clusterCenterFrac = (Math.min(...xs) + Math.max(...xs)) / 2;

      const colLeft = colRect.left - mapRect.left;
      const visibleStart = wide ? colLeft + CARD_WIDTH + CARD_GAP : EDGE_MARGIN;
      const visibleEnd = mapRect.width - EDGE_MARGIN;

      const minLeft = visibleStart - Math.min(...xs) * mapWidth;
      const maxLeft = visibleEnd - Math.max(...xs) * mapWidth;
      const centered = (visibleStart + visibleEnd) / 2 - clusterCenterFrac * mapWidth;

      // Center when the whole cluster fits; otherwise never let it slide behind
      // the card, even if that pushes pins past the right edge.
      const nextMapLeft =
        minLeft <= maxLeft ? clamp(centered, minLeft, maxLeft) : minLeft;

      // Cards are inset horizontally from the column by CARD_INSET on wide.
      const x1 = wide
        ? colRect.right - CARD_INSET - stickyRect.left
        : colRect.left + colRect.width / 2 - stickyRect.left;
      const baseY = colRect.top + colRect.height / 2 - stickyRect.top;

      const mapOriginX = mapRect.left - stickyRect.left + nextMapLeft;
      const mapOriginY = mapRect.top - stickyRect.top;
      const pins = data.pins.map((p) => ({
        x: mapOriginX + (p.x / data.vbW) * mapWidth,
        y: mapOriginY + (p.y / data.vbH) * mapRect.height,
      }));

      // Bail out when nothing moved. A resize can settle after a couple of
      // passes (card height feeds the window height feeds the map height), and
      // returning `prev` is what stops that from re-rendering forever.
      setMetrics((prev) =>
        prev.cardH === nextCardH &&
        prev.mapLeft === nextMapLeft &&
        prev.geo?.x1 === x1 &&
        prev.geo?.baseY === baseY &&
        prev.geo?.pins[0]?.x === pins[0]?.x &&
        prev.geo?.pins[0]?.y === pins[0]?.y
          ? prev
          : { cardH: nextCardH, mapLeft: nextMapLeft, geo: { x1, baseY, pins } },
      );
    },
    () => [stickyRef.current, mapRegionRef.current, cardColRef.current, ...cardRefs.current],
    // The narrow deck and the wide carousel are different trees, so these
    // elements only exist while `wide` is true. Without re-observing on the
    // switch, the pass would run once at mount against nulls and never again —
    // leaving the map pinned at left: 0 and the connector lines undrawn.
    [wide],
  );

  // The same idea for the deck: one pass, all reads, one commit. Nothing here
  // depends on the scroll position — the connectors offset from `baseX` by the
  // deck's live position, so this only re-runs when something actually resizes.
  useResizeEffect(
    () => {
      const rootEl = outerRef.current;
      const mapEl = narrowMapRef.current;
      const deckEl = deckRef.current;
      if (!rootEl || !mapEl || !deckEl) return;

      const rootRect = rootEl.getBoundingClientRect();
      const mapRect = mapEl.getBoundingClientRect();
      const deckRect = deckEl.getBoundingClientRect();

      const step = deckStep(deckEl);
      // Cards snap centred, so the focused card's centre is the deck's centre.
      const baseX = deckRect.left - rootRect.left + deckRect.width / 2;
      const y1 = deckRect.top - rootRect.top;
      const pins = data.pins.map((p) => ({
        x: mapRect.left - rootRect.left + (p.x / data.vbW) * mapRect.width,
        y: mapRect.top - rootRect.top + (p.y / data.vbH) * mapRect.height,
      }));

      setDeckGeo((prev) =>
        prev &&
        prev.baseX === baseX &&
        prev.y1 === y1 &&
        prev.step === step &&
        prev.pins[0]?.x === pins[0]?.x &&
        prev.pins[0]?.y === pins[0]?.y
          ? prev
          : { baseX, y1, step, pins },
      );
    },
    () => [outerRef.current, narrowMapRef.current, deckRef.current],
    [wide],
  );

  // ── reduced motion: whole world + list (accessible fallback) ──
  if (reduce) {
    return (
      <div className="mx-auto max-w-[900px] px-6">
        <div className="relative mx-auto w-[86%]" style={{ aspectRatio: `${data.vbW} / ${data.vbH}` }}>
          <MapLayersStatic data={data} activeIndex={n - 1} />
        </div>
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {hackathons.map((h) => (
            <li key={h.city} className="flex items-center justify-between gap-4 py-4">
              <div>
                <span className="font-medium">{h.city}</span>
                <span className="ml-3 text-sm text-muted">{h.project}</span>
              </div>
              <span className="flex shrink-0 items-center gap-3">
                {h.award ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-accent-2 px-3 py-1.5 font-mono text-[13px] font-bold uppercase tracking-[0.14em] text-background">
                    <Trophy className="h-4 w-4 shrink-0" />
                    {h.award}
                  </span>
                ) : null}
                {h.repo ? (
                  <a
                    href={h.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted transition-colors hover:text-accent"
                    aria-label={`${h.project} on GitHub`}
                    onClick={() =>
                      capture("hackathon_repo_clicked", {
                        hackathon_event: h.event,
                        hackathon_city: h.city,
                        project_name: h.project,
                      })
                    }
                  >
                    <Github className="h-4 w-4" />
                  </a>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // ── narrow: whole world, scaled to fit, above a horizontal snap-scroll deck ──
  // Nothing is sticky and nothing is scroll-jacked here; the section is ordinary
  // page flow and the only scroll being interpreted is the deck's own. This is
  // the one place the two layouts genuinely diverge in markup rather than CSS,
  // so crossing the breakpoint does remount the section.
  if (!wide) {
    return (
      // `outerRef` stays attached even though nothing here is scroll-linked, so
      // the shared `useScroll` above always has a mounted target to measure.
      <div ref={outerRef} className="relative">
        {/* The whole map, contained and centred — no crop, so it floats on the
            paper background instead of sitting in a box with cut-off edges. */}
        <div className="px-6">
          <div
            ref={narrowMapRef}
            className="relative mx-auto w-full"
            style={{ maxWidth: NARROW_MAP_MAX_W, aspectRatio: `${data.vbW} / ${data.vbH}` }}
          >
            <MapLayersLive data={data} t={t} pinScale={NARROW_PIN_SCALE} />
          </div>
        </div>

        {deckGeo ? (
          <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
            {deckGeo.pins.map((pin, i) => (
              <DeckConnector
                key={data.pins[i].city}
                index={i}
                t={t}
                step={deckGeo.step}
                baseX={deckGeo.baseX}
                y1={deckGeo.y1}
                x2={pin.x}
                y2={pin.y}
              />
            ))}
          </svg>
        ) : null}

        <div
          ref={deckRef}
          role="region"
          aria-label="Hackathon cities"
          style={{ paddingInline: DECK_PAD }}
          className="relative z-20 mt-6 flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {hackathons.map((h, i) => (
            <DeckCard key={h.city} h={h} index={i} t={t} />
          ))}
        </div>

        <div className="mt-5 flex justify-center gap-2">
          {data.pins.map((p, i) => (
            <Dot key={p.city} index={i} t={t} />
          ))}
        </div>
      </div>
    );
  }

  // One tree for the wide layout. The map region and card column overlap as
  // absolute boxes at `md:`; the grid rows below are the pre-`md:` fallback for
  // the frame between hydration and `useWide` resolving.
  const vars = {
    "--card-w": `${CARD_WIDTH}px`,
    // Never let the carousel window grow past the space the sticky container
    // actually has: the map row is minmax(0,1fr), so it absorbs the remainder
    // and the two rows can't sum past the viewport no matter how short it gets.
    "--card-window": `min(${cardH + CARD_PEEK}px, 68dvh)`,
  } as CSSProperties;

  return (
    <div
      ref={outerRef}
      className="relative"
      style={{ ...vars, height: `calc(100dvh + ${travel}px)` }}
    >
      <div
        ref={stickyRef}
        className="sticky top-0 grid h-[100dvh] w-full grid-rows-[minmax(0,1fr)_auto] overflow-hidden"
      >
        <div
          ref={mapRegionRef}
          className="relative overflow-hidden md:absolute md:inset-0"
        >
          <div
            className="absolute inset-y-0"
            style={{ aspectRatio: `${data.vbW} / ${data.vbH}`, left: mapLeft }}
          >
            <MapLayersLive data={data} t={t} />
          </div>

          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 md:bottom-8">
            {data.pins.map((p, i) => (
              <Dot key={p.city} index={i} t={t} />
            ))}
          </div>
        </div>

        {/* Left gutter is fluid: it grows with the viewport on roomy screens and
            tightens back to 40px as the screen slims, where the map needs every
            pixel. The measurement pass reads it, so this stays the one place
            it's defined. */}
        <div
          ref={cardColRef}
          className="relative z-20 h-[var(--card-window)] w-full overflow-hidden md:absolute md:inset-y-0 md:left-10 md:h-auto md:w-[var(--card-w)] lg:left-[clamp(4rem,11vw,16rem)]"
        >
          <div
            className="absolute inset-0 [--fade:22px] md:[--fade:14%]"
            style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}
          >
            {hackathons.map((h, i) => (
              <CityCard
                key={h.city}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                h={h}
                index={i}
                t={t}
                spacing={spacing}
                focused={focus === i}
              />
            ))}
          </div>
        </div>

        {geo ? (
          <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
            {geo.pins.map((pin, i) => (
              <Connector
                key={data.pins[i].city}
                index={i}
                t={t}
                spacing={spacing}
                x1={geo.x1}
                baseY={geo.baseY}
                x2={pin.x}
                y2={pin.y}
              />
            ))}
          </svg>
        ) : null}
      </div>
    </div>
  );
}

/* One location's card. Each city is its own separate bordered card; the cards
   ride vertically like a carousel. A card's position is a pure function of the
   scroll position: at `t === index` it sits centred; as the scroll advances it
   slides up while the next card rises into place, and around the hand-off two
   distinct cards share the screen. Fully scroll-linked and freezable.

   The outer div centres the card on the column's midline with pure CSS, so the
   card keeps its natural height however its text wraps. The inner motion.div
   owns the transform — the two are separate elements because framer writes
   `transform` directly and would otherwise clobber the centring. */
function CityCard({
  ref,
  h,
  index,
  t,
  spacing,
  focused,
}: {
  ref: (el: HTMLDivElement | null) => void;
  h: (typeof hackathons)[number];
  index: number;
  t: MotionValue<number>;
  spacing: number;
  focused: boolean;
}) {
  const y = useTransform(t, (v) => (index - v) * spacing);
  // How close the scroll is to this card — 1 when parked on it, 0 a full city
  // away. Awarded cities use it to fade their banner and card glow.
  const near = useTransform(t, (v) => clamp(1 - Math.abs(v - index)));
  // The banner never drops out entirely: a card must never slide in wearing a
  // blank coral band, so it enters already legible and firms up to full strength
  // across the middle of the card's pass.
  const awardOpacity = useTransform(near, [0, 0.3], [0.5, 1]);
  // Full strength early, and held there for most of the card's time on screen
  // rather than peaking only at the exact parked position.
  const glowOpacity = useTransform(near, [0.05, 0.35], [0, 1]);

  return (
    <div
      ref={ref}
      className="absolute left-6 right-6 top-1/2 -translate-y-1/2 md:left-10 md:right-10"
    >
      <motion.div
        className="relative"
        style={{ y, pointerEvents: focused ? "auto" : "none" }}
        aria-hidden={focused ? undefined : true}
      >
        {h.award ? (
          // Static shadow faded with opacity. Interpolating the box-shadow
          // string itself repainted the card on every scroll frame. It sits
          // outside the clipping box below so the halo can spill past the card.
          <motion.span
            aria-hidden="true"
            className="card-glow pointer-events-none absolute inset-0 rounded-2xl"
            style={{ opacity: glowOpacity }}
          />
        ) : null}

        {/* `overflow-hidden` is what lets the award banner run edge to edge and
            still take the card's rounded corners. */}
        <div className="relative flex flex-col justify-center overflow-hidden rounded-2xl border border-border bg-background-soft/80 shadow-sm">
          {h.award ? (
            <AwardBanner
              award={h.award}
              padX="px-6 md:px-8"
              height={AWARD_BANNER_H}
              textClass="text-[13px] tracking-[0.18em]"
              opacity={awardOpacity}
            />
          ) : null}
          <CardDetails
            h={h}
            pad="p-6 md:p-8"
            titleClass="text-3xl sm:text-4xl"
            blurbClass="text-sm"
          />
        </div>
      </motion.div>
    </div>
  );
}

/* Narrow layout's card. One per screen in a horizontal snap-scroll deck: no
   absolute positioning and no height math — the flex row stretches every card
   to the tallest one, so nothing can clip however long the blurb runs. The only
   scroll-linked thing left is the coral glow on the card you're parked on. */
function DeckCard({
  h,
  index,
  t,
}: {
  h: (typeof hackathons)[number];
  index: number;
  t: MotionValue<number>;
}) {
  const near = useTransform(t, (v) => clamp(1 - Math.abs(v - index)));
  const glowOpacity = useTransform(near, [0.05, 0.35], [0, 1]);
  return (
    <div className="relative shrink-0 snap-center" style={{ width: DECK_CARD_W }}>
      {h.award ? (
        <motion.span
          aria-hidden="true"
          className="card-glow pointer-events-none absolute inset-0 rounded-2xl"
          style={{ opacity: glowOpacity }}
        />
      ) : null}
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background-soft/80 shadow-sm">
        {h.award ? (
          <AwardBanner
            award={h.award}
            padX="px-5"
            height={NARROW_BANNER_H}
            textClass="text-[11px] tracking-[0.14em]"
          />
        ) : null}
        <CardDetails h={h} pad="px-5 py-6" titleClass="text-2xl" blurbClass="text-[13px]" />
      </div>
    </div>
  );
}

/* The win, worn across the top of the card. `opacity` is a MotionValue in the
   wide carousel, where the banner softens at the edges of the carousel window;
   in the deck every card sits still, so it reads at full strength. */
function AwardBanner({
  award,
  padX,
  height,
  textClass,
  opacity,
}: {
  award: string;
  padX: string;
  height: number;
  textClass: string;
  opacity?: MotionValue<number>;
}) {
  return (
    <motion.div
      className={`flex shrink-0 items-center gap-2.5 bg-accent-2 text-background ${padX}`}
      style={{ height, ...(opacity ? { opacity } : null) }}
    >
      <Trophy className="h-4 w-4 shrink-0" />
      <span className={`font-mono font-bold uppercase ${textClass}`}>{award}</span>
    </motion.div>
  );
}

/* Everything below the banner. Shared by both layouts so the copy and the two
   analytics events have exactly one definition. */
function CardDetails({
  h,
  pad,
  titleClass,
  blurbClass,
}: {
  h: (typeof hackathons)[number];
  pad: string;
  titleClass: string;
  blurbClass: string;
}) {
  return (
    <div className={`flex flex-1 flex-col justify-center ${pad}`}>
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
        {h.city}, {h.country}
      </p>
      <h3 className={`display mt-1 text-ink ${titleClass}`}>{h.event}</h3>
      <p className="mt-2 text-base font-medium" style={{ color: BLUE }}>
        {h.project}
      </p>
      <p className={`mt-3 leading-relaxed text-muted ${blurbClass}`}>{h.blurb}</p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
        {h.repo ? (
          <a
            href={h.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-ink transition-colors hover:text-accent"
            onClick={() =>
              capture("hackathon_repo_clicked", {
                hackathon_event: h.event,
                hackathon_city: h.city,
                project_name: h.project,
              })
            }
          >
            <Github className="h-4 w-4" /> GitHub
          </a>
        ) : null}
        {h.link ? (
          <a
            href={h.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-accent"
            onClick={() =>
              capture("hackathon_link_clicked", {
                hackathon_event: h.event,
                hackathon_city: h.city,
                project_name: h.project,
              })
            }
          >
            View project <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

/* Dotted line from a location's card to its pin. It follows the card up the
   carousel (y1 tracks the card's live position) and fades by how close the
   scroll is to that city, so during a hand-off both cards' lines are drawn to
   their respective cities. */
function Connector({
  index,
  t,
  spacing,
  x1,
  baseY,
  x2,
  y2,
}: {
  index: number;
  t: MotionValue<number>;
  spacing: number;
  x1: number;
  baseY: number;
  x2: number;
  y2: number;
}) {
  const y1 = useTransform(t, (v) => baseY + (index - v) * spacing);
  const opacity = useTransform(t, (v) => clamp(1 - Math.abs(v - index)));
  return (
    <g>
      <motion.line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={CORAL}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="1 6"
        opacity={opacity}
      />
      <motion.circle cx={x2} cy={y2} r={4} fill={CORAL} opacity={opacity} />
    </g>
  );
}

/* The deck's connector. Same dotted thread and the same fade by scroll
   proximity as the carousel's, but hung from the focused card's top edge: the
   deck's cards travel horizontally, so `x1` tracks the live position where
   `Connector` tracks `y1`. */
function DeckConnector({
  index,
  t,
  step,
  baseX,
  y1,
  x2,
  y2,
}: {
  index: number;
  t: MotionValue<number>;
  step: number;
  baseX: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  const x1 = useTransform(t, (v) => baseX + (index - v) * step);
  const opacity = useTransform(t, (v) => clamp(1 - Math.abs(v - index)));
  return (
    <g>
      <motion.line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={CORAL}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="1 6"
        opacity={opacity}
      />
      <motion.circle cx={x2} cy={y2} r={4} fill={CORAL} opacity={opacity} />
    </g>
  );
}

/* Progress dot that fills coral as the scroll passes its city. */
function Dot({ index, t }: { index: number; t: MotionValue<number> }) {
  const opacity = useTransform(t, (v) => clamp(v - index + 0.5));
  return (
    <span className="relative h-1.5 w-1.5">
      <span className="absolute inset-0 rounded-full bg-ink/20" />
      <motion.span className="absolute inset-0 rounded-full" style={{ background: CORAL, opacity }} />
    </span>
  );
}

/* The dot grid, as a static asset rather than inline markup.
   It's ~12k <circle> elements; loading it through <img> keeps every one of them
   inside the image's own isolated document, so the page never lays them out and
   a resize costs nothing. Inline, it was ~2 MB of HTML and a full reflow of 12k
   nodes on every resize event. Decorative — the pins carry the meaning. */
function MapDots() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- next/image can't optimize SVG, and a separate document is the whole point here
    <img
      src={MAP_DOTS_SRC}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
    />
  );
}

/* Live map: pins light up progressively as the scroll passes them, and the
   nearest city gets the pulse — all driven by the continuous scroll position. */
function MapLayersLive({
  data,
  t,
  pinScale = 1,
}: {
  data: MapData;
  t: MotionValue<number>;
  pinScale?: number;
}) {
  return (
    <>
      <MapDots />
      <svg
        viewBox={`0 0 ${data.vbW} ${data.vbH}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
      >
        <MapDefs />
        {data.pins.map((p, i) => (
          <Pin key={p.city} p={p} index={i} t={t} sizeScale={pinScale} />
        ))}
      </svg>
    </>
  );
}

// Base radius of the coral dot. It scales rather than growing its `r`, because
// `r` is a geometry attribute: changing it re-runs SVG layout every frame,
// while a transform is compositor work. Same reason the halo below is a
// gradient and not a blur filter.
const PIN_R = 1.6;
const PIN_R_MIN = 1.15;

function Pin({
  p,
  index,
  t,
  sizeScale,
}: {
  p: MapData["pins"][number];
  index: number;
  t: MotionValue<number>;
  // The narrow map is drawn much smaller, and these radii are in viewBox units
  // — so they'd shrink with it. Scaled back up to stay legible there.
  sizeScale: number;
}) {
  const near = useTransform(t, (v) => clamp(1 - Math.abs(v - index)));
  const coralOpacity = useTransform(t, (v) => clamp(v - index + 0.5));
  const scale = useTransform(near, (v) => (PIN_R_MIN + 0.45 * v) / PIN_R);
  const haloOpacity = useTransform(near, [0, 1], [0.35, 1]);
  const spin = { transformBox: "fill-box", transformOrigin: "center" } as const;
  return (
    <g>
      <motion.circle
        cx={p.x}
        cy={p.y}
        r={5 * sizeScale}
        fill="url(#pinglow)"
        style={{ opacity: haloOpacity }}
      />
      {/* The pulse keyframe animates its own opacity, so gate visibility with
          the wrapping group — only the pin nearest the scroll pulses. */}
      <motion.g style={{ opacity: near }}>
        <circle cx={p.x} cy={p.y} r={1.9 * sizeScale} fill={CORAL} className="pulse-ring" />
      </motion.g>
      <circle cx={p.x} cy={p.y} r={PIN_R_MIN * sizeScale} fill={BLUE} />
      <motion.circle
        cx={p.x}
        cy={p.y}
        r={PIN_R * sizeScale}
        fill={CORAL}
        style={{ opacity: coralOpacity, scale, ...spin }}
      />
      <circle cx={p.x} cy={p.y} r={0.4 * sizeScale} fill="#fff" opacity={0.9} />
    </g>
  );
}

/* Static map for the reduced-motion fallback. */
function MapLayersStatic({ data, activeIndex }: { data: MapData; activeIndex: number }) {
  return (
    <>
      <MapDots />
      <svg
        viewBox={`0 0 ${data.vbW} ${data.vbH}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
      >
        <MapDefs />
        {data.pins.map((p, i) => {
          const lit = i <= activeIndex;
          return (
            <g key={p.city}>
              {lit ? <circle cx={p.x} cy={p.y} r={5} fill="url(#pinglow)" /> : null}
              <circle cx={p.x} cy={p.y} r={PIN_R_MIN} fill={lit ? CORAL : BLUE} />
              <circle cx={p.x} cy={p.y} r={0.4} fill="#fff" opacity={0.9} />
            </g>
          );
        })}
      </svg>
    </>
  );
}

/* The pin halo. This used to be an feGaussianBlur filter applied per pin, with
   a 500%-of-bounds filter region — so every pin allocated its own offscreen
   buffer and re-blurred it on each scroll frame as the pin animated. A radial
   gradient paints the same soft falloff with no filter pass at all. */
function MapDefs() {
  return (
    <defs>
      <radialGradient id="pinglow">
        <stop offset="0%" stopColor={CORAL} stopOpacity="0.5" />
        <stop offset="45%" stopColor={CORAL} stopOpacity="0.16" />
        <stop offset="100%" stopColor={CORAL} stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}
