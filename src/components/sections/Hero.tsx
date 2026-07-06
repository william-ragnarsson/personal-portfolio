import Reveal from "@/components/Reveal";
import { site } from "@/data/site";
import { Github, Mail, Linkedin } from "@/components/ui/icons";

export default function Hero() {
  return (
    <header className="mx-auto flex min-h-[92vh] max-w-[1100px] flex-col justify-center px-6 py-24">
      <Reveal>
        <p className="kicker text-muted">{site.name} — Portfolio</p>
      </Reveal>

      <Reveal delay={0.05}>
        <h1 className="display mt-6 text-[clamp(2.8rem,9vw,7rem)]">
          Hi, I&apos;m <span className="text-accent">William</span>.
        </h1>
      </Reveal>

      <Reveal delay={0.12}>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
          I&apos;m a CS student who can&apos;t stop building things. I trained an
          AI to think like a VC, I fly across Europe for hackathons, and I once
          tried to start a hardware company. Here&apos;s some of it.
        </p>
      </Reveal>

      <Reveal delay={0.18}>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a
            href={`mailto:${site.email}`}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
          >
            <Mail className="h-4 w-4" /> Reach out
          </a>
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-ink"
          >
            <Github className="h-4 w-4" /> GitHub
          </a>
          <a
            href={site.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-ink"
          >
            <Linkedin className="h-4 w-4" /> LinkedIn
          </a>
        </div>
      </Reveal>

      <p className="kicker mt-20 flex items-center gap-3 text-muted">
        scroll <span className="inline-block h-px w-12 bg-accent-2" />
      </p>
    </header>
  );
}
