// The projects index, as a pure function of scroll progress, like the globe
// flights in src/lib/globe/timeline.ts.
//
// `p` is how many screens the page has scrolled since the stage's track
// reached the top of the viewport. The track is `100dvh * (1 + travel)` tall,
// so the same `p` shows the same project at every window size.

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Screens of scrolling each project gets. */
const PER_PROJECT = 0.75;

export const projectsTravel = (n: number) => PER_PROJECT * n;

export type ProjectsFrame = {
  /** The project showing. */
  current: number;
  /** Each name's progress bar, 0..1: how far the page is through that project. */
  fill: number[];
};

export function projectAt(p: number, n: number): ProjectsFrame {
  const fill: number[] = [];
  for (let j = 0; j < n; j++) fill.push(clamp((p - PER_PROJECT * j) / PER_PROJECT, 0, 1));
  return { current: clamp(Math.floor(p / PER_PROJECT), 0, n - 1), fill };
}

/** Halfway through project i's screens: where picking its name scrolls to. */
export const projectStopAt = (i: number) => PER_PROJECT * (i + 0.5);
