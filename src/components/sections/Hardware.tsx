import Section, { Prose } from "@/components/ui/Section";
import TuneboxGallery from "@/components/TuneboxGallery";

export default function Hardware() {
  return (
    <Section
      kicker="04 — Before software"
      title={
        <>
          I did my own <span className="text-accent">startup</span> in my first
          year of university.
        </>
      }
    >
      <Prose delay={0.1}>
        It was <span className="font-medium text-foreground">Tunebox</span>, a
        hardware startup: a more creative, hands-on project than anything
        I&apos;d done before, and the thing that first lit the{" "}
        <span className="font-medium text-foreground">
          drive to build startups
        </span>
        .
      </Prose>

      <Prose delay={0.14} className="mt-5">
        I&apos;ve since moved on from the hardware, (luckily) but not the itch.
        Ever since, my focus has been{" "}
        <span className="font-medium text-foreground">100% startups</span>.
      </Prose>

      <TuneboxGallery />
    </Section>
  );
}
