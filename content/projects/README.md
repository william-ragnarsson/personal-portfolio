# Projects

One file per project. The page shows the **featured** ones as big blocks that
alternate sides, in file order, then a "See the rest on GitHub" link. A file
without `featured: true` isn't shown. It stays here so it can be featured
again later.

To **add** one: drop a `.md` here and its screenshot in
`public/images/projects/`. To **remove** one: delete the file, or drop
`featured`. To **reorder**: change the number prefixes, so `ls` shows the order
the page shows.

```md
---
name: Double Pendulum
blurb: "One line, shown under the name."
alt: "What the screenshot shows, for screen readers."
href: "https://…"
linkLabel: Live demo      # or: GitHub
repo: "https://github.com/…"  # optional, only when href is a live demo
stack: [WebGPU, TypeScript]
featured: true            # shown on the page
video: /videos/double-pendulum.mp4   # optional, featured only. see below.
focal: top                # top | center | bottom | left | right
---

First paragraph of the story. Every paragraph is shown, and **words in double
asterisks** are highlighted.

Second paragraph. Blank lines separate them; there is no limit.
```

**The image is found by name.** `01-double-pendulum.md` looks for
`public/images/projects/double-pendulum.{jpg,jpeg,png,webp,avif}`. Add an
`image: other-name.jpg` field only when the names differ. Every project needs
one: it's the block's picture, and the poster for a `video`.

**`video`** is a looping muted clip in place of the screenshot, served from
`public/videos/`: 16:10, H.264 `.mp4` (or `.webm`), no audio track. It plays
while it's on screen. Under `prefers-reduced-motion` it waits for a press
instead. The file can be committed after the copy: until it exists the build
**warns** (it doesn't fail) and the block shows the screenshot.

**Pictures crop to 16:10.** Most screenshots aren't that shape, so `focal`
picks which edge survives. Without a `focal:` line, `npm run build` warns, by
filename, whenever the crop cuts more than 12%. Writing one, even
`focal: top`, the default, says you've looked, and silences it.

Anything missing or misspelled fails the build, naming the file. See
`src/data/projects.ts`.
