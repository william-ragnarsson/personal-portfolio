import Reveal from "@/components/Reveal";
import VcPreviewSpotlight from "@/components/VcPreviewSpotlight";

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

      <VcPreviewSpotlight />

      <Reveal delay={0.05}>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          During my internship at Plug and Play Tech Center, I reviewed ~60
          pitch decks a week: scoring, notes, verdicts. Repetitive work, but I
          realized I was building a labeled dataset of real VC judgment calls
          that literally doesn&apos;t exist outside a handful of firms.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          So I kept every review and built a pipeline around it: deck ingestion
          → structured extraction → a logistic regression model trained on my
          own 800 labeled evaluations → automated due diligence → investment
          memo, end to end.
        </p>
      </Reveal>
    </section>
  );
}
