"use client";

import { useEffect, useRef, useState } from "react";
import { useMedia } from "@/hooks/useMedia";
import { REDUCED_MOTION_QUERY } from "@/lib/mode";
import s from "./sections/Projects.module.css";

/**
 * A project's looping clip. It plays while it's near the screen and its
 * project is the one showing, and pauses otherwise; nothing is fetched until
 * then. With reduced motion it stays on its poster until someone presses play.
 */
export default function ProjectClip({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useMedia(REDUCED_MOTION_QUERY);
  const [pressed, setPressed] = useState(false);
  const still = reduced && !pressed;

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (still) {
      video.pause();
      return;
    }
    // The index stacks every project in the same place, so being on screen
    // isn't enough: its panel has to be the current one (ProjectsStage).
    const panel = video.closest<HTMLElement>("[data-panel]");
    let near = false;
    const sync = () => {
      if (near && (!panel || panel.hasAttribute("data-current"))) void video.play().catch(() => {});
      else video.pause();
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        sync();
      },
      { rootMargin: "25% 0px" },
    );
    io.observe(video);
    const mo = new MutationObserver(sync);
    if (panel) mo.observe(panel, { attributes: true, attributeFilter: ["data-current"] });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [still]);

  return (
    <>
      <video ref={ref} src={src} poster={poster} muted loop playsInline preload="none" aria-label={label} />
      {still ? (
        <button type="button" className={s.clipBtn} onClick={() => setPressed(true)}>
          Play the clip
        </button>
      ) : null}
    </>
  );
}
