"use client";

import { useEffect } from "react";
import { site } from "@/data/site";

// A little hello for anyone who opens devtools.
export default function ConsoleGreeting() {
  useEffect(() => {
    console.log(
      "%cyou found the console. respect.",
      "background:#0054a2;color:#ffc576;font-weight:700;font-size:13px;padding:4px 8px;border-radius:4px",
    );
    console.log(
      `%cpoking around? the source is open: ${site.repoUrl}\nor just email me: ${site.email}`,
      "color:#54657a",
    );
  }, []);

  return null;
}
