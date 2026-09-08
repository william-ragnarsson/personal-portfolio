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
        During my internship at Plug and Play Tech Center, I reviewed 800+ pitch decks:
        scoring, notes, verdicts. This took a lot of effort and as the process was repetitive, but I kept going and
        I logged each review in a structured excel table. As the internship went on I decided I would do something about the process.
        I looked at the data I had kept and thought: could I train an AI on this?
      </Prose>

      <Prose delay={0.1} className="mt-5">
        So that's what I did. I built an end-to-end investment pipeline around it: deck ingestion {" -> "} structured extraction {" -> "} a logistic regression model trained on my own 800+ labeled evaluations {" -> "} automated due diligence {" -> "} investment memo. This cut down the review times by roughly 40% for me.
      </Prose>

      <Prose delay={0.1} className="mt-5">
        I'm still working on the logistic regression model: experimenting with different methods to see what works best, while documenting the process to have a publishable paper by the end.
      </Prose>
    </Section>
  );
}
