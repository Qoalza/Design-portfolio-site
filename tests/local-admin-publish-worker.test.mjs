import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { PUBLISH_STAGES, createReleaseArchive, createPublishBranch, ensurePullRequest, isReusablePublishJob, pendingPublishStages, publishInputFingerprint, publishReadiness, pushPublishCommit, runPublishJob } from "../tools/des-art-admin/publish-worker.mjs";
import { PublishCommandError } from "../tools/des-art-admin/admin-errors.mjs";
import { classifyCommandFailure, createPublishCommandRunner } from "../tools/des-art-admin/publish-diagnostics.mjs";

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

test("a sideband disconnect after an HTTP/1.1 push remains a retryable network failure", () => {
  assert.deepEqual(classifyCommandFailure({
    stderr: "send-pack: unexpected disconnect while reading sideband packet\nfatal: the remote end hung up unexpectedly\nEverything up-to-date",
  }), { failureCode: "NETWORK_UNAVAILABLE", retryable: true });
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
  assert.equal((await stat(path.join(root, "diagnostics", result.id, `${result.diagnosticId}.log`))).mode & 0o777, 0o600);
});

test("push resume reuses the exact remote SHA and retries an HTTP/2 reset once without chunked transfer", async () => {
  const sha = "a".repeat(40);
  const existingCalls = [];
  const existing = await pushPublishCommit({ command: async (operation, command, args) => {
    existingCalls.push({ operation, command, args });
    return { stdout: `${sha}\trefs/heads/codex/content-publish-test\n` };
  }, cwd: "/sandbox", branch: "codex/content-publish-test", contentCommit: sha });
  assert.deepEqual(existing, { state: "already-pushed", attempt: 0 });
  assert.equal(existingCalls.length, 1);

  const retryCalls = [];
  let verificationCount = 0;
  const retried = await pushPublishCommit({ command: async (operation, command, args, options, attempt) => {
    retryCalls.push({ operation, command, args, attempt });
    if (operation === "push.lookup") return { stdout: "" };
    if (operation === "push.verify") return { stdout: verificationCount++ === 0 ? "" : `${sha}\trefs/heads/codex/content-publish-test\n` };
    if (attempt === 1) throw new PublishCommandError({ failedOperation: "push", failureCode: "HTTP2_RPC_RESET", exitCode: 128, retryable: true, attempt: 1, diagnosticId: "first" });
    return { stdout: "" };
  }, cwd: "/sandbox", branch: "codex/content-publish-test", contentCommit: sha });
  assert.deepEqual(retried, { state: "pushed", attempt: 2 });
  const retry = retryCalls.find((call) => call.operation === "push" && call.attempt === 2);
  assert.deepEqual(retry.args.slice(0, 4), ["-c", "http.version=HTTP/1.1", "-c", "http.postBuffer=536870912"]);
  assert.equal(retry.args.at(-1), `${sha}:refs/heads/codex/content-publish-test`);
  assert.equal(retryCalls.filter((call) => call.operation === "push").length, 2);
});

test("push verifies the remote SHA after a transport error before reporting failure", async () => {
  const sha = "a".repeat(40);
  const calls = [];
  const result = await pushPublishCommit({ command: async (operation) => {
    calls.push(operation);
    if (operation === "push.lookup") return { stdout: "" };
    if (operation === "push.verify") return { stdout: `${sha}\trefs/heads/codex/content-publish-test\n` };
    throw new PublishCommandError({ failedOperation: "push", failureCode: "NETWORK_UNAVAILABLE", exitCode: 1, retryable: true, attempt: 1, diagnosticId: "disconnect" });
  }, cwd: "/sandbox", branch: "codex/content-publish-test", contentCommit: sha });
  assert.deepEqual(result, { state: "pushed-after-transport-error", attempt: 1 });
  assert.deepEqual(calls, ["push.lookup", "push", "push.verify"]);
});

test("push stops when a successful command cannot be confirmed at the exact remote SHA", async () => {
  await assert.rejects(() => pushPublishCommit({ command: async (operation) => {
    if (operation === "push.lookup" || operation === "push.verify") return { stdout: "" };
    return { stdout: "" };
  }, cwd: "/sandbox", branch: "codex/content-publish-test", contentCommit: "a".repeat(40) }), (error) => error.title === "Push не подтверждён");
});

test("push blocks when post-failure reconciliation finds a different remote SHA", async () => {
  const contentCommit = "a".repeat(40);
  await assert.rejects(() => pushPublishCommit({ command: async (operation) => {
    if (operation === "push.lookup") return { stdout: "" };
    if (operation === "push.verify") return { stdout: `${"b".repeat(40)}\trefs/heads/codex/content-publish-test\n` };
    throw new PublishCommandError({ failedOperation: "push", failureCode: "NETWORK_UNAVAILABLE", exitCode: 1, retryable: true, attempt: 1, diagnosticId: "disconnect" });
  }, cwd: "/sandbox", branch: "codex/content-publish-test", contentCommit }), (error) => error.title === "Удалённая ветка изменилась");
});

test("resume starts after the last completed stage without repeating checks, commit or push", () => {
  const stages = PUBLISH_STAGES.map(([id, label]) => ({ id, label, status: ["validate", "prepare", "checks", "commit", "push"].includes(id) ? "complete" : "pending" }));
  assert.deepEqual(pendingPublishStages(stages).map(([id]) => id), ["pr", "merge", "deploy", "verify"]);
});

test("publish input fingerprint covers draft bytes and every copied draft asset", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-publish-input-"));
  const draftFile = path.join(root, "drafts", "draft.json");
  const draftAssetRoot = path.join(root, "draft-assets");
  await mkdir(path.dirname(draftFile), { recursive: true });
  await mkdir(path.join(draftAssetRoot, "draft", "nested"), { recursive: true });
  await writeFile(draftFile, "draft-v1");
  await writeFile(path.join(draftAssetRoot, "draft", "nested", "asset.png"), "asset-v1");
  const first = await publishInputFingerprint({ files: [draftFile], draftAssetRoot });
  const repeated = await publishInputFingerprint({ files: [draftFile], draftAssetRoot });
  assert.equal(repeated, first);
  await writeFile(path.join(draftAssetRoot, "draft", "nested", "asset.png"), "asset-v2");
  assert.notEqual(await publishInputFingerprint({ files: [draftFile], draftAssetRoot }), first);
});

test("an unfinished job is reusable only for the same exact publish input and identity", () => {
  const job = {
    id: "job", status: "failed", mode: "live", scope: "project", slug: "draft",
    branch: "codex/content-publish-20260903-145322", contentCommit: "a".repeat(40), inputFingerprint: "b".repeat(64),
  };
  const identity = { mode: "live", scope: "project", slug: "draft", inputFingerprint: "b".repeat(64) };
  assert.equal(isReusablePublishJob(job, identity), true);
  assert.equal(isReusablePublishJob({ ...job, status: "running" }, identity), true);
  assert.equal(isReusablePublishJob({ ...job, status: "queued", branch: undefined, contentCommit: undefined }, identity), true);
  assert.equal(isReusablePublishJob(job, { ...identity, inputFingerprint: "c".repeat(64) }), false);
  assert.equal(isReusablePublishJob({ ...job, status: "complete" }, identity), false);
  assert.equal(isReusablePublishJob({ ...job, contentCommit: undefined }, identity), false);
  assert.equal(isReusablePublishJob({ ...job, scope: "all", slug: "first" }, { ...identity, scope: "all", slug: "second" }), true);
});

test("push does not retry authentication failures", async () => {
  let attempts = 0;
  await assert.rejects(() => pushPublishCommit({ command: async (operation) => {
    if (operation === "push.lookup" || operation === "push.verify") return { stdout: "" };
    attempts += 1;
    throw new PublishCommandError({ failedOperation: "push", failureCode: "AUTHENTICATION_FAILED", exitCode: 128, retryable: false, attempt: 1, diagnosticId: "auth" });
  }, cwd: "/sandbox", branch: "codex/content-publish-test", contentCommit: "a".repeat(40) }));
  assert.equal(attempts, 1);
});

test("push resume blocks a conflicting remote SHA", async () => {
  await assert.rejects(() => pushPublishCommit({
    command: async () => ({ stdout: `${"b".repeat(40)}\trefs/heads/codex/content-publish-test\n` }),
    cwd: "/sandbox", branch: "codex/content-publish-test", contentCommit: "a".repeat(40),
  }), (error) => error.title === "Удалённая ветка изменилась");
});

test("pull request resume reuses one open PR and blocks closed or ambiguous matches", async () => {
  const open = await ensurePullRequest({ command: async () => ({ stdout: JSON.stringify([{ state: "OPEN", url: "https://github.test/pr/1", mergedAt: null }]) }), cwd: "/sandbox", branch: "codex/test", title: "Test" });
  assert.equal(open, "https://github.test/pr/1");
  await assert.rejects(() => ensurePullRequest({ command: async () => ({ stdout: JSON.stringify([{ state: "CLOSED", url: "https://github.test/pr/2", mergedAt: null }]) }), cwd: "/sandbox", branch: "codex/test", title: "Test" }), (error) => error.title === "Pull Request закрыт без merge");
  await assert.rejects(() => ensurePullRequest({ command: async () => ({ stdout: JSON.stringify([{ state: "OPEN" }, { state: "OPEN" }]) }), cwd: "/sandbox", branch: "codex/test", title: "Test" }), (error) => error.title === "Найдено несколько Pull Request");
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

test("live readiness verifies identity, exact repository, push permission, remote access, credential helper and SSH without claiming upload", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-live-ready-"));
  const keyPath = path.join(root, "deploy-key");
  await writeFile(keyPath, "test-only-key");
  await writeFile(path.join(root, "production-data-baseline.json"), JSON.stringify({ version: 5, source: "production-live" }));
  await writeFile(path.join(root, "live-publish.json"), JSON.stringify({ mode: "live", host: "example.test", user: "deploy", keyPath }));
  const calls = [];
  const result = await publishReadiness({ supportRoot: root, repoRoot: "/sandbox/repository", mode: "live", execImpl: async (command, args) => {
    calls.push([command, ...args].join(" "));
    if (command === "git" && args[0] === "remote") return { stdout: "https://github.com/Qoalza/Design-portfolio-site.git\n" };
    if (command === "gh" && args[0] === "repo") return { stdout: JSON.stringify({ nameWithOwner: "Qoalza/Design-portfolio-site", viewerPermission: "WRITE" }) };
    if (command === "git" && args[0] === "config") return { stdout: "!/opt/homebrew/bin/gh auth git-credential\n" };
    return { stdout: "ok\n" };
  }});
  assert.equal(result.ready, true);
  assert.equal(result.configured, true);
  assert.equal(result.uploadVerified, false);
  assert.match(result.warnings.join(" "), /Git-пакета.*Push/);
  for (const expected of ["gh auth status", "gh api user", "gh repo view", "git ls-remote", "git config", "ssh -o BatchMode=yes"]) assert.ok(calls.some((call) => call.startsWith(expected)), expected);
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
