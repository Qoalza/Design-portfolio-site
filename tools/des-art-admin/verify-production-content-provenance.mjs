import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { validateProjectDocument } from "../../src/lib/project-contract.ts";

const exec = promisify(execFile);
const PROJECTS = new Set(["boff.json", "corvo.json", "sarafan-radio.json"]);
const BUSINESS_KEYS = ["title", "slug", "description", "subtitle", "role", "year", "tags", "detailTags", "visibility", "catalogOrder", "detailAvailable", "materials", "platforms", "logo", "workSummary"];

async function git(args, options = {}) {
  return (await exec("git", args, { maxBuffer: 20 * 1024 * 1024, ...options })).stdout;
}

async function documentAt(ref, file) {
  return JSON.parse(await git(["show", `${ref}:content/projects/${file}`]));
}

function stable(value) {
  return JSON.stringify(value);
}

function homePlacement(project) {
  if (project.schemaVersion === 3) return project.homePlacement;
  if (!project.featuredOnHome) return undefined;
  return project.slug === "corvo" ? "primary" : project.slug === "sarafan-radio" ? "secondary" : "featured";
}

function textContent(project) {
  return (project.content ?? []).filter((block) => block.type === "section").map((section) => ({
    heading: section.heading,
    blocks: (section.blocks ?? []).filter((block) => !["frame", "visual", "image", "hardBreak"].includes(block.type)).map((block) => {
      if (block.type === "notice") return { type: "notice", content: block.content };
      const publicBlock = { ...block };
      delete publicBlock.adminId;
      return publicBlock;
    }),
  }));
}

function galleryTuples(project) {
  return (project.content ?? []).filter((block) => block.type === "gallery").map((gallery) => (gallery.groups ?? []).map((group) => ({
    deviceId: group.deviceId ?? group.id,
    images: (group.images ?? group.items ?? []).map(({ src, alt, width, height }) => ({ src, alt, width, height })),
  })));
}

function semantic(project) {
  return {
    business: Object.fromEntries(BUSINESS_KEYS.filter((key) => key in project).map((key) => [key, project[key]])),
    homePlacement: homePlacement(project),
    textContent: textContent(project),
    galleries: galleryTuples(project),
  };
}

function imageSources(value, sources = new Set()) {
  if (!value || typeof value !== "object") return sources;
  if (Array.isArray(value)) {
    for (const item of value) imageSources(item, sources);
    return sources;
  }
  if (typeof value.src === "string" && value.src.startsWith("/assets/")) sources.add(value.src);
  for (const item of Object.values(value)) imageSources(item, sources);
  return sources;
}

async function assetHash(ref, source) {
  return createHash("sha256").update(await git(["show", `${ref}:public${source}`], { encoding: "buffer" })).digest("hex");
}

export async function verifyProductionContentProvenance({ base, target, cwd = process.cwd() }) {
  await git(["merge-base", "--is-ancestor", base, target], { cwd });
  const changed = (await git(["diff", "--name-status", `${base}..${target}`, "--", "content/projects", "public/assets"], { cwd })).trim().split("\n").filter(Boolean);
  const contentChanges = changed.filter((line) => line.includes("content/projects/"));
  const assetChanges = changed.filter((line) => line.includes("public/assets/"));
  if (assetChanges.length) throw new Error("Provenance rejected: canonical public assets changed.");
  const report = { version: 1, baseSha: (await git(["rev-parse", base], { cwd })).trim(), targetSha: (await git(["rev-parse", target], { cwd })).trim(), projects: [] };
  if (!contentChanges.length) return { ...report, noCanonicalChanges: true };
  if (contentChanges.some((line) => !/^M\s+content\/projects\/(boff|corvo|sarafan-radio)\.json$/.test(line))) {
    throw new Error("Provenance rejected: only the three declared project documents may change.");
  }
  for (const file of [...PROJECTS].filter((name) => contentChanges.some((line) => line.endsWith(name)))) {
    const before = await documentAt(base, file);
    const after = await documentAt(target, file);
    validateProjectDocument(after);
    const beforeSemantic = semantic(before);
    const afterSemantic = semantic(after);
    if (stable(beforeSemantic.business) !== stable(afterSemantic.business) || stable(beforeSemantic.homePlacement) !== stable(afterSemantic.homePlacement) || stable(beforeSemantic.textContent) !== stable(afterSemantic.textContent)) {
      throw new Error(`Provenance rejected: business or textual content changed in ${file}.`);
    }
    const galleryChangedOnlyByDeclaredMigration = before.schemaVersion === 2 && after.schemaVersion === 3 && afterSemantic.galleries.length === 0;
    if (!galleryChangedOnlyByDeclaredMigration && stable(beforeSemantic.galleries) !== stable(afterSemantic.galleries)) {
      throw new Error(`Provenance rejected: gallery tuples changed in ${file}.`);
    }
    const assets = [...imageSources(after)].sort();
    const hashes = {};
    for (const source of assets) {
      const beforeHash = await assetHash(base, source);
      const afterHash = await assetHash(target, source);
      if (beforeHash !== afterHash) throw new Error(`Provenance rejected: asset bytes differ for ${source}.`);
      hashes[source] = beforeHash;
    }
    report.projects.push({ file, schema: `${before.schemaVersion}->${after.schemaVersion}`, galleryRemovedByDeclaredMigration: galleryChangedOnlyByDeclaredMigration, assets: hashes });
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [base, target] = process.argv.slice(2);
  if (!base || !target) throw new Error("Usage: verify-production-content-provenance.mjs <base-ref> <target-ref>");
  process.stdout.write(`${JSON.stringify(await verifyProductionContentProvenance({ base, target }), null, 2)}\n`);
}
