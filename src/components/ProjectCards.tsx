"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import ProjectDialog from "@/components/ProjectDialog";
import type { FocalPoint, Project } from "@/data/projects";
import { capture } from "@/lib/analytics";

/**
 * Tailwind only sees class names it can read as literal strings, so the focal
 * point maps through a lookup rather than being interpolated into a class.
 */
const FOCAL: Record<FocalPoint, string> = {
  top: "object-top",
  center: "object-center",
  bottom: "object-bottom",
  left: "object-left",
  right: "object-right",
};

/**
 * The projects with a screenshot, as a two-up contact sheet.
 *
 * There is deliberately no card chrome — no border, no fill, no frame. The
 * screenshots sit straight on the paper and carry the section on their own;
 * the copy underneath is a caption, not a card body. Two columns rather than
 * three so the shots are large enough to actually read.
 *
 * Clicking a project opens the full write-up in a dialog. Content comes from
 * `content/projects/*.md` via `getProjects()`, which is build-time only — so
 * the server section above reads it and passes it down here.
 */
export default function ProjectCards({ projects }: { projects: Project[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // The dialog unmounts on close, so the browser's own focus restoration
  // doesn't apply — put focus back on the tile that opened it.
  const trigger = useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <ul className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2">
        {projects.map((project, i) => (
          <Reveal as="li" key={project.slug} delay={0.05 * i}>
            <button
              type="button"
              onClick={(e) => {
                trigger.current = e.currentTarget;
                setOpenIndex(i);
                capture("project_opened", { project_name: project.name });
              }}
              className="group block w-full cursor-pointer rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              {/* The whole tile scales on hover, not the image inside its frame —
                  so the screenshot grows as one object rather than zooming
                  behind a fixed window. */}
              <div className="relative aspect-[16/10] overflow-hidden rounded-md motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-[1.02]">
                <Image
                  src={project.image}
                  alt={project.imageAlt}
                  fill
                  sizes="(min-width: 640px) 400px, 100vw"
                  className={`object-cover ${FOCAL[project.focal]}`}
                />
              </div>

              <p className="kicker mt-2.5 text-[0.65rem]">
                <span className="text-accent">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-muted"> · {project.linkLabel}</span>
              </p>
              <h3 className="display mt-1.5 text-[1.15rem]">{project.name}</h3>
              <p className="mt-1 text-sm leading-snug text-muted">{project.blurb}</p>
            </button>
          </Reveal>
        ))}
      </ul>

      {openIndex !== null && (
        <ProjectDialog
          project={projects[openIndex]}
          index={openIndex + 1}
          onClose={() => {
            setOpenIndex(null);
            trigger.current?.focus();
          }}
        />
      )}
    </>
  );
}
