import Reveal from "@/components/Reveal";

export default function Hardware() {
  return (
    <section className="mx-auto max-w-[820px] px-6 py-24 sm:py-32">
      <Reveal>
        <p className="kicker text-accent">04 — Before software</p>
      </Reveal>

      <Reveal delay={0.05}>
        <h2 className="display mt-5 text-[clamp(2rem,5.5vw,3.6rem)] leading-[1.05]">
          I naively tried a{" "}
          <span className="text-accent">hardware startup</span> my first year.
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="mt-7 text-lg leading-relaxed text-muted">
          Motors, sensors, PCBs, the whole thing — first year of uni, full of
          ambition and not much of a clue. It taught me a ton, mostly that the
          part I loved was the software. So I&apos;ve since{" "}
          <span className="font-medium text-foreground">
            fully transitioned to software
          </span>{" "}
          — and I love it.
        </p>
      </Reveal>
    </section>
  );
}
