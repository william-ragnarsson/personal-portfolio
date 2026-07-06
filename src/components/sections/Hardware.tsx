import Reveal from "@/components/Reveal";

export default function Hardware() {
  return (
    <section className="mx-auto max-w-[820px] px-6 py-24 sm:py-32">
      <Reveal>
        <p className="kicker text-accent">04 — Before software</p>
      </Reveal>

      <Reveal delay={0.05}>
        <h2 className="display mt-5 text-[clamp(2rem,5.5vw,3.6rem)] leading-[1.05]">
          I actually started in{" "}
          <span className="text-accent">hardware</span>.
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="mt-7 text-lg leading-relaxed text-muted">
          First year of university, I tried to start my own hardware company.
          Motors, sensors, PCBs, the whole thing. It taught me a ton — mostly
          that the part I loved was the software. So I went{" "}
          <span className="font-medium text-foreground">100% software</span>.
          haha.
        </p>
      </Reveal>
    </section>
  );
}
