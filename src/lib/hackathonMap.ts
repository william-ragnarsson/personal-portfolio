import DottedMap from "dotted-map";
import { hackathons } from "@/data/content";

// Runs at build time (server). Produces the dotted map SVG + pin coordinates
// (in viewBox units) for the scroll-driven MapJourney.
const map = new DottedMap({
  height: 100,
  grid: "diagonal",
});

const dotsSvg = map
  .getSVG({
    radius: 0.32,
    color: "#8f8a7d",
    shape: "circle",
    backgroundColor: "transparent",
  })
  // show the whole world, contained (floats in whitespace — no box/edge)
  .replace("<svg ", '<svg preserveAspectRatio="xMidYMid meet" ');

const [, , vbW, vbH] = (
  dotsSvg.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 100 50"
)
  .split(" ")
  .map(Number);

export type MapData = {
  dotsSvg: string;
  vbW: number;
  vbH: number;
  pins: { city: string; x: number; y: number }[];
};

export const mapData: MapData = {
  dotsSvg,
  vbW,
  vbH,
  pins: hackathons.map((h) => {
    const p = map.getPin({ lat: h.lat, lng: h.lng });
    return { city: h.city, x: p?.x ?? 0, y: p?.y ?? 0 };
  }),
};
