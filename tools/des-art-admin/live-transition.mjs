import { createHash } from "node:crypto";
import { access, cp, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseAdminDraft } from "./draft-contract.mjs";

export const SANDBOX_ORIGIN_VERSION = 1;
export const LIVE_TRANSITION_REQUEST_VERSION = 1;
export const sandboxOriginPath = (supportRoot) => path.join(supportRoot, "sandbox-origin-v1.json");
export const liveTransitionRequestPath = (supportRoot) => path.join(supportRoot, "live-transition-request-v1.json");

const clone = (value) => structuredClone(value);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const ignoredKeys = new Set(["slug", "schemaVersion", "catalogOrder", "homePlacement", "visibility", "admin", "content"]);

function normalizeOriginProjects(projects = []) {
  return projects.map((project) => {
    const next = clone(project);
    next.content = (next.content ?? []).map((item, index) => item?.type === "section"
      ? { ...item, adminId: typeof item.adminId === "string" ? item.adminId : `${next.slug}-section-${index + 1}` }
      : item);
    return next;
  });
}

function hasValue(value) {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value !== undefined && value !== null;
}

function overlayWithoutDeletion(base, sandbox, production) {
  if (same(base, sandbox)) return clone(production);
  if (!hasValue(sandbox) && hasValue(base)) return clone(production);
  if (Array.isArray(sandbox)) {
    const before = Array.isArray(base) ? base : [];
    const current = Array.isArray(production) ? clone(production) : [];
    for (const [index, value] of sandbox.entries()) {
      current[index] = overlayWithoutDeletion(before[index], value, current[index]);
    }
    return current;
  }
  if (sandbox && typeof sandbox === "object") {
    const before = base && typeof base === "object" ? base : {};
    const current = production && typeof production === "object" ? clone(production) : {};
    for (const [key, value] of Object.entries(sandbox)) {
      if (!(key in before) || !same(before[key], value)) current[key] = overlayWithoutDeletion(before[key], value, current[key]);
    }
    return current;
  }
  return clone(sandbox);
}

function itemKey(item, index) {
  if (item?.type === "section" && typeof item.adminId === "string") return `section:${item.adminId}`;
  if (item?.type === "gallery") return "gallery";
  return `${item?.type ?? "unknown"}:${index}`;
}

function mergeContent({ base = [], sandbox = [], production = [] }) {
  const baseline = new Map(base.map((item, index) => [itemKey(item, index), item]));
  const merged = production.map(clone);
  const positions = new Map(merged.map((item, index) => [itemKey(item, index), index]));
  for (const [index, item] of sandbox.entries()) {
    const key = itemKey(item, index);
    const before = baseline.get(key);
    if (before && same(before, item)) continue;
    if (before && !hasValue(item)) continue;
    const currentIndex = positions.get(key);
    if (currentIndex === undefined) {
      merged.push(clone(item));
      positions.set(key, merged.length - 1);
    } else {
      merged[currentIndex] = overlayWithoutDeletion(before, item, merged[currentIndex]);
    }
  }
  return merged;
}

function mergeExistingProject(base, sandbox, production) {
  const result = clone(production);
  for (const key of Object.keys(sandbox)) {
    if (ignoredKeys.has(key) || same(base?.[key], sandbox[key]) || !hasValue(sandbox[key])) continue;
    result[key] = overlayWithoutDeletion(base?.[key], sandbox[key], production[key]);
  }
  result.content = mergeContent({ base: base?.content, sandbox: sandbox.content, production: production.content });
  result.catalogOrder = production.catalogOrder;
  if (production.homePlacement === undefined) delete result.homePlacement;
  else result.homePlacement = production.homePlacement;
  result.visibility = production.visibility;
  return result;
}

export function buildSandboxOrigin({ sourceSha, projects, assetHashes }) {
  if (!/^[0-9a-f]{40}$/i.test(sourceSha ?? "")) throw new Error("Sandbox origin requires an exact production SHA.");
  return {
    version: SANDBOX_ORIGIN_VERSION,
    sourceSha: sourceSha.toLowerCase(),
    projects: normalizeOriginProjects(projects),
    assetHashes: clone(assetHashes ?? {}),
  };
}

export function createLiveTransitionRequest({ selection, units } = {}) {
  if (selection !== "clean" && selection !== "delta") throw new Error("Live transition selection is required.");
  if (units !== undefined && (!Array.isArray(units) || units.some((unit) => !unit || typeof unit.slug !== "string" || typeof unit.key !== "string"))) {
    throw new Error("Live transition review selection is invalid.");
  }
  return { version: LIVE_TRANSITION_REQUEST_VERSION, selection, ...(units ? { units: clone(units) } : {}) };
}

async function atomicJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: "wx" });
  await rename(temporary, file);
}

export async function saveSandboxOrigin({ supportRoot, sourceSha, projects, assetHashes }) {
  const file = sandboxOriginPath(supportRoot);
  try { return JSON.parse(await readFile(file, "utf8")); } catch (error) { if (error?.code !== "ENOENT") throw error; }
  const origin = buildSandboxOrigin({ sourceSha, projects, assetHashes });
  await atomicJson(file, origin);
  return origin;
}

export async function readSandboxOrigin(supportRoot) {
  try {
    const value = JSON.parse(await readFile(sandboxOriginPath(supportRoot), "utf8"));
    if (value?.version !== SANDBOX_ORIGIN_VERSION || !/^[0-9a-f]{40}$/i.test(value.sourceSha ?? "") || !Array.isArray(value.projects) || !value.assetHashes || typeof value.assetHashes !== "object") {
      throw new Error("Sandbox origin is invalid.");
    }
    return value;
  } catch (error) { if (error?.code === "ENOENT") return undefined; throw error; }
}

export async function saveLiveTransitionRequest({ supportRoot, selection, units }) {
  if (await readLiveTransitionRequest(supportRoot)) throw new Error("Live transition request already exists.");
  const request = createLiveTransitionRequest({ selection, units });
  await atomicJson(liveTransitionRequestPath(supportRoot), request);
  return request;
}

export async function readLiveTransitionRequest(supportRoot) {
  try {
    const request = JSON.parse(await readFile(liveTransitionRequestPath(supportRoot), "utf8"));
    return createLiveTransitionRequest(request);
  } catch (error) { if (error?.code === "ENOENT") return undefined; throw error; }
}

export async function consumeLiveTransitionRequest(supportRoot) {
  const file = liveTransitionRequestPath(supportRoot);
  const request = await readLiveTransitionRequest(supportRoot);
  if (!request) throw new Error("Live transition request is missing.");
  await rm(file, { force: true });
  return request;
}

export function buildUnpublishedDraftTransfer({ origin, sandboxProjects, productionProjects }) {
  if (!origin || origin.version !== SANDBOX_ORIGIN_VERSION) return { reviewRequired: true, drafts: [] };
  const baseline = new Map(origin.projects.map((project) => [project.slug, project]));
  const production = new Map(productionProjects.map((project) => [project.slug, project]));
  const drafts = [];
  for (const sandbox of sandboxProjects) {
    if (sandbox.visibility === "deleted") continue;
    const current = production.get(sandbox.slug);
    if (!current) {
      const next = { ...clone(sandbox), visibility: "draft" };
      delete next.homePlacement;
      delete next.catalogOrder;
      drafts.push(next);
      continue;
    }
    if (!baseline.has(sandbox.slug)) return { reviewRequired: true, drafts: [] };
    const next = mergeExistingProject(baseline.get(sandbox.slug), sandbox, current);
    if (!same(next, current)) drafts.push(next);
  }
  return { reviewRequired: false, drafts };
}

export function buildLegacyTransferReview({ sandboxProjects, productionProjects }) {
  const production = new Map(productionProjects.map((project) => [project.slug, project]));
  const projects = [];
  for (const sandbox of sandboxProjects) {
    if (sandbox.visibility === "deleted") continue;
    const current = production.get(sandbox.slug);
    const units = [];
    for (const [key, value] of Object.entries(sandbox)) {
      if (ignoredKeys.has(key) || key === "content" || !hasValue(value) || same(current?.[key], value)) continue;
      units.push({ key, kind: "field", label: key });
    }
    for (const [index, item] of (sandbox.content ?? []).entries()) {
      if (!hasValue(item)) continue;
      const key = itemKey(item, index);
      const currentItem = (current?.content ?? []).find((candidate, candidateIndex) => itemKey(candidate, candidateIndex) === key);
      if (!same(currentItem, item)) units.push({ key, kind: item?.type === "section" ? "section" : "content", label: item?.heading ?? item?.type ?? "content" });
    }
    if (units.length) projects.push({ slug: sandbox.slug, title: sandbox.title, isNew: !current, units });
  }
  return { version: 1, projects };
}

function selectedLegacyProject({ sandbox, production, units }) {
  const chosen = new Set(units.map((unit) => unit.key));
  const result = clone(production ?? { schemaVersion: sandbox.schemaVersion, slug: sandbox.slug, visibility: "draft", content: [] });
  for (const [key, value] of Object.entries(sandbox)) {
    if (!ignoredKeys.has(key) && chosen.has(key) && hasValue(value)) result[key] = clone(value);
  }
  const currentContent = new Map((result.content ?? []).map((item, index) => [itemKey(item, index), item]));
  for (const [index, item] of (sandbox.content ?? []).entries()) {
    const key = itemKey(item, index);
    if (chosen.has(key) && hasValue(item)) currentContent.set(key, clone(item));
  }
  result.content = [...currentContent.values()];
  if (production) {
    result.catalogOrder = production.catalogOrder;
    result.homePlacement = production.homePlacement;
    result.visibility = production.visibility;
  }
  return result;
}

export function buildLegacySelectedDraftTransfer({ sandboxProjects, productionProjects, units }) {
  const selected = new Map();
  for (const unit of units ?? []) {
    if (!selected.has(unit.slug)) selected.set(unit.slug, []);
    selected.get(unit.slug).push(unit);
  }
  const production = new Map(productionProjects.map((project) => [project.slug, project]));
  const drafts = [];
  for (const sandbox of sandboxProjects) {
    if (sandbox.visibility === "deleted" || !selected.has(sandbox.slug)) continue;
    const draft = selectedLegacyProject({ sandbox, production: production.get(sandbox.slug), units: selected.get(sandbox.slug) });
    if (!production.has(sandbox.slug)) draft.visibility = "draft";
    drafts.push(draft);
  }
  return { reviewRequired: false, drafts };
}

async function fileHash(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

export async function collectAssetHashes(root, publicPrefix = "/assets/projects") {
  const hashes = {};
  const visit = async (directory, relative = "") => {
    const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
      if (error?.code === "ENOENT") return [];
      throw error;
    });
    for (const entry of entries) {
      const next = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await visit(path.join(directory, entry.name), next);
      else if (entry.isFile()) hashes[`${publicPrefix}/${next}`] = await fileHash(path.join(directory, entry.name));
    }
  };
  await visit(root);
  return hashes;
}

function draftAssetSources(draft) {
  const prefix = `/assets/projects/${draft.slug}/`;
  const sources = new Set();
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    if (typeof value.src === "string" && value.src.startsWith(prefix)) sources.add(value.src.slice(prefix.length));
    Object.values(value).forEach(visit);
  };
  visit(draft);
  return sources;
}

export async function stageUnpublishedDraftTransfer({ archiveRoot, stagingRoot, origin, productionProjects, legacyUnits }) {
  const sandboxProjects = await readSandboxDraftProjects(archiveRoot);
  const result = origin
    ? buildUnpublishedDraftTransfer({ origin, sandboxProjects, productionProjects })
    : legacyUnits?.length
      ? buildLegacySelectedDraftTransfer({ sandboxProjects, productionProjects, units: legacyUnits })
      : { reviewRequired: true, drafts: [] };
  if (result.reviewRequired) return result;
  const destination = path.join(stagingRoot, "drafts");
  const assetHashes = {};
  const canonicalAssets = new Set(productionProjects.flatMap((project) => (
    [...draftAssetSources(project)].map((source) => `/assets/projects/${project.slug}/${source}`)
  )));
  await mkdir(destination, { recursive: true });
  for (const draft of result.drafts) {
    parseAdminDraft(JSON.stringify(draft), `${draft.slug}.json`);
    const file = path.join(destination, `${draft.slug}.json`);
    await writeFile(file, `${JSON.stringify(draft, null, 2)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
    for (const source of draftAssetSources(draft)) {
      const from = path.join(archiveRoot, "draft-assets", draft.slug, source);
      try { await access(from); } catch {
        if (canonicalAssets.has(`/assets/projects/${draft.slug}/${source}`)) continue;
        throw new Error(`Отсутствует переносимый asset ${draft.slug}/${source}.`);
      }
      const to = path.join(stagingRoot, "draft-assets", draft.slug, source);
      await mkdir(path.dirname(to), { recursive: true });
      await cp(from, to, { force: false, errorOnExist: true });
      const hash = await fileHash(from);
      if (hash !== await fileHash(to)) throw new Error(`Не удалось проверить хэш переносимого asset ${draft.slug}/${source}.`);
      assetHashes[`/assets/projects/${draft.slug}/${source}`] = hash;
    }
  }
  return { ...result, assetHashes };
}

export async function readSandboxDraftProjects(root) {
  const draftsRoot = path.join(root, "drafts");
  const names = (await readdir(draftsRoot).catch(() => [])).filter((name) => name.endsWith(".json")).sort();
  return Promise.all(names.map(async (name) => JSON.parse(await readFile(path.join(draftsRoot, name), "utf8"))));
}

export async function activateStagedDraftTransfer({ supportRoot, stagingRoot, move = rename }) {
  const names = ["drafts", "draft-assets"];
  const moved = [];
  try {
    await mkdir(supportRoot, { recursive: true });
    for (const name of names) {
      const source = path.join(stagingRoot, name);
      try { await access(source); } catch (error) { if (error?.code === "ENOENT") continue; throw error; }
      const destination = path.join(supportRoot, name);
      try { await access(destination); throw new Error(`Live ${name} уже существует; перенос остановлен до записи.`); }
      catch (error) { if (error?.code !== "ENOENT") throw error; }
      await move(source, destination);
      moved.push({ source, destination });
    }
    const rollback = async () => {
      const restoreErrors = [];
      for (const entry of moved.reverse()) {
        try { await move(entry.destination, entry.source); } catch (restoreError) { restoreErrors.push(restoreError); }
      }
      if (restoreErrors.length) throw new AggregateError(restoreErrors, "Не удалось вернуть live drafts в staging после сбоя marker.");
    };
    return { activated: moved.map(({ destination }) => path.basename(destination)), rollback };
  } catch (error) {
    const restoreErrors = [];
    for (const entry of moved.reverse()) {
      try { await move(entry.destination, entry.source); } catch (restoreError) { restoreErrors.push(restoreError); }
    }
    if (restoreErrors.length) throw new AggregateError([error, ...restoreErrors], "Не удалось безопасно отменить активацию live drafts.");
    throw error;
  }
}
