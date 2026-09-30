"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useResizeEffect } from "@/hooks/useResizeEffect";
import { requestFrame, subscribeFrame } from "@/lib/frame";
import { prefersReducedMotion } from "@/lib/mode";
import { projectAt, projectStopAt, projectsTravel } from "@/lib/projectSteps";

type Geo = {
  trackTop: number;
  panels: HTMLElement[];
  picks: HTMLElement[];
  ticks: HTMLElement[];
};

/**
 * Whether the pinned layout has room for everything: the names, every
 * project's story, and pictures no shorter than a quarter of the stage.
 * Offsets rather than rects where it matters, since a story that isn't
 * showing is shifted down by its transition; the stage is their offset
 * parent.
 */
function fits(grid: HTMLElement, nav: HTMLElement): boolean {
  const H = grid.offsetHeight;
  const pics = [...grid.querySelectorAll<HTMLElement>("[data-pic]")];
  const tallest = Math.max(0, ...pics.map((el) => el.offsetHeight));
  if (nav.scrollWidth > nav.clientWidth + 1 || tallest < H / 4) return false;
  let top = nav.offsetTop;
  let bottom = nav.offsetTop + nav.offsetHeight;
  for (const story of grid.querySelectorAll<HTMLElement>("[data-story]")) {
    // The story's box is its grid cell; what's written in it can run past.
    const end = story.lastElementChild?.getBoundingClientRect().bottom ?? 0;
    top = Math.min(top, story.offsetTop);
    bottom = Math.max(bottom, story.offsetTop + end - story.getBoundingClientRect().top);
  }
  return top >= grid.offsetTop - 1 && bottom <= grid.offsetTop + H + 1;
}

function show(g: Geo, current: number) {
  g.panels.forEach((el, i) => el.toggleAttribute("data-current", i === current));
  g.picks.forEach((el, i) => {
    if (i === current) el.setAttribute("aria-current", "true");
    else el.removeAttribute("aria-current");
  });
}

/**
 * The projects index. The server renders every project as `children`; this
 * pins them to the screen and steps through them as the page scrolls. The
 * names are the index, and the current project's picture and story show:
 *
 *   [data-stage]  the sticky, full-viewport stage
 *   [data-grid]   its layout: the names, and every project's picture and
 *                 story stacked in the same cells
 *   [data-nav]    the names: [data-pick] each one, [data-tick] its progress
 *   [data-panel]  one project: [data-pic] its picture, [data-story] its story
 *
 * It pins only where the stage has room for all of it at the window's
 * smallest height, a phone's with its toolbars showing. Anywhere else, and
 * until it's measured, the projects are a list, one after another.
 */
export default function ProjectsStage({
  count,
  className,
  children,
}: {
  count: number;
  className?: string;
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const geo = useRef<Geo | null>(null);
  const shown = useRef(-2);

  useResizeEffect(
    () => {
      const track = trackRef.current;
      const grid = track?.querySelector<HTMLElement>("[data-grid]");
      const nav = grid?.querySelector<HTMLElement>("[data-nav]");
      if (!track || !grid || !nav) return;
      const trackTop = track.getBoundingClientRect().top + window.scrollY;
      const wasPinned = track.hasAttribute("data-pin");
      // Lay it out pinned, at its smallest height, and see.
      track.setAttribute("data-pin", "");
      track.setAttribute("data-fit", "");
      const pin = fits(grid, nav);
      track.removeAttribute("data-fit");
      track.setAttribute("data-measured", "");

      const panels = [...track.querySelectorAll<HTMLElement>("[data-panel]")];
      if (!pin) {
        track.removeAttribute("data-pin");
        // A list shows every project, so every clip may play.
        panels.forEach((el) => el.setAttribute("data-current", ""));
        geo.current = null;
        shown.current = -2;
        return;
      }
      const g: Geo = {
        trackTop,
        panels,
        picks: [...track.querySelectorAll<HTMLElement>("[data-pick]")],
        ticks: [...track.querySelectorAll<HTMLElement>("[data-tick]")],
      };
      geo.current = g;
      // The right project now, not a frame later with all of them showing.
      const { current } = projectAt((window.scrollY - trackTop) / window.innerHeight, panels.length);
      show(g, current);
      shown.current = current;
      // From the list, the others go at once rather than fading out over it.
      if (!wasPinned) for (const a of track.getAnimations({ subtree: true })) a.finish();
      requestFrame();
    },
    () => {
      const track = trackRef.current;
      if (!track) return [];
      return [
        track,
        track.querySelector("[data-stage]"),
        track.querySelector("[data-nav]"),
        // A story's box is its cell, so it's what's written in it that grows.
        ...track.querySelectorAll("[data-story] > *"),
        document.body,
      ];
    },
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const paint = (y: number, vh: number) => {
      const g = geo.current;
      if (!g) return;
      const n = g.panels.length;
      const p = (y - g.trackTop) / vh;
      if (p < -1.02 || p > projectsTravel(n) + 1.02) return;
      const f = projectAt(p, n);
      if (f.current !== shown.current) {
        show(g, f.current);
        shown.current = f.current;
      }
      g.ticks.forEach((el, j) => (el.style.transform = `scaleX(${f.fill[j].toFixed(3)})`));
    };
    const unsubscribe = subscribeFrame(paint);

    // Picking a name scrolls to its project.
    const pick = (e: MouseEvent) => {
      const g = geo.current;
      const el = (e.target as Element).closest<HTMLElement>("[data-pick]");
      if (!g || !el) return;
      e.preventDefault();
      const top = g.trackTop + projectStopAt(Number(el.dataset.pick)) * window.innerHeight;
      window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    };
    // Tabbing to a project's links brings the index to it.
    const focus = (e: FocusEvent) => {
      const g = geo.current;
      const panel = (e.target as Element).closest<HTMLElement>("[data-panel]");
      if (!g || !panel || panel.hasAttribute("data-current")) return;
      const i = g.panels.indexOf(panel);
      if (i >= 0) window.scrollTo({ top: g.trackTop + projectStopAt(i) * window.innerHeight, behavior: "auto" });
    };
    track.addEventListener("click", pick);
    track.addEventListener("focusin", focus);

    return () => {
      unsubscribe();
      track.removeEventListener("click", pick);
      track.removeEventListener("focusin", focus);
    };
  }, []);

  return (
    <div ref={trackRef} className={className} style={{ "--travel": projectsTravel(count) } as CSSProperties}>
      {children}
    </div>
  );
}
