import geometry from "@/data/mapGeometry.json";

// Map geometry for the scroll-driven MapJourney: the viewBox the dot grid was
// drawn in, plus each hackathon city projected into those units.
//
// The dot grid itself is NOT here. It's ~12k <circle> elements, so it's emitted
// once at build time to `public/map-dots.svg` (see scripts/generate-map.mjs)
// and loaded via <img> — keeping those nodes out of the page's layout tree and
// out of the RSC payload. Only these few hundred bytes cross to the client.

/** Path of the generated dot-grid asset. */
export const MAP_DOTS_SRC = "/map-dots.svg";

export type MapPin = { city: string; x: number; y: number };

export type MapData = {
  vbW: number;
  vbH: number;
  pins: MapPin[];
};

export const mapData: MapData = geometry;
