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
};

// Having a screenshot promotes the project to a card in section 03, and a card
// has to link somewhere. Expressing that as a union makes it a type error at
// author time rather than an exception thrown while the module evaluates —
// which previously meant a data typo failed the build with a stack trace.
type Illustrated = { image: string; imageAlt?: string } & (
  | { repo: string }
  | { link: string }
);

export type Hackathon = HackathonBase &
  (Illustrated | { image?: never; imageAlt?: never });

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
    image: "/images/projects/zucc-it.jpg",
    imageAlt:
      "ZUCC.IT dashboard scoring a meeting on tempo, confidence, politeness and structure, with the team's knowledge gaps listed below",
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
    image: "/images/projects/project-net-zero.jpg",
    imageAlt:
      "Project Net Zero's pipeline diagram: code is split per function, optimized, measured for carbon, and only swapped back in if it is greener and still passes tests",
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
    image: "/images/projects/nora-ai.jpg",
    imageAlt:
      "Nora.ai reviewing a frame of surgical training footage, with flagged errors such as needle misalignment and instrument collision listed alongside",
  },
];

export type ProjectCard = {
  name: string;
  blurb: string;
  image: string;
  imageAlt: string;
  href: string;
  linkLabel: "Live demo" | "GitHub";
};

// The six projects with a screenshot — shown as a grid of image cards.
export const projectCards: ProjectCard[] = [
  {
    name: "Double Pendulum",
    blurb: "Chaos, simulated on the GPU with WebGPU compute shaders.",
    image: "/images/projects/double-pendulum.jpg",
    imageAlt:
      "The double pendulum simulator: rod and bob controls on the left, a live pendulum trace, and a rainbow phase map of its chaotic sensitivity",
    href: "https://www.pendulum.williamragnarsson.com",
    linkLabel: "Live demo",
  },
  {
    name: "Resume Generator",
    blurb: "Turns your repos into a real LaTeX résumé with Claude.",
    image: "/images/projects/resume-generator.jpg",
    imageAlt:
      "The resume generator's upload screen, with a template picker and a LinkedIn PDF dropped in ready to extract",
    href: "https://github.com/william-ragnarsson/dev-resume-generator",
    linkLabel: "GitHub",
  },
  {
    name: "Finance Tracker",
    blurb: "host your own financial agentic database",
    image: "/images/projects/finance-tracker.jpg",
    imageAlt:
      "The finance tracker rendering a month of spending as a newspaper front page, with a lead story on the month's balance and a breakdown by category",
    href: "https://github.com/william-ragnarsson/finance-tracker",
    linkLabel: "GitHub",
  },
  // The `Hackathon` union already makes "screenshot without a link" a type
  // error, so the checks here only exist to narrow the optional fields — they
  // can't actually fail. Skipping rather than throwing keeps a data mistake
  // from taking the whole build down with it.
  ...hackathons.flatMap((h): ProjectCard[] => {
    const href = h.link ?? h.repo;
    if (!h.image || !href) return [];
    return [
      {
        name: h.project,
        blurb: h.blurb,
        image: h.image,
        imageAlt: h.imageAlt ?? `${h.project} screenshot`,
        href,
        linkLabel: h.link ? "Live demo" : "GitHub",
      },
    ];
  }),
];

