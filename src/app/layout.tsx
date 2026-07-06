import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display-custom",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

const sans = Inter({
  variable: "--font-sans-custom",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-custom",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://williamragnarsson.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "William Ragnarsson",
  description:
    "Hi, I'm William. I built an AI VC-analyst at Plug & Play in San Francisco, I love hackathons, and I make a lot of things. Started in hardware, went all-in on software.",
  keywords: [
    "William Ragnarsson",
    "software engineer",
    "Plug and Play",
    "machine learning",
    "hackathons",
    "portfolio",
  ],
  authors: [{ name: "William Ragnarsson" }],
  openGraph: {
    title: "William Ragnarsson",
    description:
      "AI VC-analyst at Plug & Play SF, hackathon-obsessed, builder of a lot of things.",
    url: SITE_URL,
    siteName: "William Ragnarsson",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "William Ragnarsson",
    description:
      "AI VC-analyst at Plug & Play SF, hackathon-obsessed, builder of a lot of things.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
