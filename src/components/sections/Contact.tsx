import Reveal from "@/components/Reveal";
import { site } from "@/data/site";
import { ArrowUpRight } from "@/components/ui/icons";

const links = [
  { label: "Email", href: `mailto:${site.email}`, value: site.email },
  { label: "LinkedIn", href: site.linkedin, value: "william-ragnarsson" },
];

export default function Contact() {
  return (
    <section className="mx-auto max-w-[1100px] px-6 py-24 sm:py-32">
      <Reveal>
        <p className="kicker text-accent-2">05 — Say hi</p>
      </Reveal>

      <Reveal delay={0.05}>
        <h2 className="display mt-5 text-[clamp(2.6rem,8vw,6rem)]">
          Let&apos;s <span className="text-accent-2">Talk!</span>
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="mt-6 max-w-4-xl text-lg leading-relaxed text-muted">
          I&apos;m always looking to work on ambitious projects, with talented
          people, and go big!
        </p>
      </Reveal>

      <Reveal delay={0.14}>
        <div className="mt-10 divide-y divide-border border-y border-border">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-6 py-5"
            >
              <span className="flex items-baseline gap-4">
                <span className="kicker w-20 text-muted">{l.label}</span>
                <span className="text-lg font-medium sm:text-xl">{l.value}</span>
              </span>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-accent-2" />
            </a>
          ))}
        </div>
      </Reveal>

      <div className="mt-16 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
        <a
          href={site.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="kicker transition-colors hover:text-accent"
        >
          View source →
        </a>
      </div>
    </section>
  );
}
