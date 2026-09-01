import { createHash } from "node:crypto";
import { access, cp, mkdir, mkdtemp, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { validateProjectDocument } from "../../src/lib/project-contract.ts";
import { compileAdminDraft, createAdminDraft } from "./draft-contract.mjs";

const SLUG = "sarafan-radio";
const BACKUP_DIRECTORY = "v3-migration-backups";
const STATE_FILE = "v3-migration-state.json";
const ROLLBACK_JOURNAL_FILE = "v3-rollback-journal.json";
const PROJECT_PREFIX = `/assets/projects/${SLUG}/`;

const CROP_SPECS = {
  "Модель": {
    templateId: "canvas.sarafan-model",
    sources: [{ slot: "content", left: 112, top: 112, width: 1776, height: 480, destination: "slots/model-content.png", alt: "Модель продукта Sarafan.Radio" }],
  },
  "Сценарии": {
    templateId: "canvas.sarafan-scenarios",
    sources: [{ slot: "content", left: 140, top: 130, width: 1722, height: 699, destination: "slots/scenarios-content.png", alt: "Сценарии работы Sarafan.Radio" }],
  },
  "Настройка": {
    templateId: "canvas.sarafan-setup",
    sources: [
      { slot: "desktop", left: 136, top: 302, width: 1206, height: 828, destination: "slots/setup-desktop.png", alt: "Настройка Sarafan.Radio на desktop" },
      { slot: "panel", left: 960, top: 144, width: 928, height: 1176, destination: "slots/setup-panel.png", alt: "Панель настройки Sarafan.Radio" },
    ],
  },
};

const exists = async (target) => access(target).then(() => true).catch(() => false);
const atomicJson = async (file, value) => {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, file);
};

function projectRelative(src) {
  if (typeof src !== "string" || !src.startsWith(PROJECT_PREFIX)) throw new Error(`Asset ${String(src)} is outside the Sarafan project asset root.`);
  const relative = src.slice(PROJECT_PREFIX.length);
  if (!relative || relative.includes("\\") || relative.split("/").some((part) => part === "." || part === "..") || path.posix.normalize(relative) !== relative) {
    throw new Error(`Asset ${src} has an unsafe relative path.`);
  }
  return relative;
}

async function copyProjectAsset(sourceRoot, destinationRoot, src) {
  const relative = projectRelative(src);
  const source = path.join(sourceRoot, relative);
  const destination = path.join(destinationRoot, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { force: false });
  return relative;
}

async function imageFromNode(node, sourceRoot, destinationRoot, alt = "") {
  const src = node?.asset?.src;
  await copyProjectAsset(sourceRoot, destinationRoot, src);
  const metadata = await sharp(path.join(sourceRoot, projectRelative(src))).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Cannot read dimensions for ${src}.`);
  return { src, alt, width: metadata.width, height: metadata.height };
}

function frameSource(block, heading) {
  const src = block?.composition?.nodes?.[0]?.asset?.src;
  if (typeof src !== "string") throw new Error(`Legacy section «${heading}» does not contain one raster Frame source.`);
  return src;
}

async function cropVisual(sourceRoot, destinationRoot, heading, block) {
  const spec = CROP_SPECS[heading];
  if (!spec) throw new Error(`Legacy Frame in section «${heading}» has no approved template mapping.`);
  const source = path.join(sourceRoot, projectRelative(frameSource(block, heading)));
  const assets = {};
  for (const crop of spec.sources) {
    const destination = path.join(destinationRoot, crop.destination);
    await mkdir(path.dirname(destination), { recursive: true });
    await sharp(source).extract({ left: crop.left, top: crop.top, width: crop.width, height: crop.height }).png().toFile(destination);
    assets[crop.slot] = [{ src: `${PROJECT_PREFIX}${crop.destination}`, alt: crop.alt, width: crop.width, height: crop.height }];
  }
  return { type: "visual", templateId: spec.templateId, assets };
}

function cleanLegacyBlock(block) {
  if (block.type === "paragraph") return { type: "paragraph", content: block.content };
  if (block.type === "heading") return { type: "heading", level: 3, content: block.content };
  if (block.type === "list") return { type: "list", style: block.style, items: block.items };
  if (block.type === "notice") return { type: "notice", templateId: "notice.info-v1", content: block.content };
  if (block.type === "divider" || block.type === "hardBreak") return { type: block.type };
  throw new Error(`Legacy section block type ${String(block.type)} requires an explicit migration mapping.`);
}

async function migrateContent(content, sourceRoot, destinationRoot) {
  if (!Array.isArray(content)) throw new Error("Legacy Sarafan content must be an array.");
  const migrated = [];
  const visualSources = {};
  for (const block of content) {
    if (block?.type === "gallery") continue;
    if (block?.type !== "section" || typeof block.heading !== "string" || !Array.isArray(block.blocks)) {
      throw new Error("Legacy Sarafan content contains an unsupported top-level block.");
    }
    const blocks = [];
    for (const sectionBlock of block.blocks) {
      if (sectionBlock?.type === "frame") {
        const visual = await cropVisual(sourceRoot, destinationRoot, block.heading, sectionBlock);
        blocks.push(visual);
        const url = sectionBlock.composition?.source?.url;
        if (typeof url === "string") {
          visualSources[`${SLUG}-section-${migrated.length + 1}`] = { url, templateId: visual.templateId };
        }
      } else blocks.push(cleanLegacyBlock(sectionBlock));
    }
    migrated.push({ type: "section", heading: block.heading, blocks });
  }
  return { content: migrated, visualSources };
}

async function migrateSarafanDraft(draft, sourceRoot, destinationRoot) {
  if (draft?.schemaVersion !== 2 || draft.slug !== SLUG) throw new Error("Migration accepts only the Sarafan schema-v2 draft.");
  if (!Array.isArray(draft.catalogFrame?.nodes) || draft.catalogFrame.nodes.length !== 3) throw new Error("Sarafan catalog Frame must contain exactly three approved assets.");
  if (!Array.isArray(draft.heroFrame?.nodes) || draft.heroFrame.nodes.length !== 5) throw new Error("Sarafan hero Frame must contain exactly five approved assets.");
  const [catalogDashboard, catalogPlayer, catalogPayment] = await Promise.all([
    imageFromNode(draft.catalogFrame.nodes[0], sourceRoot, destinationRoot, "Интерфейс Sarafan.Radio"),
    imageFromNode(draft.catalogFrame.nodes[1], sourceRoot, destinationRoot, "Плеер Sarafan.Radio"),
    imageFromNode(draft.catalogFrame.nodes[2], sourceRoot, destinationRoot, "Оплата Sarafan.Radio"),
  ]);
  const [illustration, decoration, heroDashboard, heroPlayer, heroPayment] = await Promise.all([
    imageFromNode(draft.heroFrame.nodes[0], sourceRoot, destinationRoot, "Иллюстрация пустого эфира"),
    imageFromNode(draft.heroFrame.nodes[1], sourceRoot, destinationRoot, ""),
    imageFromNode(draft.heroFrame.nodes[2], sourceRoot, destinationRoot, "Интерфейс Sarafan.Radio"),
    imageFromNode(draft.heroFrame.nodes[3], sourceRoot, destinationRoot, "Плеер Sarafan.Radio"),
    imageFromNode(draft.heroFrame.nodes[4], sourceRoot, destinationRoot, "Оплата Sarafan.Radio"),
  ]);
  if (draft.logo?.type === "image" && draft.logo.src.startsWith(PROJECT_PREFIX)) await copyProjectAsset(sourceRoot, destinationRoot, draft.logo.src);
  const migratedContent = await migrateContent(draft.content, sourceRoot, destinationRoot);
  const project = {
    schemaVersion: 3,
    designProfile: "sarafan-v1",
    title: draft.title,
    slug: draft.slug,
    description: draft.description,
    ...(draft.subtitle === undefined ? {} : { subtitle: draft.subtitle }),
    role: draft.role,
    year: draft.year,
    tags: draft.tags,
    detailTags: draft.detailTags,
    visibility: draft.visibility,
    catalogOrder: draft.catalogOrder,
    ...(draft.visibility === "published" && draft.featuredOnHome ? { homePlacement: "secondary" } : {}),
    detailAvailable: true,
    materials: draft.materials,
    platforms: draft.platforms,
    ...(draft.logo === undefined ? {} : { logo: draft.logo }),
    visuals: {
      catalog: { templateId: "catalog.sarafan-collage", assets: { dashboard: [catalogDashboard], player: [catalogPlayer], payment: [catalogPayment] } },
      home: { templateId: "home.sarafan-radio", assets: { dashboard: [catalogDashboard], player: [catalogPlayer], payment: [catalogPayment] } },
      hero: { templateId: "hero.sarafan-collage", assets: { illustration: [illustration], decoration: [decoration], dashboard: [heroDashboard], player: [heroPlayer], payment: [heroPayment] } },
    },
    ...(draft.workSummary === undefined ? {} : { workSummary: draft.workSummary }),
    content: migratedContent.content,
  };
  const publicProject = validateProjectDocument(project);
  const visualSources = {
    ...(typeof draft.catalogFrame?.source?.url === "string" ? { catalog: { url: draft.catalogFrame.source.url, templateId: "catalog.sarafan-collage" } } : {}),
    ...(typeof draft.heroFrame?.source?.url === "string" ? { hero: { url: draft.heroFrame.source.url, templateId: "hero.sarafan-collage" } } : {}),
    ...migratedContent.visualSources,
  };
  const adminDraft = createAdminDraft({
    ...publicProject,
    ...(Object.keys(visualSources).length ? { admin: { visualSources } } : {}),
  });
  compileAdminDraft(adminDraft);
  return adminDraft;
}

async function walkFiles(root, prefix = "") {
  const directory = path.join(root, prefix);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, "en"))) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(root, relative));
    else if (entry.isFile()) files.push(relative);
  }
  return files;
}

async function hashFile(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

async function createBackup(supportRoot, backupId, draftFile, assetRoot) {
  const backupRoot = path.join(supportRoot, BACKUP_DIRECTORY, backupId);
  if (await exists(backupRoot)) throw new Error(`Backup ${backupId} already exists.`);
  await mkdir(path.join(backupRoot, "drafts"), { recursive: true });
  await mkdir(path.join(backupRoot, "draft-assets"), { recursive: true });
  await cp(draftFile, path.join(backupRoot, "drafts", `${SLUG}.json`), { force: false });
  await cp(assetRoot, path.join(backupRoot, "draft-assets", SLUG), { recursive: true, force: false });
  const files = await walkFiles(backupRoot);
  const manifest = { version: 1, slug: SLUG, createdAt: backupId, files: [] };
  for (const relative of files) {
    const info = await stat(path.join(backupRoot, relative));
    manifest.files.push({ path: relative.split(path.sep).join("/"), bytes: info.size, sha256: await hashFile(path.join(backupRoot, relative)) });
  }
  await atomicJson(path.join(backupRoot, "manifest.json"), manifest);
  return backupRoot;
}

async function verifyBackup(backupRoot) {
  const manifest = JSON.parse(await readFile(path.join(backupRoot, "manifest.json"), "utf8"));
  if (manifest.version !== 1 || manifest.slug !== SLUG || !Array.isArray(manifest.files)) throw new Error("Migration backup manifest is invalid.");
  for (const item of manifest.files) {
    const file = path.join(backupRoot, item.path);
    const info = await stat(file);
    if (info.size !== item.bytes || await hashFile(file) !== item.sha256) throw new Error(`Migration backup verification failed for ${item.path}.`);
  }
  return manifest;
}

async function swapStore(supportRoot, stagedDraft, stagedAssets, tag) {
  const draftFile = path.join(supportRoot, "drafts", `${SLUG}.json`);
  const assetRoot = path.join(supportRoot, "draft-assets", SLUG);
  const oldDraft = path.join(supportRoot, `.v3-old-draft-${tag}.json`);
  const oldAssets = path.join(supportRoot, `.v3-old-assets-${tag}`);
  await rename(assetRoot, oldAssets);
  try {
    await rename(stagedAssets, assetRoot);
    await rename(draftFile, oldDraft);
    await rename(stagedDraft, draftFile);
  } catch (error) {
    await rm(assetRoot, { recursive: true, force: true });
    if (await exists(oldAssets)) await rename(oldAssets, assetRoot);
    if (await exists(oldDraft)) {
      await rm(draftFile, { force: true });
      await rename(oldDraft, draftFile);
    }
    throw error;
  }
  await rm(oldAssets, { recursive: true, force: true });
  await rm(oldDraft, { force: true });
}

function backupId(now) {
  return now.replace(/[^0-9A-Za-z]/g, "");
}

async function stageMigration(supportRoot, mode) {
  const stageBase = mode === "dry-run" ? os.tmpdir() : supportRoot;
  const stageRoot = await mkdtemp(path.join(stageBase, ".des-art-v3-stage-"));
  const stagedDraft = path.join(stageRoot, "drafts", `${SLUG}.json`);
  const stagedAssets = path.join(stageRoot, "draft-assets", SLUG);
  await mkdir(path.dirname(stagedDraft), { recursive: true });
  await mkdir(stagedAssets, { recursive: true });
  const draftFile = path.join(supportRoot, "drafts", `${SLUG}.json`);
  const assetRoot = path.join(supportRoot, "draft-assets", SLUG);
  const source = JSON.parse(await readFile(draftFile, "utf8"));
  const migrated = await migrateSarafanDraft(source, assetRoot, stagedAssets);
  await atomicJson(stagedDraft, migrated);
  return { stageRoot, stagedDraft, stagedAssets, draftFile, assetRoot, migrated };
}

export async function migrateAdminStoreV3({ supportRoot, mode, now = new Date().toISOString() }) {
  if (!path.isAbsolute(supportRoot)) throw new Error("supportRoot must be absolute.");
  if (mode === "rollback") {
    const stateFile = path.join(supportRoot, STATE_FILE);
    const journalFile = path.join(supportRoot, ROLLBACK_JOURNAL_FILE);
    const state = JSON.parse(await readFile(stateFile, "utf8"));
    if (state.status !== "applied" || typeof state.backupRoot !== "string") throw new Error("There is no applied v3 migration to roll back.");
    const existingJournal = await readFile(journalFile, "utf8").then(JSON.parse).catch(() => undefined);
    if (existingJournal) {
      if (existingJournal.version !== 1 || existingJournal.status !== "pending" || typeof existingJournal.v3BackupRoot !== "string") {
        throw new Error("Rollback journal is invalid; live v3 data was not changed.");
      }
      await verifyBackup(existingJournal.v3BackupRoot);
      const liveDraft = JSON.parse(await readFile(path.join(supportRoot, "drafts", `${SLUG}.json`), "utf8"));
      if (liveDraft.schemaVersion !== 2) {
        throw new Error("Rollback journal is pending but the live store is not a verified v2 restore. Stop without changing v3 backup.");
      }
      await atomicJson(stateFile, { ...state, status: "rolled-back", rolledBackAt: existingJournal.createdAt, rollbackBackupRoot: existingJournal.v3BackupRoot });
      await rm(journalFile, { force: true });
      return { mode, valid: true, backupRoot: state.backupRoot, rollbackBackupRoot: existingJournal.v3BackupRoot, recovered: true };
    }
    await verifyBackup(state.backupRoot);
    const stageRoot = await mkdtemp(path.join(supportRoot, ".des-art-v3-rollback-"));
    const stagedDraft = path.join(stageRoot, "drafts", `${SLUG}.json`);
    const stagedAssets = path.join(stageRoot, "draft-assets", SLUG);
    await mkdir(path.dirname(stagedDraft), { recursive: true });
    await mkdir(path.dirname(stagedAssets), { recursive: true });
    await cp(path.join(state.backupRoot, "drafts", `${SLUG}.json`), stagedDraft, { force: false });
    await cp(path.join(state.backupRoot, "draft-assets", SLUG), stagedAssets, { recursive: true, force: false });
    const liveDraft = path.join(supportRoot, "drafts", `${SLUG}.json`);
    const liveAssets = path.join(supportRoot, "draft-assets", SLUG);
    const rollbackBackupRoot = await createBackup(supportRoot, `pre-rollback-${backupId(now)}`, liveDraft, liveAssets);
    await verifyBackup(rollbackBackupRoot);
    await atomicJson(journalFile, { version: 1, status: "pending", createdAt: now, v3BackupRoot: rollbackBackupRoot, v2BackupRoot: state.backupRoot });
    try {
      await swapStore(supportRoot, stagedDraft, stagedAssets, `rollback-${process.pid}`);
      await atomicJson(stateFile, { ...state, status: "rolled-back", rolledBackAt: now, rollbackBackupRoot });
      await rm(journalFile, { force: true });
      return { mode, valid: true, backupRoot: state.backupRoot, rollbackBackupRoot };
    } finally {
      await rm(stageRoot, { recursive: true, force: true });
    }
  }
  if (mode !== "dry-run" && mode !== "apply") throw new Error("Mode must be dry-run, apply, or rollback.");
  const staged = await stageMigration(supportRoot, mode);
  try {
    if (mode === "dry-run") return { mode, valid: true, slug: SLUG, removedGallery: true };
    const id = backupId(now);
    const backupRoot = await createBackup(supportRoot, id, staged.draftFile, staged.assetRoot);
    await verifyBackup(backupRoot);
    await swapStore(supportRoot, staged.stagedDraft, staged.stagedAssets, `apply-${process.pid}`);
    await atomicJson(path.join(supportRoot, STATE_FILE), { version: 1, status: "applied", slug: SLUG, appliedAt: now, backupRoot });
    return { mode, valid: true, slug: SLUG, backupRoot, removedGallery: true };
  } finally {
    await rm(staged.stageRoot, { recursive: true, force: true });
  }
}

export async function restoreFigmaSourcesFromV2Backup({ supportRoot, backupRoot }) {
  if (!path.isAbsolute(supportRoot) || !path.isAbsolute(backupRoot)) throw new Error("supportRoot and backupRoot must be absolute.");
  await verifyBackup(backupRoot);
  const draftFile = path.join(supportRoot, "drafts", `${SLUG}.json`);
  const current = createAdminDraft(JSON.parse(await readFile(draftFile, "utf8")));
  const legacy = JSON.parse(await readFile(path.join(backupRoot, "drafts", `${SLUG}.json`), "utf8"));
  if (current.schemaVersion !== 3 || current.slug !== SLUG || legacy.schemaVersion !== 2 || legacy.slug !== SLUG) {
    throw new Error("Figma source restoration requires the matching Sarafan v2 backup and v3 draft.");
  }
  const visualSources = { ...current.admin?.visualSources };
  if (typeof legacy.catalogFrame?.source?.url === "string") visualSources.catalog = { url: legacy.catalogFrame.source.url, templateId: current.visuals.catalog.templateId };
  if (typeof legacy.heroFrame?.source?.url === "string" && current.visuals.hero) visualSources.hero = { url: legacy.heroFrame.source.url, templateId: current.visuals.hero.templateId };
  const legacySections = legacy.content.filter((block) => block?.type === "section");
  const currentSections = current.content.filter((block) => block?.type === "section");
  for (const [index, section] of currentSections.entries()) {
    const legacySection = legacySections[index];
    if (!legacySection || legacySection.heading !== section.heading) throw new Error(`Section ${index + 1} no longer matches the verified backup.`);
    const legacyFrame = legacySection.blocks?.find((block) => block?.type === "frame");
    const visual = section.blocks?.find((block) => block?.type === "visual");
    if (typeof legacyFrame?.composition?.source?.url === "string" && visual) {
      visualSources[section.adminId] = { url: legacyFrame.composition.source.url, templateId: visual.templateId };
    }
  }
  const next = createAdminDraft({ ...current, admin: { ...current.admin, visualSources } });
  compileAdminDraft(next);
  await atomicJson(draftFile, next);
  return { restored: Object.keys(visualSources).length, slug: SLUG };
}

function cliArguments(argv) {
  const mode = argv.includes("--dry-run") ? "dry-run" : argv.includes("--apply") ? "apply" : argv.includes("--rollback") ? "rollback" : undefined;
  if (!mode || ["--dry-run", "--apply", "--rollback"].filter((flag) => argv.includes(flag)).length !== 1) {
    throw new Error("Use exactly one of --dry-run, --apply, or --rollback.");
  }
  const supportIndex = argv.indexOf("--support-root");
  const supportRoot = supportIndex === -1
    ? path.join(os.homedir(), "Library", "Application Support", "Des-art Admin")
    : path.resolve(argv[supportIndex + 1]);
  return { mode, supportRoot };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const result = await migrateAdminStoreV3(cliArguments(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
