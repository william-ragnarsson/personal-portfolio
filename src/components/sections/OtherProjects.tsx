"use client";

import posthog from "posthog-js";
import Reveal from "@/components/Reveal";
import ProjectCards from "@/components/ProjectCards";
import { site } from "@/data/site";
import { Github } from "@/components/ui/icons";

export default function OtherProjects() {
  return (
    <section className="mx-auto max-w-[820px] px-6 py-24 sm:py-32">
      <Reveal>
        <p className="kicker text-accent-2">03 — Projects</p>
      </Reveal>

      <Reveal delay={0.05}>
        <h2 className="display mt-5 text-[clamp(2rem,5.5vw,3.6rem)] leading-[1.05]">
          Have a look at <span className="text-accent-2">all of my projects</span> :)
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Simulators, databases, dev tools, half-finished experiments. Most of it
          lives on my GitHub.
        </p>
      </Reveal>

      <Reveal delay={0.14}>
        <a
          href={site.github}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
          onClick={() => posthog.capture("github_profile_clicked")}
        >
          <Github className="h-4 w-4" /> github.com/{site.githubHandle}
        </a>
      </Reveal>

      <ProjectCards />
    </section>
  );
}
