# personal-portfolio

William Ragnarsson's portfolio — *builds cool shit*. A fast, single-page Next.js site:
internships, projects built during finals, hackathons, personal projects, and a robotics era.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4** (CSS-first config in `src/app/globals.css`)
- **Framer Motion** for tasteful scroll/entrance motion (respects `prefers-reduced-motion`)
- Deploys to **Vercel**, targets `williamragnarsson.com`

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Editing content

All copy lives in typed data files — change these, not the layout:

- `src/data/site.ts` — name, tagline, links (GitHub, email, LinkedIn, repo)
- `src/data/internships.ts` — Plug & Play VC internship
- `src/data/projects.ts` — finals projects + personal projects
- `src/data/hackathons.ts` — trophy case

Sections live in `src/components/sections/`, shared UI in `src/components/ui/`.

## TODO (for William)

- **Robotics section** (`src/components/sections/Robotics.tsx`): drop photos/videos in
  `public/robotics/`, replace the placeholder slots with `<Image>`/`<video>`, and add a couple
  sentences of context. Remove the helper note once real media is in.
- Confirm the **LinkedIn URL** in `src/data/site.ts` (currently a guess).
- Public **GitHub handle** confirmed as `william-ragnarsson`.
