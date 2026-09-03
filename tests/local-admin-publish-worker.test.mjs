import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { PUBLISH_STAGES, createReleaseArchive, createPublishBranch, publishReadiness, runPublishJob } from "../tools/des-art-admin/publish-worker.mjs";
import { createPublishCommandRunner } from "../tools/des-art-admin/publish-diagnostics.mjs";

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

test("live publication exposes commit, push and pull request as separate real-time stages", () => {
  assert.deepEqual(PUBLISH_STAGES.map(([id]) => id), ["validate", "prepare", "checks", "commit", "push", "pr", "merge", "deploy", "verify"]);
  assert.equal(createPublishBranch("2026-08-29T12:34:56.000Z"), "codex/content-publish-20260829-123456");
});

test("publish command failures expose safe typed metadata and write a private redacted diagnostic", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-publish-diagnostic-"));
  const run = createPublishCommandRunner({
    diagnosticRoot: root,
    jobId: "job-safe",
    execImpl: async () => {
      const error = new Error("Command failed: git push -u origin branch\nAuthorization: Bearer gho_supersecret\nfatal: Authentication failed for https://oauth2:password@github.com/Qoalza/Design-portfolio-site.git");
      error.code = 128;
      error.stderr = "Authorization: Bearer github_pat_supersecret\nfatal: Authentication failed for https://oauth2:password@github.com/Qoalza/Design-portfolio-site.git";
      throw error;
    },
  });
  const failure = await run("push", "git", ["push", "-u", "origin", "branch"]).then(() => null, (error) => error);
  assert.equal(failure.failedOperation, "push");
  assert.equal(failure.failureCode, "AUTHENTICATION_FAILED");
  assert.equal(failure.exitCode, 128);
  assert.equal(failure.retryable, false);
  assert.equal(failure.attempt, 1);
  assert.match(failure.diagnosticId, /^[a-f0-9-]+$/);
  assert.doesNotMatch(failure.message, /supersecret|password|oauth2/i);
  const diagnosticFile = path.join(root, `${failure.diagnosticId}.log`);
  assert.equal((await stat(diagnosticFile)).mode & 0o777, 0o600);
  const diagnostic = await readFile(diagnosticFile, "utf8");
  assert.doesNotMatch(diagnostic, /gho_supersecret|github_pat_supersecret|oauth2:password/i);
  assert.match(diagnostic, /\[REDACTED\]/);
});

test("publish worker persists command failure metadata without exposing technical output", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-publish-job-failure-"));
  const draftFile = path.join(root, "draft.json");
  const snapshotRoot = path.join(root, "snapshots");
  const jobFile = path.join(root, "job.json");
  await mkdir(snapshotRoot);
  await writeFile(draftFile, JSON.stringify(project()));
  await writeFile(path.join(snapshotRoot, "draft.json"), JSON.stringify(project({ visibility: "published", admin: false })));
  await writeFile(jobFile, JSON.stringify({
    id: "failed-command", mode: "sandbox", scope: "all", repoRoot: path.join(root, "missing-repository"), supportRoot: root,
    files: [draftFile], snapshotRoot, status: "queued", message: "Подготовка",
    stages: PUBLISH_STAGES.map(([id, label]) => ({ id, label, status: "pending" })),
  }));
  await runPublishJob(jobFile);
  const result = JSON.parse(await readFile(jobFile, "utf8"));
  assert.equal(result.status, "failed");
  assert.equal(result.failedOperation, "checks.tests");
  assert.equal(result.failureCode, "COMMAND_FAILED");
  assert.equal(result.retryable, false);
  assert.equal(result.attempt, 1);
  assert.match(result.diagnosticId, /^[a-f0-9-]+$/);
  assert.doesNotMatch(`${result.errorTitle} ${result.error}`, /ENOENT|missing-repository|spawn/i);
  assert.equal((await stat(path.join(root, "jobs", "diagnostics", result.id, `${result.diagnosticId}.log`))).mode & 0o777, 0o600);
});

test("live publish configuration is process-only and never serialized into a job", async () => {
  const source = await readFile(new URL("../tools/des-art-admin/publish-worker.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /job\.liveConfig/);
});

test("release archive excludes local runtime and macOS metadata inputs", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-release-archive-"));
  const archive = path.join(root, "release.tar.gz");
  await mkdir(path.join(root, "source", ".git"), { recursive: true });
  await mkdir(path.join(root, "source", "node_modules"), { recursive: true });
  await mkdir(path.join(root, "source", ".next"), { recursive: true });
  await writeFile(path.join(root, "source", "index.txt"), "public release\n");
  await writeFile(path.join(root, "source", ".git", "config"), "private\n");
  await writeFile(path.join(root, "source", "node_modules", "private.js"), "private\n");
  await writeFile(path.join(root, "source", ".next", "cache"), "private\n");
  await createReleaseArchive({ archive, sourceRoot: path.join(root, "source") });
  const entries = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" });
  assert.match(entries, /index\.txt/);
  assert.doesNotMatch(entries, /\.git|node_modules|\.next/);
});

test("live readiness requires a live production baseline", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-live-baseline-"));
  const result = await publishReadiness({ supportRoot: root, mode: "live" });
  assert.equal(result.ready, false);
  assert.deepEqual(result.failures, ["Рабочие данные ещё не синхронизированы с актуальным production-контентом"]);
});

test("live publish rejects a sandbox support root without making a release", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-live-guard-"));
  const jobFile = path.join(root, "job.json");
  const initial = {
    id: "unsafe-live", mode: "live", scope: "all", repoRoot: process.cwd(), supportRoot: root, files: [], status: "queued", message: "Подготовка",
    stages: PUBLISH_STAGES.map(([id, label]) => ({ id, label, status: "pending" })),
  };
  await writeFile(jobFile, JSON.stringify(initial));
  await runPublishJob(jobFile);
  const result = JSON.parse(await readFile(jobFile, "utf8"));
  assert.equal(result.status, "failed");
  assert.doesNotMatch(JSON.stringify(result), /support root|Library\/Application Support/i);
});
