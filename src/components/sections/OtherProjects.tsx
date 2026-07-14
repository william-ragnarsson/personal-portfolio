import Reveal from "@/components/Reveal";
import { otherProjects } from "@/data/content";
import { site } from "@/data/site";
import { ArrowUpRight, Github } from "@/components/ui/icons";

export default function OtherProjects() {
  return (
    <section className="mx-auto max-w-[820px] px-6 py-24 sm:py-32">
      <Reveal>
        <p className="kicker text-accent-2">03 — Projects</p>
      </Reveal>

      <Reveal delay={0.05}>
        <h2 className="display mt-5 text-[clamp(2rem,5.5vw,3.6rem)] leading-[1.05]">
          Have a look at my{" "}
          <span className="text-accent-2">other projects</span> :)
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Simulators, databases, dev tools, half-finished experiments. Most of it
          lives on my GitHub — here&apos;s a taste.
        </p>
      </Reveal>

      <Reveal delay={0.14}>
        <a
          href={site.github}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
        >
          <Github className="h-4 w-4" /> github.com/{site.githubHandle}
        </a>
      </Reveal>

      <Reveal delay={0.18}>
        <ul className="mt-10 divide-y divide-border border-y border-border">
          {otherProjects.map((p) => {
            const href = p.demo ?? p.repo;
            const Row = href ? "a" : "div";
            return (
              <li key={p.name}>
                <Row
                  {...(href
                    ? { href, target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="group flex items-baseline justify-between gap-6 py-4"
                >
                  <div>
                    <span className="text-lg font-medium">{p.name}</span>
                    <span className="ml-3 text-sm text-muted">{p.blurb}</span>
                  </div>
                  {href ? (
                    <ArrowUpRight className="h-4 w-4 shrink-0 translate-y-1 text-muted transition-colors group-hover:text-accent" />
                  ) : null}
                </Row>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </section>
  );
}
