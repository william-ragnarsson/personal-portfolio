// Finds and launches a headless Chrome, and connects a CDP session to it.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { connectCDP, sleep } from "./cdp.mjs";

const HOME = process.env.HOME ?? "";

/** Somewhere on this machine there is a Chrome. Look in the usual places. */
function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];

  // Puppeteer keeps versioned downloads here; take whatever is present.
  for (const kind of ["chrome-headless-shell", "chrome"]) {
    const root = join(HOME, ".cache", "puppeteer", kind);
    if (!existsSync(root)) continue;
    for (const version of readdirSync(root)) {
      for (const rel of [
        join(version, `${kind}-mac-arm64`, kind),
        join(version, `${kind}-mac-x64`, kind),
        join(version, "chrome-mac-arm64", "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"),
        join(version, "chrome-mac-x64", "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"),
        join(version, `${kind}-linux64`, kind),
      ]) {
        candidates.push(join(root, rel));
      }
    }
  }

  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    throw new Error(
      "No Chrome found. Install Google Chrome, or set CHROME_PATH to a Chrome/Chromium binary.",
    );
  }
  return found;
}

/**
 * Launch headless Chrome on a debugging port and open a CDP session.
 * Returns the session plus a `close()` that also kills the browser.
 */
export async function launch({ port = 9333, width = 1440, height = 900 } = {}) {
  const binary = findBrowser();
  const profile = mkdtempSync(join(tmpdir(), "layout-check-"));

  const child = spawn(
    binary,
    [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--no-first-run",
      "--disable-extensions",
      "--hide-scrollbars",
      `--user-data-dir=${profile}`,
      `--remote-debugging-port=${port}`,
      `--window-size=${width},${height}`,
      "about:blank",
    ],
    { stdio: "ignore", detached: false },
  );

  // Wait for the debugging endpoint to come up.
  let target;
  for (let i = 0; i < 60; i++) {
    await sleep(250);
    try {
      const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
      target = list.find((t) => t.type === "page");
      if (target) break;
    } catch {
      // not listening yet
    }
  }
  if (!target) {
    child.kill("SIGKILL");
    throw new Error(`Chrome did not expose a debugging port on ${port}`);
  }

  const cdp = await connectCDP(target.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  return {
    ...cdp,
    close: () => {
      cdp.close();
      child.kill("SIGKILL");
      try {
        rmSync(profile, { recursive: true, force: true });
      } catch {
        // best effort
      }
    },
  };
}

/** Fail early with a clear message rather than a wall of navigation errors. */
export async function requireServer(origin) {
  try {
    const res = await fetch(origin, { redirect: "manual" });
    if (res.status >= 500) throw new Error(`status ${res.status}`);
  } catch (err) {
    throw new Error(
      `No server responding at ${origin}.\n` +
        `Start one first:  npm run build && npx next start -p ${new URL(origin).port || 80}\n` +
        `(or point the check elsewhere:  ORIGIN=http://localhost:3000 npm run check:layout)\n` +
        `cause: ${err.message}`,
    );
  }
}
