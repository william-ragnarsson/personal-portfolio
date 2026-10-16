# personal-portfolio

William Ragnarsson's portfolio, `williamragnarsson.com`: one page that looks
like plain HTML. Browser defaults for the look, a little CSS for the layout, no
JavaScript, no build. The only structure is boxes drawn with underscores and
pipes.

## What's where

```
public/
  index.html             the whole site
  images/                one picture per section, WebP, at most 1400px wide
  videos/                Jev Events and the double pendulum, MP4s that loop in place of their pictures
  favicon.svg, icon.png  the tab icon: a bold Times W in one of the page's boxes
  apple-touch-icon.png   the same, with room around it for the home screen
  og.png                 link preview, 1200x630
vercel.json              tells Vercel there is nothing to build: serve public/
```

## Run it

```bash
python3 -m http.server 3001 --directory public
```

Then open http://localhost:3001. Opening `public/index.html` straight from the
disk also works, except the pictures, whose paths start at the site root.
Safari won't play the videos from Python's server, which can't send
part of a file; look at it in Chrome or Firefox, or on the deployed site.

## Deploy

Vercel serves `public/` as it is. `vercel.json` sets `"framework": null` (the
"Other" preset), so there is no install and no build step, whatever the
project's dashboard still says from the Next.js days.

## Editing

The rules are in [AGENTS.md](AGENTS.md). The short version: CSS may arrange
the page but never style it, and every cell of a box is a whole number of lines
tall, so its pipes stay joined.
