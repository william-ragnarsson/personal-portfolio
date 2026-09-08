import Image from "next/image";
import Reveal from "@/components/Reveal";
import ProjectVideo from "@/components/ProjectVideo";
import TrackedLink, { external } from "@/components/ui/TrackedLink";
import type { Project } from "@/data/projects";
import { ArrowUpRight, Github } from "@/components/ui/icons";

/**
 * One project as a full editorial block: a large visual on one side, the story
 * on the other.
 *
 * The image side alternates down the column — that flip is done in CSS by
 * `OtherProjects` (`nth-child(even) .feature-media { order: last }`), so this
 * component renders the same tree at every width. `.feature-media` is the hook
 * for that selector: don't rename it without updating `OtherProjects`.
 */
export default function ProjectFeature({
  project,
  index,
}: {
  project: Project;
  /** 1-based position among the featured blocks, shown as the `01` kicker. */
  index: number;
}) {
  const isDemo = project.linkLabel === "Live demo";

  return (
    <Reveal as="div" className="grid items-start gap-8 md:grid-cols-2 md:gap-12">
      <div className="feature-media">
        {/* Every feature visual is the same square, capped a touch below the
            column width, so the blocks read as a set however their media
            differs. */}
        <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-2xl border border-border bg-background-soft shadow-sm">
          {project.video ? (
            <div className="aspect-square">
              <ProjectVideo
                src={project.video}
                poster={project.image}
                alt={project.imageAlt}
              />
            </div>
          ) : (
            <div className="relative aspect-square">
              <Image
                src={project.image}
                alt={project.imageAlt}
                fill
                sizes="(min-width: 768px) 360px, 100vw"
                className="object-cover object-top"
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="kicker text-[0.62rem]">
          <span className="text-accent-2">{String(index).padStart(2, "0")}</span>
          <span className="text-muted"> · {project.linkLabel}</span>
        </p>

        <h3 className="display mt-3 text-[clamp(1.5rem,3.5vw,2rem)]">{project.name}</h3>

        <p className="mt-3 text-lg leading-snug">{project.blurb}</p>

        {project.details.map((paragraph) => (
          <p key={paragraph} className="mt-3 text-sm leading-relaxed text-muted">
            {paragraph}
          </p>
        ))}

        {project.stack.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-1.5">
            {project.stack.map((tech) => (
              <li
                key={tech}
                className="rounded-full border border-border px-2.5 py-1 font-mono text-[0.68rem] text-muted"
              >
                {tech}
              </li>
            ))}
          </ul>
        )}

        <TrackedLink
          href={project.href}
          {...external}
          event="project_link_clicked"
          properties={{
            project_name: project.name,
            link_type: isDemo ? "demo" : "repo",
            surface: "feature",
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
        >
          {isDemo ? (
            <>
              Open live demo <ArrowUpRight className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              <Github className="h-4 w-4" /> View on GitHub
            </>
          )}
        </TrackedLink>
      </div>
    </Reveal>
  );
}
