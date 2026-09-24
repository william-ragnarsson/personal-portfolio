"use client";

import { useEffect, useRef, useState } from "react";
import { blend, cameraFor, clamp, discRadius, dot, s5, v3, type View } from "@/lib/globe/math";
import { canvasDpr, drawPin, sizeCanvas, strokeRoute, traceRoute, type LatLng } from "@/lib/globe/paint";
import { drawGlobe, globeSupported, landReady, onLandReady } from "@/lib/globe/renderer";
import { NEW_YORK } from "@/lib/globe/timeline";
import type { Origin } from "@/lib/contact";
import { demoteGlobe, prefersReducedMotion } from "@/lib/mode";
import s from "./Contact.module.css";

const DURATION = 2600;
/** Give up waiting for the land texture after this long and just say it's sent. */
const LAND_WAIT = 2500;

const TO: View = { T: v3(NEW_YORK[0], NEW_YORK[1]), D: 2.4 };

/**
 * What replaces the form once a message is sent: the message's flight to New
 * York on the globe, from wherever the sender is (when Vercel knows), then a
 * line saying where the reply will go. With reduced motion it's the last
 * frame; without WebGL, just the line.
 */
export default function SentFlight({ email, origin }: { email: string; origin: Origin | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  // Only ever mounted on the client, after a send, so `window` is there.
  const [animate] = useState(() => typeof window !== "undefined" && !prefersReducedMotion());
  const [landed, setLanded] = useState(!animate);

  useEffect(() => {
    textRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    let start = 0;
    let wait = 0;

    const from: LatLng | null = origin ? [origin.lat, origin.lng] : null;
    const O = from ? v3(from[0], from[1]) : null;
    const ang = O ? Math.acos(clamp(dot(O, TO.T), -1, 1)) : 0;
    // A route only when there's somewhere real to fly from: not nowhere, and
    // not from New York itself.
    const route = from && ang > 0.01 ? from : null;
    const FROM: View = route
      ? { T: v3(route[0], route[1]), D: 2.6 }
      : { T: v3(NEW_YORK[0] - 12, NEW_YORK[1] + 75), D: 2.7 };
    const alt = 0.076 * Math.min(1, ang / 0.92);

    const paint = (t: number) => {
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      const ctx = canvas.getContext("2d");
      if (!W || !H || !ctx) return;
      const dpr = canvasDpr();
      sizeCanvas(canvas, W, H, dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const R = Math.min(W * 0.42, H / 2 - 8);
      const frame = { W, H, cx: W / 2, cy: H / 2, zoom: R / discRadius(TO.D, H / 2) };
      const g = s5(clamp((t - 0.08) / 0.78, 0, 1));
      const cam = cameraFor(blend(FROM, TO, g, 0.5), frame);
      if (!drawGlobe(ctx, cam, dpr)) return;
      const u = clamp(R / 240, 0.5, 1);
      if (route) {
        if (g > 0 && traceRoute(ctx, cam, route, NEW_YORK, alt, g)) strokeRoute(ctx, u);
        drawPin(ctx, cam, route, 0, u);
      }
      drawPin(ctx, cam, NEW_YORK, g > 0.97 ? 2 : 0, u);
    };

    const tick = (now: number) => {
      start ||= now;
      const t = animate ? clamp((now - start) / DURATION, 0, 1) : 1;
      paint(t);
      if (t >= 0.85) setLanded(true);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    const go = () => {
      window.clearTimeout(wait);
      cancelAnimationFrame(raf);
      start = 0;
      raf = requestAnimationFrame(tick);
    };

    // Phones and the still layout may not have fetched the land yet.
    if (!globeSupported()) {
      demoteGlobe();
      raf = requestAnimationFrame(() => setLanded(true));
      return () => cancelAnimationFrame(raf);
    }
    const off = onLandReady(go);
    if (landReady()) go();
    else wait = window.setTimeout(() => setLanded(true), LAND_WAIT);

    return () => {
      off();
      window.clearTimeout(wait);
      cancelAnimationFrame(raf);
    };
  }, [animate, origin]);

  return (
    <div className={s.sent}>
      <canvas ref={canvasRef} className={s.sentCanvas} aria-hidden />
      <div ref={textRef} className={s.sentText} data-in={landed ? "" : undefined} role="status" tabIndex={-1}>
        <p className={s.sentHd}>Sent.</p>
        <p className={s.sentP}>
          I’ll reply to <b>{email}</b>
        </p>
      </div>
    </div>
  );
}
