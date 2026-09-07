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
        During my internship at Plug and Play Tech Center, I reviewed 800+ pitch
        decks: scoring, notes, verdicts. Repetitive work and not something I'm not willing to go through again, but I realized
        I had built a labeled dataset of real VC judgment calls that isn't immediately accessible from the outside.
      </Prose>

      <Prose delay={0.1} className="mt-5">
        So I kept every review and built a pipeline around it: deck ingestion -
        structured extraction - a logistic regression model trained on my own
        800 labeled evaluations - automated due diligence - investment memo, end
        to end.
      </Prose>

      <Prose delay={0.1} className="mt-5">
        I'm still working on the logistic regression model: experimenting with different methods to see what works best, while documenting the process to have a publishable paper by the end.
      </Prose>
    </Section>
  );
}
