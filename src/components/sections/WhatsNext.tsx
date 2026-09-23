import Section, { Prose } from "@/components/ui/Section";

export default function WhatsNext() {
  return (
    <Section
      title={
        <>
          The move to <span className="text-accent-2">NYC</span>
        </>
      }
    >
      <Prose delay={0.1}>
        I just finished my Bachelor&apos;s in Computer Science, and <span className="font-medium text-foreground">
          I&apos;m moving to New York City to go all in on startups </span>, chasing that American dream.
      </Prose>

      <Prose delay={0.1}>
        I want to join a{" "}
        <span className="font-medium text-foreground">
          growing team with a LOT ambition
        </span>{" "}. Almost everything I know, I learned by building.
        So that&apos;s what I want to keep doing: <span className="font-medium text-foreground">build a lot, build fast and build big!</span>
      </Prose>
    </Section>
  );
}
