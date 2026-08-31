import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { gunzipSync } from "node:zlib";
import {
  PUBLISH_STAGES,
  createReleaseArchive,
  createPublishBranch,
  publishReadiness,
  runPublishJob,
} from "../tools/des-art-admin/publish-worker.mjs";

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
    catch { context.skip("macOS extended attributes are unavailable in this environment"); return; }
  }

  await createReleaseArchive({ archive, sourceRoot });
  const rawTar = gunzipSync(await readFile(archive)).toString("latin1");
  assert.doesNotMatch(rawTar, /LIBARCHIVE\.xattr|SCHILY\.xattr|com\.apple\.codex-deploy-test/);
  assert.doesNotMatch(rawTar, /\._portfolio\.json/);
});

test("dry-run publish persists every stage without external mutations", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-publish-"));
  const jobFile = path.join(root, "job.json");
  await writeFile(jobFile, JSON.stringify({ id: "test", scope: "all", dryRun: true, repoRoot: process.cwd(), files: [], status: "queued", message: "Подготовка", stages: PUBLISH_STAGES.map(([id, label]) => ({ id, label, status: "pending" })) }));
  await runPublishJob(jobFile);
  const result = JSON.parse(await readFile(jobFile, "utf8"));
  assert.equal(result.status, "complete");
  assert.ok(result.stages.every((stage) => stage.status === "complete"));
});

test("dry-run compiles admin metadata into isolated public staging files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-publish-draft-"));
  const draftFile = path.join(root, "draft.json");
  const jobFile = path.join(root, "job.json");
  await writeFile(draftFile, JSON.stringify({
    schemaVersion: 2,
    title: "Черновик",
    slug: "draft",
    description: "Описание",
    role: "Product Designer",
    year: 2026,
    tags: [],
    detailTags: [],
    visibility: "draft",
    catalogOrder: 4,
    featuredOnHome: false,
    detailAvailable: false,
    materials: { projectState: "completed", fileState: "absent" },
    platforms: [],
    content: [{ type: "section", adminId: "draft-section-1", heading: "Секция", blocks: [] }],
    admin: { sections: { "draft-section-1": { noticeEnabled: false } } },
  }));
  const snapshotRoot = path.join(root, "snapshots");
  await mkdir(snapshotRoot);
  await writeFile(path.join(snapshotRoot, "draft.json"), JSON.stringify({
    schemaVersion: 2,
    title: "Старая публикация",
    slug: "draft",
    description: "Описание",
    role: "Product Designer",
    year: 2026,
    tags: [],
    detailTags: [],
    visibility: "published",
    catalogOrder: 1,
    featuredOnHome: false,
    detailAvailable: false,
    materials: { projectState: "completed", fileState: "absent" },
    platforms: [],
    content: [],
  }));
  await writeFile(jobFile, JSON.stringify({
    id: "draft-test",
    scope: "project",
    dryRun: true,
    repoRoot: process.cwd(),
    files: [draftFile],
    snapshotRoot,
    status: "queued",
    message: "Подготовка",
    stages: PUBLISH_STAGES.map(([id, label]) => ({ id, label, status: "pending" })),
  }));

  await runPublishJob(jobFile);
  const staged = JSON.parse(await readFile(path.join(root, "staging", "draft.json"), "utf8"));
  assert.equal("admin" in staged, false);
  assert.equal("adminId" in staged.content[0], false);
  const savedDraft = JSON.parse(await readFile(draftFile, "utf8"));
  const snapshot = JSON.parse(await readFile(path.join(root, "snapshots", "draft.json"), "utf8"));
  assert.equal(savedDraft.visibility, "published");
  assert.equal("admin" in savedDraft, true);
  assert.equal(snapshot.visibility, "published");
  assert.equal("admin" in snapshot, false);
  assert.equal(snapshot.catalogOrder, 1);
  assert.equal(snapshot.featuredOnHome, false);
  assert.equal(snapshot.homeOrder, undefined);
  assert.equal(savedDraft.catalogOrder, 4);
  assert.equal(savedDraft.featuredOnHome, false);
});

test("readiness reports missing credentials without exposing secrets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-readiness-"));
  const result = await publishReadiness({ supportRoot: root });
  assert.equal(typeof result.ready, "boolean");
  assert.ok(Array.isArray(result.failures));
  assert.doesNotMatch(JSON.stringify(result), /BEGIN .*PRIVATE KEY/);
});

test("live readiness blocks publication before canonical production data bootstrap", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-live-baseline-"));
  const result = await publishReadiness({ supportRoot: root, mode: "live" });
  assert.equal(result.ready, false);
  assert.deepEqual(result.failures, ["Рабочие данные ещё не синхронизированы с актуальным production-контентом"]);
});

test("live readiness rejects the legacy production baseline before checking credentials", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-legacy-live-baseline-"));
  await writeFile(path.join(root, "production-data-baseline.json"), JSON.stringify({
    version: 1,
    source: "canonical-main",
    sourceSha: "a".repeat(40),
  }));
  const result = await publishReadiness({ supportRoot: root, mode: "live" });
  assert.equal(result.ready, false);
  assert.deepEqual(result.failures, ["Рабочие данные ещё не синхронизированы с актуальным production-контентом"]);
});

test("live publish refuses a sandbox support root", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-live-guard-"));
  const jobFile = path.join(root, "job.json");
  await writeFile(jobFile, JSON.stringify({
    id: "unsafe-live",
    mode: "live",
    scope: "all",
    repoRoot: process.cwd(),
    supportRoot: root,
    files: [],
    status: "queued",
    message: "Подготовка",
    stages: PUBLISH_STAGES.map(([id, label]) => ({ id, label, status: "pending" })),
  }));
  await runPublishJob(jobFile);
  const result = JSON.parse(await readFile(jobFile, "utf8"));
  assert.equal(result.status, "failed");
  assert.equal(result.errorTitle, "Действие не выполнено");
  assert.doesNotMatch(JSON.stringify(result), /support root|Library\/Application Support/i);
});
