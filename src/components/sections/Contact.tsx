"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import posthog from "posthog-js";
import { site } from "@/data/site";
import { ArrowUpRight } from "@/components/ui/icons";

const links = [
  { label: "Email", href: `mailto:${site.email}`, value: site.email },
  { label: "LinkedIn", href: site.linkedin, value: "william-ragnarsson" },
];

/** Headline, sub-line and links — the whole closing statement. */
function Panel() {
  return (
    <>
      <h2 className="display text-[clamp(3rem,9vw,7rem)]">
        Let&apos;s <span className="text-accent-2">Talk!</span>
      </h2>

      <p className="mt-8 max-w-3xl text-xl font-medium leading-snug text-ink sm:text-3xl">
        I&apos;m always looking to work on ambitious projects, with talented
        people, and go big!
      </p>

      <div className="mt-10 divide-y divide-border border-y border-border">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-6 py-4"
            onClick={() => posthog.capture("contact_link_clicked", { link_type: l.label.toLowerCase() })}
          >
            <span className="flex items-baseline gap-4">
              <span className="kicker w-20 text-muted">{l.label}</span>
              <span className="text-lg font-medium sm:text-xl">{l.value}</span>
            </span>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-accent-2" />
          </a>
        ))}
      </div>
    </>
  );
}

function Footer() {
  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-3 px-6 text-sm text-muted">
      <p>
        © {new Date().getFullYear()} {site.name}
      </p>
      <a
        href={site.repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="kicker transition-colors hover:text-accent"
        onClick={() => posthog.capture("source_repo_clicked")}
      >
        View source →
      </a>
    </div>
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
        <div className="mx-auto w-full max-w-[1100px] px-6">
          <Panel />
        </div>
        <div className="mt-16">
          <Footer />
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[170vh]">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <motion.div
          className="mx-auto w-full max-w-[1100px] px-6"
          style={{ opacity, y, scale }}
        >
          <Panel />
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 pb-8">
          <Footer />
        </div>
      </div>
    </section>
  );
}
