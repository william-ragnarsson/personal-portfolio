# personal-portfolio

William Ragnarsson's portfolio — *builds cool shit*. A fast, single-page Next.js site:
internships, hackathons, projects, and the hardware startup that started it.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4** (CSS-first config in `src/app/globals.css`)
- **Framer Motion** for the scroll-linked map section (respects `prefers-reduced-motion`)
- Deploys to **Vercel**, targets `williamragnarsson.com`

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

`predev` / `prebuild` run `scripts/generate-map.mjs`, which renders the dotted world
map to `public/map-dots.svg` and writes the city pin coordinates to
`src/data/mapGeometry.json`. Both are committed, so a deploy doesn't depend on the
script running first.

## Editing content

All copy lives in typed data files — change these, not the layout:

- `src/data/site.ts` — name, email, links (GitHub, LinkedIn, demos)
- `src/data/content.ts` — hackathons (which also feed the map) and project cards

Sections live in `src/components/sections/` and share the `Section` shell in
`src/components/ui/`. A hackathon with an `image` is automatically promoted to a
project card, and the type enforces that it also has a `repo` or `link`.

## Checking layout

The page is scroll-linked and sticky-heavy, so layout regressions never show up in
a typecheck — they only appear at particular viewport sizes. After changing
anything responsive, check these by hand at **320×568, 390×844, 768×1024,
1024×600 (short and wide), and 1440×900**:

- no horizontal scrollbar, no section overlapping the next
- sticky containers never exceed the viewport — they stop sticking if they do
- each map card parks dead-centre at every city, at every size
- **drag** the window width slowly through 768px (don't just jump): the map
  section must not jump or re-lay-out beyond the intended breakpoint change
- scroll down fast, then reload mid-page — every section must still be visible,
  not stuck invisible

The rules behind these are written up in `AGENTS.md` — read that before changing
anything responsive.

## TODO (for William)

- Confirm the **LinkedIn URL** in `src/data/site.ts` (currently a guess).
- Fill in the real NYC hackathon blurb in `src/data/content.ts` (marked `TODO`).
