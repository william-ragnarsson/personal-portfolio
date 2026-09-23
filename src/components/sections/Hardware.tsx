import Section, { Prose } from "@/components/ui/Section";
import TuneboxTrailer from "@/components/TuneboxTrailer";
import TuneboxGallery from "@/components/TuneboxGallery";

/**
 * Media-led: the trailer and photo strip lead, then the story runs as one
 * uninterrupted block — not the text/media/text/media ladder this section used
 * to be. It keeps the standard 820px `Section` measure so its column lines up
 * with every other narrative section down the page.
 */
export default function Hardware() {
  return (
    <Section
      title={
        <>
          Did my own <span className="text-accent">startup</span> in my first
          year of university.
        </>
      }
    >
      <TuneboxTrailer />
      <TuneboxGallery />

      <Prose delay={0.1} className="mt-12">
        <span className="font-medium text-foreground">Tunebox</span>, a
        hardware startup: a more creative, hands-on project than anything
        I&apos;d done before, and the thing that first lit the{" "}
        <span className="font-medium text-foreground">
          drive to build startups
        </span>
        .
      </Prose>

      <Prose delay={0.1} className="mt-5">
        We entered the startup competition Start Academy and placed{" "}
        <span className="font-medium text-foreground">
          2nd out of 120 startups
        </span>
      </Prose>

      <Prose delay={0.14} className="mt-5">
        I&apos;ve since moved on from the hardware, (luckily) but not the itch.
        Ever since, my focus has been{" "}
        <span className="font-medium text-foreground">100% startups</span>.
      </Prose>
    </Section>
  );
}
