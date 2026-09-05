import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { PUBLISH_STAGES, cleanupPublishedRefs, createPublishReadinessCoordinator, createReleaseArchive, createPublishBranch, deployPublishedRelease, ensurePullRequest, expectedResumeHead, finalizePublishedJob, isReusablePublishJob, mergePublishPullRequest, pendingMergeChecks, pendingPublishStages, publishInputFingerprint, publishReadiness, pushPublishCommit, reconcileResumeWorktree, resumeInputMatches, runPublishJob } from "../tools/des-art-admin/publish-worker.mjs";
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
  const staged = JSON.parse(await readFile(path.join(root, "staging", "draft-test", "draft.json"), "utf8"));
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

test("merge resume runs only checks not already completed for the exact published SHA", () => {
  const sha = "a".repeat(40);
  assert.deepEqual(pendingMergeChecks({}, sha).map(([check]) => check), ["checkout", "install", "lint", "build"]);
  assert.deepEqual(pendingMergeChecks({ mergeCheckoutSha: sha, mergeInstallSha: sha, mergeLintSha: sha }, sha).map(([check]) => check), ["build"]);
  assert.deepEqual(pendingMergeChecks({ mergeCheckoutSha: sha, mergeInstallSha: sha, mergeLintSha: sha, mergeBuildSha: sha }, sha), []);
  assert.deepEqual(pendingMergeChecks({ mergeBuildSha: "b".repeat(40) }, sha).map(([check]) => check), ["checkout", "install", "lint", "build"]);
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

test("resume permits a newer local draft only after the submitted commit is proven in published main", () => {
  const job = { inputFingerprint: "a".repeat(64), publishedSha: "b".repeat(40), contentInPublishedSha: true };
  assert.equal(resumeInputMatches(job, job.inputFingerprint), true);
  assert.equal(resumeInputMatches(job, "c".repeat(64)), true);
  assert.equal(resumeInputMatches({ ...job, contentInPublishedSha: false }, "c".repeat(64)), false);
  assert.equal(resumeInputMatches({ ...job, publishedSha: undefined }, "c".repeat(64)), false);
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

test("merge reconciles a non-zero command after GitHub already merged the exact PR", async () => {
  const contentCommit = "a".repeat(40);
  const mergeCommit = "b".repeat(40);
  const calls = [];
  let lookups = 0;
  const result = await mergePublishPullRequest({
    command: async (operation, command, args) => {
      calls.push({ operation, command, args });
      if (operation === "merge.lookup" || operation === "merge.verify") {
        const merged = lookups++ > 0;
        return { stdout: JSON.stringify({
          state: merged ? "MERGED" : "OPEN",
          mergedAt: merged ? "2026-09-03T17:07:02Z" : null,
          mergeCommit: merged ? { oid: mergeCommit } : null,
          headRefName: "codex/content-publish-test",
          headRefOid: contentCommit,
          baseRefName: "main",
        }) };
      }
      if (operation === "merge.execute") {
        throw new PublishCommandError({ failedOperation: "merge.execute", failureCode: "COMMAND_FAILED", exitCode: 1, retryable: false, attempt: 1, diagnosticId: "partial" });
      }
      if (operation === "merge.resolve") return { stdout: `${mergeCommit}\n` };
      return { stdout: "" };
    },
    cwd: "/sandbox",
    pullRequestUrl: "https://github.test/pr/35",
    branch: "codex/content-publish-test",
    contentCommit,
  });
  assert.deepEqual(result, { mergeCommitSha: mergeCommit, publishedSha: mergeCommit });
  const mergeCall = calls.find((call) => call.operation === "merge.execute");
  assert.deepEqual(mergeCall.args, ["pr", "merge", "https://github.test/pr/35", "--merge", "--match-head-commit", contentCommit]);
  assert.equal(mergeCall.args.includes("--delete-branch"), false);
  assert.deepEqual(calls.filter((call) => call.operation === "merge.ancestry").length, 3);
});

test("merge resume accepts an already merged exact PR without executing merge again", async () => {
  const contentCommit = "a".repeat(40);
  const mergeCommit = "b".repeat(40);
  const newerMain = "c".repeat(40);
  const calls = [];
  const result = await mergePublishPullRequest({
    command: async (operation) => {
      calls.push(operation);
      if (operation === "merge.lookup") return { stdout: JSON.stringify({ state: "MERGED", mergedAt: "2026-09-03T17:07:02Z", mergeCommit: { oid: mergeCommit }, headRefName: "codex/content-publish-test", headRefOid: contentCommit, baseRefName: "main" }) };
      if (operation === "merge.resolve") return { stdout: `${newerMain}\n` };
      return { stdout: "" };
    },
    cwd: "/sandbox", pullRequestUrl: "https://github.test/pr/35", branch: "codex/content-publish-test", contentCommit,
  });
  assert.deepEqual(result, { mergeCommitSha: mergeCommit, publishedSha: newerMain });
  assert.equal(calls.includes("merge.execute"), false);
  assert.equal(calls.includes("merge.verify"), false);
  assert.equal(calls.filter((operation) => operation === "merge.ancestry").length, 3);
});

test("merge blocks a PR whose exact base, branch or head commit does not match the job", async () => {
  await assert.rejects(() => mergePublishPullRequest({
    command: async () => ({ stdout: JSON.stringify({ state: "OPEN", mergedAt: null, mergeCommit: null, headRefName: "codex/other", headRefOid: "b".repeat(40), baseRefName: "main" }) }),
    cwd: "/sandbox", pullRequestUrl: "https://github.test/pr/35", branch: "codex/content-publish-test", contentCommit: "a".repeat(40),
  }), (error) => error.title === "Pull Request изменился");
});

test("merge preserves the original command failure when the exact PR remains open", async () => {
  const contentCommit = "a".repeat(40);
  const failure = new PublishCommandError({ failedOperation: "merge.execute", failureCode: "AUTHENTICATION_FAILED", exitCode: 1, retryable: false, attempt: 1, diagnosticId: "merge-auth" });
  await assert.rejects(() => mergePublishPullRequest({
    command: async (operation) => {
      if (operation === "merge.execute") throw failure;
      return { stdout: JSON.stringify({ state: "OPEN", mergedAt: null, mergeCommit: null, headRefName: "codex/content-publish-test", headRefOid: contentCommit, baseRefName: "main" }) };
    },
    cwd: "/sandbox", pullRequestUrl: "https://github.test/pr/35", branch: "codex/content-publish-test", contentCommit,
  }), (error) => error === failure);
});

test("resume expects content commit before Merge and published SHA after Merge", () => {
  const contentCommit = "a".repeat(40);
  const publishedSha = "b".repeat(40);
  const beforeMerge = PUBLISH_STAGES.map(([id, label]) => ({ id, label, status: id === "merge" ? "pending" : "complete" }));
  const afterMerge = beforeMerge.map((stage) => stage.id === "merge" ? { ...stage, status: "complete" } : stage);
  assert.equal(expectedResumeHead({ stages: beforeMerge, contentCommit, publishedSha }), contentCommit);
  assert.equal(expectedResumeHead({ stages: afterMerge, contentCommit, publishedSha }), publishedSha);
  assert.equal(expectedResumeHead({ stages: beforeMerge, contentCommit, publishedSha, contentInPublishedSha: true }), publishedSha);
});

test("resume safely realigns a clean worker worktree after Merge reconciliation", async () => {
  const contentCommit = "a".repeat(40);
  const publishedSha = "b".repeat(40);
  const calls = [];
  let resolves = 0;
  await reconcileResumeWorktree({
    command: async (operation, command, args) => {
      calls.push({ operation, command, args });
      if (operation === "resume.resolve") return { stdout: `${resolves++ ? publishedSha : contentCommit}\n` };
      if (operation === "resume.status") return { stdout: "" };
      return { stdout: "" };
    },
    worktree: "/sandbox/worktree",
    job: { stages: [], contentCommit, publishedSha, contentInPublishedSha: true },
  });
  assert.ok(calls.some((call) => call.operation === "resume.checkout" && call.args.at(-1) === publishedSha));
  assert.equal(resolves, 2);
});

test("resume blocks an exact worker SHA when the service worktree is dirty", async () => {
  const contentCommit = "a".repeat(40);
  await assert.rejects(() => reconcileResumeWorktree({
    command: async (operation) => operation === "resume.resolve" ? { stdout: `${contentCommit}\n` } : { stdout: " M content/projects/draft.json\n" },
    worktree: "/sandbox/worktree",
    job: { stages: [], contentCommit },
  }), (error) => error.title === "Publish-worktree содержит изменения");
});

test("live finalization snapshots the exact published document and marks only unchanged drafts published", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-finalize-live-"));
  const draftRoot = path.join(root, "drafts");
  const draftAssetRoot = path.join(root, "draft-assets");
  const snapshotRoot = path.join(root, "snapshots");
  const worktree = path.join(root, "worktree");
  const draftFile = path.join(draftRoot, "draft.json");
  await mkdir(draftRoot, { recursive: true });
  await mkdir(draftAssetRoot, { recursive: true });
  await mkdir(path.join(worktree, "content", "projects"), { recursive: true });
  const draft = project({ visibility: "draft" });
  const published = project({ title: "Exact published", visibility: "published", catalogOrder: 2, admin: false });
  await writeFile(draftFile, JSON.stringify(draft));
  await writeFile(path.join(worktree, "content", "projects", "draft.json"), JSON.stringify(published));
  const inputFingerprint = await publishInputFingerprint({ files: [draftFile], draftAssetRoot });

  const result = await finalizePublishedJob({
    job: { mode: "live", files: [draftFile], draftAssetRoot, snapshotRoot, inputFingerprint },
    worktree,
  });

  assert.deepEqual(result, { draftUpdated: true });
  assert.equal(JSON.parse(await readFile(draftFile, "utf8")).visibility, "published");
  assert.deepEqual(JSON.parse(await readFile(path.join(snapshotRoot, "draft.json"), "utf8")), published);
});

test("live finalization preserves a newer draft while snapshotting the exact published document", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-finalize-newer-draft-"));
  const draftRoot = path.join(root, "drafts");
  const draftAssetRoot = path.join(root, "draft-assets");
  const snapshotRoot = path.join(root, "snapshots");
  const worktree = path.join(root, "worktree");
  const draftFile = path.join(draftRoot, "draft.json");
  await mkdir(draftRoot, { recursive: true });
  await mkdir(draftAssetRoot, { recursive: true });
  await mkdir(path.join(worktree, "content", "projects"), { recursive: true });
  await writeFile(draftFile, JSON.stringify(project({ title: "Submitted", visibility: "draft" })));
  const inputFingerprint = await publishInputFingerprint({ files: [draftFile], draftAssetRoot });
  const newerDraft = project({ title: "Newer local edit", visibility: "draft" });
  const published = project({ title: "Submitted", visibility: "published", admin: false });
  await writeFile(draftFile, JSON.stringify(newerDraft));
  await writeFile(path.join(worktree, "content", "projects", "draft.json"), JSON.stringify(published));

  const result = await finalizePublishedJob({
    job: { mode: "live", files: [draftFile], draftAssetRoot, snapshotRoot, inputFingerprint },
    worktree,
  });

  assert.deepEqual(result, { draftUpdated: false });
  assert.deepEqual(JSON.parse(await readFile(draftFile, "utf8")), newerDraft);
  assert.deepEqual(JSON.parse(await readFile(path.join(snapshotRoot, "draft.json"), "utf8")), published);
});

test("deploy resume skips archive, upload and publish when exact SHA is already active", async () => {
  const sha = "a".repeat(40);
  const calls = [];
  const result = await deployPublishedRelease({
    command: async (operation) => { calls.push(operation); return { stdout: `ready ${sha}\n` }; },
    createArchive: async () => { calls.push("archive"); },
    upload: async () => { calls.push("upload"); },
    archive: "/sandbox/release.tar.gz", sourceRoot: "/sandbox", config: { host: "host", user: "user", keyPath: "/key" }, sha,
  });
  assert.deepEqual(result, { state: "already-deployed" });
  assert.deepEqual(calls, ["deploy.status.before"]);
});

test("deploy reconciles a publish transport error when restricted status reports the exact SHA", async () => {
  const sha = "a".repeat(40);
  const calls = [];
  let statusChecks = 0;
  const result = await deployPublishedRelease({
    command: async (operation) => {
      calls.push(operation);
      if (operation.startsWith("deploy.status")) return { stdout: `ready ${statusChecks++ ? sha : "b".repeat(40)}\n` };
      throw new PublishCommandError({ failedOperation: "deploy.publish", failureCode: "NETWORK_UNAVAILABLE", exitCode: 255, retryable: true, attempt: 1, diagnosticId: "disconnect" });
    },
    createArchive: async () => { calls.push("archive"); },
    upload: async () => { calls.push("upload"); },
    archive: "/sandbox/release.tar.gz", sourceRoot: "/sandbox", config: { host: "host", user: "user", keyPath: "/key" }, sha,
  });
  assert.deepEqual(result, { state: "deployed-after-transport-error" });
  assert.deepEqual(calls, ["deploy.status.before", "archive", "upload", "deploy.publish", "deploy.status.after"]);
});

test("deploy refuses success when restricted status does not confirm the exact SHA", async () => {
  const sha = "a".repeat(40);
  await assert.rejects(() => deployPublishedRelease({
    command: async (operation) => operation.startsWith("deploy.status") ? { stdout: `ready ${"b".repeat(40)}\n` } : { stdout: "" },
    createArchive: async () => {}, upload: async () => {}, archive: "/sandbox/release.tar.gz", sourceRoot: "/sandbox",
    config: { host: "host", user: "user", keyPath: "/key" }, sha,
  }), (error) => error.title === "Deploy не подтверждён");
});

test("deploy blocks before upload when restricted status is not an exact SHA", async () => {
  const calls = [];
  await assert.rejects(() => deployPublishedRelease({
    command: async (operation) => { calls.push(operation); return { stdout: "ready unknown\n" }; },
    createArchive: async () => { calls.push("archive"); }, upload: async () => { calls.push("upload"); },
    archive: "/sandbox/release.tar.gz", sourceRoot: "/sandbox", config: { host: "host", user: "user", keyPath: "/key" }, sha: "a".repeat(40),
  }), (error) => error.title === "Production SHA не подтверждён");
  assert.deepEqual(calls, ["deploy.status.before"]);
});

test("publish branch cleanup runs only after verified content and ignores cleanup failures", async () => {
  const contentCommit = "a".repeat(40);
  const calls = [];
  await cleanupPublishedRefs({
    execImpl: async (command, args) => {
      calls.push([command, ...args]);
      if (args[0] === "ls-remote") return { stdout: `${contentCommit}\trefs/heads/codex/content-publish-test\n` };
      if (args[0] === "rev-parse") return { stdout: `${contentCommit}\n` };
      if (args[0] === "push") throw new Error("cleanup transport failed");
      return { stdout: "" };
    },
    repoRoot: "/sandbox/repository", worktree: "/sandbox/worktree", branch: "codex/content-publish-test", contentCommit, contentInPublishedSha: true,
  });
  assert.ok(calls.some(([, ...args]) => args[0] === "worktree" && args[1] === "remove"));
  assert.ok(calls.some(([, ...args]) => args[0] === "push" && args.includes("--delete")));
  assert.ok(calls.some(([, ...args]) => args[0] === "branch" && args[1] === "-D"));

  const unverifiedCalls = [];
  await cleanupPublishedRefs({ execImpl: async (command, args) => { unverifiedCalls.push([command, ...args]); return { stdout: "" }; }, repoRoot: "/sandbox/repository", worktree: "/sandbox/worktree", branch: "codex/content-publish-test", contentCommit, contentInPublishedSha: false });
  assert.equal(unverifiedCalls.some(([, ...args]) => args[0] === "push" || args[0] === "branch"), false);
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

test("live readiness reports one actionable missing-tool failure and skips dependent GitHub checks", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-readiness-tools-"));
  await writeFile(path.join(root, "production-data-baseline.json"), JSON.stringify({ version: 5, source: "production-live" }));
  const result = await publishReadiness({
    supportRoot: root,
    repoRoot: root,
    mode: "live",
    execImpl: async (command) => {
      if (command === "gh") {
        const error = new Error("spawn gh ENOENT");
        error.code = "ENOENT";
        throw error;
      }
      return { stdout: "" };
    },
  });
  assert.equal(result.ready, false);
  assert.ok(Array.isArray(result.checks));
  assert.deepEqual(result.checks.find((check) => check.id === "github-cli"), {
    id: "github-cli", status: "failed", code: "TOOL_MISSING", message: "GitHub CLI не найден в окружении Admin", retryable: false,
  });
  assert.equal(result.checks.find((check) => check.id === "github-identity")?.status, "skipped");
  assert.equal(result.checks.find((check) => check.id === "repository")?.status, "skipped");
  assert.equal(result.warnings.length, 0);
});

test("readiness classifies a locally terminated command as a retryable timeout", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-readiness-sigterm-"));
  await writeFile(path.join(root, "production-data-baseline.json"), JSON.stringify({ version: 5, source: "production-live" }));
  const result = await publishReadiness({
    supportRoot: root,
    repoRoot: root,
    mode: "live",
    execImpl: async (command) => {
      if (command === "gh") {
        const error = new Error("Command failed");
        error.killed = true;
        error.signal = "SIGTERM";
        throw error;
      }
      return { stdout: "" };
    },
  });
  assert.deepEqual(result.checks.find((check) => check.id === "github-cli"), {
    id: "github-cli", status: "failed", code: "TIMEOUT", message: "Проверка GitHub CLI не ответила вовремя", retryable: true,
  });
});

test("readiness deadline returns a retryable result and releases the coordinator for a later retry", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-readiness-timeout-"));
  await writeFile(path.join(root, "production-data-baseline.json"), JSON.stringify({ version: 5, source: "production-live" }));
  const timedOut = await publishReadiness({
    supportRoot: root,
    repoRoot: root,
    mode: "live",
    timeoutMs: 5,
    execImpl: async () => new Promise(() => {}),
  });
  assert.equal(timedOut.ready, false);
  assert.ok(timedOut.checks.some((check) => check.code === "TIMEOUT" && check.retryable));

  let calls = 0;
  const coordinated = createPublishReadinessCoordinator(async () => ({ ready: ++calls > 1 }));
  const [first, sameFirst] = await Promise.all([coordinated(), coordinated()]);
  assert.equal(calls, 1);
  assert.deepEqual(first, sameFirst);
  assert.equal((await coordinated()).ready, true);
  assert.equal(calls, 2);
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

test("live readiness gives local checks a 10-second deadline and network checks 15 seconds", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-readiness-deadlines-"));
  const keyPath = path.join(root, "deploy-key");
  await writeFile(keyPath, "test-only-key");
  await writeFile(path.join(root, "production-data-baseline.json"), JSON.stringify({ version: 5, source: "production-live" }));
  await writeFile(path.join(root, "live-publish.json"), JSON.stringify({ mode: "live", host: "example.test", user: "deploy", keyPath }));
  const deadlines = new Map();
  const result = await publishReadiness({ supportRoot: root, repoRoot: "/sandbox/repository", mode: "live", execImpl: async (command, args, options) => {
    deadlines.set([command, ...args.slice(0, 2)].join(" "), options.timeout);
    if (command === "git" && args[0] === "remote") return { stdout: "https://github.com/Qoalza/Design-portfolio-site.git\n" };
    if (command === "gh" && args[0] === "repo") return { stdout: JSON.stringify({ nameWithOwner: "Qoalza/Design-portfolio-site", viewerPermission: "WRITE" }) };
    if (command === "git" && args[0] === "config") return { stdout: "!/opt/homebrew/bin/gh auth git-credential\n" };
    return { stdout: "ok\n" };
  }});
  assert.equal(result.ready, true);
  assert.equal(deadlines.get("git remote get-url"), 10_000);
  assert.equal(deadlines.get("git config --get-all"), 10_000);
  assert.equal(deadlines.get("gh auth status"), 15_000);
  assert.equal(deadlines.get("git ls-remote --exit-code"), 15_000);
  assert.equal(deadlines.get("ssh -o BatchMode=yes"), 15_000);
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
