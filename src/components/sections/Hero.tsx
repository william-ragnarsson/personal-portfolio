"use client";

import { useEffect, useRef } from "react";
import { clamp, easeOut3, lerp } from "@/lib/globe/math";
import { hasFinePointer, prefersReducedMotion } from "@/lib/mode";
import styles from "./Hero.module.css";

const LINES = ["Hi, I’m", "William."];
const MIN = 75;
const MAX = 125;

type Letter = { el: HTMLElement; line: number; cx: number; cy: number; slope: number; p: number; w: number };

const fvs = (wdth: number) => `"wdth" ${wdth.toFixed(2)}, "wght" 800`;

/**
 * The opening poster: "Hi, I'm / William." stretched across the screen.
 *
 * Both lines share one size; each gets its own width (the font's `wdth` axis,
 * 75–125) so it reaches the right edge if it can. The name opens from its
 * narrowest once the font is in. Under a mouse, the letters nearest the
 * pointer widen and the rest of the line gives up the room, so its length
 * holds.
 *
 * The server renders every letter at wdth 75 with a CSS estimate of the size,
 * which is exactly the animation's first frame: nothing jumps when this takes
 * over. Changing `font-variation-settings` re-lays out text, the one exception
 * to "transform and opacity only" on this page; `contain` keeps that layout
 * inside the heading.
 */
export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const name = nameRef.current;
    const sub = subRef.current;
    if (!hero || !name || !sub) return;

    const lines = [...name.querySelectorAll<HTMLElement>("[data-line]")];
    const letters: Letter[] = lines.flatMap((line, i) =>
      [...line.querySelectorAll<HTMLElement>("[data-ch]")].map((el) => ({
        el,
        line: i,
        cx: 0,
        cy: 0,
        slope: 0,
        p: 0,
        w: MIN,
      })),
    );
    const reduce = prefersReducedMotion();
    const hover = hasFinePointer() && !reduce;

    let base = lines.map(() => MIN);
    let fs = 0;
    // The hero's size at the last fit.
    let fitW = 0;
    let fitH = 0;
    let heroTop = 0;
    let opened = reduce;
    let t0 = 0;
    let raf = 0;
    let last = 0;
    let inside = false;
    let mx = 0;
    let my = 0;
    let disposed = false;

    const setLine = (i: number, wdth: number) => {
      for (const l of letters) if (l.line === i) l.el.style.fontVariationSettings = fvs(wdth);
    };
    const lineWidth = (i: number) => lines[i].getBoundingClientRect().width;

    function fit() {
      fitW = hero!.clientWidth;
      fitH = hero!.clientHeight;
      const W = fitW - 2 * name!.offsetLeft;
      const H = fitH;
      if (W <= 0 || H <= 0) return;

      // One size for both lines, chosen so each can reach the full width
      // somewhere inside the axis range.
      name!.style.fontSize = "100px";
      let hi = H * 0.31;
      let lo = 0;
      lines.forEach((_, i) => {
        setLine(i, MIN);
        hi = Math.min(hi, (W / lineWidth(i)) * 100);
        setLine(i, MAX);
        lo = Math.max(lo, (W / lineWidth(i)) * 100);
      });
      fs = lo <= hi ? Math.min(hi, Math.sqrt(lo * hi)) : hi;
      name!.style.fontSize = "";
      hero!.style.setProperty("--fs", `${fs}px`);

      base = lines.map((_, i) => {
        let a = MIN;
        let b = MAX;
        for (let k = 0; k < 16; k++) {
          const m = (a + b) / 2;
          setLine(i, m);
          if (lineWidth(i) < W) a = m;
          else b = m;
        }
        return a;
      });

      // Each letter's width per unit of wdth, so the hover can widen some and
      // narrow the others by the same total.
      const widths = (w: number) => {
        lines.forEach((_, i) => setLine(i, w));
        return letters.map((l) => l.el.getBoundingClientRect().width);
      };
      const narrow = widths(MIN);
      const wide = widths(MAX);
      letters.forEach((l, i) => (l.slope = Math.max(1e-3, (wide[i] - narrow[i]) / (MAX - MIN))));

      lines.forEach((_, i) => setLine(i, base[i]));
      const box = hero!.getBoundingClientRect();
      heroTop = box.top + window.scrollY;
      for (const l of letters) {
        const r = l.el.getBoundingClientRect();
        l.cx = r.left + r.width / 2 - box.left;
        l.cy = r.top + r.height / 2 - box.top;
        l.w = base[l.line];
      }

      // Centre the group on tall screens, a little above the middle. The gap
      // under the name is CSS; read it back rather than duplicate it.
      const gap = sub!.offsetTop - name!.offsetTop - 2 * fs;
      const top = Math.max(H * 0.075, (H - 2 * fs - gap - sub!.offsetHeight) * 0.45);
      hero!.style.setProperty("--top", `${top}px`);

      if (!opened) lines.forEach((_, i) => setLine(i, MIN));
    }

    function frame(now: number) {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      let busy = false;

      const sum = lines.map(() => 0);
      const weight = lines.map(() => 0);
      for (const l of letters) {
        if (hover) {
          const dx = (l.cx - mx) / fs;
          const dy = (l.cy - my) / (fs * 0.85);
          const target = inside ? Math.exp(-(dx * dx + dy * dy)) : 0;
          l.p += (target - l.p) * (1 - Math.exp(-dt * 10));
          if (Math.abs(target - l.p) > 1e-3) busy = true;
        }
        sum[l.line] += l.slope * l.p;
        weight[l.line] += l.slope;
      }

      for (const l of letters) {
        const i = l.line;
        let b = base[i];
        if (!opened) {
          const e = clamp((now - t0 - 150 - i * 120) / 1100, 0, 1);
          if (e < 1) busy = true;
          b = lerp(MIN, base[i], easeOut3(e));
        }
        // Push towards the pointer, pull back by the line's weighted mean so
        // the total width is unchanged.
        const amp = (MAX - base[i]) * 0.9;
        const w = clamp(b + amp * (l.p - sum[i] / weight[i]), MIN, MAX);
        if (Math.abs(w - l.w) > 0.05) {
          l.w = w;
          l.el.style.fontVariationSettings = fvs(w);
        }
      }
      if (!opened && !busy) opened = true;
      if (busy) raf = requestAnimationFrame(frame);
      else last = 0;
    }

    const kick = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(frame);
    };

    // The hero is full width, so only its top needs tracking.
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mx = e.clientX;
      my = e.clientY + window.scrollY - heroTop;
      inside = true;
      kick();
    };
    const leave = () => {
      inside = false;
      kick();
    };

    let pending = 0;
    const refit = () => {
      if (pending || disposed) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        opened = true;
        fit();
        lines.forEach((_, i) => setLine(i, base[i]));
      });
    };
    // A ResizeObserver also reports once when it starts observing. Only a
    // real change in size refits: refitting cuts the open animation short.
    const observer = new ResizeObserver(() => {
      if (hero.clientWidth !== fitW || hero.clientHeight !== fitH) refit();
    });

    // Measure with the real font, not the fallback. Give up waiting after a
    // while; if the font turns up later, refit then.
    const font = `800 100px ${getComputedStyle(name).fontFamily}`;
    let realFont = false;
    const fontArrived = () => {
      if (!realFont && document.fonts.check(font)) {
        realFont = true;
        refit();
      }
    };
    void Promise.race([document.fonts.load(font), new Promise((resolve) => setTimeout(resolve, 2500))]).then(() => {
      if (disposed) return;
      realFont = document.fonts.check(font);
      fit();
      t0 = performance.now();
      if (opened) lines.forEach((_, i) => setLine(i, base[i]));
      else kick();
      observer.observe(hero);
      document.fonts.addEventListener("loadingdone", fontArrived);
      if (hover) {
        hero.addEventListener("pointermove", move, { passive: true });
        hero.addEventListener("pointerleave", leave);
      }
    });

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      if (pending) cancelAnimationFrame(pending);
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", fontArrived);
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <section ref={heroRef} className={`${styles.hero} tone-blue`} data-tone="blue">
      <h1 ref={nameRef} className={styles.name}>
        <span className="sr-only">Hi, I&rsquo;m William.</span>
        {LINES.map((line) => (
          <span key={line} className={styles.line} data-line="" aria-hidden="true">
            {[...line].map((ch, i) => (
              <span key={i} className={styles.ch} data-ch="">
                {ch}
              </span>
            ))}
          </span>
        ))}
      </h1>
      <p ref={subRef} className={styles.sub}>
        Obsessive learner, with a
        <br />
        <span className={styles.hl}>big love for startups</span>
      </p>
    </section>
  );
}
