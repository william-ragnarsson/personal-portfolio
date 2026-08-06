import Section, { Prose } from "@/components/ui/Section";
import Reveal from "@/components/Reveal";
import ProjectCards from "@/components/ProjectCards";
import TrackedLink, { external } from "@/components/ui/TrackedLink";
import { site } from "@/data/site";
import { Github } from "@/components/ui/icons";

export default function OtherProjects() {
  return (
    <Section
      kicker="03 — Projects"
      accent="coral"
      title={
        <>
          Have a look at{" "}
          <span className="text-accent-2">all of my projects</span> :)
        </>
      }
    >
      <Prose delay={0.1} className="mt-6 max-w-xl">
        Simulators, databases, dev tools, half-finished experiments. Most of it
        lives on my GitHub.
      </Prose>

      <Reveal delay={0.14}>
        <TrackedLink
          href={site.github}
          {...external}
          event="github_profile_clicked"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
        >
          <Github className="h-4 w-4" /> github.com/{site.githubHandle}
        </TrackedLink>
      </Reveal>

      <ProjectCards />
    </Section>
  );
}
