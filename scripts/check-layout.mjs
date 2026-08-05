#!/usr/bin/env node
// Layout regression check.
//
// Guards the three failure modes this site actually shipped:
//
//   1. Sections overlapping / the page scrolling sideways at narrow widths,
//      because a sticky container was taller than the viewport.
//   2. The map section jumping when the window is dragged through the `md`
//      breakpoint, because crossing it swapped in a different DOM tree.
//   3. Reveal-on-scroll elements never appearing, because an
//      IntersectionObserver only reports threshold crossings and a fast scroll
//      can skip one entirely.
//
// Usage:  npm run check:layout            (expects a server on :3002)
//         ORIGIN=http://localhost:3000 npm run check:layout
//
// Requires a running server — see `npm run check:layout` in package.json.
import { launch, requireServer } from "./lib/browser.mjs";
import { evaluate, sleep } from "./lib/cdp.mjs";

const ORIGIN = process.env.ORIGIN ?? "http://localhost:3002";

// Kept in step with MapJourney.tsx. If the carousel gains a city or changes its
// lead-in, update these — the parking assertions depend on them.
const CITIES = 4;
const LEAD_IN = 0.85;
// Narrow `--fade` in MapJourney; the parked card must clear it.
const FADE_PX = 22;

const VIEWPORTS = [
  { name: "320x568  (small phone)", width: 320, height: 568 },
  { name: "390x844  (phone)", width: 390, height: 844 },
  { name: "768x1024 (tablet)", width: 768, height: 1024 },
  { name: "1024x600 (short + wide)", width: 1024, height: 600 },
  { name: "1440x900 (desktop)", width: 1440, height: 900 },
];

const failures = [];
const fail = (msg) => failures.push(msg);

const PAGE_PROBE = `(() => {
  const de = document.documentElement;
  const sticky = document.querySelector('.sticky');
  const rect = sticky?.getBoundingClientRect();
  const main = document.querySelector('main');
  return {
    ready: Boolean(main),
    scrollW: de.scrollWidth, clientW: de.clientWidth, vh: innerHeight,
    stickyH: rect ? Math.round(rect.height) : null,
    sections: [...(main?.children ?? [])].map((el) => {
      const b = el.getBoundingClientRect();
      return { tag: el.tagName, top: Math.round(b.top + scrollY), bottom: Math.round(b.bottom + scrollY) };
    }),
  };
})()`;

const MAP_PROBE = `(() => {
  const s = document.querySelector('.sticky');
  if (!s) return null;
  const col = s.querySelector('[class*="overflow-hidden"][class*="z-20"]');
  const c = col?.getBoundingClientRect();
  return {
    vh: innerHeight,
    colTop: c ? Math.round(c.top) : null,
    colBottom: c ? Math.round(c.bottom) : null,
    cards: [...s.querySelectorAll('[class*="rounded-2xl"][class*="border-border"]')].map((el) => {
      const b = el.getBoundingClientRect();
      return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) };
    }),
  };
})()`;

const trackTop = `Math.round(document.querySelector('.sticky').parentElement.getBoundingClientRect().top + scrollY)`;
const trackHeight = `Math.round(document.querySelector('.sticky').parentElement.getBoundingClientRect().height)`;

/**
 * Navigate and wait until the document is actually usable. A fixed sleep races
 * navigation — `Page.navigate` resolves when the load *starts* — and produces
 * confusing "page did not render" noise that looks like a real failure.
 *
 * Deliberately does not wait for `readyState === 'complete'`: the page embeds a
 * live third-party iframe, so the load event can be delayed arbitrarily by a
 * server we don't control. The DOM being present is what these checks need.
 */
/** Collect page errors so a crash is reported as a crash, not as "didn't load". */
async function captureErrors(cdp) {
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      window.__errors = [];
      addEventListener('error', (e) => window.__errors.push(String(e.message || e.error)));
      addEventListener('unhandledrejection', (e) => window.__errors.push('unhandled rejection: ' + e.reason));
    `,
  });
}

const readErrors = (cdp) =>
  evaluate(cdp, `(window.__errors || []).slice(0, 3)`).catch(() => []);

async function goto(cdp, url) {
  await cdp.send("Page.navigate", { url });
  for (let i = 0; i < 60; i++) {
    await sleep(150);
    const ready = await evaluate(
      cdp,
      `!!document.querySelector('main') && !!document.querySelector('.sticky')`,
    ).catch(() => false);
    // Give hydration and the first measurement pass a moment to settle.
    if (ready) return await sleep(800), true;
  }
  return false;
}

await requireServer(ORIGIN);
const cdp = await launch();

try {
  await captureErrors(cdp);
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
  });

  // ── 1. Layout holds at every viewport ───────────────────────────────
  console.log("Layout matrix");
  for (const vp of VIEWPORTS) {
    const before = failures.length;
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: false,
    });
    if (!(await goto(cdp, ORIGIN))) {
      const errs = await readErrors(cdp);
      const why = errs.length ? `page crashed: ${errs[0]}` : "page never rendered";
      fail(`${vp.name}: ${why}`);
      console.log(`  FAIL  ${vp.name}  (${why})`);
      continue;
    }

    const page = await evaluate(cdp, PAGE_PROBE);

    if (page.scrollW > page.clientW + 1)
      fail(`${vp.name}: page scrolls sideways (${page.scrollW} > ${page.clientW})`);

    if (page.stickyH !== null && page.stickyH > page.vh + 1)
      fail(`${vp.name}: sticky container ${page.stickyH}px exceeds viewport ${page.vh}px — sticky will release`);

    for (let i = 1; i < page.sections.length; i++) {
      const prev = page.sections[i - 1];
      const cur = page.sections[i];
      if (cur.top < prev.bottom - 1)
        fail(`${vp.name}: <${cur.tag}> starts at ${cur.top} but previous ends at ${prev.bottom} — sections overlap`);
    }

    // Park on each city; the card must land centred in its window.
    const top = await evaluate(cdp, trackTop);
    const height = await evaluate(cdp, trackHeight);
    const span = CITIES - 1 + LEAD_IN;

    for (let city = 0; city < CITIES; city++) {
      const y = Math.round(top + ((city + LEAD_IN) / span) * (height - page.vh));
      await evaluate(cdp, `window.scrollTo(0, ${y}); null`);
      await sleep(400);
      const map = await evaluate(cdp, MAP_PROBE);
      if (!map?.cards?.length || map.colTop === null) continue;

      const windowH = map.colBottom - map.colTop;
      const middle = (map.colTop + map.colBottom) / 2;
      const card = map.cards[city];
      if (!card) continue;

      const off = Math.abs((card.top + card.bottom) / 2 - middle);
      if (off > 2)
        fail(`${vp.name} @city${city}: card centre off by ${off.toFixed(0)}px — scroll/card mapping has drifted`);
      if (card.h > windowH + 1)
        fail(`${vp.name} @city${city}: card ${card.h}px taller than its ${windowH}px window`);
      if ((windowH - card.h) / 2 < FADE_PX)
        fail(`${vp.name} @city${city}: only ${((windowH - card.h) / 2).toFixed(0)}px clearance vs the ${FADE_PX}px edge fade`);
    }

    const added = failures.length - before;
    console.log(
      `  ${added ? "FAIL" : "ok  "}  ${vp.name}  sticky=${page.stickyH}/${page.vh}` +
        (added ? `  (${added} problem${added > 1 ? "s" : ""})` : ""),
    );
  }

  // ── 2. Dragging through the breakpoint must not remount ─────────────
  console.log("\nBreakpoint drag (900 → 640 → 900, parked mid-journey)");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 900, height: 800, deviceScaleFactor: 1, mobile: false,
  });
  if (!(await goto(cdp, ORIGIN))) {
    const errs = await readErrors(cdp);
    fail(`breakpoint drag: page unusable at 900px — ${errs[0] ?? "never rendered"}`);
    console.log("  SKIP  page unusable, see failures below");
  } else {
  const top = await evaluate(cdp, trackTop);
  const height = await evaluate(cdp, trackHeight);
  await evaluate(cdp, `window.scrollTo(0, ${Math.round(top + 0.48 * (height - 800))}); null`);
  await sleep(500);

  // Tag the live nodes. If React swaps the tree, the property is gone.
  await evaluate(cdp, `(() => {
    const s = document.querySelector('.sticky');
    s.__alive = true; s.parentElement.__alive = true; return true;
  })()`);

  let remounts = 0;
  const widths = [];
  for (let w = 900; w >= 640; w -= 20) widths.push(w);
  for (let w = 660; w <= 900; w += 20) widths.push(w);

  for (const width of widths) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width, height: 800, deviceScaleFactor: 1, mobile: false,
    });
    await sleep(160);
    const state = await evaluate(cdp, `(() => {
      const s = document.querySelector('.sticky');
      if (!s) return { gone: true };
      const de = document.documentElement;
      const r = s.getBoundingClientRect();
      return { alive: s.__alive === true && s.parentElement.__alive === true,
               overflow: de.scrollWidth - de.clientWidth, tall: Math.round(r.height) > innerHeight + 1 };
    })()`);

    if (state.gone || !state.alive) remounts++;
    if (state.overflow > 1) fail(`drag @${width}px: page scrolls sideways`);
    if (state.tall) fail(`drag @${width}px: sticky taller than viewport`);
  }

  if (remounts > 0)
    fail(`breakpoint drag: MapJourney remounted ${remounts}x — the tree must not change shape at md`);
  console.log(`  ok  ${widths.length} width steps, ${remounts} remounts`);
  }

  // ── 3. Every reveal must end up visible ─────────────────────────────
  console.log("\nScroll reveals");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1280, height: 800, deviceScaleFactor: 1, mobile: false,
  });
  if (!(await goto(cdp, ORIGIN))) {
    const errs = await readErrors(cdp);
    fail(`reveals: page unusable at 1280px — ${errs[0] ?? "never rendered"}`);
  } else {
  // Coarse jumps on purpose: this is what skips an observer sample.
  for (let f = 0.1; f <= 1.001; f += 0.1) {
    await evaluate(cdp, `window.scrollTo(0, document.body.scrollHeight * ${f}); null`);
    await sleep(280);
  }
  await sleep(900);

  const stuck = await evaluate(cdp, `[...document.querySelectorAll('.reveal')]
    .filter((el) => getComputedStyle(el).opacity !== '1')
    .map((el) => (el.textContent || '').trim().slice(0, 40))`);

  if (stuck.length)
    fail(`${stuck.length} reveal element(s) never became visible: ${stuck.map((s) => JSON.stringify(s)).join(", ")}`);
  else console.log(`  ok  all reveals visible after a jumpy scroll`);
  }
} finally {
  cdp.close();
}

console.log("");
if (failures.length === 0) {
  console.log("PASS — no overflow, no overlap, no remount, no stuck reveals");
  process.exit(0);
}
console.log(`FAIL — ${failures.length} problem(s):`);
for (const f of failures) console.log(`  ✗ ${f}`);
process.exit(1);
