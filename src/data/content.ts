// All editable copy + data for the narrative page.

import { site } from "@/data/site";

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
    name: "VC Analyst",
    blurb: "AI due diligence trained on 800+ real pitch deck reviews.",
    repo: site.vcRepo,
    demo: site.vcDemo,
  },
  {
    name: "Double Pendulum",
    blurb: "Chaos, simulated on the GPU with WebGPU compute shaders.",
    repo: "https://github.com/william-ragnarsson/double-pendulum",
    demo: "https://www.pendulum.williamragnarsson.com",
  },
  {
    name: "Resume Generator",
    blurb: "Turns your repos into a real LaTeX résumé with Claude.",
    repo: "https://github.com/william-ragnarsson/dev-resume-generator",
  },
  {
    name: "Finance Tracker",
    blurb: "host your own financial agentic database",
    repo: "https://github.com/william-ragnarsson/finance-tracker",
  },
  ...hackathons.map((hackathon) => ({
    name: hackathon.project,
    blurb: `${hackathon.event} in ${hackathon.city}.`,
    repo: hackathon.repo,
    demo: hackathon.link,
  })),
];
