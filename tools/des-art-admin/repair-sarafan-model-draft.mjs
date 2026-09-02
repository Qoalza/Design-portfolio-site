import { cp, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { resolveProjectAssetPath, resolveProjectDocumentPath } from "../../src/lib/project-contract.ts";
import { parseAdminDraft } from "./draft-contract.mjs";
import { importFigmaTemplate, parseFigmaNodeUrl } from "./figma-template-import.mjs";
import { templateMatchesFigmaSource } from "./figma-template-map.mjs";

const TARGET_TEMPLATE = "canvas.sarafan-model";

function clone(value) {
  return structuredClone(value);
}

function visualReferences(draft) {
  return draft.content.flatMap((section) => section.type !== "section" ? [] : section.blocks
    .map((visual, blockIndex) => ({ section, visual, blockIndex, source: draft.admin?.visualSources?.[section.adminId] }))
    .filter(({ visual }) => visual.type === "visual" || typeof visual.templateId === "string"));
}

export function findSarafanModelRepair(draft) {
  const matches = visualReferences(draft).filter(({ source }) => {
    if (!source?.url) return false;
    try { return templateMatchesFigmaSource(TARGET_TEMPLATE, parseFigmaNodeUrl(source.url)); } catch { return false; }
  });
  if (matches.length !== 1) throw new Error(`Ожидался ровно один локальный блок «Модель», найдено ${matches.length}. Черновик не изменён.`);
  const match = matches[0];
  if (match.visual.templateId === TARGET_TEMPLATE && match.visual.type === "visual") throw new Error("Локальный блок «Модель» уже использует актуальный шаблон.");
  if (match.visual.templateId !== TARGET_TEMPLATE && match.visual.templateId !== "canvas.sarafan-scenarios") throw new Error("Найденный блок не является ошибочно назначенным шаблоном «Сценарии».");
  return match;
}

export function applySarafanModelRepair(draft, imported) {
  const match = findSarafanModelRepair(draft);
  if (imported?.visual?.templateId !== TARGET_TEMPLATE || imported?.source?.templateId !== TARGET_TEMPLATE) {
    throw new Error("Importer не вернул утверждённый шаблон «Модель». Черновик не изменён.");
  }
  const next = clone(draft);
  next.content = next.content.map((section) => section.adminId !== match.section.adminId ? section : {
    ...section,
    blocks: section.blocks.map((block, blockIndex) => blockIndex === match.blockIndex ? { type: "visual", ...imported.visual } : block),
  });
  next.admin = {
    ...next.admin,
    visualSources: {
      ...next.admin?.visualSources,
      [match.section.adminId]: imported.source,
    },
  };
  return parseAdminDraft(JSON.stringify(next), `${draft.slug}.json`);
}

async function atomicJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
  await rename(temporary, file);
}

function assetFolderFromSource(slug, source) {
  const prefix = `/assets/projects/${slug}/`;
  if (typeof source !== "string" || !source.startsWith(prefix)) return undefined;
  const parts = source.slice(prefix.length).split("/");
  return parts.length >= 3 ? parts.slice(0, -1).join("/") : undefined;
}

export async function backupSarafanModelRepair({ draftFile, draftAssetRoot, draft, backupRoot }) {
  const match = findSarafanModelRepair(draft);
  const stamp = new Date().toISOString().replaceAll(":", "-");
  const target = path.join(backupRoot, `${draft.slug}-sarafan-model-${stamp}`);
  await mkdir(target, { recursive: true, mode: 0o700 });
  await cp(draftFile, path.join(target, path.basename(draftFile)), { force: false });
  const assetFolder = assetFolderFromSource(draft.slug, match.visual.assets.content?.[0]?.src);
  if (assetFolder) {
    const source = resolveProjectAssetPath(draftAssetRoot, draft.slug, assetFolder);
    await cp(source, path.join(target, "assets", assetFolder), { recursive: true, force: false, errorOnExist: true });
  }
  return target;
}

export async function repairSarafanModelDraft({ supportRoot, slug = "sarafan-radio", backupRoot, apply = false, importer = importFigmaTemplate }) {
  const draftRoot = path.join(supportRoot, "drafts");
  const draftAssetRoot = path.join(supportRoot, "draft-assets");
  const draftFile = resolveProjectDocumentPath(draftRoot, slug);
  const draft = parseAdminDraft(await readFile(draftFile, "utf8"), path.basename(draftFile));
  const match = findSarafanModelRepair(draft);
  const source = parseFigmaNodeUrl(match.source.url);
  const plan = { slug, sectionId: match.section.adminId, fromTemplateId: match.visual.templateId, toTemplateId: TARGET_TEMPLATE, source };
  if (!apply) return { plan };
  if (!backupRoot) throw new Error("Для применения ремонта требуется backupRoot.");
  const backup = await backupSarafanModelRepair({ draftFile, draftAssetRoot, draft, backupRoot });
  const imported = await importer({ url: match.source.url, slug, templateId: TARGET_TEMPLATE, assetRoot: draftAssetRoot });
  const repaired = applySarafanModelRepair(draft, imported);
  await atomicJson(draftFile, repaired);
  return { plan, backup, repaired };
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const supportRoot = argument("--support-root");
  const backupRoot = argument("--backup-root");
  const apply = process.argv.includes("--apply");
  if (!supportRoot || (apply && !backupRoot)) throw new Error("Использование: --support-root <path> [--backup-root <path> --apply]");
  const result = await repairSarafanModelDraft({ supportRoot, backupRoot, apply });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
