import "server-only";

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { imageSize } from "image-size";

/**
 * Project cards are authored as markdown, one file per project, so editing the
 * section never means editing TypeScript. This module reads them at build time.
 *
 *   content/projects/01-double-pendulum.md   ← copy, in filename order
 *   public/images/projects/double-pendulum.* ← matched to it by slug
 *
 * The `NN-` prefix is the running order, so `ls` shows what the page shows and
 * reordering is a rename. Anything malformed throws rather than rendering a
 * blank card — a typo in content should fail the build, not ship.
 */

const CONTENT_DIR = join(process.cwd(), "content/projects");
const IMAGE_DIR = join(process.cwd(), "public/images/projects");
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];

/** The tile's fixed shape. Anything not this ratio gets cropped to fit it. */
const TILE_RATIO = 16 / 10;
/** Warn past this much of an image being cut. */
const CROP_WARNING_THRESHOLD = 0.12;

export const FOCAL_POINTS = ["top", "center", "bottom", "left", "right"] as const;
export type FocalPoint = (typeof FOCAL_POINTS)[number];

export type Project = {
  slug: string;
  name: string;
  blurb: string;
  /** The long-form story, one entry per paragraph. */
  details: string[];
  stack: string[];
  image: string;
  imageAlt: string;
  /** Which edge of the image survives the tile's crop. */
  focal: FocalPoint;
  /** Intrinsic size, so the dialog can show the image uncropped. */
  width: number;
  height: number;
  href: string;
  linkLabel: "Live demo" | "GitHub";
};

function fail(file: string, message: string): never {
  throw new Error(`content/projects/${file}: ${message}`);
}

/**
 * Resolve the screenshot by convention: the slug, with any supported
 * extension. An `image:` field overrides it for the odd file whose name
 * doesn't match.
 */
function resolveImage(file: string, slug: string, override: unknown, available: string[]): string {
  if (typeof override === "string" && override) {
    const name = override.replace(/^.*\//, "");
    if (!available.includes(name)) {
      fail(file, `image: "${name}" not found in public/images/projects/`);
    }
    return name;
  }

  const candidates = IMAGE_EXTENSIONS.map((ext) => `${slug}.${ext}`);
  const found = candidates.find((name) => available.includes(name));
  if (!found) {
    fail(
      file,
      `no image found. Add one of ${candidates.join(", ")} to public/images/projects/, ` +
        `or point at an existing file with an "image:" field.`,
    );
  }
  return found;
}

/**
 * Screenshots come in whatever shape the window was, and the tile is a fixed
 * 16:10 — so most of them lose an edge. Say so at build time, naming the file
 * and the amount, rather than leaving it to be noticed on the page. A warning,
 * not an error: cropping hard is sometimes the right answer.
 */
function warnOnHeavyCrop(name: string, width: number, height: number, focal: FocalPoint) {
  const ratio = width / height;
  const wide = ratio > TILE_RATIO;
  const lost = 1 - (wide ? TILE_RATIO / ratio : ratio / TILE_RATIO);
  if (lost <= CROP_WARNING_THRESHOLD) return;

  const edge = wide ? "the sides" : focal === "top" ? "the bottom" : `the ${focal} side`;
  console.warn(
    `[projects] ${name} is ${width}x${height} (${ratio.toFixed(2)}:1). The 16:10 tile ` +
      `crops ${Math.round(lost * 100)}% off ${edge}. Set "focal:" to choose what survives, ` +
      `or re-crop the file.`,
  );
}

function toParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim().replace(/\s*\n\s*/g, " "))
    .filter(Boolean);
}

function requireString(file: string, data: Record<string, unknown>, field: string): string {
  const value = data[field];
  if (typeof value !== "string" || !value.trim()) {
    fail(file, `missing required "${field}" in the frontmatter.`);
  }
  return value.trim();
}

function readProject(file: string, available: string[]): Project {
  const slug = file.replace(/\.md$/, "").replace(/^\d+[-_]?/, "");
  if (!slug) fail(file, "filename is only an order prefix — it needs a name after it.");

  const { data, content } = matter(readFileSync(join(CONTENT_DIR, file), "utf8"));

  const details = toParagraphs(content);
  if (details.length === 0) {
    fail(file, "the body is empty — write the story below the frontmatter.");
  }

  const linkLabel = requireString(file, data, "linkLabel");
  if (linkLabel !== "Live demo" && linkLabel !== "GitHub") {
    fail(file, `linkLabel must be "Live demo" or "GitHub", got "${linkLabel}".`);
  }

  const focal = (data.focal ?? "top") as FocalPoint;
  if (!FOCAL_POINTS.includes(focal)) {
    fail(file, `focal must be one of ${FOCAL_POINTS.join(", ")}, got "${String(data.focal)}".`);
  }

  const stack: unknown = data.stack ?? [];
  if (!Array.isArray(stack) || stack.some((tech) => typeof tech !== "string")) {
    fail(file, "stack must be a list of strings, e.g. [WebGPU, TypeScript].");
  }

  const imageName = resolveImage(file, slug, data.image, available);
  const { width, height } = imageSize(readFileSync(join(IMAGE_DIR, imageName)));
  if (!width || !height) fail(file, `could not read the dimensions of ${imageName}.`);
  warnOnHeavyCrop(imageName, width, height, focal);

  return {
    slug,
    name: requireString(file, data, "name"),
    blurb: requireString(file, data, "blurb"),
    details,
    stack: stack as string[],
    image: `/images/projects/${imageName}`,
    imageAlt: requireString(file, data, "alt"),
    focal,
    width,
    height,
    href: requireString(file, data, "href"),
    linkLabel,
  };
}

/** A project file is `NN-slug.md`. The prefix is the order, and requiring it
 *  also means notes kept alongside the content (README.md, drafts) are ignored
 *  rather than parsed as a card. */
const PROJECT_FILE = /^\d+[-_].+\.md$/;

/** Every project card, in filename order. Build-time only. */
export function getProjects(): Project[] {
  const available = readdirSync(IMAGE_DIR);
  return readdirSync(CONTENT_DIR)
    .filter((file) => PROJECT_FILE.test(file))
    .sort()
    .map((file) => readProject(file, available));
}
