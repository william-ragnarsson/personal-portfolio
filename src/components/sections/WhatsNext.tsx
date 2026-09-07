import Section, { Prose } from "@/components/ui/Section";

export default function WhatsNext() {
  return (
    <Section
      kicker="05 — Looking ahead"
      accent="coral"
      title={
        <>
          What&apos;s <span className="text-accent-2">next</span>
        </>
      }
    >
      <Prose delay={0.1}>
        I have finished my Bachelor's degree in Computer Science and have decided not to pursue my Master's degree.
        It's not something I'm excited about and it's not the way I want to continue learning.
      </Prose>
      <Prose delay={0.1}>
        So I&apos;m actively looking to join a growing team building an AI product
        I&apos;d want to use myself. Most of what I know has come from building,
        so that&apos;s what I want to keep doing. I want to build a lot, build fast and build
        big!
      </Prose>
    </Section>
  );
}
