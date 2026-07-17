import Reveal from "@/components/Reveal";
import { site } from "@/data/site";
import { ArrowUpRight, Github } from "@/components/ui/icons";

export default function PlugAndPlay() {
  return (
    <section className="mx-auto max-w-[820px] px-6 py-24 sm:py-32">
      <Reveal>
        <p className="kicker text-accent">01 — Last internship</p>
      </Reveal>

      <Reveal delay={0.05}>
        <h2 className="display mt-5 text-[clamp(2rem,5.5vw,3.6rem)] leading-[1.05]">
          Internship @{" "}
          <span className="text-accent">Plug and Play Tech Center</span>,
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="mt-7 text-lg leading-relaxed text-muted">
          <span className="font-medium text-foreground">
            Built an AI VC analyst trained on 800+ real pitch deck reviews on a
            self-formed proprietary dataset.
          </span>
        </p>
      </Reveal>

      <Reveal delay={0.13}>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          During my internship at Plug and Play Tech Center, I reviewed ~60
          pitch decks a week: scoring, notes, verdicts. Repetitive work, but I
          realized I was building a labeled dataset of real VC judgment calls
          that literally doesn&apos;t exist outside a handful of firms.
        </p>
      </Reveal>

      <Reveal delay={0.16}>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          So I kept every review and built a pipeline around it: deck ingestion
          → structured extraction → a logistic regression model trained on my
          own 800 labeled evaluations → automated due diligence → investment
          memo, end to end.
        </p>
      </Reveal>

      <Reveal delay={0.2}>
        <a
          href={site.vcDemo}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-9 block overflow-hidden rounded-2xl border border-border bg-background-soft shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
            <span className="flex items-center gap-1.5 truncate font-mono text-xs text-muted">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-accent-2/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent/50" />
                <span className="h-2.5 w-2.5 rounded-full bg-muted/30" />
              </span>
              <span className="ml-2 truncate">vcanalyst.williamragnarsson.dev</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium transition-colors group-hover:text-accent">
              Open <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
          {/* Live homepage preview. Pointer events are disabled so the whole
              card behaves as one link into the site. */}
          <div className="relative aspect-[16/10] w-full bg-background">
            <iframe
              src={site.vcDemo}
              title="VC Analyst — live preview"
              loading="lazy"
              tabIndex={-1}
              className="pointer-events-none absolute left-0 top-0 h-[200%] w-[200%] origin-top-left scale-50 border-0"
            />
          </div>
        </a>
      </Reveal>

      <Reveal delay={0.24}>
        <div className="mt-8 flex flex-wrap gap-5 text-sm">
          <a
            href={site.vcDemo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium transition-colors hover:text-accent"
          >
            Try it out yourself <ArrowUpRight className="h-4 w-4" />
          </a>
          <a
            href={site.vcRepo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-foreground"
          >
            <Github className="h-4 w-4" /> Source
          </a>
        </div>
      </Reveal>
    </section>
  );
}
