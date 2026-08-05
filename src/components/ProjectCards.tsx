import Image from "next/image";
import Reveal from "@/components/Reveal";
import TrackedLink, { external } from "@/components/ui/TrackedLink";
import { projectCards } from "@/data/content";
import { ArrowUpRight } from "@/components/ui/icons";

/**
 * The six projects that have a screenshot, as a two-up grid of image cards.
 * Whole card is one link; the screenshots carry the weight so the copy stays small.
 */
export default function ProjectCards() {
  return (
    <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      {projectCards.map((project, i) => (
        <Reveal as="li" key={project.name} delay={0.05 * i}>
          <TrackedLink
            href={project.href}
            {...external}
            event="project_clicked"
            properties={{
              project_name: project.name,
              link_type: project.linkLabel === "Live demo" ? "demo" : "repo",
              surface: "card",
            }}
            className="group flex h-full flex-col overflow-hidden rounded-md border border-border bg-background-soft shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md"
          >
            <div className="relative aspect-[16/10] overflow-hidden border-b border-border">
              <Image
                src={project.image}
                alt={project.imageAlt}
                fill
                sizes="(min-width: 768px) 260px, (min-width: 640px) 400px, 100vw"
                className="object-cover object-top motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.04]"
              />
            </div>

            <div className="flex flex-1 flex-col p-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium">{project.name}</h3>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 translate-y-0.5 text-muted transition-colors group-hover:text-accent" />
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted">
                {project.blurb}
              </p>
              <span className="kicker mt-auto pt-3 text-[0.625rem] text-muted transition-colors group-hover:text-accent">
                {project.linkLabel}
              </span>
            </div>
          </TrackedLink>
        </Reveal>
      ))}
    </ul>
  );
}
