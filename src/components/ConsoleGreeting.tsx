"use client";

import { useEffect } from "react";
import { site } from "@/data/site";

// A little hello for anyone who opens devtools. Meta, harmless, tasteful.
export default function ConsoleGreeting() {
  useEffect(() => {
    const style =
      "color:#2b5cff;font-weight:700;font-size:13px;font-family:monospace";
    // eslint-disable-next-line no-console
    console.log("%cyou found the console. respect.", style);
    // eslint-disable-next-line no-console
    console.log(
      `%cpoking around? the source is open: ${site.repoUrl}\nor just email me: ${site.email}`,
      "color:#9a9aa6;font-family:monospace"
    );
  }, []);

  return null;
}
