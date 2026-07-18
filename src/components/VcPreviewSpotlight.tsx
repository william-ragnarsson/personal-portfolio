"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import posthog from "posthog-js";
import { site } from "@/data/site";
import { ArrowUpRight, Github } from "@/components/ui/icons";

function PreviewCard({ animated = false }: { animated?: boolean }) {
  const className =
    "group block overflow-hidden rounded-2xl border border-border bg-background-soft shadow-sm transition-transform hover:-translate-y-0.5";

  const content = (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <span className="flex items-center gap-1.5 truncate font-mono text-xs text-muted">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-accent-2/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-accent/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted/30" />
          </span>
          <span className="ml-2 truncate">vcanalyst.williamragnarsson.dev</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium transition-colors group-hover:text-accent">
          Open <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="relative aspect-[16/10] w-full bg-background">
        <iframe
          src={site.vcDemo}
          title="VC Analyst - live preview"
          loading="lazy"
          tabIndex={-1}
          className="pointer-events-none absolute left-0 top-0 h-[200%] w-[200%] origin-top-left scale-50 border-0"
        />
      </div>
    </>
  );

  const props = {
    href: site.vcDemo,
    target: "_blank",
    rel: "noopener noreferrer",
    className,
    onClick: () => posthog.capture("vc_analyst_demo_clicked", { source: "card" }),
  };

  return animated ? (
    <motion.a {...props}>{content}</motion.a>
  ) : (
    <a {...props}>{content}</a>
  );
}

export default function VcPreviewSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 70%", "end 55%"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 1], [0, 1, 1]);
  const y = useTransform(scrollYProgress, [0, 0.2, 1], [22, 0, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.42, 1], [0.985, 1, 1.006, 1]);
  const boxShadow = useTransform(
    scrollYProgress,
    [0.18, 0.38, 0.65],
    [
      "0 1px 2px rgba(22, 21, 15, 0.05)",
      "0 18px 44px rgba(43, 92, 255, 0.16)",
      "0 1px 2px rgba(22, 21, 15, 0.05)",
    ],
  );

  if (reduce) {
    return (
      <div className="mt-9">
        <PreviewCard />
        <PreviewLinks />
      </div>
    );
  }

  return (
    <div ref={ref} className="relative mt-9 h-[115vh] min-h-[720px]">
      <div className="sticky top-[14vh]">
        <motion.div style={{ opacity, y }}>
          <motion.div className="rounded-2xl" style={{ scale, boxShadow }}>
            <PreviewCard animated />
          </motion.div>
          <PreviewLinks />
        </motion.div>
      </div>
    </div>
  );
}

function PreviewLinks() {
  return (
    <div className="mt-4 flex flex-wrap gap-5 text-sm">
      <a
        href={site.vcDemo}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium transition-colors hover:text-accent"
        onClick={() => posthog.capture("vc_analyst_demo_clicked", { source: "try_it_out" })}
      >
        Try it out yourself <ArrowUpRight className="h-4 w-4" />
      </a>
      <a
        href={site.vcRepo}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-foreground"
        onClick={() => posthog.capture("vc_analyst_repo_clicked")}
      >
        <Github className="h-4 w-4" /> Source
      </a>
    </div>
  );
}
