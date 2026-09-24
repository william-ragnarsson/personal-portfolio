// Bakes the globe's land mask: public/globe/land.png, a 4096x2048
// equirectangular 8-bit grayscale image (255 = land, 0 = sea, antialiased).
//
//   npm run bake:land
//
// The PNG is committed, so a deploy never runs this. Re-run it only to change
// the source data or the resolution.
//
// Source: Natural Earth 1:50m land via world-atlas. The shader thresholds this
// mask at 0.5 for the coastline and reads a blurred mip of it for the clay
// relief, so the grey ramp along each coast is what keeps the edge smooth at
// every zoom level.

import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const topology = require("world-atlas/land-50m.json");

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/globe/land.png");

const W = 4096;
const H = 2048;
// Subsample rows per pixel row. Horizontal coverage is computed exactly, so
// this only sets the vertical antialiasing precision.
const SUB = 16;

const land = feature(topology, topology.objects.land);
const geometries = land.features ? land.features.map((f) => f.geometry) : [land.geometry];

/** Edges in pixel space as [x0, y0, x1, y1] with y0 < y1. */
const edges = [];

function addRing(ring) {
  // Each ring is drawn three times, shifted a full turn either way, so a
  // polygon that runs past ±180° after unwrapping still lands on the texture.
  for (const shift of [-360, 0, 360]) {
    const pts = ring.map(([lng, lat]) => [((lng + shift + 180) / 360) * W, ((90 - lat) / 180) * H]);
    let minX = Infinity;
    let maxX = -Infinity;
    for (const [x] of pts) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
    if (maxX < 0 || minX > W) continue;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if (a[1] === b[1]) continue;
      edges.push(a[1] < b[1] ? [a[0], a[1], b[0], b[1]] : [b[0], b[1], a[0], a[1]]);
    }
  }
}

for (const geometry of geometries) {
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
  for (const polygon of polygons) {
    for (const ring of polygon) {
      // Unwrap longitudes so a ring crossing the antimeridian stays one
      // continuous outline instead of a stripe across the whole map.
      let offset = 0;
      let prev = null;
      let latSum = 0;
      const unwrapped = ring.map(([lng, lat]) => {
        let x = lng + offset;
        if (prev !== null) {
          if (x - prev > 180) {
            offset -= 360;
            x -= 360;
          } else if (x - prev < -180) {
            offset += 360;
            x += 360;
          }
        }
        prev = x;
        latSum += lat;
        return [x, lat];
      });
      // A ring that goes all the way around the globe (Antarctica) doesn't
      // close on itself once unwrapped: close it through the nearest pole.
      const last = unwrapped[unwrapped.length - 1];
      if (Math.abs(last[0] - unwrapped[0][0]) > 180) {
        const pole = latSum < 0 ? -90 : 90;
        unwrapped.push([last[0], pole], [unwrapped[0][0], pole]);
      }
      addRing(unwrapped);
    }
  }
}

// Scanline fill, even-odd, with an active edge list.
edges.sort((a, b) => a[1] - b[1]);
const img = new Uint8Array(W * H);
const acc = new Float32Array(W + 1);
const xs = [];
let active = [];
let next = 0;

function span(a, b) {
  a = Math.max(0, a);
  b = Math.min(W, b);
  if (b <= a) return;
  const ia = Math.floor(a);
  const ib = Math.floor(b);
  if (ia === ib) {
    acc[ia] += b - a;
    return;
  }
  acc[ia] += ia + 1 - a;
  for (let x = ia + 1; x < ib; x++) acc[x] += 1;
  if (ib < W) acc[ib] += b - ib;
}

for (let y = 0; y < H; y++) {
  acc.fill(0);
  for (let k = 0; k < SUB; k++) {
    const ys = y + (k + 0.5) / SUB;
    while (next < edges.length && edges[next][1] <= ys) active.push(edges[next++]);
    let n = 0;
    xs.length = 0;
    for (let i = 0; i < active.length; i++) {
      const e = active[i];
      if (e[3] <= ys) continue;
      active[n++] = e;
      xs.push(e[0] + ((ys - e[1]) / (e[3] - e[1])) * (e[2] - e[0]));
    }
    active.length = n;
    xs.sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i += 2) span(xs[i], xs[i + 1]);
  }
  for (let x = 0; x < W; x++) img[y * W + x] = Math.round(Math.min(1, acc[x] / SUB) * 255);
}

// PNG: 8-bit greyscale, per-row adaptive filter (the one with the smallest
// sum of absolute residuals), deflate level 9.
function crc32(buf) {
  let crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    let c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const raw = Buffer.alloc((W + 1) * H);
const filtered = [0, 1, 2, 3, 4].map(() => Buffer.alloc(W));
const zero = new Uint8Array(W);
for (let y = 0; y < H; y++) {
  const cur = img.subarray(y * W, (y + 1) * W);
  const up = y ? img.subarray((y - 1) * W, y * W) : zero;
  let best = 0;
  let bestScore = Infinity;
  for (let type = 0; type < 5; type++) {
    const out = filtered[type];
    let score = 0;
    for (let x = 0; x < W; x++) {
      const a = x ? cur[x - 1] : 0;
      const b = up[x];
      const c = x ? up[x - 1] : 0;
      let pred = 0;
      if (type === 1) pred = a;
      else if (type === 2) pred = b;
      else if (type === 3) pred = (a + b) >> 1;
      else if (type === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      const v = (cur[x] - pred) & 255;
      out[x] = v;
      score += v < 128 ? v : 256 - v;
    }
    if (score < bestScore) {
      bestScore = score;
      best = type;
    }
  }
  raw[y * (W + 1)] = best;
  filtered[best].copy(raw, y * (W + 1) + 1);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(W, 0);
header.writeUInt32BE(H, 4);
header[8] = 8; // bit depth
header[9] = 0; // greyscale
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", header),
  chunk("IDAT", deflateSync(raw, { level: 9, memLevel: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, png);
console.log(`wrote ${OUT} (${W}x${H}, ${(png.length / 1024).toFixed(0)} KB, ${edges.length} edges)`);
