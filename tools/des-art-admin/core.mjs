import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  deleteProject,
  parseProjectDocument,
  resolveProjectAssetPath,
  resolveProjectDocumentPath,
  validateProjectDocument,
} from "../../src/lib/project-contract.ts";
import { readAllProjectDocuments, writeProjectDocument } from "../../src/lib/projects.ts";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);
const IMAGE_TYPES = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/gif", ".gif"],
  ["image/webp", ".webp"],
]);
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;

export function validateLocalRequest(request, csrfToken, port) {
  const host = String(request.host ?? "");
  const separator = host.lastIndexOf(":");
  const hostname = separator === -1 ? host : host.slice(0, separator);
  const requestPort = separator === -1 ? "" : host.slice(separator + 1);
  if (!LOOPBACK_HOSTS.has(hostname) || requestPort !== String(port)) {
    throw new Error("Host is not the local admin endpoint.");
  }
  if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS") {
    const expectedOrigin = `http://127.0.0.1:${port}`;
    if (request.origin !== expectedOrigin) throw new Error("Origin is not trusted.");
    if (request.csrf !== csrfToken) throw new Error("CSRF token is missing or invalid.");
  }
}

export function safeUploadName(fileName) {
  if (typeof fileName !== "string" || fileName.includes("/") || fileName.includes("\\") || fileName.includes("..")) {
    throw new Error("Filename must not contain path segments.");
  }
  const extension = path.extname(fileName).toLowerCase();
  if (![...IMAGE_TYPES.values()].includes(extension) && extension !== ".jpeg") {
    throw new Error("Filename extension is not supported.");
  }
  const stem = path.basename(fileName, path.extname(fileName))
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "image";
  return `${stem}${extension === ".jpeg" ? ".jpg" : extension}`;
}

function pngDimensions(buffer) {
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("PNG signature is invalid.");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function gifDimensions(buffer) {
  if (buffer.length < 10 || !["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))) throw new Error("GIF signature is invalid.");
  return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
}

function jpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) throw new Error("JPEG signature is invalid.");
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2 || offset + length + 2 > buffer.length) break;
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += length + 2;
  }
  throw new Error("JPEG dimensions were not found.");
}

function webpDimensions(buffer) {
  if (buffer.length < 30 || buffer.subarray(0, 4).toString("ascii") !== "RIFF" || buffer.subarray(8, 12).toString("ascii") !== "WEBP") throw new Error("WebP signature is invalid.");
  const type = buffer.subarray(12, 16).toString("ascii");
  if (type === "VP8X") return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  if (type === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (type === "VP8 ") return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  throw new Error("WebP dimensions were not found.");
}

export function inspectImage(buffer, fileName, mime) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) throw new Error("Image size must be between 1 byte and 20 MB.");
  const expectedExtension = IMAGE_TYPES.get(mime);
  if (!expectedExtension) throw new Error("Image MIME type is not supported.");
  const safeName = safeUploadName(fileName);
  if (path.extname(safeName) !== expectedExtension) throw new Error("Image extension does not match its MIME type.");
  const dimensions = mime === "image/png" ? pngDimensions(buffer)
    : mime === "image/jpeg" ? jpegDimensions(buffer)
      : mime === "image/gif" ? gifDimensions(buffer)
        : webpDimensions(buffer);
  if (dimensions.width < 1 || dimensions.height < 1 || dimensions.width * dimensions.height > MAX_IMAGE_PIXELS) {
    throw new Error("Image resolution is invalid or exceeds 40 megapixels.");
  }
  return { extension: expectedExtension, ...dimensions, mime };
}

async function canonicalDraftPath(root, slug) {
  await mkdir(root, { recursive: true });
  return resolveProjectDocumentPath(root, slug);
}

export class AdminStore {
  constructor({ contentRoot, assetRoot, draftRoot, draftAssetRoot = assetRoot }) {
    this.contentRoot = contentRoot;
    this.assetRoot = assetRoot;
    this.draftRoot = draftRoot;
    this.draftAssetRoot = draftAssetRoot;
  }

  async listProjects() {
    await mkdir(this.contentRoot, { recursive: true });
    const published = readAllProjectDocuments(this.contentRoot);
    await mkdir(this.draftRoot, { recursive: true });
    const draftFiles = (await readdir(this.draftRoot)).filter((name) => name.endsWith(".json"));
    const drafts = (await Promise.all(draftFiles.map(async (name) => {
      try {
        return parseProjectDocument(await readFile(path.join(this.draftRoot, name), "utf8"), name);
      } catch {
        return undefined;
      }
    }))).filter(Boolean);
    const merged = new Map(published.map((project) => [project.slug, project]));
    for (const draft of drafts) merged.set(draft.slug, draft);
    return [...merged.values()];
  }

  async getProject(slug) {
    try {
      return await this.getDraft(slug);
    } catch {}
    return this.getPublishedProject(slug);
  }

  async getPublishedProject(slug) {
    const file = resolveProjectDocumentPath(this.contentRoot, slug);
    return parseProjectDocument(await readFile(file, "utf8"), path.basename(file));
  }

  async saveProject(value) {
    return writeProjectDocument(value, this.contentRoot);
  }

  async duplicateProject(sourceSlug, newSlug) {
    const source = await this.getProject(sourceSlug);
    const copy = validateProjectDocument({
      ...source,
      title: `${source.title} — копия`,
      slug: newSlug,
      visibility: "draft",
      featuredOnHome: false,
      homeOrder: undefined,
    });
    await this.saveDraft(newSlug, copy);
    return copy;
  }

  async setVisibility(slug, visibility) {
    const current = await this.getProject(slug);
    const next = visibility === "deleted" ? deleteProject(current) : validateProjectDocument({
      ...current,
      visibility,
      ...(visibility === "published" ? {} : { featuredOnHome: false, homeOrder: undefined }),
    });
    await this.saveDraft(slug, next);
    return next;
  }

  async reorder(slugs) {
    const projects = await this.listProjects();
    const bySlug = new Map(projects.map((item) => [item.slug, item]));
    for (const slug of slugs) if (!bySlug.has(slug)) throw new Error(`Unknown project slug "${slug}".`);
    const published = projects.filter((item) => item.visibility === "published");
    if (slugs.length !== published.length || slugs.some((slug) => bySlug.get(slug)?.visibility !== "published")) {
      throw new Error("Only published projects can be reordered.");
    }
    for (const [index, slug] of slugs.entries()) await this.saveDraft(slug, { ...bySlug.get(slug), catalogOrder: index + 1 });
    return this.listProjects();
  }

  async saveDraft(slug, value) {
    const file = await canonicalDraftPath(this.draftRoot, slug);
    const project = validateProjectDocument(value);
    const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(project, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await rename(temporary, file);
    return file;
  }

  async getDraft(slug) {
    const file = await canonicalDraftPath(this.draftRoot, slug);
    return parseProjectDocument(await readFile(file, "utf8"), path.basename(file));
  }

  async permanentlyDelete(slug) {
    const project = await this.getProject(slug);
    if (project.visibility !== "deleted") throw new Error("Only deleted projects can be removed permanently.");
    try {
      const published = await this.getPublishedProject(slug);
      if (published.visibility === "published") {
        throw new Error("Publish this deletion before removing the project permanently.");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Publish this deletion")) throw error;
    }
    await rm(resolveProjectDocumentPath(this.draftRoot, slug), { force: true });
    await rm(path.join(this.draftAssetRoot, slug), { recursive: true, force: true });
  }

  async saveImage(slug, fileName, mime, buffer, alt) {
    if (typeof alt !== "string" || alt.trim().length === 0) throw new Error("Alt text is required.");
    const inspected = inspectImage(buffer, fileName, mime);
    const safeName = safeUploadName(fileName);
    const destination = resolveProjectAssetPath(this.draftAssetRoot, slug, safeName);
    await mkdir(path.dirname(destination), { recursive: true });
    const digest = createHash("sha256").update(buffer).digest("hex");
    let duplicateOf;
    for (const existing of await readdir(path.dirname(destination)).catch(() => [])) {
      const existingPath = resolveProjectAssetPath(this.draftAssetRoot, slug, existing);
      const existingBuffer = await readFile(existingPath);
      if (createHash("sha256").update(existingBuffer).digest("hex") === digest) {
        duplicateOf = `/assets/projects/${slug}/${existing}`;
        break;
      }
    }
    if (!duplicateOf) await writeFile(destination, buffer, { flag: "wx", mode: 0o600 });
    return {
      src: duplicateOf ?? `/assets/projects/${slug}/${safeName}`,
      alt: alt.trim(),
      width: inspected.width,
      height: inspected.height,
      mime: inspected.mime,
      ...(duplicateOf ? { duplicateOf } : {}),
    };
  }
}
