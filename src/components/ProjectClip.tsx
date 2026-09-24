"use client";

import { useEffect, useRef, useState } from "react";
import { useMedia } from "@/hooks/useMedia";
import { REDUCED_MOTION_QUERY } from "@/lib/mode";
import s from "./sections/Projects.module.css";

/**
 * A feature block's looping clip. It plays while it's on screen and pauses
 * when it isn't; nothing is fetched until it's close. With reduced motion it
 * stays on its poster until someone presses play.
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
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { rootMargin: "25% 0px" },
    );
    io.observe(video);
    return () => io.disconnect();
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
