"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

// The page has ~30 reveal-on-scroll elements. Each one owning its own
// IntersectionObserver means 30 separate observation contexts for what is the
// same question asked with the same options — so they all share one here,
// created lazily and torn down when the last subscriber leaves.

/** Matches the `.reveal` trigger point: 90px inside the bottom edge. */
const REVEAL_MARGIN_PX = 90;

type Callback = (inView: boolean) => void;

let observer: IntersectionObserver | null = null;
const callbacks = new Map<Element, Callback>();

// An IntersectionObserver only reports threshold *crossings*. If an element
// goes from below the viewport to above it between two samples — a fast flick,
// an anchor jump, or a reload that restores scroll position mid-page — its
// ratio never leaves 0, so no callback ever fires and the element stays hidden
// for good. This sweep is the safety net: it runs when scrolling settles, and
// only while something is still waiting.
function sweep() {
  for (const [el, cb] of callbacks) {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - REVEAL_MARGIN_PX) cb(true);
  }
}

let sweepQueued = false;
function queueSweep() {
  if (sweepQueued) return;
  sweepQueued = true;
  requestAnimationFrame(() => {
    sweepQueued = false;
    sweep();
  });
}

// `scrollend` fires once per gesture; the plain `scroll` fallback is for
// browsers without it. Either way the work is rAF-coalesced and the listener
// only exists while elements are still pending.
const SWEEP_EVENT = typeof window !== "undefined" && "onscrollend" in window ? "scrollend" : "scroll";

function setListener(active: boolean) {
  if (typeof window === "undefined") return;
  const method = active ? "addEventListener" : "removeEventListener";
  window[method](SWEEP_EVENT, queueSweep, { passive: true } as AddEventListenerOptions);
}

function getObserver() {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) callbacks.get(entry.target)?.(entry.isIntersecting);
    },
    { rootMargin: `-${REVEAL_MARGIN_PX}px` },
  );
  return observer;
}

function observe(el: Element, cb: Callback) {
  const first = callbacks.size === 0;
  callbacks.set(el, cb);
  getObserver().observe(el);
  if (first) setListener(true);

  return () => {
    callbacks.delete(el);
    observer?.unobserve(el);
    if (callbacks.size === 0) {
      observer?.disconnect();
      observer = null;
      setListener(false);
    }
  };
}

/**
 * True once `ref`'s element has scrolled into view. With `once` (the default)
 * it latches and stops observing, matching the one-shot reveal behaviour.
 */
export function useInView(ref: RefObject<Element | null>, once = true) {
  const [inView, setInView] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || done.current) return;

    let unobserve: (() => void) | undefined;
    unobserve = observe(el, (visible) => {
      if (visible && once) {
        done.current = true;
        setInView(true);
        unobserve?.();
        unobserve = undefined;
      } else {
        setInView(visible);
      }
    });

    // Covers the case where the element is already past the trigger point on
    // mount — a reload with a restored scroll position.
    queueSweep();

    return () => unobserve?.();
  }, [ref, once]);

  return inView;
}
