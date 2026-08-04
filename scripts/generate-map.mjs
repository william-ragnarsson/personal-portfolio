// Build-time map generation. Runs via `predev` / `prebuild`.
//
// The dotted world map is ~12k <circle> elements. Rendering it inside the React
// tree put all of those nodes in the main document's layout tree, so every
// resize reflowed them — and shipped the markup twice (once as HTML, once
// serialised into the RSC payload as a string prop). Instead we emit it once,
// here, as a plain static asset:
//
//   public/map-dots.svg        the dot grid, loaded via <img> so its nodes live
//                              in an isolated document the page never reflows
//   src/data/mapGeometry.json  viewBox + projected pin coords (a few hundred bytes)
//
// Both are checked in, so a deploy never depends on this having run.

import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import DottedMap from "dotted-map";
import ts from "typescript";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// `content.ts` stays the single source of truth for hackathon data, including
// coordinates. Node 20 can't import TypeScript, so transpile it in memory and
// import the result as a data: URL. Safe here because content.ts is plain data
// with no imports of its own.
async function loadContent() {
  const source = readFileSync(resolve(ROOT, "src/data/content.ts"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  return import(`data:text/javascript,${encodeURIComponent(outputText)}`);
}

// Atlantic-centered crop: full Americas + Europe + Africa, Asia mostly cut —
// still reads as a world map, but frames the hackathon cities much tighter
// than the full 360° world would.
const MAP_OPTIONS = {
  height: 160,
  grid: "diagonal",
  region: { lat: { min: -58, max: 85 }, lng: { min: -170, max: 180 } },
};

const SVG_OPTIONS = {
  radius: 0.2,
  color: "#353535ff",
  shape: "circle",
  backgroundColor: "transparent",
};

// dotted-map emits every circle with a full-precision `cy` and its own `fill`,
// which is ~2x the bytes it needs. Round to the 2 decimals the viewBox can
// actually resolve, and hoist the shared fill onto a wrapping <g>.
function shrink(svg, vbW, vbH) {
  const dots = svg
    .replace(/\s*fill="[^"]*"/g, "")
    .replace(/(c[xy])="([\d.]+)"/g, (_, attr, value) => `${attr}="${+(+value).toFixed(2)}"`)
    .match(/<circle[^>]*\/>/g);

  // show the whole world, contained (floats in whitespace — no box/edge)
  return (
    `<svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg">` +
    `<g fill="${SVG_OPTIONS.color}">${dots.join("")}</g></svg>`
  );
}

const { hackathons } = await loadContent();

const map = new DottedMap(MAP_OPTIONS);
const rawSvg = map.getSVG(SVG_OPTIONS);

const [, , vbW, vbH] = (rawSvg.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 100 50")
  .split(" ")
  .map(Number);

const dotsSvg = shrink(rawSvg, vbW, vbH);

const geometry = {
  // Regenerate with `node scripts/generate-map.mjs` — do not hand-edit.
  vbW,
  vbH,
  pins: hackathons.map((h) => {
    const p = map.getPin({ lat: h.lat, lng: h.lng });
    return { city: h.city, x: p?.x ?? 0, y: p?.y ?? 0 };
  }),
};

await mkdir(resolve(ROOT, "public"), { recursive: true });
await writeFile(resolve(ROOT, "public/map-dots.svg"), dotsSvg, "utf8");
await writeFile(
  resolve(ROOT, "src/data/mapGeometry.json"),
  `${JSON.stringify(geometry, null, 2)}\n`,
  "utf8",
);

console.log(
  `generate-map: ${(dotsSvg.length / 1024).toFixed(0)} KB svg, ${geometry.pins.length} pins, viewBox ${vbW}x${vbH}`,
);
