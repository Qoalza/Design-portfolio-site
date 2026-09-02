import { createHash } from "node:crypto";
import { access, cp, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseAdminDraft } from "./draft-contract.mjs";

export const SANDBOX_ORIGIN_VERSION = 1;
export const LIVE_TRANSITION_REQUEST_VERSION = 1;
export const sandboxOriginPath = (supportRoot) => path.join(supportRoot, "sandbox-origin-v1.json");
export const liveTransitionRequestPath = (supportRoot) => path.join(supportRoot, "live-transition-request-v1.json");

const clone = (value) => structuredClone(value);

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value)
    .sort((left, right) => left.localeCompare(right, "en"))
    .map((key) => [key, stableValue(value[key])])
    .filter(([, item]) => item !== undefined));
}

function stableJson(value) {
  return JSON.stringify(stableValue(value)) ?? "undefined";
}

const same = (left, right) => stableJson(left) === stableJson(right);
const unitFingerprint = (value) => createHash("sha256").update(`live-transition-v1:${stableJson(value)}`).digest("hex");
const fingerprintMatches = (value, fingerprint) => typeof fingerprint === "string"
  && /^[0-9a-f]{64}$/i.test(fingerprint)
  && unitFingerprint(value) === fingerprint.toLowerCase();
const ignoredKeys = new Set(["slug", "schemaVersion", "catalogOrder", "homePlacement", "visibility", "admin", "content"]);
const legacyFieldLabels = {
  detailAvailable: "Страница проекта",
};
const legacyVisualLabels = {
  hero: "Главное изображение страницы проекта",
};

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

function hasVisualValue(value) {
  if (!value || typeof value !== "object") return false;
  return Object.values(value.assets ?? {}).some((items) => Array.isArray(items) && items.length > 0);
}

function itemKey(item) {
  if (item?.type === "section" && typeof item.adminId === "string") return `section:${item.adminId}`;
  if (item?.type === "gallery") return "gallery";
  return undefined;
}

function withoutAdminId(item) {
  if (item?.type !== "section") return item;
  return Object.fromEntries(Object.entries(item).filter(([key]) => key !== "adminId"));
}

function resolvedProductionContent(base = [], production = []) {
  const available = base.filter((item) => item?.type === "section" && typeof item.adminId === "string");
  const claimed = new Set();
  return production.map((item) => {
    if (item?.type !== "section" || typeof item.adminId === "string") return clone(item);
    const publicItem = withoutAdminId(item);
    const exact = available.filter((candidate) => !claimed.has(candidate.adminId) && same(withoutAdminId(candidate), publicItem));
    const heading = exact.length === 1 ? exact : available.filter((candidate) => !claimed.has(candidate.adminId) && candidate.heading === item.heading);
    if (heading.length !== 1) return clone(item);
    const [matched] = heading;
    claimed.add(matched.adminId);
    return { ...clone(item), adminId: matched.adminId };
  });
}

function addConflict(conflicts, slug, unit) {
  if (!conflicts.some((conflict) => conflict.slug === slug && conflict.unit === unit)) conflicts.push({ slug, unit });
}

function mergeContent({ slug, base = [], sandbox = [], production = [], conflicts }) {
  const baseline = new Map(base.map((item) => [itemKey(item), item]).filter(([key]) => key));
  const merged = resolvedProductionContent(base, production);
  const positions = new Map(merged.map((item, index) => [itemKey(item), index]).filter(([key]) => key));
  for (const item of sandbox) {
    const key = itemKey(item);
    if (!key) {
      addConflict(conflicts, slug, "content");
      continue;
    }
    const before = baseline.get(key);
    const sandboxChanged = !before || !same(before, item);
    if (!sandboxChanged || (before && !hasValue(item))) continue;
    const currentIndex = positions.get(key);
    if (!before) {
      if (currentIndex === undefined) {
        merged.push(clone(item));
        positions.set(key, merged.length - 1);
      } else if (!same(merged[currentIndex], item)) addConflict(conflicts, slug, key);
      continue;
    }
    if (currentIndex === undefined) {
      addConflict(conflicts, slug, key);
      continue;
    }
    const current = merged[currentIndex];
    if (!same(before, current) && !same(item, current)) {
      addConflict(conflicts, slug, key);
      continue;
    }
    if (!same(item, current)) merged[currentIndex] = clone(item);
  }
  return merged;
}

function mergeVisuals({ slug, base = {}, sandbox = {}, production = {}, conflicts }) {
  const result = clone(production);
  for (const surface of Object.keys(sandbox)) {
    const before = base?.[surface];
    const candidate = sandbox[surface];
    const current = production?.[surface];
    if (!hasVisualValue(candidate) || same(before, candidate)) continue;
    if (before === undefined) {
      if (current === undefined || same(current, candidate)) result[surface] = clone(candidate);
      else addConflict(conflicts, slug, `visual:${surface}`);
      continue;
    }
    if (current === undefined || (!same(before, current) && !same(candidate, current))) {
      addConflict(conflicts, slug, `visual:${surface}`);
      continue;
    }
    if (!same(candidate, current)) result[surface] = clone(candidate);
  }
  return result;
}

function hasTransferableChange(base, sandbox) {
  for (const key of Object.keys(sandbox)) {
    if (ignoredKeys.has(key) || key === "visuals" || same(base?.[key], sandbox[key]) || !hasValue(sandbox[key])) continue;
    return true;
  }
  for (const surface of Object.keys(sandbox.visuals ?? {})) {
    if (!same(base?.visuals?.[surface], sandbox.visuals[surface]) && hasVisualValue(sandbox.visuals[surface])) return true;
  }
  for (const item of sandbox.content ?? []) {
    const key = itemKey(item);
    if (!key) return true;
    const before = (base?.content ?? []).find((candidate) => itemKey(candidate) === key);
    if ((!before || !same(before, item)) && (!before || hasValue(item))) return true;
  }
  return false;
}

function mergeExistingProject(base, sandbox, production, conflicts) {
  const result = clone(production);
  for (const key of Object.keys(sandbox)) {
    if (ignoredKeys.has(key) || key === "visuals" || same(base?.[key], sandbox[key]) || !hasValue(sandbox[key])) continue;
    if (production[key] === undefined || (!same(base?.[key], production[key]) && !same(sandbox[key], production[key]))) {
      addConflict(conflicts, sandbox.slug, `field:${key}`);
      continue;
    }
    if (!same(sandbox[key], production[key])) result[key] = clone(sandbox[key]);
  }
  result.visuals = mergeVisuals({ slug: sandbox.slug, base: base?.visuals, sandbox: sandbox.visuals, production: production.visuals, conflicts });
  result.content = mergeContent({ slug: sandbox.slug, base: base?.content, sandbox: sandbox.content, production: production.content, conflicts });
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
  if (units !== undefined && (!Array.isArray(units) || units.some((unit) => !unit
    || typeof unit.slug !== "string"
    || typeof unit.key !== "string"
    || !/^[0-9a-f]{64}$/i.test(unit.fingerprint)))) {
    throw new Error("Live transition review selection is invalid.");
  }
  return {
    version: LIVE_TRANSITION_REQUEST_VERSION,
    selection,
    ...(units ? { units: units.map(({ slug, key, fingerprint }) => ({ slug, key, fingerprint: fingerprint.toLowerCase() })) } : {}),
  };
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
  if (!origin || origin.version !== SANDBOX_ORIGIN_VERSION) return { reviewRequired: true, blocked: false, conflicts: [], drafts: [] };
  const baseline = new Map(origin.projects.map((project) => [project.slug, project]));
  const production = new Map(productionProjects.map((project) => [project.slug, project]));
  const drafts = [];
  const conflicts = [];
  for (const sandbox of sandboxProjects) {
    if (sandbox.visibility === "deleted") continue;
    const current = production.get(sandbox.slug);
    const before = baseline.get(sandbox.slug);
    if (!current) {
      if (before) {
        if (hasTransferableChange(before, sandbox)) addConflict(conflicts, sandbox.slug, "project");
        continue;
      }
      const next = { ...clone(sandbox), visibility: "draft" };
      delete next.homePlacement;
      delete next.catalogOrder;
      drafts.push(next);
      continue;
    }
    if (!before) return { reviewRequired: true, blocked: false, conflicts: [], drafts: [] };
    const next = mergeExistingProject(before, sandbox, current, conflicts);
    if (!same(next, current)) drafts.push(next);
  }
  if (conflicts.length) return { reviewRequired: false, blocked: true, conflicts, drafts: [] };
  return { reviewRequired: false, blocked: false, conflicts: [], drafts };
}

export function buildLegacyTransferReview({ sandboxProjects, productionProjects }) {
  const production = new Map(productionProjects.map((project) => [project.slug, project]));
  const projects = [];
  for (const sandbox of sandboxProjects) {
    if (sandbox.visibility === "deleted") continue;
    const current = production.get(sandbox.slug);
    const currentDraft = current ? normalizeOriginProjects([current])[0] : undefined;
    const units = [];
    for (const [key, value] of Object.entries(sandbox)) {
      if (ignoredKeys.has(key) || key === "content" || key === "visuals" || !hasValue(value) || same(currentDraft?.[key], value)) continue;
      units.push({ key, kind: "field", label: legacyFieldLabels[key] ?? key, fingerprint: unitFingerprint(currentDraft?.[key]) });
    }
    for (const [surface, value] of Object.entries(sandbox.visuals ?? {})) {
      if (!hasVisualValue(value) || same(currentDraft?.visuals?.[surface], value)) continue;
      units.push({ key: `visual:${surface}`, kind: "visual", label: legacyVisualLabels[surface] ?? surface, fingerprint: unitFingerprint(currentDraft?.visuals?.[surface]) });
    }
    for (const item of sandbox.content ?? []) {
      if (!hasValue(item)) continue;
      const key = itemKey(item);
      if (!key) continue;
      const currentItem = (currentDraft?.content ?? []).find((candidate) => itemKey(candidate) === key);
      if (!same(currentItem, item)) units.push({
        key,
        kind: item?.type === "section" ? "section" : "content",
        label: item?.type === "section" && currentItem?.type === "section"
          ? `${item.heading} → ${currentItem.heading}`
          : item?.heading ?? item?.type ?? "content",
        fingerprint: unitFingerprint(currentItem),
      });
    }
    if (units.length) projects.push({ slug: sandbox.slug, title: sandbox.title, isNew: !current, units });
  }
  return { version: 1, projects };
}

function selectedLegacyProject({ sandbox, production, units, conflicts }) {
  const chosen = new Map(units.map((unit) => [unit.key, unit]));
  const current = production ? normalizeOriginProjects([production])[0] : undefined;
  const result = clone(current ?? { schemaVersion: sandbox.schemaVersion, slug: sandbox.slug, visibility: "draft", content: [] });
  for (const [key, value] of Object.entries(sandbox)) {
    const unit = chosen.get(key);
    if (ignoredKeys.has(key) || key === "visuals" || !unit || !hasValue(value)) continue;
    if (!fingerprintMatches(current?.[key], unit.fingerprint)) {
      addConflict(conflicts, sandbox.slug, `legacy:${key}`);
      continue;
    }
    result[key] = clone(value);
  }
  result.visuals ??= {};
  for (const [surface, value] of Object.entries(sandbox.visuals ?? {})) {
    const key = `visual:${surface}`;
    const unit = chosen.get(key);
    if (!unit || !hasVisualValue(value)) continue;
    if (!fingerprintMatches(current?.visuals?.[surface], unit.fingerprint)) {
      addConflict(conflicts, sandbox.slug, `legacy:${key}`);
      continue;
    }
    result.visuals[surface] = clone(value);
  }
  const currentContent = new Map((result.content ?? []).map((item) => [itemKey(item), item]).filter(([key]) => key));
  for (const item of sandbox.content ?? []) {
    const key = itemKey(item);
    const unit = key ? chosen.get(key) : undefined;
    if (!key || !unit || !hasValue(item)) continue;
    if (!fingerprintMatches(currentContent.get(key), unit.fingerprint)) {
      addConflict(conflicts, sandbox.slug, `legacy:${key}`);
      continue;
    }
    currentContent.set(key, clone(item));
  }
  result.content = [...currentContent.values()];
  if (current) {
    result.catalogOrder = current.catalogOrder;
    result.homePlacement = current.homePlacement;
    result.visibility = current.visibility;
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
  const conflicts = [];
  for (const sandbox of sandboxProjects) {
    if (sandbox.visibility === "deleted" || !selected.has(sandbox.slug)) continue;
    const draft = selectedLegacyProject({ sandbox, production: production.get(sandbox.slug), units: selected.get(sandbox.slug), conflicts });
    if (!production.has(sandbox.slug)) draft.visibility = "draft";
    drafts.push(draft);
  }
  if (conflicts.length) return { reviewRequired: false, blocked: true, conflicts, drafts: [] };
  return { reviewRequired: false, blocked: false, conflicts: [], drafts };
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
  if (result.reviewRequired || result.blocked) return result;
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
