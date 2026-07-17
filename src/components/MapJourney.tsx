"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { MapData } from "@/lib/hackathonMap";
import { hackathons } from "@/data/content";
import { ArrowUpRight, Github } from "@/components/ui/icons";

const BLUE = "#2b5cff";
const CORAL = "#ff5a4d";
const INTRO = 0.08; // small lead-in before the first city lights

// Wide layout: the card floats over the map at a fixed width. The map is
// positioned so all pins stay visible between the card and the right edge,
// centered in that space when there's room, never sliding a pin behind the
// card when there isn't.
const CARD_WIDTH = 480;
const CARD_GAP = 40;
const EDGE_MARGIN = 40;

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

type Line = { x1: number; y1: number; x2: number; y2: number };

export default function MapJourney({ data }: { data: MapData }) {
  const reduce = useReducedMotion();
  const wide = useWide();
  const n = data.pins.length;
  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);
  const [line, setLine] = useState<Line | null>(null);
  const [mapLeft, setMapLeft] = useState<number | null>(null);

  // Scroll advances the active city index.
  useEffect(() => {
    if (reduce) return;

    const onScroll = () => {
      const outer = outerRef.current;
      if (!outer) return;
      const y = window.scrollY;
      const top = outer.getBoundingClientRect().top + y;
      const len = Math.max(1, outer.offsetHeight - window.innerHeight);
      const p = clamp((y - top) / len);
      const idx = p < INTRO ? -1 : Math.min(n - 1, Math.floor(((p - INTRO) / (1 - INTRO)) * n));
      setActive((a) => (a === idx ? a : idx));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduce, n]);

  // Wide layout: fit every pin between the card and the right edge,
  // centered in that space when there's room. Depends only on container
  // size (not the active city), so the map holds still while scrolling and
  // only repositions when the browser is resized.
  useLayoutEffect(() => {
    // mapLeft is only read when wide, so a stale value here is harmless.
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

  // Connector line: measured after the DOM reflects the active card and the
  // repositioned map, so it never points at a stale position.
  useLayoutEffect(() => {
    if (reduce) return;

    const updateLine = () => {
      const containerEl = stickyRef.current;
      const mapEl = mapWrapRef.current;
      const cardEl = cardRef.current;
      const pin = active >= 0 ? data.pins[active] : null;
      if (!containerEl || !mapEl || !cardEl || !pin) {
        setLine(null);
        return;
      }
      const containerRect = containerEl.getBoundingClientRect();
      const mapRect = mapEl.getBoundingClientRect();
      const cardRect = cardEl.getBoundingClientRect();
      const x2 = mapRect.left + (pin.x / data.vbW) * mapRect.width - containerRect.left;
      const y2 = mapRect.top + (pin.y / data.vbH) * mapRect.height - containerRect.top;
      const x1 = wide
        ? cardRect.right - containerRect.left
        : cardRect.left + cardRect.width / 2 - containerRect.left;
      const y1 = wide
        ? cardRect.top + cardRect.height / 2 - containerRect.top
        : cardRect.top - containerRect.top;
      setLine({ x1, y1, x2, y2 });
    };

    updateLine();
    window.addEventListener("resize", updateLine);
    return () => window.removeEventListener("resize", updateLine);
  }, [reduce, active, wide, data, mapLeft]);

  const current = active >= 0 ? hackathons[active] : null;

  // ── reduced motion: whole world + list (accessible fallback) ──
  if (reduce) {
    return (
      <div className="mx-auto max-w-[900px] px-6">
        <div className="relative mx-auto w-[86%]" style={{ aspectRatio: `${data.vbW} / ${data.vbH}` }}>
          <MapLayers data={data} activeIndex={n - 1} />
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
      <MapLayers data={data} activeIndex={active} />
    </div>
  );

  const lineOverlay = line ? (
    <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
      <line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke={CORAL}
        strokeWidth={1.5}
        strokeDasharray="3 4"
        opacity={0.55}
      />
      <circle cx={line.x2} cy={line.y2} r={3} fill={CORAL} opacity={0.9} />
    </svg>
  ) : null;

  const card = current ? (
    <motion.div
      key={current.city}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
        {current.city}, {current.country}
      </p>
      <h3 className="display mt-1 text-3xl text-ink sm:text-4xl">{current.event}</h3>
      <p className="mt-2 text-base font-medium" style={{ color: BLUE }}>
        {current.project}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">{current.blurb}</p>
      {current.award ? (
        <p
          className="mt-3 font-mono text-[11px] font-bold uppercase tracking-wider"
          style={{ color: CORAL }}
        >
          ★ {current.award}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
        {current.repo ? (
          <a
            href={current.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-ink transition-colors hover:text-accent"
          >
            <Github className="h-4 w-4" /> GitHub
          </a>
        ) : null}
        {current.link ? (
          <a
            href={current.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-accent"
          >
            View project <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
    </motion.div>
  ) : null;

  const progressDots = (
    <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
      {data.pins.map((p, i) => (
        <span
          key={p.city}
          className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
          style={{ background: i <= active ? CORAL : "rgba(22,21,15,0.18)" }}
        />
      ))}
    </div>
  );

  // ── wide: full-bleed map, fixed-width card floating on top of it ──
  if (wide) {
    return (
      <div ref={outerRef} style={{ height: `${n * 80 + 40}vh` }} className="relative">
        <div ref={stickyRef} className="sticky top-0 h-screen w-full overflow-hidden">
          {mapWrap}
          {lineOverlay}
          <div
            className="absolute inset-y-0 left-0 z-20 flex items-center px-10"
            style={{ width: CARD_WIDTH }}
          >
            <div
              ref={cardRef}
              className={`w-full rounded-2xl border border-border bg-background-soft/80 p-8 shadow-sm backdrop-blur-sm transition-opacity duration-300 ${
                current ? "opacity-100" : "opacity-0"
              }`}
            >
              {card}
            </div>
          </div>
          {progressDots}
        </div>
      </div>
    );
  }

  // ── narrow: sticky map near the top, bordered card below it ──
  return (
    <div ref={outerRef} style={{ height: `${n * 70 + 30}vh` }} className="relative">
      <div ref={stickyRef} className="sticky top-0 w-full">
        <div className="relative h-[42vh] w-full overflow-hidden">{mapWrap}</div>
        <div className="relative px-6 pb-8 pt-6">
          <div
            ref={cardRef}
            className={`rounded-2xl border border-border bg-background-soft/80 p-6 shadow-sm backdrop-blur-sm transition-opacity duration-300 ${
              current ? "opacity-100" : "opacity-0"
            }`}
          >
            {card}
          </div>
        </div>
        {lineOverlay}
      </div>
    </div>
  );
}

/* whole-world dots + marked city dots (colour transitions on scroll) */
function MapLayers({ data, activeIndex }: { data: MapData; activeIndex: number }) {
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
        <defs>
          <filter id="mapglow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="0.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {data.pins.map((p, i) => {
          const lit = i <= activeIndex;
          const isActive = i === activeIndex;
          const c = lit ? CORAL : BLUE;
          return (
            <g key={p.city} filter="url(#mapglow)">
              {isActive ? (
                <circle className="pulse-ring" cx={p.x} cy={p.y} r="1.9" fill={CORAL} opacity="0.5" />
              ) : null}
              <circle
                cx={p.x}
                cy={p.y}
                r={isActive ? 1.6 : 1.15}
                fill={c}
                style={{ transition: "fill 0.4s ease, r 0.4s ease" }}
              />
              <circle cx={p.x} cy={p.y} r="0.4" fill="#fff" opacity="0.9" />
            </g>
          );
        })}
      </svg>
    </>
  );
}
