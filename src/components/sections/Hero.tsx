import Reveal from "@/components/Reveal";

export default function Hero() {
  return (
    <header className="mx-auto flex min-h-[92vh] max-w-[1100px] flex-col justify-center px-6 py-24">
      <Reveal>
        <h1 className="display text-[clamp(2.8rem,9vw,7rem)]">
          Hi, I&apos;m <span className="text-accent">William</span>.
        </h1>
      </Reveal>

      <Reveal delay={0.08}>
        <p className="mt-8 max-w-6xl text-2xl font-medium leading-snug text-ink sm:text-3xl">
          Obsessive learner, love to build and work on <span className="text-accent-2">ambitious projects</span>

        </p>
      </Reveal>

      <p className="kicker mt-20 flex items-center gap-3 text-muted">
        scroll <span className="inline-block h-px w-12 bg-accent-2" />
      </p>
    </header>
  );
}
