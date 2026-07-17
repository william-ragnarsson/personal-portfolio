// All editable copy + data for the narrative page.

export type Hackathon = {
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

// Order = the travel order the map pans through.
export const hackathons: Hackathon[] = [
  {
    city: "New York",
    country: "USA",
    event: "vibeFORWARD",
    project: "Placeholder.AI",
    blurb: "Very brief description.", // TODO: fill in the real NYC project + blurb
    lat: 40.71,
    lng: -74.0,
    repo: "https://github.com/william-popmie/Placeholder",
  },
  {
    city: "Berlin",
    country: "Germany",
    event: "BCG Platinion Hackathon",
    project: "ZUCC.IT",
    blurb: "Flew in, built fast, took the podium.",
    award: "3rd place",
    lat: 52.52,
    lng: 13.4,
    repo: "https://github.com/william-popmie/Team-zucc",
    link: "https://zucc.it",
  },
  {
    city: "Stockholm",
    country: "Sweden",
    event: "HackEurope",
    project: "Project Net Zero",
    blurb: "No trophy, but a project I'm genuinely proud of.",
    lat: 59.33,
    lng: 18.07,
    repo: "https://github.com/william-popmie/project-net-zero-backend",
  },
  {
    city: "Belgium",
    country: "Belgium",
    event: "Data for Good Challenge (D4GC)",
    project: "Nora.ai",
    blurb: "Built Nora.ai and took home Best Pitch.",
    award: "Best Pitch",
    lat: 50.85,
    lng: 4.35,
    repo: "https://github.com/william-popmie/DataForGoodChallenge",
  },
];

export type OtherProject = {
  name: string;
  blurb: string;
  repo?: string;
  demo?: string;
};

// Kept deliberately brief — the point is "here's my GitHub + a taste".
export const otherProjects: OtherProject[] = [
  {
    name: "Double Pendulum",
    blurb: "Chaos, simulated on the GPU with WebGPU compute shaders.",
    repo: "https://github.com/william-popmie/double-pendulum",
    demo: "https://www.pendulum.williamragnarsson.com",
  },
  {
    name: "Resume Generator",
    blurb: "Turns your repos into a real LaTeX résumé with Claude.",
    repo: "https://github.com/william-popmie/dev-resume-generator",
  },
  {
    name: "Finance Tracker",
    blurb: "A finance tracker I actually use.",
    repo: "https://github.com/william-popmie/finance-tracker",
  },
];
