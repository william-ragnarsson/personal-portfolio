// What both scroll-driven globe stages share: measuring the sticky stage,
// placing the globe beside the text column, and masking text under a circle.

import { clamp, discRadius, type Frame } from "@/lib/globe/math";
import { canvasDpr, sizeCanvas } from "@/lib/globe/paint";
import { globeSupported } from "@/lib/globe/renderer";
import { demoteGlobe, stagesActive } from "@/lib/mode";

export type StageBox = {
  W: number;
  H: number;
  /** Design px (the 1200x750 layout) at this stage size. Matches `--u` in CSS. */
  u: number;
  dpr: number;
  /** The track's top in document coordinates. */
  trackTop: number;
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
};

/**
 * Reads the stage's geometry and sizes its canvas. Null when the stages
 * aren't laid out (still mode, or narrower than `md`), and also when WebGL2
 * turns out not to work, in which case the page falls back to the list.
 */
export function measureStage(track: HTMLElement): StageBox | null {
  if (!stagesActive()) return null;
  if (!globeSupported()) {
    demoteGlobe();
    return null;
  }
  const stage = track.querySelector<HTMLElement>("[data-stage]");
  const canvas = track.querySelector<HTMLCanvasElement>("[data-canvas]");
  const ctx = canvas?.getContext("2d");
  if (!stage || !canvas || !ctx) return null;
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  const dpr = canvasDpr();
  sizeCanvas(canvas, W, H, dpr);
  return {
    W,
    H,
    u: clamp(Math.min(W / 1200, H / 750), 0.6, 0.9),
    dpr,
    trackTop: track.getBoundingClientRect().top + window.scrollY,
    stage,
    canvas,
    ctx,
  };
}

/** The text column's right edge and the bottom of its content, in stage px. */
export function columnEdges(col: HTMLElement | null) {
  if (!col) return { right: 0, bottom: 0 };
  const last = col.lastElementChild as HTMLElement | null;
  return {
    right: col.offsetLeft + col.offsetWidth,
    bottom: col.offsetTop + (last ? last.offsetTop + last.offsetHeight : col.offsetHeight),
  };
}

/**
 * Where the globe goes. On a landscape stage it's beside the text column: at
 * `fx` of the width, as in the design, unless that would run into the column
 * or off the right edge, in which case it's centred in the room that's left
 * and shrunk if it still doesn't fit. On a portrait stage (the CSS switches
 * the column at the same point, with a container query) it's centred under
 * the column instead, down to `floor`.
 *
 * `maxD` is the lowest the camera flies, which is when the globe is biggest;
 * `margin` is the room kept at the edges, in design px.
 */
export function placeGlobe(
  box: StageBox,
  col: { right: number; bottom: number },
  { fx, maxD, margin, floor }: { fx: number; maxD: number; margin: number; floor: number },
): Frame {
  const { W, H, u } = box;
  const r = discRadius(maxD, H / 2);
  // CSS counts a square as portrait too.
  if (H >= W) {
    const top = col.bottom + 32 * u;
    const fit = Math.min(floor - top, W - 2 * margin * u) / 2;
    return { W, H, cx: W / 2, cy: (top + floor) / 2, zoom: clamp(fit / r, 0.4, 1) };
  }
  const left = col.right + 24 * u;
  const right = W - margin * u;
  let cx = fx * W;
  let zoom = 1;
  if (right - left < 2 * r) {
    zoom = Math.max(0.4, (right - left) / (2 * r));
    cx = (left + right) / 2;
  } else {
    cx = clamp(cx, left + r, right - r);
  }
  return { W, H, cx, cy: 0.51 * H, zoom };
}

/** The stage's top edge in viewport coordinates at scroll progress `p`. */
export function stageTopAt(p: number, travel: number, vh: number) {
  if (p < 0) return -p * vh;
  if (p > travel) return -(p - travel) * vh;
  return 0;
}

export type Masked = { el: HTMLElement; x: number; y: number };

/** Hide whatever of `els` lies inside the circle, so the text is uncovered
 *  exactly where the circle's edge passes over it. r <= 0 removes the mask. */
export function maskOutside(els: Masked[], cx: number, cy: number, r: number) {
  for (const { el, x, y } of els) {
    const m =
      r > 0
        ? `radial-gradient(circle at ${(cx - x).toFixed(1)}px ${(cy - y).toFixed(1)}px, transparent ${r.toFixed(1)}px, #000 ${(r + 1).toFixed(1)}px)`
        : "";
    el.style.maskImage = m;
    el.style.setProperty("-webkit-mask-image", m);
  }
}

/** Fill the whole canvas with the page colour, in CSS px. */
export function clearTo(box: StageBox, color: string) {
  const { ctx, dpr, W, H } = box;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
}
