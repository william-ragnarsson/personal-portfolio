import Section, { Prose } from "@/components/ui/Section";
import VcPreviewSpotlight from "@/components/VcPreviewSpotlight";

export default function PlugAndPlay() {
  return (
    <Section
      kicker="01 — Last internship"
      title={
        <>
          Internship @{" "}
          <span className="text-accent">Plug and Play Tech Center</span>,
        </>
      }
    >
      <Prose delay={0.1}>
        <span className="font-medium text-foreground">
          Built an AI VC analyst trained on 800+ real pitch deck reviews on a
          self-formed proprietary dataset.
        </span>
      </Prose>

      <VcPreviewSpotlight />

      <Prose delay={0.05} className="mt-5">
        During my internship at Plug and Play Tech Center, I reviewed ~60 pitch
        decks a week: scoring, notes, verdicts. Repetitive work, but I realized
        I was building a labeled dataset of real VC judgment calls that
        literally doesn&apos;t exist outside a handful of firms.
      </Prose>

      <Prose delay={0.1} className="mt-5">
        So I kept every review and built a pipeline around it: deck ingestion →
        structured extraction → a logistic regression model trained on my own
        800 labeled evaluations → automated due diligence → investment memo, end
        to end.
      </Prose>
    </Section>
  );
}
