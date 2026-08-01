"use client";

import posthog from "posthog-js";
import Reveal from "@/components/Reveal";
import { site } from "@/data/site";
import { ArrowUpRight, Github } from "@/components/ui/icons";

function PreviewCard() {
  return (
    <a
      href={site.vcDemo}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-2xl border border-border bg-background-soft shadow-sm transition-transform hover:-translate-y-0.5"
      onClick={() => posthog.capture("vc_analyst_demo_clicked", { source: "card" })}
    >
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
    </a>
  );
}

export default function VcPreviewSpotlight() {
  return (
    <Reveal className="mt-9">
      <PreviewCard />
      <PreviewLinks />
    </Reveal>
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
