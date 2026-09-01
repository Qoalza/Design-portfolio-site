import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { PUBLISH_STAGES, publishReadiness, runPublishJob } from "../tools/des-art-admin/publish-worker.mjs";

const image = (src, alt = "") => ({ src, alt, width: 2960, height: 2400 });
function project({ title = "Черновик", visibility = "draft", catalogOrder = 4, homePlacement, admin = true } = {}) {
  const backdrop = image("/assets/homepage/corvo-dashboard.png");
  const foreground = image("/assets/homepage/corvo-product.png", "Corvo");
  const stack = { templateId: "catalog.corvo-stack", assets: { backdrop: [backdrop], foreground: [foreground] } };
  return {
    schemaVersion: 3, designProfile: "corvo-v1", title, slug: "draft", description: "Описание", role: "Product Designer", year: 2026,
    tags: [], detailTags: [], visibility, catalogOrder, ...(homePlacement ? { homePlacement } : {}), detailAvailable: false,
    materials: { projectState: "completed", fileState: "absent" }, platforms: [],
    visuals: { catalog: stack, home: stack, hero: { templateId: "hero.corvo-browser", assets: stack.assets } },
    content: [{ type: "section", ...(admin ? { adminId: "draft-section-1" } : {}), heading: "Секция", blocks: [] }],
    ...(admin ? { admin: { sections: { "draft-section-1": { localCollapsed: false } } } } : {}),
  };
}


test("sandbox publish compiles Admin metadata, validates the full collection and preserves global placement in project scope", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-publish-draft-"));
  const draftFile = path.join(root, "draft.json");
  const snapshotRoot = path.join(root, "snapshots");
  const jobFile = path.join(root, "job.json");
  await mkdir(snapshotRoot);
  await writeFile(draftFile, JSON.stringify(project()));
  await writeFile(path.join(snapshotRoot, "draft.json"), JSON.stringify(project({ title: "Старая публикация", visibility: "published", catalogOrder: 1, homePlacement: "primary", admin: false })));
  await writeFile(jobFile, JSON.stringify({
    id: "draft-test", mode: "sandbox", scope: "project", repoRoot: process.cwd(), supportRoot: root, files: [draftFile], snapshotRoot,
    status: "queued", message: "Подготовка", stages: PUBLISH_STAGES.map(([id, label]) => ({ id, label, status: "pending" })),
  }));
  await runPublishJob(jobFile);
  const result = JSON.parse(await readFile(jobFile, "utf8"));
  assert.equal(result.status, "complete");
  assert.ok(result.stages.every((stage) => stage.status === "complete"));
  const staged = JSON.parse(await readFile(path.join(root, "staging", "draft.json"), "utf8"));
  assert.equal("admin" in staged, false);
  assert.equal("adminId" in staged.content[0], false);
  const savedDraft = JSON.parse(await readFile(draftFile, "utf8"));
  const snapshot = JSON.parse(await readFile(path.join(snapshotRoot, "draft.json"), "utf8"));
  assert.equal(savedDraft.visibility, "published");
  assert.equal("admin" in savedDraft, true);
  assert.equal(snapshot.catalogOrder, 1);
  assert.equal(snapshot.homePlacement, "primary");
  assert.equal("admin" in snapshot, false);
});

test("readiness rejects every non-sandbox mode without inspecting credentials", async () => {
  const result = await publishReadiness({ mode: "live" });
  assert.equal(result.ready, false);
  assert.deepEqual(result.failures, ["Admin поддерживает только локальную sandbox-проверку"]);
});

test("non-sandbox publish jobs are rejected before the job file is rewritten", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-non-sandbox-guard-"));
  const jobFile = path.join(root, "job.json");
  const initial = {
    id: "unsafe-live", mode: "live", scope: "all", repoRoot: process.cwd(), supportRoot: root, files: [], status: "queued", message: "Подготовка",
    stages: PUBLISH_STAGES.map(([id, label]) => ({ id, label, status: "pending" })),
  };
  await writeFile(jobFile, JSON.stringify(initial));
  await assert.rejects(runPublishJob(jobFile), /only sandbox/);
  assert.deepEqual(JSON.parse(await readFile(jobFile, "utf8")), initial);
});
