import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import sharp from "sharp";

import { migrateAdminStoreV3, restoreFigmaSourcesFromV2Backup } from "../tools/des-art-admin/migrate-v3.mjs";

const slug = "sarafan-radio";
const publicPath = (relative) => `/assets/projects/${slug}/${relative}`;

async function png(file, width, height) {
  await mkdir(path.dirname(file), { recursive: true });
  await sharp({ create: { width, height, channels: 4, background: { r: 32, g: 64, b: 96, alpha: 1 } } }).png().toFile(file);
}

function sourceNode(relative) {
  return { asset: { src: publicPath(relative), format: "raster", fit: "contain" } };
}

function legacyDraft() {
  const paragraph = { type: "paragraph", content: [{ type: "text", text: "Текст" }] };
  const visualSection = (heading, relative) => ({
    type: "section",
    adminId: `section-${heading}`,
    heading,
    blocks: [paragraph, { type: "frame", composition: { source: { url: `https://www.figma.com/design/file/Test?node-id=${heading.length}-1` }, nodes: [sourceNode(relative)] } }],
  });
  return {
    schemaVersion: 2,
    title: "Sarafan.Radio",
    slug,
    description: "Описание",
    role: "Product designer",
    year: 2026,
    tags: ["SaaS"],
    detailTags: ["SaaS"],
    visibility: "published",
    catalogOrder: 2,
    featuredOnHome: true,
    homeOrder: 2,
    detailAvailable: true,
    materials: { projectState: "completed", fileState: "absent" },
    platforms: ["Desktop"],
    logo: { type: "image", src: publicPath("logo.svg") },
    homeImages: [
      { src: "/assets/homepage/radio-dashboard.png", alt: "", width: 2880, height: 2518 },
      { src: "/assets/homepage/radio-player.png", alt: "", width: 1688, height: 612 },
      { src: "/assets/homepage/radio-payment.png", alt: "", width: 760, height: 1100 },
    ],
    catalogFrame: { source: { url: "https://www.figma.com/design/file/Test?node-id=1-1" }, nodes: [sourceNode("frames/catalog/dashboard.png"), sourceNode("frames/catalog/player.png"), sourceNode("frames/catalog/payment.png")] },
    heroFrame: { source: { url: "https://www.figma.com/design/file/Test?node-id=1-2" }, nodes: [
      sourceNode("frames/hero/illustration.png"), sourceNode("frames/hero/decoration.png"), sourceNode("frames/hero/dashboard.png"),
      sourceNode("frames/hero/player.png"), sourceNode("frames/hero/payment.png"),
    ] },
    content: [
      visualSection("Модель", "frames/model.png"),
      visualSection("Сценарии", "frames/scenarios.png"),
      visualSection("Настройка", "frames/setup.png"),
      { type: "gallery", title: "Галерея", description: "Интерфейсы", groups: [{ id: "desktop", items: [{ src: publicPath("gallery.png"), alt: "Галерея", width: 4320, height: 2880 }] }] },
    ],
    admin: { sections: { stale: { interactive: { enabled: true } } } },
  };
}

async function fixture() {
  const supportRoot = await mkdtemp(path.join(os.tmpdir(), "des-art-admin-v3-"));
  const draftRoot = path.join(supportRoot, "drafts");
  const assets = path.join(supportRoot, "draft-assets", slug);
  await mkdir(draftRoot, { recursive: true });
  await mkdir(assets, { recursive: true });
  await writeFile(path.join(draftRoot, `${slug}.json`), `${JSON.stringify(legacyDraft(), null, 2)}\n`);
  await writeFile(path.join(assets, "logo.svg"), '<svg viewBox="0 0 24 24"></svg>');
  for (const [relative, width, height] of [
    ["frames/catalog/dashboard.png", 2880, 2518], ["frames/catalog/player.png", 1688, 612], ["frames/catalog/payment.png", 760, 1100],
    ["frames/hero/illustration.png", 2714, 2144], ["frames/hero/decoration.png", 2472, 2472], ["frames/hero/dashboard.png", 2896, 2464],
    ["frames/hero/player.png", 1688, 920], ["frames/hero/payment.png", 1099, 536],
    ["frames/model.png", 2000, 714], ["frames/scenarios.png", 2000, 960], ["frames/setup.png", 2000, 1464],
    ["gallery.png", 4320, 2880],
  ]) await png(path.join(assets, relative), width, height);
  return supportRoot;
}

test("Sarafan store migration is dry-runnable, backed up, reversible and re-applicable", async () => {
  const supportRoot = await fixture();
  const draftFile = path.join(supportRoot, "drafts", `${slug}.json`);
  const original = await readFile(draftFile);
  const originalHash = createHash("sha256").update(original).digest("hex");

  const dryRun = await migrateAdminStoreV3({ supportRoot, mode: "dry-run", now: "2026-09-01T10:00:00.000Z" });
  assert.equal(dryRun.valid, true);
  assert.equal(createHash("sha256").update(await readFile(draftFile)).digest("hex"), originalHash);

  const applied = await migrateAdminStoreV3({ supportRoot, mode: "apply", now: "2026-09-01T10:01:00.000Z" });
  const migrated = JSON.parse(await readFile(draftFile, "utf8"));
  assert.equal(applied.valid, true);
  assert.equal(migrated.schemaVersion, 3);
  assert.equal(migrated.designProfile, "sarafan-v1");
  assert.equal(migrated.visuals.hero.templateId, "hero.sarafan-collage");
  assert.equal(migrated.admin.visualSources.catalog.templateId, "catalog.sarafan-collage");
  assert.equal(migrated.admin.visualSources.hero.url.includes("node-id=1-2"), true);
  assert.equal(migrated.admin.visualSources["sarafan-radio-section-1"].templateId, "canvas.sarafan-model");
  assert.deepEqual(migrated.content.filter((block) => block.type === "gallery"), []);
  assert.deepEqual(migrated.content.filter((block) => block.type === "section").flatMap((section) => section.blocks).filter((block) => block.type === "visual").map((block) => block.templateId), [
    "canvas.sarafan-model", "canvas.sarafan-scenarios", "canvas.sarafan-setup",
  ]);
  await assert.rejects(readFile(path.join(supportRoot, "draft-assets", slug, "gallery.png")));
  assert.equal(JSON.parse(await readFile(path.join(applied.backupRoot, "manifest.json"), "utf8")).files.length > 1, true);

  delete migrated.admin.visualSources;
  await writeFile(draftFile, `${JSON.stringify(migrated, null, 2)}\n`);
  const restored = await restoreFigmaSourcesFromV2Backup({ supportRoot, backupRoot: applied.backupRoot });
  assert.equal(restored.restored, 5);
  assert.equal(JSON.parse(await readFile(draftFile, "utf8")).admin.visualSources["sarafan-radio-section-3"].templateId, "canvas.sarafan-setup");

  const editedV3 = JSON.parse(await readFile(draftFile, "utf8"));
  editedV3.description = "Локальная v3-правка, которую rollback не должен удалить";
  await writeFile(draftFile, `${JSON.stringify(editedV3, null, 2)}\n`);

  const rolledBack = await migrateAdminStoreV3({ supportRoot, mode: "rollback" });
  assert.equal(rolledBack.valid, true);
  assert.equal(typeof rolledBack.rollbackBackupRoot, "string");
  assert.equal(JSON.parse(await readFile(path.join(rolledBack.rollbackBackupRoot, "drafts", `${slug}.json`), "utf8")).description, editedV3.description);
  assert.equal(createHash("sha256").update(await readFile(draftFile)).digest("hex"), originalHash);
  await readFile(path.join(supportRoot, "draft-assets", slug, "gallery.png"));

  const reapplied = await migrateAdminStoreV3({ supportRoot, mode: "apply", now: "2026-09-01T10:02:00.000Z" });
  assert.equal(reapplied.valid, true);
  assert.equal(JSON.parse(await readFile(draftFile, "utf8")).schemaVersion, 3);
});
