// The two scroll-driven flights, as pure functions of scroll progress.
//
// `p` is how many screens the page has scrolled since a stage's track reached
// the top of the viewport. The tracks are `100dvh * (1 + travel)` tall, so the
// same `p` means the same frame at every window size.

import { hackathons } from "@/data/content";
import { blend, clamp, eio, lerp, s5, slerp, sstep, v3, type View } from "./math";
import type { LatLng, PinStyle } from "./paint";

export const STOPS: LatLng[] = hackathons.map((h) => [h.lat, h.lng] as const);

// ── Hackathons ────────────────────────────────────────────────────────────

/** Screens spent folding the blue page into the globe before the first stop. */
export const HACK_LEAD = 0.75;
/** Flying in to New York, then a dwell and a leg per stop, then a last dwell. */
export const HACK_TRAVEL = HACK_LEAD + 3.85;
const ARRIVE = 0.3;
const PER_STOP = 0.75;
const DWELL = 0.3;
const LEG = 0.45;

const OVERVIEW: View = { T: v3(47, -30), D: 2.75 };
const AT = (i: number): View => ({ T: v3(STOPS[i][0], STOPS[i][1]), D: 2.3 });

export type HackFrame = {
  view: View;
  /** Which stop's card shows (-1: none yet), its opacity and its y offset in design px. */
  card: number;
  cardAlpha: number;
  cardY: number;
  /** Legs fully flown, and how far along the current one. */
  done: number;
  leg: number;
  /** The stop the camera is at or nearest, for the highlighted pin. */
  current: number;
  /** Progress bar, one 0..1 value per stop. */
  fill: number[];
};

export function hackAt(p: number): HackFrame {
  const q = p - HACK_LEAD;
  const f: HackFrame = { view: OVERVIEW, card: -1, cardAlpha: 0, cardY: 0, done: 0, leg: 0, current: -1, fill: [] };
  for (let j = 0; j < STOPS.length; j++) {
    f.fill.push(clamp((q - PER_STOP * j) / (j < STOPS.length - 1 ? PER_STOP : 0.7), 0, 1));
  }
  if (q < 0) return f;
  if (q < ARRIVE) {
    const g = s5(q / ARRIVE);
    f.view = blend(OVERVIEW, AT(0), g, 0);
    f.card = 0;
    f.cardAlpha = g;
    f.cardY = (1 - g) * 36;
    f.current = g > 0.5 ? 0 : -1;
    return f;
  }
  const r = q - ARRIVE;
  const i = Math.min(STOPS.length - 1, Math.floor(r / PER_STOP));
  const t = r - i * PER_STOP;
  f.done = i;
  if (i >= STOPS.length - 1 || t < DWELL) {
    f.view = AT(i);
    f.card = i;
    f.cardAlpha = 1;
    f.current = i;
    return f;
  }
  // A leg: the card leaves upward during the first half, the next one rises
  // into place during the second.
  const g = s5((t - DWELL) / LEG);
  f.leg = g;
  f.view = blend(AT(i), AT(i + 1), g, 0.8);
  f.current = g < 0.5 ? i : i + 1;
  if (g < 0.5) {
    f.card = i;
    f.cardAlpha = 1 - g * 2;
    f.cardY = -72 * g;
  } else {
    f.card = i + 1;
    f.cardAlpha = (g - 0.5) * 2;
    f.cardY = 36 * (1 - (g - 0.5) * 2);
  }
  return f;
}

/** Scroll progress at the middle of stop `i`'s dwell. */
export const hackStopAt = (i: number) => HACK_LEAD + ARRIVE + PER_STOP * i + DWELL / 2;

/** The blue page as a circle shrinking onto the globe, then fading into it. */
export function hackIris(p: number, coverR: number, globeR: number) {
  const u = clamp((p + 0.35) / 1.05, 0, 1);
  return { r: lerp(coverR, globeR, eio(u)), alpha: 1 - sstep(0.8, 1, u) };
}
export const HACK_OVERVIEW_D = OVERVIEW.D;

/** Pin styles for the unique stop locations (two events share Belgium). */
export function hackPins(current: number): [LatLng, PinStyle][] {
  const seen = new Set<string>();
  const cur = current >= 0 ? STOPS[current].join() : "";
  const out: [LatLng, PinStyle][] = [];
  for (const ll of STOPS) {
    const key = ll.join();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push([ll, key === cur ? 1 : 0]);
  }
  return out;
}

/** The whole route at rest, for the still globe. */
export const HACK_STILL_VIEW = OVERVIEW;

// ── The move to NYC ───────────────────────────────────────────────────────

export const BELGIUM: LatLng = [50.85, 4.35];
export const NEW_YORK: LatLng = [40.71, -74.0];
/** Just inland of New York, so the dive ends in land, not the harbour. */
const INLAND: LatLng = [40.95, -74.35];
export const NYC_TRAVEL = 2.1;

const FROM: View = { T: v3(BELGIUM[0], BELGIUM[1]), D: 2.6 };
const TO: View = { T: v3(NEW_YORK[0], NEW_YORK[1]), D: 2.4 };

export type NycFrame = {
  view: View;
  /** Flight progress, 0..1. */
  g: number;
  /** Dive into the land, 0..1. */
  dive: number;
  /** Yellow spreading out from New York over the last of the dive, 0..1. */
  flood: number;
  /** The clay's light and shadow evening out, a little ahead of the flood. */
  flat: number;
  /** New York's pin turns yellow once the plane has landed. */
  arrived: number;
};

export function nycAt(p: number): NycFrame {
  const g = s5(clamp(p, 0, 1));
  const dive = s5(clamp((p - 1.3) / 0.8, 0, 1));
  let view = blend(FROM, TO, g, 0.5);
  if (dive > 0) {
    view = {
      T: slerp(TO.T, v3(INLAND[0], INLAND[1]), dive),
      D: Math.exp(lerp(Math.log(TO.D), Math.log(0.012), dive)),
      c: sstep(0, 0.5, dive),
    };
  }
  return { view, g, dive, flood: sstep(1.7, NYC_TRAVEL, p), flat: sstep(1.5, 1.85, p), arrived: clamp((p - 1) / 0.2, 0, 1) };
}

export const nycPinStyle = (f: NycFrame): PinStyle => (f.arrived > 0.5 ? 2 : f.g > 0.97 ? 1 : 0);

/** Both ends of the move in one frame, for the still globe. */
export const NYC_STILL_VIEW: View = { T: slerp(FROM.T, TO.T, 0.5), D: 2.9 };
