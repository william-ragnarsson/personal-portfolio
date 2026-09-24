import Image, { getImageProps } from "next/image";
import type { ReactNode } from "react";
import Arrow from "@/components/Arrow";
import ProjectClip from "@/components/ProjectClip";
import TrackedLink, { external } from "@/components/TrackedLink";
import { getProjects, type FocalPoint, type Project } from "@/data/projects";
import { site } from "@/data/site";
import s from "./Projects.module.css";

const POSITION: Record<FocalPoint, string> = {
  top: "50% 0%",
  center: "50% 50%",
  bottom: "50% 100%",
  left: "0% 50%",
  right: "100% 50%",
};

const SIZES = "(width < 48rem) 100vw, 490px";

/** `**words**` in a project's story are highlighted. */
function inline(text: string): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part));
}

function Media({ p }: { p: Project }) {
  const style = { objectPosition: POSITION[p.focal] };
  if (p.video && p.videoReady) {
    const { props } = getImageProps({ src: p.image, alt: "", width: 1320, height: 825 });
    return (
      <div className={`media ${s.pim}`} style={{ ["--pos" as string]: POSITION[p.focal] }}>
        <ProjectClip src={p.video} poster={props.src} label={p.imageAlt} />
      </div>
    );
  }
  return (
    <div className={`media ${s.pim}`}>
      <Image src={p.image} alt={p.imageAlt} fill sizes={SIZES} style={style} />
    </div>
  );
}

function Links({ p }: { p: Project }) {
  const demo = p.linkLabel === "Live demo";
  const track = (type: "demo" | "repo") => ({
    event: "project_link_clicked",
    properties: { project_name: p.name, link_type: type, surface: "feature" },
  });
  return (
    <div className="links">
      <TrackedLink href={p.href} {...external} className="link" data-primary {...track(demo ? "demo" : "repo")}>
        {p.linkLabel}
        <Arrow />
      </TrackedLink>
      {p.repo ? (
        <TrackedLink href={p.repo} {...external} className="link" {...track("repo")}>
          GitHub
          <Arrow />
        </TrackedLink>
      ) : null}
    </div>
  );
}

export default function Projects() {
  const featured = getProjects().filter((p) => p.featured);
  return (
    <section id="projects" className="box tone-light" data-tone="light">
      <h2 className="hd">
        Some of my <span className="hl">other projects</span> :)
      </h2>
      <p className="copy">Simulators, algorithms, half-finished projects, most of it can be found on my Github!</p>

      {featured.map((p) => (
        <article key={p.slug} className={s.pj}>
          <Media p={p} />
          <div>
            <h3 className={s.name}>{p.name}</h3>
            <p className={s.blurb}>{p.blurb}</p>
            {p.details.map((d, i) => (
              <p key={i} className="copy">
                {inline(d)}
              </p>
            ))}
            <p className={s.stack}>{p.stack.join(" · ")}</p>
            <Links p={p} />
          </div>
        </article>
      ))}

      <p className={s.gh}>
        <TrackedLink href={site.github} {...external} className="link" event="other_projects_github">
          See the rest on GitHub
          <Arrow />
        </TrackedLink>
      </p>
    </section>
  );
}
