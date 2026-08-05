"use client";

import { useRef, type ReactNode } from "react";
import { useInView } from "@/hooks/useInView";

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span" | "p" | "h2";
};

/**
 * Subtle fade + rise as it scrolls into view. Static under reduced motion.
 *
 * This is the most-used component on the page (~30 instances), so it stays
 * plain DOM: the transition is CSS and visibility comes from one shared
 * IntersectionObserver. It used to be a framer `motion` element with
 * `whileInView`, which meant 30 observers and 30 animation components for what
 * is a one-shot, two-property transition.
 *
 * Reduced motion is handled entirely in CSS (see `.reveal` in globals.css), so
 * there's no JS branch that could render differently on server and client.
 */
export default function Reveal({ children, delay = 0, className, as: Tag = "div" }: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);

  return (
    <Tag
      ref={ref as never}
      data-visible={inView ? "true" : "false"}
      className={className ? `reveal ${className}` : "reveal"}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </Tag>
  );
}
