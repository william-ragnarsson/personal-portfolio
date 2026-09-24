// Which version of the globe sections this visitor gets.
//
// The scroll-driven 3D stages need a mouse or trackpad, WebGL2 and motion
// allowed. Everyone else (phones, tablets, reduced motion) gets the still
// version: one rendered globe and the stops as a list.
//
// The decision is made by an inline script in <head> before first paint (see
// `GLOBE_MODE_SCRIPT`) and stored as `data-globe` on <html>:
//
//   "3d"     scroll-driven stages (laid out at `md` and up only)
//   "still"  still globes and the list
//   "none"   the list, no globes: WebGL2 turned out not to work
//
// CSS lays out every version from that attribute plus the `md` breakpoint, so
// the server markup is identical for everyone and nothing mounts or unmounts on
// the client. JS only reads the attribute, inside a measurement pass.

import { isWideViewport } from "./breakpoints";

export const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const FINE = JSON.stringify(FINE_POINTER_QUERY);
const REDUCE = JSON.stringify(REDUCED_MOTION_QUERY);

/**
 * Runs before first paint. It checks the WebGL2 constructor exists rather than
 * creating a context, which would cost milliseconds on the critical path. If a
 * context fails later, `demoteGlobe()` flips the attribute: a CSS-only change.
 * It re-runs when the pointer or motion preference changes.
 */
export const GLOBE_MODE_SCRIPT = `(function(){
var d=document.documentElement;
function m(q){return window.matchMedia(q).matches}
function set(){if(d.getAttribute("data-globe")==="none")return;d.setAttribute("data-globe",m(${FINE})&&!m(${REDUCE})&&"WebGL2RenderingContext" in window?"3d":"still")}
try{set();[${FINE},${REDUCE}].forEach(function(q){window.matchMedia(q).addEventListener("change",set)})}catch(e){}
})();`;

/** True when the scroll-driven stages are laid out (3D mode at `md` and up). */
export function stagesActive() {
  return document.documentElement.dataset.globe === "3d" && isWideViewport();
}

/** No WebGL2 after all: fall back to the list layout without globes. */
export function demoteGlobe() {
  document.documentElement.setAttribute("data-globe", "none");
}

export const prefersReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;
export const hasFinePointer = () => window.matchMedia(FINE_POINTER_QUERY).matches;
