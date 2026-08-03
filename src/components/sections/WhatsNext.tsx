import Reveal from "@/components/Reveal";

export default function WhatsNext() {
  return (
    <section className="mx-auto max-w-[820px] px-6 py-24 sm:py-32">
      <Reveal>
        <p className="kicker text-accent-2">05 — Looking ahead</p>
      </Reveal>

      <Reveal delay={0.05}>
        <h2 className="display mt-5 text-[clamp(2rem,5.5vw,3.6rem)] leading-[1.05]">
          What&apos;s <span className="text-accent-2">next</span>
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="mt-7 text-lg leading-relaxed text-muted">
          I&apos;m actively looking to join a growing team building an AI
          product I&apos;d want to use myself. Most of what I know has come from
          building, so that&apos;s what I want to keep doing. I want to build a
          lot and build big!
        </p>
      </Reveal>
    </section>
  );
}
