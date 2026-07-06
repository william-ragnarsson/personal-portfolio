import DottedMap from "dotted-map";
import { hackathons } from "@/data/content";

// Runs at build time (server). Produces the dotted map SVG + pin coordinates
// (in viewBox units) for the scroll-driven MapJourney.
const map = new DottedMap({
  height: 60,
  grid: "diagonal",
  region: { lat: { min: 29, max: 72 }, lng: { min: -95, max: 62 } },
});

const dotsSvg = map
  .getSVG({
    radius: 0.3,
    color: "#33406a",
    shape: "circle",
    backgroundColor: "transparent",
  })
  .replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ');

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
