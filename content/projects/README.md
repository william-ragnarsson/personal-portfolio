# Project cards (section 03)

One file per project. To **add** one: drop a `.md` here and its screenshot in
`public/images/projects/`. To **remove** one: delete the file. To **reorder**:
change the number prefixes — `ls` shows the order the page shows.
Files without a `NN-` prefix (like this one) are ignored.

```md
---
name: Double Pendulum
blurb: "One line, shown under the card."
alt: "What the screenshot shows, for screen readers."
href: "https://…"
linkLabel: Live demo      # or: GitHub
stack: [WebGPU, TypeScript]
focal: top                # top | center | bottom | left | right
---

First paragraph of the story, shown in the dialog.

Second paragraph. Blank lines separate them; there is no limit.
```

**The image is found by name.** `01-double-pendulum.md` looks for
`public/images/projects/double-pendulum.{jpg,jpeg,png,webp,avif}`. Add an
`image: other-name.jpg` field only when the names differ.

**The card crops.** Tiles are a fixed 16:10 so the grid reads as a set, and
most screenshots aren't that shape — `focal` picks which edge survives.
`npm run build` warns, by filename, whenever a crop cuts more than 12%. The
dialog always shows the image uncropped, so nothing is ever lost outright.

Anything missing or misspelled fails the build naming the file — see
`src/data/projects.ts`.
