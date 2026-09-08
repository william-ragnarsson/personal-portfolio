# Project cards (section 03)

One file per project. To **add** one: drop a `.md` here and its screenshot in
`public/images/projects/`. To **remove** one: delete the file. To **reorder**:
change the number prefixes — `ls` shows the order the page shows (features first,
in file order, then the list).

```md
---
name: Double Pendulum
blurb: "One line — the whole card for a listed project, the standfirst for a feature."
alt: "What the screenshot shows, for screen readers."
href: "https://…"
linkLabel: Live demo      # or: GitHub
stack: [WebGPU, TypeScript]
featured: true            # optional. true → a full editorial block. omit → a slim list row.
video: /videos/double-pendulum.mp4   # optional, featured only. see below.
focal: top                # top | center | bottom | left | right
---

First paragraph of the story. Featured projects render every paragraph inline in
their block; listed projects show only the blurb.

Second paragraph. Blank lines separate them; there is no limit.
```

**The image is found by name.** `01-double-pendulum.md` looks for
`public/images/projects/double-pendulum.{jpg,jpeg,png,webp,avif}`. Add an
`image: other-name.jpg` field only when the names differ. Every project needs
one — it's the card for a listed project, and the poster / reduced-motion
fallback for a `video`.

**`video`** is a looping muted clip for a feature block (`featured: true` only),
served from `public/videos/`. The poster is the project's own screenshot. The
`.mp4`/`.webm` can be committed later — until it exists the build **warns** (not
fails) and the block shows the poster. Not rendered under
`prefers-reduced-motion`.

**Feature screenshots crop to 16:10** so the two image blocks read as a pair —
most screenshots aren't that shape, so `focal` picks which edge survives.
`npm run build` warns, by filename, whenever a crop cuts more than 12%. A `video`
block frames its poster as a square instead, so it isn't crop-checked.

Anything missing or misspelled fails the build naming the file — see
`src/data/projects.ts`.
