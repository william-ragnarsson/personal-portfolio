"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { MapData } from "@/lib/hackathonMap";
import { hackathons } from "@/data/content";

const BLUE = "#2b5cff";
const CORAL = "#ff5a4d";
const INTRO = 0.08; // small lead-in before the first city lights

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function useInteractive() {
  const reduce = useReducedMotion();
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return wide && !reduce;
}

export default function MapJourney({ data }: { data: MapData }) {
  const interactive = useInteractive();
  const n = data.pins.length;
  const outerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);

  // Scroll only advances the active city (box + colour). No zoom, no pan.
  useEffect(() => {
    if (!interactive) return;
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
  }, [interactive, n]);

  const current = active >= 0 ? hackathons[active] : null;

  // ── mobile / reduced-motion: whole world + list ──
  if (!interactive) {
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
              {h.award ? (
                <span className="shrink-0 rounded-full border border-accent-2/40 bg-accent-2/10 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-accent-2">
                  ★ {h.award}
                </span>
              ) : (
                <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted">
                  flew out
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // ── desktop: whole world, floating in whitespace; scroll = box + colour ──
  return (
    <div ref={outerRef} style={{ height: `${n * 70 + 40}vh` }} className="relative">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* full world, contained, lots of whitespace around it */}
        <div
          className="relative w-[74vw] max-w-[1180px]"
          style={{ aspectRatio: `${data.vbW} / ${data.vbH}` }}
        >
          <MapLayers data={data} activeIndex={active} />
        </div>

        {/* project box */}
        <div
          className={`absolute bottom-[13%] left-[8%] max-w-xs transition-opacity duration-300 ${
            current ? "opacity-100" : "opacity-0"
          }`}
        >
          {current ? (
            <div key={current.city} className="fade-swap">
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                {current.country}
              </p>
              <h3 className="display mt-1 text-4xl text-ink sm:text-5xl">
                {current.city}
              </h3>
              <p className="mt-2 text-base font-medium" style={{ color: BLUE }}>
                {current.project}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {current.blurb}
              </p>
              {current.award ? (
                <p
                  className="mt-3 font-mono text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: CORAL }}
                >
                  ★ {current.award}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* progress dots */}
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
          {data.pins.map((p, i) => (
            <span
              key={p.city}
              className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
              style={{ background: i <= active ? CORAL : "rgba(22,21,15,0.18)" }}
            />
          ))}
        </div>
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
