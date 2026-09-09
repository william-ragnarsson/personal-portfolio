import Section, { Prose } from "@/components/ui/Section";
import VcPreviewSpotlight from "@/components/VcPreviewSpotlight";

export default function PlugAndPlay() {
  return (
    <Section
      kicker="02 - Plug and Play Tech Center internship"
      title={
        <>
          Trained an <span className="text-accent">AI VC analyst</span> on a proprietary dataset of 900+
          pitch decks
        </>
      }
    >

      <VcPreviewSpotlight />

      <Prose delay={0.1} className="mt-6">
        During my time at Plug and Play I ran first-pass review on <span className="font-medium text-foreground">900+ pitch decks</span>, I
         reviewed each one and kept these verdicts in a structured spreadsheet. This process was very repetitive, and as I looked at my growing dataset I thought:  <span className="font-medium text-foreground">I can self-train an AI model on this data.</span>
      </Prose>

      <Prose delay={0.15} className="mt-5">
        The result is an end-to-end VC analyst pipeline that <span className="font-medium text-foreground"> cut down my review-time by 40%</span>. Deck ingestion {" -> "} structured extraction {" -> "} a
        logistic-regression classifier trained on the 900+ labeled evaluations {" -> "} automated due
        diligence {" -> "} drafted investment memo. The classifier is still in progress: I&apos;m benchmarking methods and documenting the work for a
        paper.
      </Prose>
    </Section>
  );
}
