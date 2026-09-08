import Section, { Prose } from "@/components/ui/Section";

export default function WhatsNext() {
  return (
    <Section
      kicker="05 — Looking ahead"
      accent="coral"
      title={
        <>
          What&apos;s <span className="text-accent-2">NEXT</span>
        </>
      }
    >
      <Prose delay={0.1}>
        I have finished my Bachelor's degree in Computer Science and have decided not to pursue my Master's degree.
        It's not the way I want to continue learning and it's not what gets me excited.
        <span className="font-medium text-foreground"> I'm going all in on startups and don't want to go slow.</span> I'm moving to NYC for this exact reason.
      </Prose>

      <Prose delay={0.1}>
        So I&apos;m actively looking to join a <span className="font-medium text-foreground">growing team with al ot of ambition</span>. Most of what I know has come from building,
        so that&apos;s what I want to keep doing. I want to build a lot, build fast and build
        big!
      </Prose>
    </Section>
  );
}
