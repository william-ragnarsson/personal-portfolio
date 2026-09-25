// Geometry for the globe: a unit sphere, a camera that sits straight above a
// target point on it, and the easing used by every flight on the page.
//
// Screen space is CSS pixels, y down. A `Frame` says where on the canvas the
// globe's centre sits and how big a unit is, so the same view can be framed on
// the right of a wide stage or in the middle of a small card.

export type Vec3 = readonly [number, number, number];

export const RAD = Math.PI / 180;
/** Vertical field of view. Wide enough to read as a sphere, not a disc. */
export const FOV = 40 * RAD;

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: Vec3) => mul(a, 1 / len(a));

export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const sstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
/** Smootherstep: zero velocity and acceleration at both ends. Every flight uses it. */
export const s5 = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
/** Cubic ease-in-out, for the blue page folding into the globe. */
export const eio = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** A point on the unit sphere. */
export const v3 = (lat: number, lng: number): Vec3 => [
  Math.cos(lat * RAD) * Math.sin(lng * RAD),
  Math.sin(lat * RAD),
  Math.cos(lat * RAD) * Math.cos(lng * RAD),
];

export function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const w = Math.acos(clamp(dot(a, b), -1, 1));
  if (w < 1e-5) return a;
  const s = Math.sin(w);
  return add(mul(a, Math.sin((1 - t) * w) / s), mul(b, Math.sin(t * w) / s));
}

/** Where the camera looks (`T`), how high above the surface it is (`D`, in
 *  radii), and how far the globe has slid from its frame position to the
 *  centre of the canvas (`c`, 0..1). */
export type View = { T: Vec3; D: number; c?: number };

/** The view partway along a flight: the camera travels the great circle and
 *  climbs by `bump` per radian of distance, peaking halfway. */
export function blend(a: View, b: View, g: number, bump: number): View {
  const ang = Math.acos(clamp(dot(a.T, b.T), -1, 1));
  return { T: slerp(a.T, b.T, g), D: lerp(a.D, b.D, g) + ang * bump * Math.sin(Math.PI * g) };
}

/** Where the globe sits on a canvas of `W`×`H` CSS px. */
export type Frame = { W: number; H: number; cx: number; cy: number; zoom: number };

export type Camera = {
  C: Vec3;
  F: Vec3;
  R: Vec3;
  Up: Vec3;
  tan: number;
  /** Lens shift in units, so the globe's centre lands on (cx, cy). */
  shift: readonly [number, number];
  /** CSS px per unit of the image plane. */
  unit: number;
  W: number;
  H: number;
  /** The globe's centre and silhouette radius on screen, CSS px. */
  cx: number;
  cy: number;
  r: number;
};

/** Screen radius of the globe seen from `D` radii above the surface. */
export const discRadius = (D: number, unit: number) =>
  (unit * Math.tan(Math.asin(1 / (1 + D)))) / Math.tan(FOV / 2);

export function cameraFor(view: View, f: Frame): Camera {
  const U = norm(view.T);
  let N = sub([0, 1, 0], mul(U, U[1]));
  N = len(N) < 1e-4 ? [0, 0, -1] : norm(N);
  const E = cross(N, U);
  const C = mul(U, 1 + view.D);
  const F = mul(U, -1);
  const c = view.c ?? 0;
  const cx = lerp(f.cx, f.W / 2, c);
  const cy = lerp(f.cy, f.H / 2, c);
  const unit = (f.H / 2) * f.zoom;
  return {
    C,
    F,
    R: E,
    Up: cross(E, F),
    tan: Math.tan(FOV / 2),
    shift: [(cx - f.W / 2) / unit, -(cy - f.H / 2) / unit],
    unit,
    W: f.W,
    H: f.H,
    cx,
    cy,
    r: discRadius(view.D, unit),
  };
}

/** Screen position of a point in space, or null if it's behind the camera. */
export function project(k: Camera, P: Vec3): [number, number] | null {
  const v = sub(P, k.C);
  const z = dot(v, k.F);
  if (z < 1e-4) return null;
  return [
    k.W / 2 + (dot(v, k.R) / (z * k.tan) + k.shift[0]) * k.unit,
    k.H / 2 - (dot(v, k.Up) / (z * k.tan) + k.shift[1]) * k.unit,
  ];
}

/** False when the globe itself hides `P` from the camera. */
export function visible(k: Camera, P: Vec3) {
  const d = sub(P, k.C);
  const L = len(d);
  const r = mul(d, 1 / L);
  const b = dot(k.C, r);
  const h = b * b - dot(k.C, k.C) + 1;
  if (h <= 0) return true;
  const t = -b - Math.sqrt(h);
  return !(t > 0 && t < L - 2e-3);
}

/** Light from the upper left, a little in front of the globe. */
export const sunDir = (k: Camera) => norm(add(add(mul(k.R, -0.5), mul(k.Up, 0.62)), mul(k.F, -0.6)));
