import type { Metadata, Viewport } from "next";
import { Anek_Latin } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { GLOBE_MODE_SCRIPT } from "@/lib/mode";
import "./globals.css";

// One family for everything. Its width axis (75–125) is what stretches the
// name on the opening screen; the i and j have round dots.
//
// `block`: the opening screen is type and nothing else, so it waits for the
// real font (it's preloaded, and usually lands before first paint) rather than
// flashing a fallback at the wrong width.
const anek = Anek_Latin({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "block",
  variable: "--font-anek",
});

const SITE_URL = "https://williamragnarsson.com";
const DESCRIPTION =
  "Hi, I'm William. I built an AI VC-analyst at Plug & Play in San Francisco, I love hackathons, and I make a lot of things. Started in hardware, went all-in on software.";
const SHORT = "AI VC-analyst at Plug & Play SF, hackathon-obsessed, builder of a lot of things.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "William Ragnarsson",
  description: DESCRIPTION,
  keywords: ["William Ragnarsson", "software engineer", "Plug and Play", "machine learning", "hackathons", "portfolio"],
  authors: [{ name: "William Ragnarsson" }],
  openGraph: {
    title: "William Ragnarsson",
    description: SHORT,
    url: SITE_URL,
    siteName: "William Ragnarsson",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "William Ragnarsson",
    description: SHORT,
  },
};

export const viewport: Viewport = {
  // PageTone updates this as the page changes colour.
  themeColor: "#0054a2",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // The inline script sets data-globe before first paint, which React
    // didn't render: hence suppressHydrationWarning, for this element only.
    <html lang="en" className={anek.variable} data-globe="still" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: GLOBE_MODE_SCRIPT }} />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
