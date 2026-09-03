import { execFile, spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { access, cp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { compileAdminDraft, parseAdminDraft } from "./draft-contract.mjs";
import { humanError, UserFacingError } from "./human-errors.mjs";
import { createPublishCommandRunner, recordPublishCommandFailure } from "./publish-diagnostics.mjs";
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

export function createPublishBranch(isoDate = new Date().toISOString()) {
  const compact = isoDate.replace(/\D/g, "").slice(0, 14);
  return `codex/content-publish-${compact.slice(0, 8)}-${compact.slice(8)}`;
}

function remoteHead(output) {
  const match = /^([a-f0-9]{40})\s+refs\/heads\//m.exec(output);
  return match?.[1];
}

export async function pushPublishCommit({ command, cwd, branch, contentCommit }) {
  const ref = `refs/heads/${branch}`;
  const { stdout = "" } = await command("push.lookup", "git", ["ls-remote", "--heads", "origin", ref], { cwd });
  const remoteSha = remoteHead(stdout);
  if (remoteSha === contentCommit) return { state: "already-pushed", attempt: 0 };
  if (remoteSha) throw new UserFacingError("Удалённая ветка изменилась", "В GitHub находится другая версия этой ветки. Автоматическое продолжение остановлено; требуется ручная проверка.", { status: 409 });
  const normalArgs = ["push", "-u", "origin", `${contentCommit}:${ref}`];
  try {
    await command("push", "git", normalArgs, { cwd, maxBuffer: 10 * 1024 * 1024 }, 1);
    return { state: "pushed", attempt: 1 };
  } catch (error) {
    if (!error?.retryable || error.attempt !== 1) throw error;
    const retryArgs = error.failureCode === "HTTP2_RPC_RESET" ? ["-c", "http.version=HTTP/1.1", ...normalArgs] : normalArgs;
    await command("push", "git", retryArgs, { cwd, maxBuffer: 10 * 1024 * 1024 }, 2);
    return { state: "pushed", attempt: 2 };
  }
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

export async function publishReadiness({ supportRoot, mode = "sandbox" }) {
  const failures = [];
  if (mode === "live") {
    try {
      const baseline = JSON.parse(await readFile(path.join(supportRoot, "production-data-baseline.json"), "utf8"));
      if (baseline.version !== PRODUCTION_DATA_BASELINE_VERSION || baseline.source !== "production-live") throw new Error("invalid baseline");
    } catch {
      failures.push("Рабочие данные ещё не синхронизированы с актуальным production-контентом");
    }
    if (failures.length) return { ready: false, failures, mode };
    try { await exec("gh", ["auth", "status"]); } catch { failures.push("GitHub CLI не авторизован"); }
    try {
      const config = await liveConfig(supportRoot);
      await access(config.keyPath);
      await exec("ssh", ["-o", "BatchMode=yes", "-o", "ConnectTimeout=10", "-i", config.keyPath, `${config.user}@${config.host}`, "status"]);
    } catch { failures.push("Безопасный SSH-доступ к deploy не настроен"); }
  }
  return { ready: failures.length === 0, failures, mode };
}

async function update(jobFile, job, patch) {
  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
  await atomicJson(jobFile, job);
}

async function uploadRelease({ archive, config, sha }) {
  await new Promise((resolve, reject) => {
    const child = spawn("ssh", ["-o", "BatchMode=yes", "-o", "ConnectTimeout=15", "-i", config.keyPath, `${config.user}@${config.host}`, "upload", sha], {
      stdio: ["pipe", "ignore", "pipe"],
    });
    let error = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => { error += chunk; });
    createReadStream(archive).on("error", reject).pipe(child.stdin);
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(error.trim() || `Release upload failed with exit code ${code}.`)));
  });
}

export async function runPublishJob(jobFile) {
  const job = JSON.parse(await readFile(jobFile, "utf8"));
  const stageRoot = path.join(path.dirname(jobFile), "staging");
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
      try {
        await access(worktree);
      } catch {
        worktree = path.join(job.supportRoot, "worktrees", job.id);
        await mkdir(path.dirname(worktree), { recursive: true });
        await command("resume.worktree", "git", ["worktree", "add", worktree, job.branch], { cwd: job.repoRoot });
        job.worktree = worktree;
        await atomicJson(jobFile, job);
      }
      const { stdout: resumedHead } = await command("resume.resolve", "git", ["rev-parse", "HEAD"], { cwd: worktree });
      if (resumedHead.trim() !== job.contentCommit) throw new UserFacingError("Локальная ветка изменилась", "Сохранённый commit больше не совпадает с publish-веткой. Автоматическое продолжение остановлено; требуется ручная проверка.", { status: 409 });
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
          await atomicJson(jobFile, job);
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
        await command("merge", "gh", ["pr", "merge", job.pullRequestUrl, "--merge", "--delete-branch"], { cwd: worktree, maxBuffer: 10 * 1024 * 1024 });
        await command("merge.fetch", "git", ["fetch", "origin", "main"], { cwd: worktree });
        const { stdout } = await command("merge.resolve", "git", ["rev-parse", "origin/main"], { cwd: worktree });
        job.publishedSha = stdout.trim();
        await command("merge.ancestry", "git", ["merge-base", "--is-ancestor", job.contentCommit, job.publishedSha], { cwd: worktree });
        job.contentInPublishedSha = true;
        await command("merge.checkout", "git", ["switch", "--detach", "origin/main"], { cwd: worktree });
        await command("merge.install", "npm", ["ci", "--no-audit", "--no-fund"], { cwd: worktree, maxBuffer: 20 * 1024 * 1024 });
        await command("merge.lint", "npm", ["run", "lint"], { cwd: worktree, maxBuffer: 20 * 1024 * 1024 });
        await command("merge.build", "npm", ["run", "build"], { cwd: worktree, maxBuffer: 40 * 1024 * 1024 });
        job.productionState = "main-updated";
      } else if (stageId === "deploy" && job.mode === "live") {
        const archive = path.join(job.supportRoot, "jobs", `${job.publishedSha}.tar.gz`);
        try {
          await createReleaseArchive({ archive, sourceRoot: worktree });
        } catch (error) {
          await recordPublishCommandFailure({ diagnosticRoot, jobId: job.id, failedOperation: "deploy.archive", command: "tar", error });
        }
        try {
          await uploadRelease({ archive, config: publishConfig, sha: job.publishedSha });
        } catch (error) {
          await recordPublishCommandFailure({ diagnosticRoot, jobId: job.id, failedOperation: "deploy.upload", command: "ssh", args: ["upload", job.publishedSha], error });
        }
        await rm(archive, { force: true });
        await command("deploy.publish", "ssh", ["-o", "BatchMode=yes", "-o", "ConnectTimeout=15", "-i", publishConfig.keyPath, `${publishConfig.user}@${publishConfig.host}`, "publish", job.publishedSha], { maxBuffer: 20 * 1024 * 1024 });
      } else if (stageId === "verify" && job.mode === "live") {
        for (const route of ["/", "/projects", ...(job.slug ? [`/projects/${job.slug}`] : [])]) {
          const response = await fetch(`https://art-des.ru${route}`, { redirect: "error" });
          if (!response.ok) throw new Error(`Production route ${route} returned ${response.status}.`);
          if (route === "/" && !(await response.text()).includes(job.publishedSha)) throw new Error("Production build SHA does not match merged main SHA.");
        }
      }
      job.stages = job.stages.map((stage) => stage.id === stageId ? { ...stage, status: "complete" } : stage);
      await atomicJson(jobFile, job);
    }
    if (job.snapshotRoot) {
      await mkdir(job.snapshotRoot, { recursive: true });
      for (const file of job.files) {
        const draft = publishedDraft(parseAdminDraft(await readFile(file, "utf8"), path.basename(file)));
        await atomicJson(file, draft);
        const snapshotFile = path.join(job.snapshotRoot, path.basename(file));
        let compiled = compileAdminDraft(draft);
        if (job.scope === "project") {
          try {
            const baseline = JSON.parse(await readFile(snapshotFile, "utf8"));
            compiled = {
              ...compiled,
              catalogOrder: baseline.catalogOrder,
              homePlacement: baseline.homePlacement,
            };
          } catch {}
        }
        await atomicJson(snapshotFile, compiled);
      }
    }
    await update(jobFile, job, { status: "complete", currentStage: undefined, message: job.mode === "live" ? "Изменения опубликованы на art-des.ru" : "Локальная репетиция завершена" });
  } catch (error) {
    const explanation = humanError(error);
    const stageLabel = PUBLISH_STAGES.find(([stageId]) => stageId === job.currentStage)?.[1];
    const commandFailure = error && typeof error === "object" && "failedOperation" in error ? error : null;
    await update(jobFile, job, {
      status: "failed",
      errorTitle: stageLabel ? `Не удалось завершить этап «${stageLabel}»` : explanation.title,
      error: explanation.message,
      productionState: job.productionState === "main-updated" ? "main-updated-deploy-failed" : "unchanged",
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
    if (worktree && job.status === "complete") {
      await exec("git", ["worktree", "remove", "--force", worktree], { cwd: job.repoRoot }).catch(() => {});
      if (job.contentInPublishedSha && job.branch) await exec("git", ["branch", "-D", job.branch], { cwd: job.repoRoot }).catch(() => {});
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url)) && process.argv[2]) {
  await runPublishJob(path.resolve(process.argv[2]));
}
