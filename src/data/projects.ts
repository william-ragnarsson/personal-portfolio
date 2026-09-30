import "server-only";

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { imageSize } from "image-size";

/**
 * Project cards are authored as markdown, one file per project, so editing the
 * section never means editing TypeScript. This module reads them at build time.
 *
 *   content/projects/01-jev-events.md   ← copy, in filename order
 *   public/images/projects/jev-events.* ← matched to it by slug
 *
 * The `NN-` prefix is the running order, so `ls` shows what the page shows and
 * reordering is a rename. Anything malformed throws rather than rendering a
 * blank card — a typo in content should fail the build, not ship.
 */

const CONTENT_DIR = join(process.cwd(), "content/projects");
const IMAGE_DIR = join(process.cwd(), "public/images/projects");
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];

export type Project = {
  slug: string;
  name: string;
  blurb: string;
  /** The long-form story, one entry per paragraph. `**words**` are highlighted. */
  details: string[];
  stack: string[];
  /** Shown on the page, in the projects index. The rest are left to GitHub. */
  featured: boolean;
  image: string;
  imageAlt: string;
  /**
   * Looping muted clip in place of the picture, e.g. "/videos/double-pendulum.mp4".
   * Featured projects only. `image` is its poster and reduced-motion fallback,
   * so the two should be the same shape.
   */
  video: string | null;
  /** False until the clip's file is in `public/videos/`: the page shows the picture. */
  videoReady: boolean;
  /** Intrinsic size of the picture. Its frame on the page takes this shape, so
   *  nothing is cropped. */
  width: number;
  height: number;
  href: string;
  linkLabel: "Live demo" | "GitHub";
  /** The source, when `href` is a live demo. */
  repo: string | null;
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

  const stack: unknown = data.stack ?? [];
  if (!Array.isArray(stack) || stack.some((tech) => typeof tech !== "string")) {
    fail(file, "stack must be a list of strings, e.g. [WebGPU, TypeScript].");
  }

  const featured = data.featured ?? false;
  if (typeof featured !== "boolean") {
    fail(file, `featured must be true or false, got "${String(data.featured)}".`);
  }

  // The picture is required for every project: it's the poster and the
  // reduced-motion fallback for a video, and the page has nothing to fall back
  // to. The video is a separate, optional field.
  let video: string | null = null;
  let videoReady = false;
  if (data.video != null) {
    if (!featured) {
      fail(file, `video is only for featured projects — add "featured: true" or remove it.`);
    }
    if (typeof data.video !== "string" || !/^\/videos\/[\w-]+\.(mp4|webm)$/.test(data.video)) {
      fail(file, `video must look like "/videos/${slug}.mp4".`);
    }
    video = data.video;
    videoReady = existsSync(join(process.cwd(), "public", video));
    // The clip can be added after the copy — warn rather than fail so the
    // project still ships, showing its picture until the file lands.
    if (!videoReady) {
      console.warn(
        `[projects] ${file}: ${video} isn't in public/videos/ yet — the page ` +
          `shows the picture until it's added.`,
      );
    }
  }

  let repo: string | null = null;
  if (data.repo != null) {
    if (typeof data.repo !== "string" || !/^https:\/\//.test(data.repo)) {
      fail(file, `repo must be a full https:// URL, got "${String(data.repo)}".`);
    }
    if (linkLabel === "GitHub") {
      fail(file, `repo is for a project whose href is a live demo; this one's href is already GitHub.`);
    }
    repo = data.repo;
  }

  const imageName = resolveImage(file, slug, data.image, available);
  const { width, height } = imageSize(readFileSync(join(IMAGE_DIR, imageName)));
  if (!width || !height) fail(file, `could not read the dimensions of ${imageName}.`);

  return {
    slug,
    name: requireString(file, data, "name"),
    blurb: requireString(file, data, "blurb"),
    details,
    stack: stack as string[],
    featured,
    image: `/images/projects/${imageName}`,
    imageAlt: requireString(file, data, "alt"),
    video,
    width,
    height,
    href: requireString(file, data, "href"),
    linkLabel,
    repo,
    videoReady,
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
