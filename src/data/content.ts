// All editable copy + data for the narrative page.

export const vcStats = [
  { v: "765", l: "decks I labeled by hand" },
  { v: "80.9%", l: "model accuracy" },
  { v: "0", l: "Python at runtime (ONNX)" },
];

export type Hackathon = {
  city: string;
  country: string;
  project: string;
  blurb: string;
  award?: string;
  lat: number;
  lng: number;
  link?: string;
};

// Order = the travel order the map pans through.
export const hackathons: Hackathon[] = [
  {
    city: "New York",
    country: "USA",
    project: "Veil",
    blurb:
      "A privacy layer for LLMs — it strips personal data out of prompts before they ever reach a model.",
    lat: 40.71,
    lng: -74.0,
  },
  {
    city: "Berlin",
    country: "Germany",
    project: "Team-Zucc",
    blurb: "BCG Platinion hackathon. Flew in, built fast, took the podium.",
    award: "3rd place",
    lat: 52.52,
    lng: 13.4,
    link: "https://zucc.it",
  },
  {
    city: "Stockholm",
    country: "Sweden",
    project: "Project Net Zero",
    blurb: "HackEurope. No trophy, but a project I'm genuinely proud of.",
    lat: 59.33,
    lng: 18.07,
  },
  {
    city: "Belgium",
    country: "Belgium",
    project: "Nora AI",
    blurb: "Data4Good Challenge. Built Nora AI and took home Best Pitch.",
    award: "Best Pitch",
    lat: 50.85,
    lng: 4.35,
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
    name: "SimpleDBMS",
    blurb: "A relational database from scratch — B+ trees, WAL, RAG.",
  },
  {
    name: "dev-resume-generator",
    blurb: "Turns your repos into a real LaTeX résumé with Claude.",
    repo: "https://github.com/william-popmie/dev-resume-generator",
  },
  {
    name: "Penny",
    blurb: "A finance tracker I actually use.",
    repo: "https://github.com/william-popmie/Penny",
  },
];
