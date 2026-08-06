"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * A couple of soft cobalt/coral blobs that drift slowly as you scroll — the
 * "moving background" touch. Fixed, non-interactive, low opacity.
 *
 * These are the most expensive thing on the page per pixel: a large blur has to
 * be rasterised, and anything that dirties the layer makes the compositor redo
 * it. Three rules keep them cheap:
 *   - only `transform` animates, so the raster is reused and just re-composited
 *   - `will-change: transform` pins each blob to its own layer up front
 *   - `contain: paint` keeps their paint from affecting anything outside
 * The third blob is dropped below `md` in CSS rather than JS — a media query
 * costs nothing and can't disagree with the server-rendered markup.
 */
export default function FloatingShapes() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "-38%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "26%"]);
  const y3 = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);

  if (reduce) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ contain: "paint" }}
    >
      <motion.div
        style={{ y: y1, willChange: "transform" }}
        className="absolute -left-40 top-[8%] h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-[80px] md:h-[36rem] md:w-[36rem]"
      />
      <motion.div
        style={{ y: y2, willChange: "transform" }}
        className="absolute -right-40 top-[42%] h-[26rem] w-[26rem] rounded-full bg-accent-2/10 blur-[80px] md:h-[34rem] md:w-[34rem]"
      />
      <motion.div
        style={{ y: y3, willChange: "transform" }}
        className="absolute left-[30%] top-[78%] hidden h-[28rem] w-[28rem] rounded-full bg-accent/[0.07] blur-[80px] md:block"
      />
    </div>
  );
}
