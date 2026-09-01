import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { gunzipSync } from "node:zlib";

import { PUBLISH_STAGES, createReleaseArchive, createPublishBranch, publishReadiness, runPublishJob } from "../tools/des-art-admin/publish-worker.mjs";

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

test("live publication branches are deterministic and contain no project title data", () => {
  assert.equal(createPublishBranch("2026-08-29T12:34:56.000Z"), "codex/content-publish-20260829-123456");
});

test("release archives omit macOS metadata that Linux would extract as AppleDouble files", async (context) => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-release-archive-"));
  const sourceRoot = path.join(root, "source");
  const projectRoot = path.join(sourceRoot, "content", "projects");
  const projectFile = path.join(projectRoot, "portfolio.json");
  const archive = path.join(root, "release.tar.gz");
  await mkdir(projectRoot, { recursive: true });
  await writeFile(projectFile, "{\"slug\":\"portfolio\"}\n");
  if (process.platform === "darwin") {
    try { execFileSync("/usr/bin/xattr", ["-w", "com.apple.codex-deploy-test", "1", projectFile]); }
    catch { context.skip("macOS extended attributes are unavailable"); return; }
  }
  await createReleaseArchive({ archive, sourceRoot });
  const rawTar = gunzipSync(await readFile(archive)).toString("latin1");
  assert.doesNotMatch(rawTar, /LIBARCHIVE\.xattr|SCHILY\.xattr|com\.apple\.codex-deploy-test|\._portfolio\.json/);
});

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

test("readiness reports missing credentials without exposing secrets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-readiness-"));
  const result = await publishReadiness({ supportRoot: root });
  assert.equal(typeof result.ready, "boolean");
  assert.ok(Array.isArray(result.failures));
  assert.doesNotMatch(JSON.stringify(result), /BEGIN .*PRIVATE KEY/);
});

test("live readiness blocks before canonical production data bootstrap", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-live-baseline-"));
  const result = await publishReadiness({ supportRoot: root, mode: "live" });
  assert.equal(result.ready, false);
  assert.deepEqual(result.failures, ["Рабочие данные ещё не синхронизированы с актуальным production-контентом"]);
});

test("live publish refuses a sandbox support root", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-live-guard-"));
  const jobFile = path.join(root, "job.json");
  await writeFile(jobFile, JSON.stringify({
    id: "unsafe-live", mode: "live", scope: "all", repoRoot: process.cwd(), supportRoot: root, files: [], status: "queued", message: "Подготовка",
    stages: PUBLISH_STAGES.map(([id, label]) => ({ id, label, status: "pending" })),
  }));
  await runPublishJob(jobFile);
  const result = JSON.parse(await readFile(jobFile, "utf8"));
  assert.equal(result.status, "failed");
  assert.doesNotMatch(JSON.stringify(result), /support root|Library\/Application Support/i);
});
