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

## Pictures

`img { max-width: 100%; height: auto }` fits them to the column. Every `<img>`
also has `width` and `height` set to its file's real size, so the page saves
its space before it loads. Keep images WebP and no wider than 1400px
(`cwebp -q 80 -resize 1200 0`).

## Check it

Serve `public/` (see README) and look at 320, 375, 736, 1024 and 1440px, and
sweep 600 to 767px, where the cards switch from one column to two:

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
