import Reveal from "@/components/Reveal";
import TrackedLink, { external } from "@/components/ui/TrackedLink";
import { ArrowUpRight, Github } from "@/components/ui/icons";
import { site } from "@/data/site";

/**
 * Everything else lives on GitHub — one centered link under the featured three.
 */
export default function ProjectList() {
  return (
    <Reveal as="div" className="mt-20 border-t border-border pt-8 text-center md:mt-28">
      <TrackedLink
        {...external}
        href={site.github}
        event="other_projects_github"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
      >
        <Github className="h-4 w-4" />
        <span>See the rest on GitHub</span>
        <ArrowUpRight className="h-3.5 w-3.5" />
      </TrackedLink>
    </Reveal>
  );
}
