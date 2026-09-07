// All editable copy + data for the narrative page.

type HackathonBase = {
  city: string;
  country: string;
  event: string;
  project: string;
  blurb: string;
  award?: string;
  lat: number;
  lng: number;
  repo?: string;
  link?: string;
  /** Label for the `link` CTA. Defaults to "View project". */
  linkLabel?: string;
};

// Project cards used to be promoted out of this list, which is why entries
// once carried a screenshot, a stack and a long write-up. That copy now lives
// in `content/projects/*.md` (see `src/data/projects.ts`), so a hackathon here
// only needs what the map itself draws.
export type Hackathon = HackathonBase;

// Order = the travel order the map pans through.
export const hackathons: Hackathon[] = [
  {
    city: "New York",
    country: "USA",
    event: "vibeFORWARD",
    project: "Placeholder.AI",
    blurb: "MCP layer that replaces sensitive placeholders with AI-generated placeholder content", // TODO: fill in the real NYC project + blurb
    lat: 40.71,
    lng: -74.0,
    repo: "https://github.com/william-ragnarsson/Placeholder",
  },
  {
    city: "Berlin",
    country: "Germany",
    event: "BCG Platinion Hackathon",
    project: "ZUCC.IT",
    blurb: "AI analyst that follows your meetings to improve your interviewing soft skills",
    award: "3rd place",
    lat: 52.52,
    lng: 13.4,
    repo: "https://github.com/william-ragnarsson/Team-zucc",
  },
  {
    city: "Stockholm",
    country: "Sweden",
    event: "HackEurope",
    project: "Project Net Zero",
    blurb: "AI  agent that helps developers refactor legacy code to greener and more energy efficient code",
    lat: 59.33,
    lng: 18.07,
    repo: "https://github.com/william-ragnarsson/project-net-zero-backend",
  },
  {
    city: "Belgium",
    country: "Belgium",
    event: "Data for Good Challenge (D4GC)",
    project: "Nora.ai",
    blurb: "AI that serves as a surgical co-pilot for student training",
    award: "Best Pitch Award",
    lat: 50.85,
    lng: 4.35,
    repo: "https://github.com/william-ragnarsson/DataForGoodChallenge",
  },
  {
    city: "Belgium",
    country: "Belgium",
    event: "Start Academy",
    project: "Tunebox",
    blurb:
      "A startup competition, where I presented Tunebox, a hardware startup from my first year of university.",
    award: "2nd place",
    lat: 50.85,
    lng: 4.35,
    link: "https://www.youtube.com/watch?v=JGS_X_n-Gvs",
    linkLabel: "Watch the trailer",
  },
];

