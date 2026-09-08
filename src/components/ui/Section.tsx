import type { ReactNode } from "react";
import Reveal from "@/components/Reveal";

type Props = {
  /** e.g. "01 — Last internship". */
  kicker: string;
  /** Which accent the kicker takes. */
  accent?: "cobalt" | "coral";
  /** Heading content — pass the emphasis spans inline. */
  title: ReactNode;
  children?: ReactNode;
  /**
   * Content that should escape the 820px measure but stay inside the section,
   * rendered after it. Used by Hackathons for the full-bleed map.
   */
  bleed?: ReactNode;
  /**
   * Override the 820px narrative column width — e.g. `"min(1040px, 100%)"` for a
   * section that needs room for side-by-side media. The `100%` clamp keeps it
   * from forcing a horizontal scrollbar at narrow widths.
   */
  measure?: string;
};

/**
 * The standard narrative section: measured column, numbered kicker, display
 * heading. Five sections were repeating this shell verbatim, including the
 * `text-[clamp(2rem,5.5vw,3.6rem)]` heading string, so it lives here now.
 */
export default function Section({
  kicker,
  accent = "cobalt",
  title,
  children,
  bleed,
  measure,
}: Props) {
  return (
    <section>
      <div
        className="mx-auto max-w-[820px] px-6 py-24 sm:py-32"
        // Inline style wins over the class, so the default 820px path is untouched.
        style={measure ? { maxWidth: measure } : undefined}
      >
        <Reveal>
          <p className={`kicker ${accent === "coral" ? "text-accent-2" : "text-accent"}`}>
            {kicker}
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="display mt-5 text-[clamp(2rem,5.5vw,3.6rem)] leading-[1.05]">
            {title}
          </h2>
        </Reveal>

        {children}
      </div>
      {bleed}
    </section>
  );
}

/**
 * A body paragraph in the section's voice. Defaults to the spacing used after
 * the heading; pass `className` to override just the margin.
 */
export function Prose({
  children,
  delay,
  className = "mt-7",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <Reveal delay={delay}>
      <p className={`${className} text-lg leading-relaxed text-muted`}>{children}</p>
    </Reveal>
  );
}
