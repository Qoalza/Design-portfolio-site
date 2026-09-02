import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { applySarafanModelRepair, backupSarafanModelRepair, findSarafanModelRepair } from "../tools/des-art-admin/repair-sarafan-model-draft.mjs";

const modelUrl = "https://www.figma.com/design/5ZzspE0OrqesDcTP0RRPHr/Sarafan?node-id=992-24663";
const draft = () => ({
  schemaVersion: 3, slug: "sarafan-radio", designProfile: "sarafan-v1", title: "Sarafan", description: "", role: "", year: 2026,
  tags: [], detailTags: [], visibility: "draft", catalogOrder: 1, detailAvailable: false, materials: { projectState: "completed", fileState: "absent" }, platforms: [],
  visuals: { catalog: { templateId: "catalog.sarafan-collage", assets: { dashboard: [{ src: "/x", alt: "", width: 856, height: 746 }], player: [{ src: "/x", alt: "", width: 530, height: 192 }], payment: [{ src: "/x", alt: "", width: 240, height: 346 }] } } },
  content: [{ type: "section", adminId: "model", heading: "Модель", blocks: [{ type: "visual", templateId: "canvas.sarafan-scenarios", assets: { content: [{ src: "/assets/projects/sarafan-radio/figma/old/content.png", alt: "", width: 1520, height: 768 }] } }] }],
  admin: { visualSources: { model: { url: modelUrl, templateId: "canvas.sarafan-scenarios" } } },
});

test("repair selects only the mistaken Model source and atomically replaces its visual contract", () => {
  const current = draft();
  assert.equal(findSarafanModelRepair(current).section.adminId, "model");
  const repaired = applySarafanModelRepair(current, {
    visual: { templateId: "canvas.sarafan-model", assets: { content: [{ src: "/assets/projects/sarafan-radio/figma/new/content.png", alt: "Модель", width: 1520, height: 768 }] } },
    source: { url: modelUrl, templateId: "canvas.sarafan-model", preview: { src: "/assets/projects/sarafan-radio/figma/new/preview.png", width: 2000, height: 960 } },
  });
  assert.equal(repaired.content[0].blocks[0].templateId, "canvas.sarafan-model");
  assert.equal(repaired.admin.visualSources.model.templateId, "canvas.sarafan-model");
});

test("repair refuses missing, repeated or already-correct Model sources", () => {
  assert.throws(() => findSarafanModelRepair({ ...draft(), admin: { visualSources: {} } }), /ровно один/i);
  const correct = draft();
  correct.content[0].blocks[0].templateId = "canvas.sarafan-model";
  assert.throws(() => findSarafanModelRepair(correct), /уже использует/i);
});

test("repair backup copies only the affected draft JSON and its referenced asset folder", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "sarafan-model-backup-"));
  const draftFile = path.join(root, "drafts", "sarafan-radio.json");
  const assets = path.join(root, "draft-assets", "sarafan-radio", "figma", "old");
  await mkdir(path.dirname(draftFile), { recursive: true });
  await mkdir(assets, { recursive: true });
  await writeFile(draftFile, `${JSON.stringify(draft())}\n`);
  await writeFile(path.join(assets, "content.png"), "old-asset");
  const backup = await backupSarafanModelRepair({ draftFile, draftAssetRoot: path.join(root, "draft-assets"), draft: draft(), backupRoot: path.join(root, "backups") });

  await access(path.join(backup, "sarafan-radio.json"));
  assert.equal(await readFile(path.join(backup, "assets", "figma", "old", "content.png"), "utf8"), "old-asset");
});
