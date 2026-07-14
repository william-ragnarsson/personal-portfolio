"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { MapData } from "@/lib/hackathonMap";
import { hackathons } from "@/data/content";

const ZOOM = 2.15;
const BLUE = "#2b5cff";
const CORAL = "#ff5a4d";
const HOLD = 0.06; // scroll fraction each city "holds" before panning

function useJourneyMode() {
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

function lerp(p: number, xs: number[], ys: number[]) {
  if (p <= xs[0]) return ys[0];
  if (p >= xs[xs.length - 1]) return ys[ys.length - 1];
  for (let i = 0; i < xs.length - 1; i++) {
    if (p >= xs[i] && p <= xs[i + 1]) {
      const t = (p - xs[i]) / (xs[i + 1] - xs[i] || 1);
      return ys[i] + (ys[i + 1] - ys[i]) * t;
    }
  }
  return ys[ys.length - 1];
}

export default function MapJourney({ data }: { data: MapData }) {
  const journey = useJourneyMode();
  const n = data.pins.length;
  const outerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // per-city pan target (translate %, origin top-left)
  const targets = data.pins.map((p) => ({
    tx: (0.5 - ZOOM * (p.x / data.vbW)) * 100,
    ty: (0.5 - ZOOM * (p.y / data.vbH)) * 100,
  }));

  // Drive the pan straight off the window scroll event (runs synchronously,
  // no rAF — reliable even where rAF is throttled).
  useEffect(() => {
    if (!journey) return;
    const bp: number[] = [];
    const txs: number[] = [];
    const tys: number[] = [];
    targets.forEach((t, i) => {
      const c = n === 1 ? 0.5 : i / (n - 1);
      bp.push(Math.max(0, c - HOLD), Math.min(1, c + HOLD));
      txs.push(t.tx, t.tx);
      tys.push(t.ty, t.ty);
    });

    const update = () => {
      const el = outerRef.current;
      const world = worldRef.current;
      if (!el || !world) return;
      const y = window.scrollY;
      const top = el.getBoundingClientRect().top + y;
      const len = Math.max(1, el.offsetHeight - window.innerHeight);
      const prog = Math.min(1, Math.max(0, (y - top) / len));
      world.style.transform = `translate(${lerp(prog, bp, txs)}%, ${lerp(
        prog,
        bp,
        tys
      )}%) scale(${ZOOM})`;
      const idx = Math.min(n - 1, Math.max(0, Math.round(prog * (n - 1))));
      setActive((a) => (a === idx ? a : idx));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey, n]);

  const current = hackathons[active];
  const initialTransform = `translate(${targets[0].tx}%, ${targets[0].ty}%) scale(${ZOOM})`;

  const fallback = (
    <div className="mx-auto max-w-[1100px] px-6">
      <div
        className="relative w-full overflow-hidden border border-white/10 bg-map-bg"
        style={{ aspectRatio: `${data.vbW} / ${data.vbH}` }}
      >
        <MapLayers data={data} activeIndex={-1} />
        {data.pins.map((p) => (
          <PinLabel key={p.city} data={data} pin={p} />
        ))}
      </div>
      <ul className="mt-6 divide-y divide-border border-y border-border">
        {hackathons.map((h) => (
          <li
            key={h.city}
            className="flex items-center justify-between gap-4 py-4"
          >
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

  const pan = (
    <div className="sticky top-0 flex h-screen items-center overflow-hidden bg-map-bg">
      <div className="mx-auto w-full max-w-[1100px] px-6">
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: `${data.vbW} / ${data.vbH}` }}
        >
          <div
            ref={worldRef}
            className="absolute inset-0 will-change-transform"
            style={{ transform: initialTransform, transformOrigin: "0% 0%" }}
          >
            <MapLayers data={data} activeIndex={active} />
          </div>

          {/* info card */}
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-sm">
            <motion.div
              key={current.city}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="border border-white/10 bg-black/40 p-5 backdrop-blur-md"
            >
              <p className="font-mono text-[11px] uppercase tracking-widest text-white/50">
                {current.country}
              </p>
              <h3 className="display mt-1 text-3xl text-white">
                {current.city}
              </h3>
              <p className="mt-1 text-sm font-medium" style={{ color: BLUE }}>
                {current.project}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
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
            </motion.div>
          </div>

          {/* stop indicator */}
          <div className="absolute right-4 top-4 flex gap-1.5 sm:right-6 sm:top-6">
            {data.pins.map((p, i) => (
              <span
                key={p.city}
                className="h-1.5 w-1.5 rounded-full transition-colors"
                style={{
                  background: i === active ? CORAL : "rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={outerRef}
      style={journey ? { height: `${n * 95}vh` } : undefined}
      className="relative"
    >
      {journey ? pan : fallback}
    </div>
  );
}

/* dots + arcs + pins, all in viewBox space so they pan together */
function MapLayers({
  data,
  activeIndex,
}: {
  data: MapData;
  activeIndex: number;
}) {
  return (
    <>
      <div
        className="absolute inset-0 [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: data.dotsSvg }}
      />
      <svg
        viewBox={`0 0 ${data.vbW} ${data.vbH}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <filter id="mapglow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="0.9" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g
          fill="none"
          stroke={BLUE}
          strokeWidth="0.35"
          strokeDasharray="0.5 1.4"
          strokeLinecap="round"
          opacity="0.85"
        >
          {data.pins.slice(1).map((p, i) => {
            const a = data.pins[i];
            const mx = (a.x + p.x) / 2;
            const my = (a.y + p.y) / 2 - Math.abs(p.x - a.x) * 0.16 - 1.5;
            return (
              <path
                key={p.city}
                d={`M ${a.x} ${a.y} Q ${mx} ${my} ${p.x} ${p.y}`}
              />
            );
          })}
        </g>

        {data.pins.map((p, i) => {
          const on = i === activeIndex;
          const c = on ? CORAL : BLUE;
          return (
            <g key={p.city} filter="url(#mapglow)">
              <circle
                className="pulse-ring"
                cx={p.x}
                cy={p.y}
                r={on ? 1.8 : 1.3}
                fill={c}
                opacity="0.5"
              />
              <circle cx={p.x} cy={p.y} r={on ? 1.7 : 1.4} fill={c} />
              <circle cx={p.x} cy={p.y} r="0.5" fill="#eaf0ff" />
            </g>
          );
        })}
      </svg>
    </>
  );
}

/* HTML label for the static (fallback) map */
function PinLabel({
  data,
  pin,
}: {
  data: MapData;
  pin: { city: string; x: number; y: number };
}) {
  return (
    <div
      className="absolute -translate-y-1/2 translate-x-3 whitespace-nowrap"
      style={{
        left: `${(pin.x / data.vbW) * 100}%`,
        top: `${(pin.y / data.vbH) * 100}%`,
      }}
    >
      <span className="text-xs font-bold text-white sm:text-sm">{pin.city}</span>
    </div>
  );
}
