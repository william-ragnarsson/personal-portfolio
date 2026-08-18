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
  /** Only read when the hackathon is promoted to a project card — see `projectCards`. */
  details?: string[];
  stack?: string[];
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
    details: [
      "Built at BCG Platinion's Berlin hackathon. ZUCC.IT sits in on a meeting, transcribes it, and scores the conversation on tempo, confidence, politeness and structure.",
      "Instead of handing back a transcript, it names the specific knowledge gaps that showed up — so the next interview goes better than the last one. Third place.",
    ],
    stack: ["Whisper", "LLM analysis", "React", "Python"],
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
    details: [
      "A refactoring agent with one hard rule: it may only keep a change it can prove is better. Anything else gets thrown away.",
      "The pipeline splits a codebase function by function, rewrites each one for energy efficiency, measures the carbon cost of the old and new versions, and swaps the new one in only if it is both greener and still passing the tests.",
    ],
    stack: ["Python", "LLM agents", "Static analysis", "FastAPI"],
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
    details: [
      "Surgical training footage is long, and the mistakes worth learning from are seconds wide. Finding them is exactly the work a supervising surgeon has no time for.",
      "Nora.ai watches the video frame by frame and flags the errors that surgeon would catch — needle misalignment, instrument collisions — so a trainee gets specific feedback on their own recording instead of waiting for a review slot. Best Pitch Award.",
    ],
    stack: ["Computer vision", "PyTorch", "Next.js"],
    image: "/images/projects/nora-ai.jpg",
    imageAlt:
      "Nora.ai reviewing a frame of surgical training footage, with flagged errors such as needle misalignment and instrument collision listed alongside",
  },
];

export type ProjectCard = {
  name: string;
  blurb: string;
  /** The long-form story, one string per paragraph. Shown in the project dialog. */
  details: string[];
  /** Shown as chips beside the screenshot. Keep it to the handful that actually matter. */
  stack: string[];
  image: string;
  imageAlt: string;
  href: string;
  linkLabel: "Live demo" | "GitHub";
};

// The six projects with a screenshot — shown as a grid of image cards. Three
// are authored here and three are promoted from `hackathons`, so this is the
// unordered pool; `cardOrder` below decides what section 03 actually shows.
const illustratedProjects: ProjectCard[] = [
  {
    name: "Double Pendulum",
    blurb: "Chaos, simulated on the GPU with WebGPU compute shaders.",
    image: "/images/projects/double-pendulum.jpg",
    imageAlt:
      "The double pendulum simulator: rod and bob controls on the left, a live pendulum trace, and a rainbow phase map of its chaotic sensitivity",
    details: [
      "A double pendulum is the textbook example of chaos: change the starting angle by a hundredth of a degree and the arm ends up somewhere completely different. Simulating one is easy. Simulating enough of them to actually see that sensitivity is not.",
      "This runs thousands at once as a WebGPU compute shader and paints the result as a phase map — every pixel is one starting condition, coloured by where that pendulum ended up. The rainbow structure is the chaos itself, drawn.",
    ],
    stack: ["WebGPU", "Compute shaders", "TypeScript", "Next.js"],
    href: "https://www.pendulum.williamragnarsson.com",
    linkLabel: "Live demo",
  },
  {
    name: "Resume Generator",
    blurb: "Turns your repos into a real LaTeX résumé with Claude.",
    image: "/images/projects/resume-generator.jpg",
    imageAlt:
      "The resume generator's upload screen, with a template picker and a LinkedIn PDF dropped in ready to extract",
    details: [
      "Most résumé builders make you retype work you have already done. Your commit history already describes it, and so does your LinkedIn export — the information exists, it just isn't in the right shape.",
      "This reads both, asks Claude to turn them into real bullet points, and compiles the result through a proper LaTeX template. The output is a typeset PDF, not a web page pretending to be one.",
    ],
    stack: ["Claude API", "LaTeX", "Next.js", "GitHub API"],
    href: "https://github.com/william-ragnarsson/dev-resume-generator",
    linkLabel: "GitHub",
  },
  {
    name: "Finance Tracker",
    blurb: "host your own financial agentic database",
    image: "/images/projects/finance-tracker.jpg",
    imageAlt:
      "The finance tracker rendering a month of spending as a newspaper front page, with a lead story on the month's balance and a breakdown by category",
    details: [
      "Self-hosted, so the bank data never leaves your machine. An agent categorises transactions as they land and answers questions about them in plain language, rather than making you build a pivot table to ask where the money went.",
      "The month gets rendered as a newspaper front page — lead story on the balance, columns for each category. Financial dashboards are boring; a front page you actually want to read is not.",
    ],
    stack: ["Agents", "SQLite", "Python", "Next.js"],
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
        details: h.details ?? [h.blurb],
        stack: h.stack ?? [],
        image: h.image,
        imageAlt: h.imageAlt ?? `${h.project} screenshot`,
        href,
        linkLabel: h.link ? "Live demo" : "GitHub",
      },
    ];
  }),
];

// Display order for section 03, by `name`. It has to be stated explicitly
// because the running order interleaves the two sources above — it can't fall
// out of how they concatenate. The card numbering (01, 02, …) follows from it.
const cardOrder = [
  "Double Pendulum",
  "Finance Tracker",
  "Project Net Zero",
  "Resume Generator",
  "Nora.ai",
  "ZUCC.IT",
];

// A name missing from `cardOrder` sorts to the end rather than the front, so a
// new project appears last instead of silently taking the lead slot.
const rank = (name: string) => {
  const i = cardOrder.indexOf(name);
  return i === -1 ? cardOrder.length : i;
};

export const projectCards: ProjectCard[] = [...illustratedProjects].sort(
  (a, b) => rank(a.name) - rank(b.name),
);

