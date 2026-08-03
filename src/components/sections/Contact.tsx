"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import posthog from "posthog-js";
import { site } from "@/data/site";
import { ArrowUpRight, Linkedin, Mail } from "@/components/ui/icons";

/** Shared pill geometry — scaled up from the button in OtherProjects. */
const CTA_BASE =
  "group inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-4 text-base font-medium transition-all hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent sm:text-lg";

/** Headline plus the two CTAs. Nothing else — the ask is the whole page. */
function Panel() {
  return (
    <>
      <h2 className="display text-[clamp(3rem,9vw,7rem)]">
        Let&apos;s <span className="text-accent-2">Talk!</span>
      </h2>

      <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
        <a
          href={`mailto:${site.email}`}
          className={`${CTA_BASE} bg-accent-2 text-background shadow-[0_10px_30px_rgba(255,90,77,0.28)] hover:shadow-[0_14px_36px_rgba(255,90,77,0.36)]`}
          onClick={() => posthog.capture("contact_link_clicked", { link_type: "email" })}
        >
          <Mail className="h-5 w-5" />
          Send me an email
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>

        <a
          href={site.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className={`${CTA_BASE} border border-border text-foreground hover:border-ink`}
          onClick={() => posthog.capture("contact_link_clicked", { link_type: "linkedin" })}
        >
          <Linkedin className="h-5 w-5" />
          Connect on LinkedIn
        </a>
      </div>

      <p className="mt-6 text-sm text-muted">
        or reach me directly at{" "}
        <a
          href={`mailto:${site.email}`}
          className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-accent-2"
          onClick={() => posthog.capture("contact_link_clicked", { link_type: "email_inline" })}
        >
          {site.email}
        </a>
      </p>
    </>
  );
}

/**
 * The closing bookend to the Hero: scrolling the last stretch pins this panel
 * and lands "Let's Talk!" filling the viewport — nothing left to read.
 */
export default function Contact() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 85%", "start start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.45], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 0.55], [40, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.55], [0.96, 1]);

  if (reduce) {
    return (
      <section className="flex min-h-screen flex-col justify-center py-24">
        <div className="mx-auto w-full max-w-[1100px] px-6 text-center">
          <Panel />
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[170vh]">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <motion.div
          className="mx-auto w-full max-w-[1100px] px-6 text-center"
          style={{ opacity, y, scale }}
        >
          <Panel />
        </motion.div>
      </div>
    </section>
  );
}
