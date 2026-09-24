# personal-portfolio

William Ragnarsson's portfolio: one long, scroll-driven page. A blue poster,
the startup on a yellow sheet and the Plug and Play work on a blue one laid
over it, then the blue folds into a clay globe that flies through the
hackathons, the projects, a flight to New York, and a dive into the yellow
contact page, where you can write William an email right there.

## Stack

- **Next.js 16** (App Router) + **TypeScript**, deployed on **Vercel**
  (`williamragnarsson.com`)
- **CSS Modules** per section, on Tailwind 4's preflight (`src/app/globals.css`
  holds the palette, the scale and the shared type)
- **Anek Latin**, a variable font; its width axis is what stretches the name
- **The globe** is a WebGL2 fragment shader (`src/lib/globe/`), no 3D library
- **Resend** sends the contact form's email (plain `fetch`, no SDK)
- **PostHog** + Vercel Analytics

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

Without `RESEND_API_KEY`, the contact form works in development but only logs
the message to the terminal. See [The contact form](#the-contact-form).

## What's where

| Section | Component | Tone |
| --- | --- | --- |
| Hi, I'm William. | `sections/Hero.tsx` | blue |
| The startup (Tunebox) | `sections/Tunebox.tsx` | yellow |
| Plug and Play | `sections/PlugAndPlay.tsx` | blue |
| Hackathons: the blue folds into the globe | `sections/Hackathons.tsx` + `globe/HackathonStage.tsx` | cream |
| Projects | `sections/Projects.tsx` | cream |
| The move to NYC: flight, dive | `sections/Nyc.tsx` + `globe/NycStage.tsx` | cream |
| Let's Talk! | `contact/Contact.tsx` | yellow |

A section's tone (`tone-blue`, `tone-light`, `tone-yellow` in `globals.css`)
sets its colours, and `data-tone` tells the custom cursor which colour will
show up on it (`src/lib/cursorTone.ts`). Tunebox and Plug and Play are also
`.sheet`s: rounded top corners and a shadow, each laid over the one before.
`PageTone` keeps the colour behind the page, and the browser's theme colour on
phones, in step with the scroll.

### The globe, in three versions

`<html data-globe>` is set by an inline script before first paint
(`src/lib/mode.ts`):

- **`3d`**: a mouse or trackpad, WebGL2 and motion allowed. At `md` and up the
  hackathons and NYC are sticky, scroll-driven stages.
- **`still`**: phones, tablets and reduced motion. Each section is a list next
  to one globe that's drawn once.
- **`none`**: WebGL2 failed after all. The list, no globe.

All three are in the server markup for everyone, and CSS picks which one shows.
Nothing mounts or unmounts on the client (see `AGENTS.md`).

- `src/lib/globe/renderer.ts`: the shader, with one WebGL context for the page
- `src/lib/globe/timeline.ts`: scroll progress → camera, cards and pins, as
  pure functions
- `src/lib/globe/paint.ts`: routes and pins, drawn in 2D on top
- `src/components/globe/`: the two stages, the still globe and the shared
  stage geometry

The land is a baked mask, `public/globe/land.png` (Natural Earth 1:50m). It's
committed. Re-bake it only to change the source or the resolution:

```bash
npm run bake:land
```

## Editing content

All copy lives in data files. Change these, not the layout:

- `src/data/site.ts`: name, email, links (GitHub, LinkedIn, X, demos)
- `src/data/content.ts`: the hackathons, in the order the globe flies them.
  Each one's `lat`/`lng` is its pin.
- `content/projects/*.md`: the Projects section, one file per project.
  `content/projects/README.md` has the format.

## The contact form

The form posts to a server action (`src/app/actions.ts`) that sends through
[Resend](https://resend.com). It works without JavaScript too.

| Variable | |
| --- | --- |
| `RESEND_API_KEY` | Required in production. Without it the form says sending isn't set up and shows the email address instead. |
| `CONTACT_FROM` | The sender, e.g. `Portfolio <hello@williamragnarsson.com>`. Defaults to Resend's test sender, `onboarding@resend.dev`, which can only deliver to the Resend account's own address. |
| `CONTACT_TO` | Where messages go. Defaults to `site.email`. |

The visitor's address goes in `reply_to`, so replying from your inbox answers
them. On Vercel the email also says roughly where it was sent from (Vercel's
geo headers). That's also where the "sent" animation's flight starts.

Setting it up:

1. Create a Resend account, and under **Domains** add `williamragnarsson.com`.
2. Add the DNS records Resend lists (DKIM TXT, plus an MX and SPF TXT on the
   `send` subdomain) to the domain's DNS. On Cloudflare, set them to
   **DNS only**, not proxied. Wait until Resend shows the domain as verified.
3. Create an API key with sending access.
4. In Vercel → Settings → Environment Variables, add `RESEND_API_KEY` and
   `CONTACT_FROM` (any address at the verified domain), then redeploy.

A hidden `company` field catches bots. When it's filled in, the action reports
success and sends nothing.

## Media

- **Project clip**: `public/videos/double-pendulum.mp4`. It should be 16:10
  (e.g. 1320×825), H.264, with no audio track, a few seconds long and
  seamlessly looping, ideally under 4 MB. Until it's there the block shows the
  screenshot, and the build warns.
- **Share image**: `src/app/opengraph-image.png` is a 1200×630 screenshot of
  the hero, with its alt text in `opengraph-image.alt.txt`. If the hero
  changes, run `npm run build && npm run start`, then retake it with Chrome:

  ```bash
  chrome --headless --hide-scrollbars --force-prefers-reduced-motion --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=9000 --screenshot=src/app/opengraph-image.png http://localhost:3000/
  ```

  `chrome` is your Chrome binary. `--force-prefers-reduced-motion` skips the
  opening animation, so the name is captured at its final width.

## Checking layout

The page is scroll-linked and full of sticky stages, so layout bugs never show
up in a typecheck. They only appear at particular viewport sizes. After
changing anything responsive, check these by hand at **320×568, 390×844,
768×1024, 1024×600 (short and wide), and 1440×900**:

- no horizontal scrollbar, no section running into the next
- a stage's text, globe and progress bar never overlap. On a tall window the
  globe moves under the text.
- scroll through the hackathons stage slowly: every card shows at its stop,
  and the progress bar and Skip stay put
- **drag** the window width slowly through 768px, don't just jump: the stages
  must switch to the list and back without jumping
- scroll down fast, then reload mid-page: every section must still be visible,
  not stuck invisible
- with reduced motion on (in the OS, or in DevTools → Rendering), you get the
  still version

The rules behind these are in `AGENTS.md`. Read that before changing anything
responsive.

## TODO (for William)

- Confirm the **LinkedIn URL** in `src/data/site.ts` (currently a guess).
- Set up **Resend** (above), or the form won't send in production.
- Add **`public/videos/double-pendulum.mp4`** (spec above).
