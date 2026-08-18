"use client";

import { useEffect, useId, useRef } from "react";
import Image from "next/image";
import TrackedLink, { external } from "@/components/ui/TrackedLink";
import type { ProjectCard } from "@/data/content";
import { ArrowUpRight, Close, Github } from "@/components/ui/icons";

/**
 * The long-form view of one project: screenshot and specs on the left, the
 * story on the right.
 *
 * Built on the native `<dialog>` element rather than a hand-rolled overlay —
 * `showModal()` supplies the focus trap, Escape-to-close, the backdrop and
 * inert-ing of the page behind it, none of which is worth reimplementing.
 */
export default function ProjectDialog({
  project,
  index,
  onClose,
}: {
  project: ProjectCard;
  /** 1-based position in the grid, shown as the `01` kicker. */
  index: number;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();

    // Stop the page scrolling underneath the modal. The lock has to go on
    // <html>: body's overflow only propagates to the viewport when html's own
    // overflow is `visible`, and html already carries `overflow-x: clip`.
    // Removing the scrollbar would otherwise shift the layout, so its width is
    // added back as padding. Safe despite the scroll-linked sections either
    // side of this one — the scroll position never moves while the lock is on,
    // and it's released before anything can scroll again.
    const root = document.documentElement;
    const gutter = window.innerWidth - root.clientWidth;
    const previous = { overflowY: root.style.overflowY, paddingRight: root.style.paddingRight };
    root.style.overflowY = "hidden";
    if (gutter > 0) root.style.paddingRight = `${gutter}px`;

    return () => {
      root.style.overflowY = previous.overflowY;
      root.style.paddingRight = previous.paddingRight;
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      // A click that lands on the dialog itself rather than its content is a
      // click on the backdrop, since the content fills the box.
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(920px,92vw)] rounded-lg border border-border bg-background p-0 text-ink shadow-2xl backdrop:bg-ink/60"
    >
      <div className="max-h-[86dvh] overflow-y-auto overscroll-contain">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 cursor-pointer rounded-full p-2 text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Close className="h-4 w-4" />
        </button>

        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-10">
          <div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-md">
              <Image
                src={project.image}
                alt={project.imageAlt}
                fill
                sizes="(min-width: 768px) 420px, 88vw"
                className="object-cover object-top"
              />
            </div>

            {project.stack.length > 0 && (
              <>
                <p className="kicker mt-7 text-[0.6rem] text-muted">Built with</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {project.stack.map((tech) => (
                    <li
                      key={tech}
                      className="rounded-full border border-border px-2.5 py-1 font-mono text-[0.68rem] text-muted"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <TrackedLink
              href={project.href}
              {...external}
              event="project_clicked"
              properties={{
                project_name: project.name,
                link_type: project.linkLabel === "Live demo" ? "demo" : "repo",
                surface: "dialog",
              }}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
            >
              {project.linkLabel === "Live demo" ? (
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

          <div className="md:pr-6">
            <p className="kicker text-[0.62rem]">
              <span className="text-accent">{String(index).padStart(2, "0")}</span>
              <span className="text-muted"> · {project.linkLabel}</span>
            </p>

            <h2 id={titleId} className="display mt-3 text-[clamp(1.6rem,4vw,2.2rem)]">
              {project.name}
            </h2>

            <p className="mt-4 text-lg leading-snug">{project.blurb}</p>

            {project.details.map((paragraph) => (
              <p key={paragraph} className="mt-4 text-sm leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </dialog>
  );
}
