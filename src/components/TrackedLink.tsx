"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { capture } from "@/lib/analytics";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** PostHog event name. */
  event: string;
  properties?: Record<string, unknown>;
  /** Optional for a link laid over something else, named by aria-label. */
  children?: ReactNode;
};

/**
 * An `<a>` that reports a click, so a section doesn't have to become a client
 * component just to attach one analytics handler.
 */
export default function TrackedLink({ event, properties, children, onClick, ...rest }: Props) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        capture(event, properties);
      }}
    >
      {children}
    </a>
  );
}

/** `target="_blank"` with the matching rel. */
export const external = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;
