"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useResizeEffect } from "@/hooks/useResizeEffect";
import { requestFrame, subscribeFrame } from "@/lib/frame";
import { cameraFor, project, sstep, v3, visible, type Frame } from "@/lib/globe/math";
import { drawPin, INK, strokeRoute, traceRoute } from "@/lib/globe/paint";
import { drawGlobe, onLandReady } from "@/lib/globe/renderer";
import { BELGIUM, NEW_YORK, NYC_TRAVEL, nycAt, nycPinStyle } from "@/lib/globe/timeline";
import { clearTo, columnEdges, measureStage, placeGlobe, type StageBox } from "./stage";

type Geo = StageBox & { frame: Frame; fades: HTMLElement[] };

const NY = v3(NEW_YORK[0], NEW_YORK[1]);

/**
 * The move to New York: a flight from Belgium, where the hackathons ended.
 * Then the camera dives into the land just inland of the city, and yellow
 * spreads out from New York until it fills the screen: the contact page below.
 *
 *   [data-stage]  the sticky stage     [data-canvas]  its canvas
 *   [data-fade]   text that fades out as the camera dives
 */
export default function NycStage({ className, children }: { className?: string; children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const geo = useRef<Geo | null>(null);

  useResizeEffect(
    () => {
      const track = trackRef.current;
      if (!track) return;
      const prev = geo.current;
      const box = measureStage(track);
      if (!box) {
        prev?.fades.forEach((el) => (el.style.opacity = ""));
        geo.current = null;
        return;
      }
      geo.current = {
        ...box,
        frame: placeGlobe(box, columnEdges(track.querySelector("[data-col]")), {
          fx: 0.72,
          maxD: 2.4,
          margin: 16,
          floor: box.H - 40 * box.u,
        }),
        fades: [...track.querySelectorAll<HTMLElement>("[data-fade]")],
      };
      requestFrame();
    },
    () => [trackRef.current, trackRef.current?.querySelector("[data-stage]"), document.body],
  );

  useEffect(() => {
    const paint = (y: number, vh: number) => {
      const g = geo.current;
      if (!g) return;
      const p = (y - g.trackTop) / vh;
      if (p < -1.02 || p > NYC_TRAVEL + 1.02) return;
      const f = nycAt(p);

      const textAlpha = (1 - sstep(0, 0.3, f.dive)).toFixed(3);
      for (const el of g.fades) el.style.opacity = textAlpha;

      clearTo(g, INK.cream);
      const cam = cameraFor(f.view, g.frame);
      // As the yellow spreads, the land's light and shadow even out to the
      // same flat yellow, so its edge only shows where it covers the sea.
      if (drawGlobe(g.ctx, cam, g.dpr, f.flat)) {
        const { ctx, u } = g;
        if (f.g > 0 && traceRoute(ctx, cam, BELGIUM, NEW_YORK, 0.07, f.g)) strokeRoute(ctx, u);
        drawPin(ctx, cam, BELGIUM, 0, u);
        drawPin(ctx, cam, NEW_YORK, nycPinStyle(f), u);
      }
      // The last of the dive: yellow spreads out from New York until it's
      // the whole screen, the way the blue page shrank into the globe at the
      // hackathons. A growing edge, not a fade: blue and yellow crossfaded
      // pass through grey.
      if (f.flood > 0) {
        const at = (visible(cam, NY) && project(cam, NY)) || [g.W / 2, g.H / 2];
        const cover = Math.max(
          Math.hypot(at[0], at[1]),
          Math.hypot(g.W - at[0], at[1]),
          Math.hypot(at[0], g.H - at[1]),
          Math.hypot(g.W - at[0], g.H - at[1]),
        );
        g.ctx.fillStyle = INK.yellow;
        g.ctx.beginPath();
        g.ctx.arc(at[0], at[1], cover * f.flood + 1, 0, Math.PI * 2);
        g.ctx.fill();
      }
    };
    const unsubscribe = subscribeFrame(paint);
    const offLand = onLandReady(requestFrame);
    return () => {
      unsubscribe();
      offLand();
    };
  }, []);

  return (
    <div ref={trackRef} className={className} style={{ "--travel": NYC_TRAVEL } as CSSProperties}>
      {children}
    </div>
  );
}
