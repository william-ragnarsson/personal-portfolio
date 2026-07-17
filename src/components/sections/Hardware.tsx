import Reveal from "@/components/Reveal";

export default function Hardware() {
  return (
    <section className="mx-auto max-w-[820px] px-6 py-24 sm:py-32">
      <Reveal>
        <p className="kicker text-accent">04 — Before software</p>
      </Reveal>

      <Reveal delay={0.05}>
        <h2 className="display mt-5 text-[clamp(2rem,5.5vw,3.6rem)] leading-[1.05]">
          I did my own{" "}
          <span className="text-accent">startup</span> in my first year of
          university.
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="mt-7 text-lg leading-relaxed text-muted">
          It was a hardware startup — a more creative, hands-on project than
          anything I&apos;d done before, and the thing that first lit the{" "}
          <span className="font-medium text-foreground">
            drive to build startups
          </span>
          .
        </p>
      </Reveal>

      <Reveal delay={0.14}>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          I&apos;ve since moved on from the hardware, but not the itch. Ever
          since, my focus has been{" "}
          <span className="font-medium text-foreground">
            100% startups
          </span>
          .
        </p>
      </Reveal>
    </section>
  );
}
