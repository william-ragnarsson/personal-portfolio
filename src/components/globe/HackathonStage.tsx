"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useResizeEffect } from "@/hooks/useResizeEffect";
import { requestFrame, subscribeFrame } from "@/lib/frame";
import { addToneProbe } from "@/lib/cursorTone";
import { cameraFor, discRadius, type Frame } from "@/lib/globe/math";
import { drawPin, INK, strokeRoute, traceRoute } from "@/lib/globe/paint";
import { drawGlobe, onLandReady, preloadGlobe } from "@/lib/globe/renderer";
import { HACK_OVERVIEW_D, HACK_TRAVEL, hackAt, hackIris, hackPins, hackStopAt, STOPS } from "@/lib/globe/timeline";
import { prefersReducedMotion } from "@/lib/mode";
import {
  clearTo,
  columnEdges,
  maskOutside,
  measureStage,
  placeGlobe,
  stageTopAt,
  type Masked,
  type StageBox,
} from "./stage";

type Geo = StageBox & {
  frame: Frame;
  coverR: number;
  globeR: number;
  folds: Masked[];
  cards: HTMLElement[];
  ticks: HTMLElement[];
};

/**
 * The hackathon flight. The server renders the stage's markup as `children`;
 * this finds its parts by data attribute and drives them from the scroll
 * position:
 *
 *   [data-stage]   the sticky, full-viewport stage
 *   [data-canvas]  its canvas: page colour, globe, routes, pins, and the blue
 *                  page folding into the globe on the way in
 *   [data-fold]    text hidden under that fold until its edge passes
 *   [data-card]    one card per stop, stacked; only the current one shows
 *   [data-tick]    the progress bar, one segment per stop
 *   [data-skip]    jumps past the section
 *
 * Painting the page colour on the canvas, instead of behind it, is what
 * avoids a hairline seam where two antialiased edges would otherwise meet.
 */
export default function HackathonStage({ className, children }: { className?: string; children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const geo = useRef<Geo | null>(null);
  const shown = useRef({ card: -2, masked: false, stageTop: 0, iris: null as null | { r: number; on: boolean } });

  useResizeEffect(
    () => {
      const track = trackRef.current;
      if (!track) return;
      const prev = geo.current;
      const box = measureStage(track);
      if (!box) {
        if (prev) maskOutside(prev.folds, 0, 0, 0);
        geo.current = null;
        return;
      }
      const prog = track.querySelector<HTMLElement>("[data-prog]");
      const frame = placeGlobe(box, columnEdges(track.querySelector("[data-col]")), {
        fx: 0.7,
        maxD: 2.3,
        margin: 32,
        floor: (prog ? prog.offsetTop : box.H) - 32 * box.u,
      });
      const unit = (box.H / 2) * frame.zoom;
      geo.current = {
        ...box,
        frame,
        // From the globe's centre to the farthest corner: the fold starts
        // with the whole stage blue.
        coverR:
          Math.max(
            Math.hypot(frame.cx, frame.cy),
            Math.hypot(box.W - frame.cx, frame.cy),
            Math.hypot(frame.cx, box.H - frame.cy),
            Math.hypot(box.W - frame.cx, box.H - frame.cy),
          ) + 4,
        globeR: discRadius(HACK_OVERVIEW_D, unit),
        folds: [...track.querySelectorAll<HTMLElement>("[data-fold]")].map((el) => ({
          el,
          x: el.offsetLeft,
          y: el.offsetTop,
        })),
        cards: [...track.querySelectorAll<HTMLElement>("[data-card]")],
        ticks: [...track.querySelectorAll<HTMLElement>("[data-tick]")],
      };
      shown.current.card = -2;
      requestFrame();
    },
    () => [trackRef.current, trackRef.current?.querySelector("[data-stage]"), document.body],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const s = shown.current;

    const paint = (y: number, vh: number) => {
      const g = geo.current;
      if (!g) return;
      const p = (y - g.trackTop) / vh;
      if (p < -1.02 || p > HACK_TRAVEL + 1.02) {
        if (s.masked) {
          maskOutside(g.folds, 0, 0, 0);
          s.masked = false;
        }
        s.iris = null;
        return;
      }
      const f = hackAt(p);
      const iris = hackIris(p, g.coverR, g.globeR);
      const irisOn = iris.alpha > 0.02;
      s.stageTop = stageTopAt(p, HACK_TRAVEL, vh);
      s.iris = { r: iris.r, on: irisOn };

      if (irisOn || s.masked) {
        maskOutside(g.folds, g.frame.cx, g.frame.cy, irisOn ? iris.r : 0);
        s.masked = irisOn;
      }

      clearTo(g, INK.cream);
      const cam = cameraFor(f.view, g.frame);
      if (drawGlobe(g.ctx, cam, g.dpr)) {
        const { ctx, u } = g;
        for (let j = 0; j < STOPS.length - 1; j++) {
          const upto = f.done > j ? 1 : f.done === j ? f.leg : 0;
          if (upto > 0 && traceRoute(ctx, cam, STOPS[j], STOPS[j + 1], 0.012, upto)) strokeRoute(ctx, u);
        }
        for (const [ll, style] of hackPins(f.current)) drawPin(ctx, cam, ll, style, u);
      }
      if (iris.alpha > 0) {
        const { ctx } = g;
        ctx.globalAlpha = iris.alpha;
        ctx.fillStyle = INK.blue;
        ctx.beginPath();
        ctx.arc(g.frame.cx, g.frame.cy, iris.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (f.card !== s.card) {
        g.cards.forEach((el, i) => {
          el.toggleAttribute("data-current", i === f.card);
          if (i !== f.card) el.style.opacity = "0";
        });
        s.card = f.card;
      }
      const card = g.cards[f.card];
      if (card) {
        card.style.opacity = f.cardAlpha.toFixed(3);
        card.style.transform = `translate3d(0, ${(f.cardY * g.u).toFixed(1)}px, 0)`;
      }
      g.ticks.forEach((el, j) => (el.style.transform = `scaleX(${f.fill[j].toFixed(3)})`));
    };

    const unsubscribe = subscribeFrame(paint);
    const offLand = onLandReady(requestFrame);

    // While the blue page is folding into the globe, the cursor over the blue
    // circle should be the colour it is on blue.
    const offProbe = addToneProbe((x, y) => {
      const g = geo.current;
      if (!g || !s.iris?.on) return null;
      const dx = x - g.frame.cx;
      const dy = y - s.stageTop - g.frame.cy;
      return dx * dx + dy * dy < s.iris.r * s.iris.r ? "blue" : null;
    });

    // Fetch the land while the visitor is still up on the opening screens.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    const idleId = idle(() => {
      if (geo.current) preloadGlobe();
    });

    const skip = (e: Event) => {
      if (!(e.target as Element).closest("[data-skip]")) return;
      const end = track.getBoundingClientRect().bottom + window.scrollY;
      window.scrollTo({ top: end, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    };
    // Tabbing to a card's link brings the flight to that stop.
    const focus = (e: FocusEvent) => {
      const g = geo.current;
      const card = (e.target as Element).closest<HTMLElement>("[data-card]");
      if (!g || !card) return;
      const i = g.cards.indexOf(card);
      if (i >= 0) window.scrollTo({ top: g.trackTop + hackStopAt(i) * window.innerHeight, behavior: "auto" });
    };
    track.addEventListener("click", skip);
    track.addEventListener("focusin", focus);

    return () => {
      unsubscribe();
      offLand();
      offProbe();
      cancelIdle(idleId);
      track.removeEventListener("click", skip);
      track.removeEventListener("focusin", focus);
    };
  }, []);

  return (
    <div ref={trackRef} className={className} style={{ "--travel": HACK_TRAVEL } as CSSProperties}>
      {children}
    </div>
  );
}
