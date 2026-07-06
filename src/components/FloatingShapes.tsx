"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * A couple of soft cobalt/coral blobs that drift slowly as you scroll — the
 * "moving background" touch. Fixed, non-interactive, low opacity.
 */
export default function FloatingShapes() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "-38%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "26%"]);
  const y3 = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);

  if (reduce) return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        style={{ y: y1 }}
        className="absolute -left-40 top-[8%] h-[36rem] w-[36rem] rounded-full bg-accent/10 blur-[110px]"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute -right-40 top-[42%] h-[34rem] w-[34rem] rounded-full bg-accent-2/10 blur-[110px]"
      />
      <motion.div
        style={{ y: y3 }}
        className="absolute left-[30%] top-[78%] h-[28rem] w-[28rem] rounded-full bg-accent/[0.07] blur-[100px]"
      />
    </div>
  );
}
