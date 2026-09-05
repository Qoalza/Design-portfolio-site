import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { access, cp, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { compileAdminDraft, parseAdminDraft } from "./draft-contract.mjs";
import { humanError, UserFacingError } from "./human-errors.mjs";
import { classifyCommandFailure, createPublishCommandRunner, recordPublishCommandFailure } from "./publish-diagnostics.mjs";
import {
  createRuntimeReleaseArchive,
  deployOperationId,
  readDeployOperation,
  resolveFreshDeployTarget,
  startDeployOperation,
  uploadRuntimeRelease,
  verifyPublicRelease,
  waitForDeployOperation,
} from "./deploy-v2.mjs";
import {
  claimPublishWorker,
  heartbeatPublishWorker,
  mutatePublishJob,
  PUBLISH_WORKER_HEARTBEAT_MS,
  releasePublishWorker,
} from "./publish-job-state.mjs";
import { PRODUCTION_DATA_BASELINE_VERSION } from "./production-data-bootstrap.mjs";
import { readAllProjectDocuments } from "../../src/lib/projects.ts";
import { validateProjectCollection } from "../../src/lib/project-visual-registry.ts";

const exec = promisify(execFile);
export const PUBLISH_STAGES = [
  ["validate", "Проверка"],
  ["prepare", "Подготовка файлов"],
  ["checks", "Lint, build и tests"],
  ["commit", "Commit"],
  ["push", "Push"],
  ["pr", "Pull Request"],
  ["merge", "Merge"],
  ["deploy", "Deploy"],
  ["verify", "Публичная проверка"],
];

export function pendingPublishStages(stages) {
  return PUBLISH_STAGES.filter(([stageId]) => stages.find((stage) => stage.id === stageId)?.status !== "complete");
}

export function pendingMergeChecks(job, publishedSha) {
  return [
    ["checkout", "mergeCheckoutSha"],
    ["install", "mergeInstallSha"],
    ["lint", "mergeLintSha"],
    ["build", "mergeBuildSha"],
  ].filter(([, field]) => job[field] !== publishedSha);
}

export function expectedResumeHead(job) {
  const hasReconciledMerge = job.contentInPublishedSha === true && /^[a-f0-9]{40}$/.test(job.publishedSha ?? "");
  const mergeComplete = job.stages?.find((stage) => stage.id === "merge")?.status === "complete";
  return hasReconciledMerge || mergeComplete ? job.publishedSha : job.contentCommit;
}

export async function reconcileResumeWorktree({ command, worktree, job }) {
  const expected = expectedResumeHead(job);
  if (!/^[a-f0-9]{40}$/.test(expected ?? "")) {
    throw new UserFacingError("SHA продолжения не найден", "Не удалось определить точный commit для продолжения публикации. Требуется ручная проверка.", { status: 409 });
  }
  const resolveHead = async () => (await command("resume.resolve", "git", ["rev-parse", "HEAD"], { cwd: worktree })).stdout.trim();
  let current = await resolveHead();
  const assertClean = async () => {
    const { stdout: status = "" } = await command("resume.status", "git", ["status", "--porcelain"], { cwd: worktree });
    if (status.trim()) {
      throw new UserFacingError("Publish-worktree содержит изменения", "В служебной копии найдены несохранённые изменения. Автоматическое продолжение остановлено; требуется ручная проверка.", { status: 409 });
    }
  };
  if (current === expected) {
    await assertClean();
    return expected;
  }

  const canRealignMergedWorktree = job.contentInPublishedSha === true
    && expected === job.publishedSha
    && current === job.contentCommit;
  if (!canRealignMergedWorktree) {
    throw new UserFacingError("Локальная ветка изменилась", "Сохранённый commit больше не совпадает с publish-worktree. Автоматическое продолжение остановлено; требуется ручная проверка.", { status: 409 });
  }
  await assertClean();
  await command("resume.checkout", "git", ["switch", "--detach", expected], { cwd: worktree });
  current = await resolveHead();
  if (current !== expected) {
    throw new UserFacingError("Локальная ветка изменилась", "Не удалось восстановить publish-worktree на exact SHA. Автоматическое продолжение остановлено; требуется ручная проверка.", { status: 409 });
  }
  return expected;
}

export function createPublishBranch(isoDate = new Date().toISOString()) {
  const compact = isoDate.replace(/\D/g, "").slice(0, 14);
  return `codex/content-publish-${compact.slice(0, 8)}-${compact.slice(8)}`;
}

async function inputFiles(root, relative = "") {
  let entries;
  try {
    entries = await readdir(path.join(root, relative), { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await inputFiles(root, child));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}

function addFingerprintEntry(hash, label, bytes) {
  hash.update(`${Buffer.byteLength(label)}:${label}:${bytes.byteLength}:`);
  hash.update(bytes);
}

export async function publishInputFingerprint({ files, draftAssetRoot }) {
  const hash = createHash("sha256");
  for (const file of [...files].sort()) {
    const slug = path.basename(file, ".json");
    addFingerprintEntry(hash, `draft/${path.basename(file)}`, await readFile(file));
    const assetRoot = path.join(draftAssetRoot, slug);
    for (const relative of await inputFiles(assetRoot)) {
      addFingerprintEntry(hash, `draft-assets/${slug}/${relative.split(path.sep).join("/")}`, await readFile(path.join(assetRoot, relative)));
    }
  }
  return hash.digest("hex");
}

export function isReusablePublishJob(job, identity) {
  const sameInput = ["queued", "running", "failed"].includes(job?.status)
    && job.mode === identity.mode
    && job.scope === identity.scope
    && (identity.scope === "all" || job.slug === identity.slug)
    && job.inputFingerprint === identity.inputFingerprint;
  if (!sameInput) return false;
  if (job.status === "queued" || job.status === "running") return true;
  return /^codex\/content-publish-\d{8}-\d{6}$/.test(job.branch)
    && /^[a-f0-9]{40}$/.test(job.contentCommit);
}

export function resumeInputMatches(job, currentInputFingerprint) {
  if (currentInputFingerprint === job.inputFingerprint) return true;
  return job.contentInPublishedSha === true && /^[a-f0-9]{40}$/.test(job.publishedSha ?? "");
}

function remoteHead(output) {
  const match = /^([a-f0-9]{40})\s+refs\/heads\//m.exec(output);
  return match?.[1];
}

// Used only after a confirmed HTTP/RPC transport reset. This keeps the bounded retry
// on HTTP/1.1 and avoids chunked transfer for normal Admin publication payloads.
const HTTP_PUSH_FALLBACK_BUFFER_BYTES = 512 * 1024 * 1024;

function assertCompatibleRemoteHead(remoteSha, contentCommit) {
  if (remoteSha && remoteSha !== contentCommit) {
    throw new UserFacingError("Удалённая ветка изменилась", "В GitHub находится другая версия этой ветки. Автоматическое продолжение остановлено; требуется ручная проверка.", { status: 409 });
  }
}

async function lookupRemoteHead({ command, cwd, ref, operation = "push.lookup", tolerateFailure = false }) {
  try {
    const { stdout = "" } = await command(operation, "git", ["ls-remote", "--heads", "origin", ref], { cwd });
    return remoteHead(stdout);
  } catch (error) {
    if (tolerateFailure) return undefined;
    throw error;
  }
}

async function verifyPushOutcome({ command, cwd, ref, contentCommit, attempt, failedPush }) {
  const remoteSha = await lookupRemoteHead({ command, cwd, ref, operation: "push.verify", tolerateFailure: Boolean(failedPush) });
  assertCompatibleRemoteHead(remoteSha, contentCommit);
  if (remoteSha === contentCommit) {
    return { state: failedPush ? "pushed-after-transport-error" : "pushed", attempt };
  }
  if (failedPush) throw failedPush;
  throw new UserFacingError("Push не подтверждён", "Git завершил отправку без ошибки, но exact commit не появился в удалённой ветке. Продолжение остановлено; требуется ручная проверка.", { status: 409 });
}

export async function pushPublishCommit({ command, cwd, branch, contentCommit }) {
  const ref = `refs/heads/${branch}`;
  const remoteSha = await lookupRemoteHead({ command, cwd, ref });
  if (remoteSha === contentCommit) return { state: "already-pushed", attempt: 0 };
  assertCompatibleRemoteHead(remoteSha, contentCommit);
  const normalArgs = ["push", "-u", "origin", `${contentCommit}:${ref}`];
  let firstFailure;
  try {
    await command("push", "git", normalArgs, { cwd, maxBuffer: 10 * 1024 * 1024 }, 1);
  } catch (error) {
    firstFailure = error;
  }
  if (!firstFailure) return verifyPushOutcome({ command, cwd, ref, contentCommit, attempt: 1 });

  const verified = await verifyPushOutcome({ command, cwd, ref, contentCommit, attempt: 1, failedPush: firstFailure }).catch((verificationError) => {
    if (verificationError !== firstFailure) throw verificationError;
    return null;
  });
  if (verified) return verified;
  if (!firstFailure?.retryable || firstFailure.attempt !== 1) throw firstFailure;

  const retryArgs = firstFailure.failureCode === "HTTP2_RPC_RESET"
    ? ["-c", "http.version=HTTP/1.1", "-c", `http.postBuffer=${HTTP_PUSH_FALLBACK_BUFFER_BYTES}`, ...normalArgs]
    : normalArgs;
  let retryFailure;
  try {
    await command("push", "git", retryArgs, { cwd, maxBuffer: 10 * 1024 * 1024 }, 2);
  } catch (error) {
    retryFailure = error;
  }
  return verifyPushOutcome({ command, cwd, ref, contentCommit, attempt: 2, failedPush: retryFailure });
}

export async function ensurePullRequest({ command, cwd, branch, title }) {
  const { stdout = "[]" } = await command("pull-request.lookup", "gh", ["pr", "list", "--state", "all", "--head", branch, "--json", "state,url,mergedAt"], { cwd });
  const matches = JSON.parse(stdout);
  if (matches.length > 1) throw new UserFacingError("Найдено несколько Pull Request", "Нельзя однозначно выбрать Pull Request для продолжения. Требуется ручная проверка.", { status: 409 });
  if (matches.length === 1) {
    const pullRequest = matches[0];
    if (pullRequest.state === "OPEN" || pullRequest.state === "MERGED" || pullRequest.mergedAt) return pullRequest.url;
    throw new UserFacingError("Pull Request закрыт без merge", "Закрытый Pull Request нельзя использовать повторно. Требуется ручная проверка перед продолжением.", { status: 409 });
  }
  const { stdout: created } = await command("pull-request.create", "gh", ["pr", "create", "--base", "main", "--head", branch, "--title", title, "--body", "Публикация подготовлена локальной Des-art Admin после успешных проверок."], { cwd });
  return created.trim();
}

const PULL_REQUEST_STATE_FIELDS = "state,mergedAt,mergeCommit,headRefName,headRefOid,baseRefName";

async function readPullRequest({ command, cwd, pullRequestUrl, operation }) {
  const { stdout = "{}" } = await command(operation, "gh", ["pr", "view", pullRequestUrl, "--json", PULL_REQUEST_STATE_FIELDS], { cwd });
  const pullRequest = JSON.parse(stdout);
  if (!pullRequest || typeof pullRequest !== "object") throw new Error("Pull Request state is invalid.");
  return pullRequest;
}

function assertPublishPullRequest(pullRequest, { branch, contentCommit }) {
  if (pullRequest.baseRefName !== "main" || pullRequest.headRefName !== branch || pullRequest.headRefOid !== contentCommit) {
    throw new UserFacingError("Pull Request изменился", "Pull Request больше не совпадает с сохранённой веткой и commit. Автоматическое продолжение остановлено; требуется ручная проверка.", { status: 409 });
  }
}

function mergedPullRequest(pullRequest) {
  return pullRequest.state === "MERGED" || Boolean(pullRequest.mergedAt);
}

export async function mergePublishPullRequest({ command, cwd, pullRequestUrl, branch, contentCommit }) {
  let pullRequest = await readPullRequest({ command, cwd, pullRequestUrl, operation: "merge.lookup" });
  assertPublishPullRequest(pullRequest, { branch, contentCommit });
  if (pullRequest.state === "CLOSED" && !mergedPullRequest(pullRequest)) {
    throw new UserFacingError("Pull Request закрыт без merge", "Закрытый Pull Request нельзя продолжить автоматически. Требуется ручная проверка.", { status: 409 });
  }

  let mergeFailure;
  if (!mergedPullRequest(pullRequest)) {
    try {
      await command("merge.execute", "gh", ["pr", "merge", pullRequestUrl, "--merge", "--match-head-commit", contentCommit], { cwd, maxBuffer: 10 * 1024 * 1024 });
    } catch (error) {
      mergeFailure = error;
    }
    try {
      pullRequest = await readPullRequest({ command, cwd, pullRequestUrl, operation: "merge.verify" });
    } catch (error) {
      if (mergeFailure) throw mergeFailure;
      throw error;
    }
    assertPublishPullRequest(pullRequest, { branch, contentCommit });
  }

  if (!mergedPullRequest(pullRequest)) {
    if (mergeFailure) throw mergeFailure;
    throw new UserFacingError("Merge не подтверждён", "GitHub не подтвердил завершённый Merge. Продолжение остановлено; повторите проверку позже.", { status: 409 });
  }
  const mergeCommitSha = pullRequest.mergeCommit?.oid;
  if (!/^[a-f0-9]{40}$/.test(mergeCommitSha ?? "")) {
    throw new UserFacingError("Merge SHA не подтверждён", "GitHub не вернул точный SHA merge commit. Продолжение остановлено; требуется ручная проверка.", { status: 409 });
  }

  await command("merge.fetch", "git", ["fetch", "origin", "main"], { cwd });
  const { stdout } = await command("merge.resolve", "git", ["rev-parse", "origin/main"], { cwd });
  const publishedSha = stdout.trim();
  if (!/^[a-f0-9]{40}$/.test(publishedSha)) throw new Error("Published SHA is invalid.");
  await command("merge.ancestry", "git", ["merge-base", "--is-ancestor", contentCommit, mergeCommitSha], { cwd });
  await command("merge.ancestry", "git", ["merge-base", "--is-ancestor", contentCommit, publishedSha], { cwd });
  await command("merge.ancestry", "git", ["merge-base", "--is-ancestor", mergeCommitSha, publishedSha], { cwd });
  return { mergeCommitSha, publishedSha };
}

export async function createReleaseArchive({ archive, sourceRoot }) {
  await exec("tar", ["--no-mac-metadata", "--no-xattrs", "--no-acls", "--no-fflags", "--exclude=.git", "--exclude=node_modules", "--exclude=.next", "--exclude=.next-admin-preview-*", "-czf", archive, "-C", sourceRoot, "."], {
    env: { ...process.env, COPYFILE_DISABLE: "1" },
    maxBuffer: 10 * 1024 * 1024,
  });
}

async function atomicJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, file);
}

function publishedDraft(project) {
  return project.visibility === "draft" ? { ...project, visibility: "published" } : project;
}

export async function finalizePublishedJob({ job, worktree }) {
  if (!job.snapshotRoot) return { draftUpdated: false };
  await mkdir(job.snapshotRoot, { recursive: true });

  if (job.mode === "live") {
    const currentFingerprint = await publishInputFingerprint({ files: job.files, draftAssetRoot: job.draftAssetRoot });
    const draftUpdated = currentFingerprint === job.inputFingerprint;
    for (const file of job.files) {
      const fileName = path.basename(file);
      const published = JSON.parse(await readFile(path.join(worktree, "content", "projects", fileName), "utf8"));
      await atomicJson(path.join(job.snapshotRoot, fileName), published);
      if (draftUpdated) {
        const draft = publishedDraft(parseAdminDraft(await readFile(file, "utf8"), fileName));
        await atomicJson(file, draft);
      }
    }
    return { draftUpdated };
  }

  for (const file of job.files) {
    const draft = publishedDraft(parseAdminDraft(await readFile(file, "utf8"), path.basename(file)));
    await atomicJson(file, draft);
    const snapshotFile = path.join(job.snapshotRoot, path.basename(file));
    let compiled = compileAdminDraft(draft);
    if (job.scope === "project") {
      try {
        const baseline = JSON.parse(await readFile(snapshotFile, "utf8"));
        compiled = { ...compiled, catalogOrder: baseline.catalogOrder, homePlacement: baseline.homePlacement };
      } catch {}
    }
    await atomicJson(snapshotFile, compiled);
  }
  return { draftUpdated: true };
}

function candidateCollection(baselineRoot, compiledProjects, scope) {
  const baseline = readAllProjectDocuments(baselineRoot);
  const currentBySlug = new Map(baseline.map((project) => [project.slug, project]));
  const replacements = new Map(compiledProjects.map((project) => {
    const current = currentBySlug.get(project.slug);
    const replacement = scope === "project" && current
      ? { ...project, catalogOrder: current.catalogOrder, homePlacement: current.homePlacement }
      : project;
    return [replacement.slug, replacement];
  }));
  const next = baseline.filter((project) => !replacements.has(project.slug)).concat([...replacements.values()]);
  validateProjectCollection(next);
  return replacements;
}

async function liveConfig(supportRoot) {
  const file = path.join(supportRoot, "live-publish.json");
  const value = JSON.parse(await readFile(file, "utf8"));
  if (value.mode !== "live" || typeof value.host !== "string" || typeof value.user !== "string" || typeof value.keyPath !== "string") {
    throw new Error("Live publish configuration is invalid.");
  }
  return { mode: "live", host: value.host, user: value.user, keyPath: value.keyPath };
}

function githubRepository(remote) {
  const match = /github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?$/.exec(remote.trim());
  return match?.[1];
}

const READINESS_COMMAND_TIMEOUT_MS = 15_000;
const READINESS_TOTAL_TIMEOUT_MS = 45_000;

function readinessFailure(error, fallback) {
  if (error?.code === "ENOENT") return { code: "TOOL_MISSING", message: fallback.missing, retryable: false };
  if (error?.name === "AbortError" || error?.code === "ABORT_ERR" || error?.killed === true || error?.signal === "SIGTERM" || /timed? out/i.test(`${error?.message ?? ""}\n${error?.stderr ?? ""}`)) {
    return { code: "TIMEOUT", message: fallback.timeout, retryable: true };
  }
  const classified = classifyCommandFailure(error);
  if (classified.failureCode === "AUTHENTICATION_FAILED") return { code: "AUTHENTICATION_FAILED", message: fallback.authentication, retryable: false };
  if (classified.failureCode === "PERMISSION_DENIED") return { code: "PERMISSION_DENIED", message: fallback.permission, retryable: false };
  if (["DNS_UNAVAILABLE", "NETWORK_UNAVAILABLE"].includes(classified.failureCode)) return { code: classified.failureCode, message: fallback.network, retryable: true };
  return { code: "UNKNOWN", message: fallback.unknown, retryable: false };
}

function skippedCheck(id, message) {
  return { id, status: "skipped", code: "PREREQUISITE_FAILED", message, retryable: false };
}

async function commandWithDeadline(execImpl, command, args, { cwd, signal, timeoutMs = READINESS_COMMAND_TIMEOUT_MS }) {
  if (signal?.aborted) {
    const error = new Error("Readiness request was cancelled.");
    error.code = "ABORT_ERR";
    throw error;
  }
  let timer;
  let abort;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error("Readiness command timed out.");
      error.code = "ABORT_ERR";
      reject(error);
    }, timeoutMs);
    abort = () => {
      const error = new Error("Readiness request was cancelled.");
      error.code = "ABORT_ERR";
      reject(error);
    };
    signal?.addEventListener("abort", abort, { once: true });
  });
  try {
    return await Promise.race([
      execImpl(command, args, { cwd, signal, timeout: timeoutMs, killSignal: "SIGTERM" }),
      deadline,
    ]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

export function createPublishReadinessCoordinator(getReadiness) {
  let inFlight;
  return async function coordinatedReadiness() {
    if (!inFlight) inFlight = Promise.resolve().then(getReadiness).finally(() => { inFlight = undefined; });
    return inFlight;
  };
}

export async function publishReadiness({
  supportRoot,
  repoRoot,
  mode = "sandbox",
  execImpl = exec,
  timeoutMs = READINESS_TOTAL_TIMEOUT_MS,
} = {}) {
  const failures = [];
  const checks = [];
  const warnings = [];
  if (mode !== "live") return { ready: true, configured: true, uploadVerified: false, failures, warnings, checks, mode };

  const controller = new AbortController();
  const deadlineAt = Date.now() + timeoutMs;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const addFailure = (id, outcome) => {
    checks.push({ id, status: "failed", ...outcome });
    failures.push(outcome.message);
    return false;
  };
  const run = async (id, command, args, fallback) => {
    try {
      const remaining = Math.max(1, deadlineAt - Date.now());
      const result = await commandWithDeadline(execImpl, command, args, { cwd: repoRoot, signal: controller.signal, timeoutMs: Math.min(READINESS_COMMAND_TIMEOUT_MS, remaining) });
      checks.push({ id, status: "passed", code: "OK", message: fallback.passed, retryable: false });
      return result;
    } catch (error) {
      addFailure(id, readinessFailure(error, fallback));
      return undefined;
    }
  };

  try {
    const baseline = JSON.parse(await readFile(path.join(supportRoot, "production-data-baseline.json"), "utf8"));
    if (baseline.version !== PRODUCTION_DATA_BASELINE_VERSION || baseline.source !== "production-live") throw new Error("invalid baseline");
    checks.push({ id: "production-baseline", status: "passed", code: "OK", message: "Production baseline подтверждён", retryable: false });
  } catch {
    addFailure("production-baseline", { code: "BASELINE_INVALID", message: "Рабочие данные ещё не синхронизированы с актуальным production-контентом", retryable: false });
    clearTimeout(timer);
    return { ready: false, configured: false, uploadVerified: false, failures, warnings, checks, mode };
  }

  const gh = await run("github-cli", "gh", ["auth", "status", "--hostname", "github.com"], {
    passed: "GitHub CLI авторизован", missing: "GitHub CLI не найден в окружении Admin", timeout: "Проверка GitHub CLI не ответила вовремя", authentication: "GitHub CLI не авторизован", permission: "Нет доступа GitHub CLI", network: "GitHub недоступен по сети", unknown: "Не удалось проверить GitHub CLI",
  });
  if (!gh) {
    checks.push(skippedCheck("github-identity", "Проверка пропущена: GitHub CLI недоступен"));
    checks.push(skippedCheck("repository", "Проверка пропущена: GitHub CLI недоступен"));
  } else {
    await run("github-identity", "gh", ["api", "user", "--jq", ".login"], {
      passed: "GitHub identity подтверждён", missing: "GitHub CLI не найден в окружении Admin", timeout: "Проверка GitHub identity не ответила вовремя", authentication: "GitHub CLI не авторизован", permission: "Нет доступа к GitHub identity", network: "GitHub недоступен по сети", unknown: "Не удалось подтвердить GitHub identity",
    });
    let remote;
    try {
      const remaining = Math.max(1, deadlineAt - Date.now());
      remote = (await commandWithDeadline(execImpl, "git", ["remote", "get-url", "origin"], { cwd: repoRoot, signal: controller.signal, timeoutMs: Math.min(READINESS_COMMAND_TIMEOUT_MS, remaining) })).stdout.trim();
    } catch (error) {
      addFailure("repository", readinessFailure(error, { missing: "Git не найден в окружении Admin", timeout: "Проверка репозитория не ответила вовремя", authentication: "Не удалось авторизоваться в репозитории Portfolio", permission: "Нет доступа к репозиторию Portfolio", network: "Репозиторий Portfolio недоступен по сети", unknown: "Не удалось прочитать репозиторий Portfolio" }));
    }
    if (remote) {
      const repository = await run("repository", "gh", ["repo", "view", "--json", "nameWithOwner,viewerPermission"], {
        passed: "Репозиторий Portfolio подтверждён", missing: "GitHub CLI не найден в окружении Admin", timeout: "Проверка репозитория не ответила вовремя", authentication: "GitHub CLI не авторизован", permission: "Нет права push в репозиторий Portfolio", network: "Репозиторий Portfolio недоступен по сети", unknown: "Не удалось проверить репозиторий Portfolio",
      });
      if (repository) {
        try {
          const value = JSON.parse(repository.stdout);
          if (githubRepository(remote) !== value.nameWithOwner) addFailure("repository-match", { code: "REPOSITORY_MISMATCH", message: "GitHub CLI подключён не к тому репозиторию", retryable: false });
          else if (!["ADMIN", "MAINTAIN", "WRITE"].includes(value.viewerPermission)) addFailure("repository-permission", { code: "PERMISSION_DENIED", message: "Нет права push в репозиторий Portfolio", retryable: false });
          else await run("repository-remote", "git", ["ls-remote", "--exit-code", "origin", "refs/heads/main"], {
            passed: "Удалённый main доступен", missing: "Git не найден в окружении Admin", timeout: "Проверка удалённого репозитория не ответила вовремя", authentication: "Не удалось авторизоваться в репозитории Portfolio", permission: "Нет доступа к репозиторию Portfolio", network: "Репозиторий Portfolio недоступен по сети", unknown: "Не удалось проверить удалённый репозиторий Portfolio",
          });
        } catch { addFailure("repository", { code: "INVALID_RESPONSE", message: "GitHub вернул неполный ответ о репозитории", retryable: true }); }
      }
    }
  }

  const helper = await run("git-credential-helper", "git", ["config", "--get-all", "credential.https://github.com.helper"], {
    passed: "Git credential helper подтверждён", missing: "Git не найден в окружении Admin", timeout: "Проверка Git credential helper не ответила вовремя", authentication: "Не удалось проверить Git credential helper", permission: "Нет доступа к настройкам Git", network: "Git credential helper недоступен", unknown: "Git credential helper для GitHub не настроен",
  });
  if (helper && !/gh\s+auth\s+git-credential/.test(helper.stdout)) addFailure("git-credential-helper", { code: "CREDENTIAL_HELPER_MISMATCH", message: "Git credential helper не согласован с GitHub CLI", retryable: false });

  try {
    const config = await liveConfig(supportRoot);
    await access(config.keyPath);
    await run("deploy-ssh", "ssh", ["-o", "BatchMode=yes", "-o", "ConnectTimeout=10", "-i", config.keyPath, `${config.user}@${config.host}`, "status"], {
      passed: "Безопасный SSH-доступ к deploy подтверждён", missing: "SSH не найден в окружении Admin", timeout: "Проверка SSH-доступа к deploy не ответила вовремя", authentication: "SSH-ключ не авторизован для deploy", permission: "Нет доступа SSH к deploy", network: "Deploy недоступен по сети", unknown: "Не удалось подтвердить SSH-доступ к deploy",
    });
  } catch (error) {
    addFailure("deploy-ssh", readinessFailure(error, { missing: "Конфигурация или ключ SSH для deploy не найдены", timeout: "Проверка SSH-доступа к deploy не ответила вовремя", authentication: "SSH-ключ не авторизован для deploy", permission: "Нет доступа SSH к deploy", network: "Deploy недоступен по сети", unknown: "Безопасный SSH-доступ к deploy не настроен" }));
  }

  clearTimeout(timer);
  const ready = failures.length === 0 && !controller.signal.aborted;
  if (controller.signal.aborted) {
    addFailure("readiness", { code: "TIMEOUT", message: "Проверка публикации не завершилась за 45 секунд", retryable: true });
  }
  if (ready) warnings.push("Окружение настроено; реальная загрузка Git-пакета будет проверена только при Push.");
  return { ready: ready && failures.length === 0, configured: ready && failures.length === 0, uploadVerified: false, failures, warnings, checks, mode };
}

async function update(jobFile, job, patch) {
  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
  await persistJob(jobFile, job);
}

async function persistJob(jobFile, job) {
  const saved = await mutatePublishJob(jobFile, (current) => {
    if (!current.worker || current.worker.ownerId !== job.worker?.ownerId) {
      throw new Error("Publish worker no longer owns the job lease.");
    }
    return { ...job, worker: current.worker };
  });
  Object.assign(job, saved);
}

async function persistDeployProgress(jobFile, job, patch) {
  Object.assign(job, patch);
  await mutatePublishJob(jobFile, (current) => ({
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  }));
}

function deployedSha(output) {
  return /^ready\s+([a-f0-9]{40})\s*$/m.exec(output)?.[1];
}

function missingDeployOperation(error) {
  return error?.failedOperation === "deploy.status-v2" && error?.exitCode === 66;
}

async function readDeployedSha({ command, config, operation, tolerateFailure = false }) {
  try {
    const { stdout = "" } = await command(operation, "ssh", ["-o", "BatchMode=yes", "-o", "ConnectTimeout=15", "-i", config.keyPath, `${config.user}@${config.host}`, "status"], { maxBuffer: 10 * 1024 * 1024 });
    const sha = deployedSha(stdout);
    if (!sha) throw new UserFacingError("Production SHA не подтверждён", "Deploy status не вернул точный активный SHA. Продолжение остановлено; требуется ручная проверка.", { status: 409 });
    return sha;
  } catch (error) {
    if (tolerateFailure) return undefined;
    throw error;
  }
}

export async function deployPublishedRelease({ command, createArchive, upload, archive, sourceRoot, config, sha }) {
  const before = await readDeployedSha({ command, config, operation: "deploy.status.before" });
  if (before === sha) return { state: "already-deployed" };

  await createArchive({ archive, sourceRoot });
  await upload({ archive, config, sha });
  let publishFailure;
  try {
    await command("deploy.publish", "ssh", ["-o", "BatchMode=yes", "-o", "ConnectTimeout=15", "-i", config.keyPath, `${config.user}@${config.host}`, "publish", sha], { maxBuffer: 20 * 1024 * 1024 });
  } catch (error) {
    publishFailure = error;
  }
  const after = await readDeployedSha({ command, config, operation: "deploy.status.after", tolerateFailure: Boolean(publishFailure) });
  if (after === sha) return { state: publishFailure ? "deployed-after-transport-error" : "deployed" };
  if (publishFailure) throw publishFailure;
  throw new UserFacingError("Deploy не подтверждён", "Команда Deploy завершилась без ошибки, но production не сообщил exact SHA. Продолжение остановлено; требуется ручная проверка.", { status: 409 });
}

export async function cleanupPublishedRefs({ execImpl = exec, repoRoot, worktree, branch, contentCommit, contentInPublishedSha }) {
  if (worktree) await execImpl("git", ["worktree", "remove", "--force", worktree], { cwd: repoRoot }).catch(() => {});
  if (!contentInPublishedSha || !branch || !/^[a-f0-9]{40}$/.test(contentCommit ?? "")) return;
  const ref = `refs/heads/${branch}`;
  const remote = await execImpl("git", ["ls-remote", "--heads", "origin", ref], { cwd: repoRoot }).catch(() => ({ stdout: "" }));
  if (remoteHead(remote.stdout ?? "") === contentCommit) {
    await execImpl("git", ["push", "origin", "--delete", branch], { cwd: repoRoot }).catch(() => {});
  }
  const local = await execImpl("git", ["rev-parse", "--verify", branch], { cwd: repoRoot }).catch(() => ({ stdout: "" }));
  if ((local.stdout ?? "").trim() === contentCommit) {
    await execImpl("git", ["branch", "-D", branch], { cwd: repoRoot }).catch(() => {});
  }
}

export async function runPublishJob(jobFile) {
  const job = JSON.parse(await readFile(jobFile, "utf8"));
  const workerOwner = process.env.DES_ART_PUBLISH_WORKER_OWNER || job.worker?.ownerId || `direct-${process.pid}-${Date.now()}`;
  const claimed = await claimPublishWorker(jobFile, { ownerId: workerOwner, pid: process.pid });
  if (!claimed.claimed) return;
  Object.assign(job, claimed.job);
  const heartbeat = setInterval(() => {
    heartbeatPublishWorker(jobFile, { ownerId: workerOwner, pid: process.pid }).catch(() => {});
  }, PUBLISH_WORKER_HEARTBEAT_MS);
  heartbeat.unref();
  const stageRoot = path.join(path.dirname(jobFile), "staging", job.id);
  const diagnosticRoot = path.join(path.dirname(jobFile), "diagnostics", job.id);
  const command = createPublishCommandRunner({
    diagnosticRoot,
    jobId: job.id,
    execImpl: exec,
  });
  let worktree = job.worktree;
  let publishConfig;
  try {
    if (job.mode === "live") {
      const expectedSupportRoot = path.join(os.homedir(), "Library", "Application Support", "Des-art Admin");
      if (path.resolve(job.supportRoot) !== path.resolve(expectedSupportRoot)) {
        throw new Error("Live environment must use the production Application Support store.");
      }
      publishConfig = await liveConfig(job.supportRoot);
    }
    const resuming = job.mode === "live" && job.resumeRequested === true && Boolean(job.contentCommit && job.branch);
    await update(jobFile, job, {
      status: "running",
      errorTitle: undefined,
      error: undefined,
      failedOperation: undefined,
      failureCode: undefined,
      exitCode: undefined,
      retryable: undefined,
      diagnosticId: undefined,
      resumeRequested: undefined,
    });
    if (resuming) {
      const resumeHead = expectedResumeHead(job);
      if (!/^[a-f0-9]{40}$/.test(resumeHead ?? "")) {
        throw new UserFacingError("SHA продолжения не найден", "Не удалось определить точный commit для продолжения публикации. Требуется ручная проверка.", { status: 409 });
      }
      try {
        await access(worktree);
      } catch {
        worktree = path.join(job.supportRoot, "worktrees", job.id);
        await mkdir(path.dirname(worktree), { recursive: true });
        const worktreeArgs = job.contentInPublishedSha === true && resumeHead === job.publishedSha
          ? ["worktree", "add", "--detach", worktree, resumeHead]
          : ["worktree", "add", worktree, job.branch];
        await command("resume.worktree", "git", worktreeArgs, { cwd: job.repoRoot });
        job.worktree = worktree;
        await persistJob(jobFile, job);
      }
      await reconcileResumeWorktree({ command, worktree, job });
    }
    for (const [stageId, label] of pendingPublishStages(job.stages)) {
      await update(jobFile, job, { currentStage: stageId, message: label });
      if (stageId === "validate") {
        const compiled = [];
        for (const file of job.files) compiled.push(compileAdminDraft(parseAdminDraft(await readFile(file, "utf8"), path.basename(file))));
        const baselineRoot = job.mode === "live" ? path.join(job.repoRoot, "content", "projects") : job.snapshotRoot;
        candidateCollection(baselineRoot, compiled, job.scope);
      } else if (stageId === "prepare") {
        await mkdir(stageRoot, { recursive: true });
        for (const file of job.files) {
          const project = compileAdminDraft(parseAdminDraft(await readFile(file, "utf8"), path.basename(file)));
          await atomicJson(path.join(stageRoot, path.basename(file)), project);
        }
        if (job.mode === "live") {
          await command("prepare.fetch", "git", ["fetch", "origin", "main"], { cwd: job.repoRoot });
          const branch = createPublishBranch(job.createdAt);
          worktree = path.join(job.supportRoot, "worktrees", job.id);
          await mkdir(path.dirname(worktree), { recursive: true });
          await command("prepare.worktree", "git", ["worktree", "add", "--detach", worktree, "origin/main"], { cwd: job.repoRoot });
          await command("prepare.branch", "git", ["switch", "-c", branch], { cwd: worktree });
          for (const file of job.files) {
            const destination = path.join(worktree, "content", "projects", path.basename(file));
            let compiled = JSON.parse(await readFile(path.join(stageRoot, path.basename(file)), "utf8"));
            if (job.scope === "project") {
              try {
                const baseline = JSON.parse(await readFile(destination, "utf8"));
                compiled = { ...compiled, catalogOrder: baseline.catalogOrder, homePlacement: baseline.homePlacement };
              } catch {}
            }
            await atomicJson(destination, compiled);
            const slug = path.basename(file, ".json");
            const assets = path.join(job.draftAssetRoot, slug);
            try { await access(assets); await cp(assets, path.join(worktree, "public", "assets", "projects", slug), { recursive: true, force: true }); } catch {}
          }
          job.branch = branch;
          job.worktree = worktree;
          await persistJob(jobFile, job);
        }
      } else if (stageId === "checks") {
        const cwd = job.mode === "live" ? worktree : job.repoRoot;
        if (job.mode === "live") await command("checks.install", "npm", ["ci", "--no-audit", "--no-fund"], { cwd, maxBuffer: 20 * 1024 * 1024 });
        await command("checks.tests", process.execPath, ["--experimental-strip-types", "--test", "tests/project-storage.test.mjs", "tests/project-content-contract.test.mjs"], { cwd, maxBuffer: 20 * 1024 * 1024 });
        if (job.mode === "live") {
          await command("checks.lint", "npm", ["run", "lint"], { cwd, maxBuffer: 20 * 1024 * 1024 });
          await command("checks.build", "npm", ["run", "build"], { cwd, maxBuffer: 40 * 1024 * 1024 });
        }
      } else if (stageId === "commit" && job.mode === "live") {
        await command("commit.stage", "git", ["add", "--", "content/projects", "public/assets/projects"], { cwd: worktree });
        try {
          await exec("git", ["diff", "--cached", "--quiet"], { cwd: worktree });
          throw new Error("После подготовки нет изменений для публикации.");
        } catch (error) {
          if (error instanceof Error && error.message.includes("нет изменений")) throw error;
          if (error?.code !== 1) await recordPublishCommandFailure({ diagnosticRoot, jobId: job.id, failedOperation: "commit.diff", command: "git", args: ["diff", "--cached", "--quiet"], error });
        }
        await command("commit.create", "git", ["commit", "-m", job.scope === "project" ? `Publish project ${job.slug}` : "Publish project content updates"], { cwd: worktree });
        const { stdout: contentCommit } = await command("commit.resolve", "git", ["rev-parse", "HEAD"], { cwd: worktree });
        job.contentCommit = contentCommit.trim();
      } else if (stageId === "push" && job.mode === "live") {
        const pushed = await pushPublishCommit({ command, cwd: worktree, branch: job.branch, contentCommit: job.contentCommit });
        job.attempt = pushed.attempt;
      } else if (stageId === "pr" && job.mode === "live") {
        job.pullRequestUrl = await ensurePullRequest({ command, cwd: worktree, branch: job.branch, title: job.scope === "project" ? `Publish project: ${job.slug}` : "Publish project content updates" });
      } else if (stageId === "merge" && job.mode === "live") {
        const merged = await mergePublishPullRequest({ command, cwd: worktree, pullRequestUrl: job.pullRequestUrl, branch: job.branch, contentCommit: job.contentCommit });
        job.mergeCommitSha = merged.mergeCommitSha;
        job.publishedSha = merged.publishedSha;
        job.contentInPublishedSha = true;
        await persistJob(jobFile, job);
        for (const [check, field] of pendingMergeChecks(job, job.publishedSha)) {
          if (check === "checkout") await command("merge.checkout", "git", ["switch", "--detach", job.publishedSha], { cwd: worktree });
          if (check === "install") await command("merge.install", "npm", ["ci", "--no-audit", "--no-fund"], { cwd: worktree, maxBuffer: 20 * 1024 * 1024 });
          if (check === "lint") await command("merge.lint", "npm", ["run", "lint"], { cwd: worktree, maxBuffer: 20 * 1024 * 1024 });
          if (check === "build") await command("merge.build", "npm", ["run", "build"], {
            cwd: worktree,
            env: { ...process.env, NEXT_PUBLIC_BUILD_SHA: job.publishedSha },
            maxBuffer: 40 * 1024 * 1024,
          });
          job[field] = job.publishedSha;
          await persistJob(jobFile, job);
        }
        job.productionState = "main-updated";
      } else if (stageId === "deploy" && job.mode === "live") {
        const currentProductionSha = await readDeployedSha({ command, config: publishConfig, operation: "deploy.status.before" });
        const targetSha = await resolveFreshDeployTarget({
          command,
          cwd: worktree,
          contentCommit: job.contentCommit,
          savedMergeSha: job.mergeCommitSha,
          productionSha: currentProductionSha,
        });
        if (targetSha !== job.publishedSha || job.mergeBuildSha !== targetSha) {
          await command("deploy.checkout", "git", ["switch", "--detach", targetSha], { cwd: worktree });
          await command("deploy.install", "npm", ["ci", "--no-audit", "--no-fund"], { cwd: worktree, maxBuffer: 20 * 1024 * 1024 });
          await command("deploy.lint", "npm", ["run", "lint"], { cwd: worktree, maxBuffer: 20 * 1024 * 1024 });
          await command("deploy.build", "npm", ["run", "build"], {
            cwd: worktree,
            env: { ...process.env, NEXT_PUBLIC_BUILD_SHA: targetSha },
            maxBuffer: 40 * 1024 * 1024,
          });
        }
        job.deployTargetSha = targetSha;
        job.publishedSha = targetSha;
        job.deployPhase = "packaging";
        job.deployStartedAt = job.deployStartedAt ?? new Date().toISOString();
        await persistJob(jobFile, job);
        const archive = path.join(job.supportRoot, "jobs", `${targetSha}.runtime.tar.gz`);
        let progressWrite = Promise.resolve();
        const queueProgress = (patch) => {
          progressWrite = progressWrite.then(() => persistDeployProgress(jobFile, job, patch)).catch(() => {});
        };
        try {
          if (currentProductionSha === targetSha) {
            job.deployPhase = "complete";
            job.productionState = "deployed";
          } else if (job.serverOperationId) {
            let existing;
            try {
              existing = await readDeployOperation({ command, config: publishConfig, operationId: job.serverOperationId });
            } catch (error) {
              if (!resuming || !missingDeployOperation(error) || !job.artifactSha256) throw error;
              const restarted = await startDeployOperation({ command, config: publishConfig, sha: targetSha, artifactSha256: job.artifactSha256 });
              if (restarted.operationId !== job.serverOperationId) throw new Error("Deploy v2 resumed a different operation identity.");
              existing = restarted;
            }
            if (existing.targetSha !== targetSha) throw new Error("Saved server operation targets a different SHA.");
            const complete = await waitForDeployOperation({
              command,
              config: publishConfig,
              operation: existing,
              onStatus: (status) => {
                job.deployPhase = status.phase;
                job.serverOperationState = status.state;
                queueProgress({ deployPhase: status.phase, serverOperationState: status.state });
              },
            });
            job.deployPhase = complete.phase;
            job.productionState = "deployed";
          } else {
          const artifact = await createRuntimeReleaseArchive({ archive, sourceRoot: worktree, sha: targetSha });
          Object.assign(job, { deployPhase: "upload", bytesTransferred: 0, bytesTotal: artifact.bytes, artifactSha256: artifact.artifactSha256, artifactPath: archive });
          await persistJob(jobFile, job);
          let lastProgressPersist = 0;
          await uploadRuntimeRelease({
            archive,
            config: publishConfig,
            sha: targetSha,
            artifactSha256: artifact.artifactSha256,
            bytes: artifact.bytes,
            onProgress: ({ bytesTransferred, bytesTotal }) => {
              Object.assign(job, { bytesTransferred, bytesTotal });
              if (Date.now() - lastProgressPersist >= 1_000) {
                lastProgressPersist = Date.now();
                queueProgress({ bytesTransferred, bytesTotal });
              }
            },
          });
          await progressWrite;
          job.bytesTransferred = artifact.bytes;
          job.deployPhase = "vps-check";
          job.serverOperationId = deployOperationId(targetSha, artifact.artifactSha256);
          await persistJob(jobFile, job);
          const operation = await startDeployOperation({ command, config: publishConfig, sha: targetSha, artifactSha256: artifact.artifactSha256 });
          if (operation.operationId !== job.serverOperationId) throw new Error("Deploy v2 returned an unexpected operation identity.");
          await persistJob(jobFile, job);
          const complete = await waitForDeployOperation({
            command,
            config: publishConfig,
            operation,
            onStatus: (status) => {
              job.deployPhase = status.phase;
              job.serverOperationState = status.state;
              queueProgress({ deployPhase: status.phase, serverOperationState: status.state });
            },
          });
            await progressWrite;
            job.deployPhase = complete.phase;
            job.productionState = "deployed";
          }
        } finally {
          if (job.productionState === "deployed") await rm(archive, { force: true });
        }
      } else if (stageId === "verify" && job.mode === "live") {
        const project = job.slug
          ? JSON.parse(await readFile(path.join(worktree, "content", "projects", `${job.slug}.json`), "utf8"))
          : undefined;
        await verifyPublicRelease({ baseUrl: "https://art-des.ru", sha: job.deployTargetSha ?? job.publishedSha, project });
        job.productionState = "verified";
      }
      job.stages = job.stages.map((stage) => stage.id === stageId ? { ...stage, status: "complete" } : stage);
      await persistJob(jobFile, job);
    }
    await update(jobFile, job, { currentStage: "finalize", message: "Сохранение опубликованного состояния" });
    await finalizePublishedJob({ job, worktree });
    await update(jobFile, job, {
      status: "complete",
      currentStage: undefined,
      productionState: job.mode === "live" ? "verified" : job.productionState,
      message: job.mode === "live" ? "Изменения опубликованы на art-des.ru" : "Локальная репетиция завершена",
    });
  } catch (error) {
    const explanation = humanError(error);
    const stageLabel = PUBLISH_STAGES.find(([stageId]) => stageId === job.currentStage)?.[1];
    const commandFailure = error && typeof error === "object" && "failedOperation" in error ? error : null;
    await update(jobFile, job, {
      status: "failed",
      errorTitle: stageLabel ? `Не удалось завершить этап «${stageLabel}»` : explanation.title,
      error: explanation.message,
      productionState: job.productionState === "main-updated"
        ? "main-updated-deploy-failed"
        : job.productionState === "deployed"
          ? "deployed-verification-failed"
          : ["verified", "verified-finalization-failed"].includes(job.productionState) ? "verified-finalization-failed" : "unchanged",
      ...(commandFailure ? {
        failedOperation: commandFailure.failedOperation,
        failureCode: commandFailure.failureCode,
        exitCode: commandFailure.exitCode,
        retryable: commandFailure.retryable,
        attempt: commandFailure.attempt,
        diagnosticId: commandFailure.diagnosticId,
      } : {}),
    });
  } finally {
    clearInterval(heartbeat);
    await releasePublishWorker(jobFile, { ownerId: workerOwner }).catch(() => {});
    if (worktree && job.status === "complete") {
      await cleanupPublishedRefs({ repoRoot: job.repoRoot, worktree, branch: job.branch, contentCommit: job.contentCommit, contentInPublishedSha: job.contentInPublishedSha });
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url)) && process.argv[2]) {
  await runPublishJob(path.resolve(process.argv[2]));
}
