"use client";

import { useEffect, useRef } from "react";
import { subscribeFrame } from "@/lib/frame";
import { hasFinePointer } from "@/lib/mode";
import { probeTone, type Tone } from "@/lib/cursorTone";

const COLOR: Record<Tone, string> = { blue: "#fff5e7", light: "#052144", yellow: "#052144" };
const INTERACTIVE = "a, button, [role='button'], label, summary, select";
// Over these the system cursor is more useful: a text caret, or whatever an
// embedded page shows.
const NATIVE = "input, textarea, [contenteditable='true'], iframe";

/**
 * A dot and a ring that sit exactly on the pointer: no easing, no trail. The
 * ring grows over anything clickable. Mouse and trackpad only; the system
 * cursor stays until this has mounted, so it's never missing.
 */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasFinePointer()) return;
    const root = document.documentElement;
    root.dataset.cursor = "custom";

    let x = 0;
    let y = 0;
    let shown = false;

    const update = (target: Element | null) => {
      const native = !!target?.closest(NATIVE);
      el.toggleAttribute("data-native", native);
      el.toggleAttribute("data-link", !native && !!target?.closest(INTERACTIVE));
      const section = target?.closest<HTMLElement>("[data-tone]");
      const tone = probeTone(x, y) ?? (section?.dataset.tone as Tone | undefined) ?? "blue";
      el.style.color = COLOR[tone];
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      x = e.clientX;
      y = e.clientY;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (!shown) {
        shown = true;
        el.setAttribute("data-on", "");
      }
      update(e.target as Element);
    };
    const hide = () => {
      shown = false;
      el.removeAttribute("data-on");
    };
    const down = () => el.setAttribute("data-down", "");
    const up = () => el.removeAttribute("data-down");

    // Scrolling moves the page under a still pointer.
    const unsubscribe = subscribeFrame(() => {
      if (shown) update(document.elementFromPoint(x, y));
    });

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    root.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    return () => {
      unsubscribe();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      root.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      delete root.dataset.cursor;
    };
  }, []);

  return (
    <div ref={ref} className="cursor" aria-hidden="true">
      <span className="cursor-ring" />
      <span className="cursor-dot" />
    </div>
  );
}
