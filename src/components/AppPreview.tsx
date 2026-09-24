"use client";

import { useRef } from "react";
import { useResizeEffect } from "@/hooks/useResizeEffect";
import { external } from "@/lib/links";
import s from "./sections/PlugAndPlay.module.css";

/** The app is laid out at this size and scaled to fit, so it always looks
 *  like the desktop app rather than reflowing to the frame's width. */
const APP_W = 1280;
/** The app is a rounded card on a page of its own: 24px of that page and a
 *  1px rim, cropped off each side so only the app shows.
 *  PlugAndPlay.module.css has the same number. */
const CROP = 25;

/**
 * The real app, running, as the picture. It's inert (no focus, no pointer,
 * hidden from assistive tech) and a link laid over it opens the app itself.
 */
export default function AppPreview({ src, title }: { src: string; title: string }) {
  const box = useRef<HTMLDivElement>(null);

  useResizeEffect(
    () => {
      const el = box.current;
      if (el) el.style.setProperty("--k", (el.clientWidth / (APP_W - 2 * CROP)).toFixed(4));
    },
    () => [box.current],
  );

  return (
    <div ref={box} className={`media ${s.app}`}>
      <iframe
        className={s.frame}
        src={src}
        title={title}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin"
        inert
      />
      <a href={src} {...external} className={s.open} aria-label={`Open ${title}`} />
    </div>
  );
}
