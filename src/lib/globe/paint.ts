// 2D drawing on top of the globe: flight routes and city pins. Sizes are in
// design px (the 1200-wide layout) and scaled by `u`, like the rest of a stage.

import { clamp, dot, mul, norm, project, slerp, sstep, sub, v3, visible, type Camera, type Vec3 } from "./math";

export const INK = {
  blue: "#0054a2",
  yellow: "#ffc576",
  cream: "#fff5e7",
  navy: "#052144",
  casing: "rgba(255,245,231,.95)",
} as const;

export type LatLng = readonly [number, number];

/** 0 = a stop, 1 = where we are now, 2 = arrived (New York, at the end). */
export type PinStyle = 0 | 1 | 2;

/** Size a canvas to `cssW`×`cssH` at `dpr`, the same rounding `drawGlobe` uses. */
export function sizeCanvas(canvas: HTMLCanvasElement, cssW: number, cssH: number, dpr: number) {
  const W = Math.max(2, Math.round(cssW * dpr));
  const H = Math.max(2, Math.round(cssH * dpr));
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
}

/** Device pixel ratio, capped: past 2x the shader costs more than it shows. */
export const canvasDpr = () => Math.min(2, window.devicePixelRatio || 1);

/**
 * Traces the great-circle route from `a` to `b` as far as `upto` (0..1),
 * lifted `alt` radii at its midpoint. Hidden stretches behind the globe break
 * the path. Returns false when nothing is on screen.
 */
export function traceRoute(ctx: CanvasRenderingContext2D, k: Camera, a: LatLng, b: LatLng, alt: number, upto: number) {
  const A = v3(a[0], a[1]);
  const B = v3(b[0], b[1]);
  const ang = Math.acos(clamp(dot(A, B), -1, 1));
  if (ang < 1e-4 || upto <= 0) return false;
  const steps = Math.ceil(ang * 90 * upto) + 4;
  ctx.beginPath();
  let pen = false;
  let any = false;
  for (let s = 0; s <= steps; s++) {
    const t = (upto * s) / steps;
    const P = mul(slerp(A, B, t), 1 + alt * Math.sin(Math.PI * t));
    const p = visible(k, P) ? project(k, P) : null;
    if (p) {
      if (pen) ctx.lineTo(p[0], p[1]);
      else ctx.moveTo(p[0], p[1]);
      pen = true;
      any = true;
    } else pen = false;
  }
  return any;
}

/** The point `upto` of the way along a route, if it's on screen. */
export function routePoint(k: Camera, a: LatLng, b: LatLng, alt: number, upto: number) {
  const A = v3(a[0], a[1]);
  const B = v3(b[0], b[1]);
  const P = mul(slerp(A, B, upto), 1 + alt * Math.sin(Math.PI * upto));
  return visible(k, P) ? project(k, P) : null;
}

/** Navy line on a cream casing, so it reads over sea and land alike. */
export function strokeRoute(ctx: CanvasRenderingContext2D, u: number) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = INK.casing;
  ctx.lineWidth = 7 * u;
  ctx.stroke();
  ctx.strokeStyle = INK.navy;
  ctx.lineWidth = 3 * u;
  ctx.stroke();
}

function disc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function drawPin(ctx: CanvasRenderingContext2D, k: Camera, ll: LatLng, style: PinStyle, u: number) {
  const P: Vec3 = v3(ll[0], ll[1]);
  // Fade out as the pin rounds the limb instead of popping.
  const fade = sstep(0.04, 0.2, dot(P, norm(sub(k.C, P))));
  if (fade <= 0) return;
  const p = project(k, mul(P, 1.002));
  if (!p) return;
  ctx.globalAlpha = fade;
  if (style === 1) {
    ctx.beginPath();
    ctx.arc(p[0], p[1], 19 * u, 0, Math.PI * 2);
    ctx.strokeStyle = INK.casing;
    ctx.lineWidth = 3 * u;
    ctx.stroke();
    disc(ctx, p[0], p[1], 10 * u, INK.cream);
    disc(ctx, p[0], p[1], 7 * u, INK.navy);
  } else if (style === 2) {
    disc(ctx, p[0], p[1], 15 * u, INK.cream);
    disc(ctx, p[0], p[1], 12 * u, INK.navy);
    disc(ctx, p[0], p[1], 9 * u, INK.yellow);
  } else {
    disc(ctx, p[0], p[1], 8 * u, INK.cream);
    disc(ctx, p[0], p[1], 5 * u, INK.navy);
  }
  ctx.globalAlpha = 1;
}
