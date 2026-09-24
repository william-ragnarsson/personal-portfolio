"use client";

import { useEffect, useRef } from "react";
import { useInView } from "@/hooks/useInView";
import { useResizeEffect } from "@/hooks/useResizeEffect";

/**
 * A word that opens from the font's narrowest width to the widest that still
 * fits its line, once it scrolls into view. The CSS transitions
 * `font-variation-settings` to `--fit`; this measures `--fit` with the
 * transition switched off, so it never reads a half-animated width.
 */
export default function StretchName({ children, className }: { children: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);

  const fit = () => {
    const el = ref.current;
    const room = el?.parentElement?.clientWidth;
    if (!el || !room) return;
    const was = el.style.transition;
    el.style.transition = "none";
    let lo = 75;
    let hi = 125;
    for (let k = 0; k < 14; k++) {
      const m = (lo + hi) / 2;
      el.style.fontVariationSettings = `"wdth" ${m}, "wght" 800`;
      if (el.getBoundingClientRect().width <= room) lo = m;
      else hi = m;
    }
    el.style.fontVariationSettings = "";
    el.style.setProperty("--fit", lo.toFixed(2));
    // Flush the style change before the transition comes back.
    void el.offsetWidth;
    el.style.transition = was;
  };

  useResizeEffect(fit, () => [ref.current?.parentElement]);
  useEffect(() => {
    void document.fonts.ready.then(fit);
  }, []);

  return (
    <span ref={ref} className={className} data-in={inView ? "" : undefined}>
      {children}
    </span>
  );
}
