"use client";

import { useEffect, useRef } from "react";
import { useResizeEffect } from "@/hooks/useResizeEffect";
import { cameraFor, clamp, discRadius } from "@/lib/globe/math";
import { canvasDpr, drawPin, sizeCanvas, strokeRoute, traceRoute } from "@/lib/globe/paint";
import { drawGlobe, globeSupported, onLandReady } from "@/lib/globe/renderer";
import { BELGIUM, HACK_STILL_VIEW, hackPins, NEW_YORK, NYC_STILL_VIEW, STOPS } from "@/lib/globe/timeline";
import { demoteGlobe } from "@/lib/mode";

/**
 * The globe as one picture, for the still version of the page: every route
 * drawn, nothing moving. Drawn once it's near the viewport, and again on
 * resize. Hidden (and never drawn) while the scroll-driven stages are shown.
 */
export default function StillGlobe({
  route,
  label,
  className,
}: {
  route: "hackathons" | "nyc";
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const near = useRef(false);

  const draw = () => {
    const canvas = ref.current;
    if (!canvas || !near.current) return;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    if (!W || !H) return;
    if (!globeSupported()) {
      demoteGlobe();
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = canvasDpr();
    sizeCanvas(canvas, W, H, dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const view = route === "hackathons" ? HACK_STILL_VIEW : NYC_STILL_VIEW;
    const zoom = (Math.min(W, H) / 2 - 4) / discRadius(view.D, H / 2);
    const cam = cameraFor(view, { W, H, cx: W / 2, cy: H / 2, zoom });
    if (!drawGlobe(ctx, cam, dpr)) return;
    const u = clamp(Math.min(W, H) / 560, 0.5, 1);
    if (route === "hackathons") {
      for (let j = 0; j < STOPS.length - 1; j++) {
        if (traceRoute(ctx, cam, STOPS[j], STOPS[j + 1], 0.012, 1)) strokeRoute(ctx, u);
      }
      for (const [ll] of hackPins(-1)) drawPin(ctx, cam, ll, 0, u);
    } else {
      if (traceRoute(ctx, cam, BELGIUM, NEW_YORK, 0.07, 1)) strokeRoute(ctx, u);
      drawPin(ctx, cam, BELGIUM, 0, u);
      drawPin(ctx, cam, NEW_YORK, 2, u);
    }
  };

  useResizeEffect(draw, () => [ref.current]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || near.current) return;
        near.current = true;
        io.disconnect();
        draw();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(canvas);
    const off = onLandReady(draw);
    return () => {
      io.disconnect();
      off();
    };
    // `draw` reads refs only; it's the same function in effect every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={ref} className={className} role="img" aria-label={label} />;
}
