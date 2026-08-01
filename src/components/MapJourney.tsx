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

// The card frame is a clipped window; cards ride through it on a conveyor. Its
// height (px) is also the travel distance for one city. The whole interaction
// is scroll-linked: every value below is a pure function of the continuous
// journey position `t`, so each scroll tick moves pixels and you can rest in
// any in-between state. There are no time-based transitions.
const CARD_H_WIDE = 360;
const CARD_H_NARROW = 320;

// Softens cards as they slide in/out the top and bottom of the clipped frame.
// Applied to the inner track (not the frame) so the frame border stays crisp.
const EDGE_FADE =
  "linear-gradient(to bottom, transparent 0%, #000 11%, #000 89%, transparent 100%)";

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
type Geo = { x1: number; y1: number; pins: { x: number; y: number }[] };

export default function MapJourney({ data }: { data: MapData }) {
  const reduce = useReducedMotion();
  const wide = useWide();
  const n = data.pins.length;
  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const cardFrameRef = useRef<HTMLDivElement>(null);
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

  // The card frame fades in as city 0 arrives, then stays put.
  const frameOpacity = useTransform(t, [-0.85, -0.1], [0, 1]);

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

      const visibleStart = CARD_WIDTH + CARD_GAP;
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

  // Static line geometry: the frame anchor and every pin's screen position.
  // Recomputed after layout (and when the map repositions), not on scroll.
  useLayoutEffect(() => {
    if (reduce) return;

    const updateGeo = () => {
      const containerEl = stickyRef.current;
      const mapEl = mapWrapRef.current;
      const frameEl = cardFrameRef.current;
      if (!containerEl || !mapEl || !frameEl) return;

      const containerRect = containerEl.getBoundingClientRect();
      const mapRect = mapEl.getBoundingClientRect();
      const frameRect = frameEl.getBoundingClientRect();

      const x1 = wide
        ? frameRect.right - containerRect.left
        : frameRect.left + frameRect.width / 2 - containerRect.left;
      const y1 = wide
        ? frameRect.top + frameRect.height / 2 - containerRect.top
        : frameRect.top - containerRect.top;

      const pins = data.pins.map((p) => ({
        x: mapRect.left + (p.x / data.vbW) * mapRect.width - containerRect.left,
        y: mapRect.top + (p.y / data.vbH) * mapRect.height - containerRect.top,
      }));

      setGeo({ x1, y1, pins });
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
        <Connector key={data.pins[i].city} index={i} t={t} x1={geo.x1} y1={geo.y1} x2={pin.x} y2={pin.y} />
      ))}
    </svg>
  ) : null;

  const cardH = wide ? CARD_H_WIDE : CARD_H_NARROW;
  const cardStack = (
    <div className="absolute inset-0" style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}>
      {hackathons.map((h, i) => (
        <CityCard key={h.city} h={h} index={i} t={t} focused={focus === i} h_px={cardH} pad={wide ? "p-8" : "p-6"} />
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
            className="absolute inset-y-0 left-0 z-20 flex items-center px-10"
            style={{ width: CARD_WIDTH }}
          >
            <motion.div
              ref={cardFrameRef}
              className="relative w-full overflow-hidden rounded-2xl border border-border bg-background-soft/80 shadow-sm backdrop-blur-sm"
              style={{ opacity: frameOpacity, height: CARD_H_WIDE }}
            >
              {cardStack}
            </motion.div>
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
        <div className="relative px-6 pb-8 pt-6">
          <motion.div
            ref={cardFrameRef}
            className="relative overflow-hidden rounded-2xl border border-border bg-background-soft/80 shadow-sm backdrop-blur-sm"
            style={{ opacity: frameOpacity, height: CARD_H_NARROW }}
          >
            {cardStack}
          </motion.div>
        </div>
        {connectors}
      </div>
    </div>
  );
}

/* One city's card riding the conveyor. Its vertical position is a pure function
   of the scroll position: at `t === index` it sits in the window; as the scroll
   advances it slides up and out the top while the next card rises from below.
   Cards are fully opaque and the frame clips them, so text never overlaps and
   you can freeze in any in-between state. */
function CityCard({
  h,
  index,
  t,
  focused,
  h_px,
  pad,
}: {
  h: (typeof hackathons)[number];
  index: number;
  t: MotionValue<number>;
  focused: boolean;
  h_px: number;
  pad: string;
}) {
  const y = useTransform(t, (v) => (index - v) * h_px);
  return (
    <motion.div
      className={`absolute inset-x-0 top-0 flex flex-col justify-center ${pad}`}
      style={{ height: h_px, y, pointerEvents: focused ? "auto" : "none" }}
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
        <p
          className="mt-3 font-mono text-[11px] font-bold uppercase tracking-wider"
          style={{ color: CORAL }}
        >
          ★ {h.award}
        </p>
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
          >
            View project <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
    </motion.div>
  );
}

/* Dotted line from the card frame to a city's pin. Its opacity tracks how close
   the scroll is to that city, so during a transition the outgoing and incoming
   lines are both drawn to their respective cities. */
function Connector({
  index,
  t,
  x1,
  y1,
  x2,
  y2,
}: {
  index: number;
  t: MotionValue<number>;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  const lineOpacity = useTransform(t, (v) => clamp(1 - Math.abs(v - index)) * 0.6);
  const dotOpacity = useTransform(t, (v) => clamp(1 - Math.abs(v - index)) * 0.9);
  return (
    <g>
      <motion.line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={CORAL}
        strokeWidth={1.5}
        strokeDasharray="3 4"
        opacity={lineOpacity}
      />
      <motion.circle cx={x2} cy={y2} r={3} fill={CORAL} opacity={dotOpacity} />
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
