# Looks like plain HTML, on purpose

The whole site is `public/index.html`. It used to be a Next.js app with a WebGL
globe and scroll-driven stages. William replaced it with a page that looks like
raw HTML. Keep it that way:

- **The look is the browser's.** Times, black on white, links in the default
  blue, default headings. No colours, backgrounds, font choices, borders,
  shadows, rounded corners, hover effects, transitions or animation.
- **CSS is for layout only.** One `<style>` in the head centres the column,
  lays things out in grids, spaces them, and draws the boxes. No `style=""`,
  no stylesheet file, no presentational attributes (`align`, `bgcolor`,
  `<center>`, `<font>`).
- **No JavaScript.** No `<script>`, no analytics, no embeds. The trailer is a
  link to YouTube, and the contact is a `mailto:` link.
- **Structure is ASCII.** Underscores for horizontal lines, `|` for vertical
  ones. Nothing fancier: no CSS borders, no box-drawing characters, no
  arrows, no emoji.
- **No build.** Nothing generates the page. Edit the HTML.

## Boxes

The boxes are drawn by CSS, as text, so they stretch to the column and their
text wraps inside them. A box is a grid. Each child is a row, and each
grandchild a cell:

```html
<div class="box cols">
  <div class="end"><span>THE PIPELINE</span></div>
  <div class="gap"><span>1</span><span>First step</span></div>
  <div class="end"><span>2</span><span>Last step</span></div>
</div>
```

```
 ________________
| THE PIPELINE   |
|________________|
|   |            |
| 1 | First step |
| 2 | Last step  |
|___|____________|
```

- **Columns:** one by default; `cols` is a narrow label column and the rest
  (`auto 1fr`); `two` and `three` are equal columns. A row with a single cell
  spans every column.
- **Rows:** `gap` leaves a blank line above the row; `end` closes it with a
  line of underscores. A row can be both.
- **Drawing:** every cell draws its left `|` column, and the box draws its top
  line and right `|` column. They are the `--line` (200 underscores) and
  `--pipes` (100 pipes) strings, clipped to fit. If a box ever gets wider than
  200 characters or a cell taller than 100 lines, lengthen them.
- **Screen readers** skip the drawing: `var(--alt,)` gives each one empty alt
  text where the browser supports it.

### Every cell is a whole number of lines

The pipes are lines of text. A cell half a line taller than its text cuts its
last `|` in half, and the underscores under it no longer meet the pipes. So
inside a box:

- Boxes use `line-height: 1.2`, and every vertical space is in `lh`: `gap`,
  `end`, and the `1lh` between paragraphs. No `em` or `px` margins.
- Headings inherit the box's font (`.box h3 { font: inherit }`), so they are
  one line tall.
- No pictures in boxes.

### Tabs and cards

A section starts with a tab whose line runs on to the edge of the column:

```html
<p class="tab"><span>01 TUNEBOX</span></p>
```

The hackathons are `<article class="box">` cards in a `<div class="cards">`:
two across when the column fits two 38-character cards (a window of about
680px), else one. Cards in a row share its height, the links sit at the
bottom, and an odd last card takes the whole row.

### Projects

Each of the other projects is an `<article class="project">` of four parts, in
this order: a `<header>` (title and tagline), the `<figure>`, the write-up
(`.text`) and the STACK / LINKS box.

```html
<article class="project" id="netzero">
  <header><h3>NetZero</h3><p><i>Tagline.</i></p></header>
  <figure>...</figure>
  <div class="text"><p>...</p></div>
  <dl class="box cols">...</dl>
</article>
```

Narrower than 42rem (672px), it is one column in that order. From 42rem, where
the column is at its full 40rem, the picture floats left at half the column,
like an `<img align="left">`. Its top lines up with the write-up's first line,
and the write-up runs beside it and on under it. The box clears the float and
closes the project at full width, so both sides end on the same line. Its
STACK and LINKS rows sit side by side there, as one row of four cells
(`auto 1fr auto auto`); narrower, they are two rows again.

## Pictures

A picture is a `<figure>`: the `<img>` inside a link to what it shows, and the
same link again, centred, as the `<figcaption>`. A caption that is a URL gets a
`<wbr>` after `https://`, so on a narrow phone it breaks there.

```html
<figure>
  <a href="https://netzero.williamragnarsson.dev"><img ...></a>
  <figcaption><a href="https://netzero.williamragnarsson.dev">https://<wbr>netzero.williamragnarsson.dev</a></figcaption>
</figure>
```

`img, video { max-width: 100%; height: auto }` fits them to the column. Every
`<img>` also has `width` and `height` set to its file's real size, so the page
saves its space before it loads, and `loading="lazy"` unless it is in the first
screen. Keep images WebP and no wider than 1400px
(`cwebp -q 80 -resize 1200 0`).

The Jev Events and double pendulum pictures move, so each is a `<video>` in
place of the `<img>`: `autoplay loop muted playsinline`, no controls, no sound,
no script. Its `poster` is the still, and its `<source>` has
`media="(prefers-reduced-motion: no-preference)"`, so anyone who asks for less
motion gets the still. The alt text goes in `aria-label`.

They are H.264 MP4s, which every browser plays, cut to one cycle so the loop
doesn't jump (`ffmpeg -c:v libx264 -preset veryslow -pix_fmt yuv420p
-movflags +faststart -an`):

- **Jev Events**: the landing page's animation, which repeats every 12s. 1200px,
  `-crf 24`, about 260KB.
- **Double pendulum**: 6s from the smooth bands into chaos. 640px at 30fps,
  `-crf 32`, about 1.5MB. Not a GIF or animated WebP: its noise barely
  compresses, and those came out at 13MB and up.

Jargon gets an `<abbr title="...">`, so hovering it shows what it means.

## Check it

Serve `public/` (see README) and look at 320, 375, 736, 1024 and 1440px, and
sweep 600 to 767px, where the cards and the projects switch from one column
to two:

- `document.documentElement.scrollWidth` equals the window width: no
  sideways scroll.
- Every cell is a whole number of lines. This should return an empty list:

  ```js
  [...document.querySelectorAll('.box > * > *')].filter(c => {
    const h = c.getBoundingClientRect().height;
    const n = h / parseFloat(getComputedStyle(c).lineHeight);
    return Math.abs(n - Math.round(n)) > 0.01;
  });
  ```
