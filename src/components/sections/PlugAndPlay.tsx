import Reveal from "@/components/Reveal";
import { vcStats } from "@/data/content";
import { ArrowUpRight } from "@/components/ui/icons";

export default function PlugAndPlay() {
  return (
    <section className="mx-auto max-w-[820px] px-6 py-24 sm:py-32">
      <Reveal>
        <p className="kicker text-accent">01 — The internship</p>
      </Reveal>

      <Reveal delay={0.05}>
        <h2 className="display mt-5 text-[clamp(2rem,5.5vw,3.6rem)] leading-[1.05]">
          I did an internship at Plug &amp; Play in{" "}
          <span className="text-accent">San Francisco</span>.
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="mt-7 text-lg leading-relaxed text-muted">
          It&apos;s one of the world&apos;s most active startup accelerators, and
          I spent it as a VC intern — reading hundreds of pitch decks, sitting in
          deal reviews, and slowly building an instinct for what makes a startup
          actually investable. Then, because I&apos;m an engineer, I tried to
          bottle that instinct.
        </p>
      </Reveal>

      <Reveal delay={0.14}>
        <div className="mt-10 border-l-2 border-accent pl-6">
          <h3 className="display text-[clamp(1.5rem,4vw,2.2rem)]">
            So I built an AI VC-analyst.
          </h3>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            A founder pastes a deck; the model scores it the way a partner would.
            The part I&apos;m proud of isn&apos;t the app — it&apos;s that I{" "}
            <span className="font-medium text-foreground">
              trained my own model on my own data
            </span>
            . I hand-labeled 765 startups, trained a gradient-boosting
            classifier, and exported it to ONNX so it runs right in the browser.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {vcStats.map((s) => (
              <div key={s.l}>
                <div className="display text-[clamp(1.6rem,4vw,2.4rem)] text-accent">
                  {s.v}
                </div>
                <div className="mt-1 text-xs leading-snug text-muted">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-5 text-sm">
            <a
              href="https://github.com/william-popmie/vc-analyst"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium transition-colors hover:text-accent"
            >
              The analyzer <ArrowUpRight className="h-4 w-4" />
            </a>
            <a
              href="https://github.com/william-popmie/vc-ai-analyst-llm-training"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted transition-colors hover:text-foreground"
            >
              How I trained it <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
