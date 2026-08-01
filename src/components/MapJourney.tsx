"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import posthog from "posthog-js";
import type { MapData } from "@/lib/hackathonMap";
import { hackathons } from "@/data/content";
import { ArrowUpRight, Github } from "@/components/ui/icons";

const BLUE = "#2b5cff";
const CORAL = "#ff5a4d";

// Wide layout: the card floats over the map at a fixed width. The map is
// positioned so all pins stay visible between the card and the right edge,
// centered in that space when there's room, never sliding a pin behind the
// card when there isn't.
const CARD_WIDTH = 480;
const CARD_GAP = 40;
const EDGE_MARGIN = 40;

// Each location is its own separate card; the cards ride vertically like a
// carousel. `CARD_H` is a card's height and `CARD_SPACING` is the distance
// between consecutive card centres as the scroll advances one city — a little
// taller than the card so neighbours peek and two cards share the screen mid-
// transition. The whole interaction is scroll-linked: every value below is a
// pure function of the continuous journey position `t`, so each scroll tick
// moves pixels and you can rest in any in-between state. No time-based anims.
const CARD_H = 300;
const CARD_SPACING = 348;
// Horizontal gutter between a wide-layout card and its column edges (px).
const CARD_INSET = 40;
// Height of the narrow-layout carousel window (clips the peeking neighbours).
const NARROW_VIEWPORT = 420;

// Softens cards as they enter/leave the top and bottom of the carousel window.
const EDGE_FADE =
  "linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return wide;
}

// Screen geometry (in sticky-container coordinates) for drawing connector
// lines. The map holds still and the card frame is fixed, so this only needs
// recomputing on resize / layout changes — never per scroll frame.
// `baseY` is the resting screen-Y of a card's anchor (its centre); each
// connector offsets from it by the card's live carousel position.
type Geo = { x1: number; baseY: number; pins: { x: number; y: number }[] };

export default function MapJourney({ data }: { data: MapData }) {
  const reduce = useReducedMotion();
  const wide = useWide();
  const n = data.pins.length;
  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const cardColRef = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [mapLeft, setMapLeft] = useState<number | null>(null);

  // Continuous journey position. `t === i` means "parked on city i"; fractional
  // values are the in-between states. A small negative start lets city 0 slide
  // in as you enter the section.
  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start start", "end end"],
  });
  const t = useTransform(scrollYProgress, [0, 1], [-0.85, Math.max(0, n - 1)]);

  // Rounded index, updated only when it flips — for the few things that need
  // real React state (pointer-events / aria on the focused card).
  const [focus, setFocus] = useState(0);
  useMotionValueEvent(t, "change", (v) => {
    const i = clamp(Math.round(v), 0, n - 1);
    setFocus((f) => (f === i ? f : i));
  });

  // Wide layout: fit every pin between the card and the right edge, centered in
  // that space when there's room. Depends only on container size (not scroll),
  // so the map holds still and only repositions when the browser is resized.
  useLayoutEffect(() => {
    if (reduce || !wide) return;

    const updatePosition = () => {
      const container = stickyRef.current;
      if (!container) return;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      const mapWidth = containerHeight * (data.vbW / data.vbH);

      const xs = data.pins.map((p) => p.x / data.vbW);
      const minFrac = Math.min(...xs);
      const maxFrac = Math.max(...xs);
      const clusterCenterFrac = (minFrac + maxFrac) / 2;

      // The column's left gutter is CSS-driven and responsive, so measure it
      // rather than assuming the column starts at x = 0.
      const colEl = cardColRef.current;
      const colLeft = colEl
        ? colEl.getBoundingClientRect().left - container.getBoundingClientRect().left
        : 0;
      const visibleStart = colLeft + CARD_WIDTH + CARD_GAP;
      const visibleEnd = containerWidth - EDGE_MARGIN;
      const desiredCenterX = (visibleStart + visibleEnd) / 2;

      const minLeft = visibleStart - minFrac * mapWidth;
      const maxLeft = visibleEnd - maxFrac * mapWidth;
      const centered = desiredCenterX - clusterCenterFrac * mapWidth;

      // Center when the whole cluster fits; otherwise never let it slide
      // behind the card, even if that pushes pins past the right edge.
      setMapLeft(minLeft <= maxLeft ? clamp(centered, minLeft, maxLeft) : minLeft);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [reduce, wide, data]);

  // Static line geometry: the card anchor (edge + resting centre) and every
  // pin's screen position. Recomputed after layout / map reposition, not on
  // scroll — each connector then offsets baseY by its card's live position.
  useLayoutEffect(() => {
    if (reduce) return;

    const updateGeo = () => {
      const containerEl = stickyRef.current;
      const mapEl = mapWrapRef.current;
      const colEl = cardColRef.current;
      if (!containerEl || !mapEl || !colEl) return;

      const containerRect = containerEl.getBoundingClientRect();
      const mapRect = mapEl.getBoundingClientRect();
      const colRect = colEl.getBoundingClientRect();

      // Cards are inset horizontally from the column by CARD_INSET.
      const x1 = wide
        ? colRect.right - CARD_INSET - containerRect.left
        : colRect.left + colRect.width / 2 - containerRect.left;
      const baseY = colRect.top + colRect.height / 2 - containerRect.top;

      const pins = data.pins.map((p) => ({
        x: mapRect.left + (p.x / data.vbW) * mapRect.width - containerRect.left,
        y: mapRect.top + (p.y / data.vbH) * mapRect.height - containerRect.top,
      }));

      setGeo({ x1, baseY, pins });
    };

    updateGeo();
    window.addEventListener("resize", updateGeo);
    return () => window.removeEventListener("resize", updateGeo);
  }, [reduce, wide, data, mapLeft]);

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
                  <span className="rounded-full border border-accent-2/40 bg-accent-2/10 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-accent-2">
                    ★ {h.award}
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
                      posthog.capture("hackathon_repo_clicked", {
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

  const mapWrap = (
    <div
      ref={mapWrapRef}
      className="absolute inset-y-0"
      style={{ aspectRatio: `${data.vbW} / ${data.vbH}`, left: wide ? mapLeft ?? 0 : 0 }}
    >
      <MapLayersLive data={data} t={t} />
    </div>
  );

  const connectors = geo ? (
    <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
      {geo.pins.map((pin, i) => (
        <Connector key={data.pins[i].city} index={i} t={t} x1={geo.x1} baseY={geo.baseY} x2={pin.x} y2={pin.y} />
      ))}
    </svg>
  ) : null;

  const cardStack = (
    <div className="absolute inset-0" style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}>
      {hackathons.map((h, i) => (
        <CityCard
          key={h.city}
          h={h}
          index={i}
          t={t}
          focused={focus === i}
          className={wide ? "left-10 right-10 p-8" : "left-6 right-6 p-6"}
        />
      ))}
    </div>
  );

  const progressDots = (
    <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
      {data.pins.map((p, i) => (
        <Dot key={p.city} index={i} t={t} />
      ))}
    </div>
  );

  // ── wide: full-bleed map, fixed-width card floating on top of it ──
  if (wide) {
    return (
      <div ref={outerRef} style={{ height: `${n * 60 + 30}vh` }} className="relative">
        <div ref={stickyRef} className="sticky top-0 h-screen w-full overflow-hidden">
          {mapWrap}
          {connectors}
          <div
            ref={cardColRef}
            className="absolute inset-y-0 left-10 z-20 overflow-hidden lg:left-16 xl:left-24 2xl:left-32"
            style={{ width: CARD_WIDTH }}
          >
            {cardStack}
          </div>
          {progressDots}
        </div>
      </div>
    );
  }

  // ── narrow: sticky map near the top, bordered card below it ──
  return (
    <div ref={outerRef} style={{ height: `${n * 55 + 25}vh` }} className="relative">
      <div ref={stickyRef} className="sticky top-0 w-full">
        <div className="relative h-[42vh] w-full overflow-hidden">{mapWrap}</div>
        <div
          ref={cardColRef}
          className="relative w-full overflow-hidden"
          style={{ height: NARROW_VIEWPORT }}
        >
          {cardStack}
        </div>
        {connectors}
      </div>
    </div>
  );
}

/* One location's card. Each city is its own separate bordered card; the cards
   ride vertically like a carousel. A card's position is a pure function of the
   scroll position: at `t === index` it sits centred; as the scroll advances it
   slides up while the next card rises into place, and around the hand-off two
   distinct cards share the screen. Fully scroll-linked and freezable. */
function CityCard({
  h,
  index,
  t,
  focused,
  className,
}: {
  h: (typeof hackathons)[number];
  index: number;
  t: MotionValue<number>;
  focused: boolean;
  className: string;
}) {
  const y = useTransform(t, (v) => (index - v) * CARD_SPACING);
  // How close the scroll is to this card — 1 when parked on it, 0 a full city
  // away. Awarded cities use it to bloom their badge and card glow.
  const near = useTransform(t, (v) => clamp(1 - Math.abs(v - index)));
  const badgeOpacity = useTransform(near, [0, 0.55, 1], [0, 0, 1]);
  const badgeScale = useTransform(near, [0.55, 1], [0.88, 1]);
  const badgeY = useTransform(near, [0.55, 1], [8, 0]);
  const glow = useTransform(
    near,
    [0.4, 1],
    // Both ends must have the same shadow-layer shape or the interpolation
    // snaps instead of ramping.
    [
      "0 0 0 0px rgba(255,90,77,0), 0 12px 40px -12px rgba(255,90,77,0)",
      "0 0 0 1px rgba(255,90,77,0.45), 0 12px 40px -12px rgba(255,90,77,0.35)",
    ],
  );
  return (
    <motion.div
      className={`absolute flex flex-col justify-center rounded-2xl border border-border bg-background-soft/80 shadow-sm backdrop-blur-sm ${className}`}
      style={{
        top: "50%",
        marginTop: -CARD_H / 2,
        height: CARD_H,
        y,
        pointerEvents: focused ? "auto" : "none",
        ...(h.award ? { boxShadow: glow } : null),
      }}
      aria-hidden={focused ? undefined : true}
    >
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
        {h.city}, {h.country}
      </p>
      <h3 className="display mt-1 text-3xl text-ink sm:text-4xl">{h.event}</h3>
      <p className="mt-2 text-base font-medium" style={{ color: BLUE }}>
        {h.project}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">{h.blurb}</p>
      {h.award ? (
        <motion.span
          className="mt-3 self-start rounded-full border border-accent-2/40 bg-accent-2/10 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-accent-2"
          style={{ opacity: badgeOpacity, scale: badgeScale, y: badgeY }}
        >
          ★ {h.award}
        </motion.span>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
        {h.repo ? (
          <a
            href={h.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-ink transition-colors hover:text-accent"
            onClick={() =>
              posthog.capture("hackathon_repo_clicked", {
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
              posthog.capture("hackathon_link_clicked", {
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
    </motion.div>
  );
}

/* Dotted line from a location's card to its pin. It follows the card up the
   carousel (y1 tracks the card's live position) and fades by how close the
   scroll is to that city, so during a hand-off both cards' lines are drawn to
   their respective cities. */
function Connector({
  index,
  t,
  x1,
  baseY,
  x2,
  y2,
}: {
  index: number;
  t: MotionValue<number>;
  x1: number;
  baseY: number;
  x2: number;
  y2: number;
}) {
  const y1 = useTransform(t, (v) => baseY + (index - v) * CARD_SPACING);
  const lineOpacity = useTransform(t, (v) => clamp(1 - Math.abs(v - index)));
  const dotOpacity = useTransform(t, (v) => clamp(1 - Math.abs(v - index)));
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
        opacity={lineOpacity}
      />
      <motion.circle cx={x2} cy={y2} r={4} fill={CORAL} opacity={dotOpacity} />
    </g>
  );
}

/* Progress dot that fills coral as the scroll passes its city. */
function Dot({ index, t }: { index: number; t: MotionValue<number> }) {
  const opacity = useTransform(t, (v) => clamp(v - index + 0.5));
  return (
    <span className="relative h-1.5 w-1.5">
      <span className="absolute inset-0 rounded-full" style={{ background: "rgba(22,21,15,0.18)" }} />
      <motion.span className="absolute inset-0 rounded-full" style={{ background: CORAL, opacity }} />
    </span>
  );
}

/* Live map: pins light up progressively as the scroll passes them, and the
   nearest city gets the pulse — all driven by the continuous scroll position. */
function MapLayersLive({ data, t }: { data: MapData; t: MotionValue<number> }) {
  return (
    <>
      <div
        className="absolute inset-0 [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: data.dotsSvg }}
      />
      <svg
        viewBox={`0 0 ${data.vbW} ${data.vbH}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
      >
        <MapGlowDef />
        {data.pins.map((p, i) => (
          <Pin key={p.city} p={p} index={i} t={t} />
        ))}
      </svg>
    </>
  );
}

function Pin({ p, index, t }: { p: MapData["pins"][number]; index: number; t: MotionValue<number> }) {
  const coralOpacity = useTransform(t, (v) => clamp(v - index + 0.5));
  const r = useTransform(t, (v) => 1.15 + 0.45 * clamp(1 - Math.abs(v - index)));
  // The pulse keyframe animates its own opacity, so gate visibility with the
  // wrapping group — only the pin nearest the scroll position pulses.
  const pulseGate = useTransform(t, (v) => clamp(1 - Math.abs(v - index)));
  return (
    <g filter="url(#mapglow)">
      <motion.g opacity={pulseGate}>
        <circle cx={p.x} cy={p.y} r={1.9} fill={CORAL} className="pulse-ring" />
      </motion.g>
      <circle cx={p.x} cy={p.y} r={1.15} fill={BLUE} />
      <motion.circle cx={p.x} cy={p.y} r={r} fill={CORAL} opacity={coralOpacity} />
      <circle cx={p.x} cy={p.y} r={0.4} fill="#fff" opacity={0.9} />
    </g>
  );
}

/* Static map for the reduced-motion fallback. */
function MapLayersStatic({ data, activeIndex }: { data: MapData; activeIndex: number }) {
  return (
    <>
      <div
        className="absolute inset-0 [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: data.dotsSvg }}
      />
      <svg
        viewBox={`0 0 ${data.vbW} ${data.vbH}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
      >
        <MapGlowDef />
        {data.pins.map((p, i) => {
          const lit = i <= activeIndex;
          return (
            <g key={p.city} filter="url(#mapglow)">
              <circle cx={p.x} cy={p.y} r={1.15} fill={lit ? CORAL : BLUE} />
              <circle cx={p.x} cy={p.y} r={0.4} fill="#fff" opacity={0.9} />
            </g>
          );
        })}
      </svg>
    </>
  );
}

function MapGlowDef() {
  return (
    <defs>
      <filter id="mapglow" x="-200%" y="-200%" width="500%" height="500%">
        <feGaussianBlur stdDeviation="0.6" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}
