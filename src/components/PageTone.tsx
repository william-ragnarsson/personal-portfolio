"use client";

import { useEffect, useRef } from "react";
import { subscribeFrame, requestFrame } from "@/lib/frame";
import { useResizeEffect } from "@/hooks/useResizeEffect";

const TONES = { blue: "#0054a2", light: "#fff5e7", yellow: "#ffc576" } as const;
type Tone = keyof typeof TONES;

/**
 * The colour behind the page: blue down to the hackathons, cream from there,
 * yellow once New York's land has filled the screen.
 *
 * Sections paint their own backgrounds, so this only shows in the overscroll
 * bounce and along the edges of the two globe stages, which are transparent so
 * their canvas can paint the page colour itself. It also tints the browser UI
 * (`theme-color`) on phones.
 */
export default function PageTone() {
  const edges = useRef({ light: Infinity, yellow: Infinity });
  const current = useRef<Tone | null>(null);

  useResizeEffect(
    () => {
      const hack = document.getElementById("hackathons");
      const contact = document.getElementById("contact");
      if (!hack || !contact) return;
      const y = window.scrollY;
      edges.current = {
        light: hack.getBoundingClientRect().top + y,
        // The contact section's top reaching the bottom of the viewport.
        yellow: contact.getBoundingClientRect().top + y,
      };
      requestFrame();
    },
    () => [document.body],
  );

  useEffect(
    () =>
      subscribeFrame((y, vh) => {
        const { light, yellow } = edges.current;
        const tone: Tone = y < light ? "blue" : y < yellow - vh - 2 ? "light" : "yellow";
        if (tone === current.current) return;
        current.current = tone;
        document.documentElement.style.backgroundColor = TONES[tone];
        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", TONES[tone]);
      }),
    [],
  );

  return null;
}
