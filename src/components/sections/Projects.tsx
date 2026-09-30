import Image, { getImageProps } from "next/image";
import type { CSSProperties, ReactNode } from "react";
import Arrow from "@/components/Arrow";
import ProjectClip from "@/components/ProjectClip";
import ProjectsStage from "@/components/ProjectsStage";
import { getProjects, type Project } from "@/data/projects";
import { site } from "@/data/site";
import { external } from "@/lib/links";
import s from "./Projects.module.css";

const SIZES = "(width < 48rem) 90vw, 600px";

/** `**words**` in a project's story are highlighted. */
function inline(text: string): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part));
}

const number = (i: number) => String(i + 1).padStart(2, "0");

const ratio = (p: Project) => p.width / p.height;

/**
 * The picture is the project's link too: a link laid over it, and a label
 * that says where it goes. A mouse sees the label on hover; a touch screen
 * has no hover, so it's always there. The frame takes the picture's own
 * shape, so nothing is cropped.
 */
function Media({ p }: { p: Project }) {
  const clip = p.video && p.videoReady ? p.video : null;
  return (
    <div className={`media ${s.frame}`} style={{ "--ar": ratio(p) } as CSSProperties}>
      {clip ? (
        <ProjectClip
          src={clip}
          poster={getImageProps({ src: p.image, alt: "", width: p.width, height: p.height }).props.src}
          label={p.imageAlt}
        />
      ) : (
        <Image src={p.image} alt={p.imageAlt} fill sizes={SIZES} />
      )}
      <a href={p.href} {...external} className="media-link" aria-label={`${p.name}: ${p.linkLabel}`}>
        <span className="media-chip" aria-hidden>
          {p.linkLabel}
          <Arrow />
        </span>
      </a>
    </div>
  );
}

function Links({ p }: { p: Project }) {
  return (
    <div className="links">
      <a href={p.href} {...external} className="link" data-primary>
        {p.linkLabel}
        <Arrow />
      </a>
      {p.repo ? (
        <a href={p.repo} {...external} className="link">
          GitHub
          <Arrow />
        </a>
      ) : null}
    </div>
  );
}

export default function Projects() {
  const featured = getProjects().filter((p) => p.featured);
  return (
    <section id="projects" className={`tone-light ${s.root}`} data-tone="light">
      <div className={`box ${s.intro}`}>
        <h2 className="hd">
          Some of my <span className="hl">other projects</span>&nbsp;:)
        </h2>
        <p className="copy">Simulators, algorithms, half-finished projects, most of it can be found on my Github!</p>
      </div>

      <ProjectsStage className={s.track} count={featured.length}>
        <div className={s.stage} data-stage>
          <div
            className={s.grid}
            data-grid
            style={{ "--ar-min": Math.min(...featured.map(ratio)) } as CSSProperties}
          >
            <nav className={s.nav} aria-label="Projects" data-nav>
              {featured.map((p, i) => (
                <a
                  key={p.slug}
                  href={`#project-${p.slug}`}
                  className={s.pick}
                  data-pick={i}
                  aria-current={i === 0 ? "true" : undefined}
                >
                  <span className={s.pickIdx}>{number(i)}</span>
                  <span className={s.tick} aria-hidden>
                    <b data-tick />
                  </span>
                  <span className={s.pickName}>{p.name}</span>
                </a>
              ))}
            </nav>

            {featured.map((p, i) => (
              <article
                key={p.slug}
                id={`project-${p.slug}`}
                className={s.panel}
                data-panel
                data-current={i === 0 ? "" : undefined}
              >
                <div className={s.pic} data-pic>
                  <Media p={p} />
                </div>
                <div className={s.story} data-story>
                  <p className={s.idx}>{number(i)}</p>
                  <h3 className={s.name}>{p.name}</h3>
                  <p className={s.blurb}>{p.blurb}</p>
                  {p.details.map((d, j) => (
                    <p key={j} className="copy">
                      {inline(d)}
                    </p>
                  ))}
                  <p className={s.stack}>{p.stack.join(" · ")}</p>
                  <Links p={p} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </ProjectsStage>

      <div className={`box ${s.outro}`}>
        <p className={s.gh}>
          <a href={site.github} {...external} className="link">
            See the rest on GitHub
            <Arrow />
          </a>
        </p>
      </div>
    </section>
  );
}
