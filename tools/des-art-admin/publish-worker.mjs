import { execFile, spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { access, cp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { compileAdminDraft, parseAdminDraft } from "./draft-contract.mjs";
import { humanError } from "./human-errors.mjs";
import { PRODUCTION_DATA_BASELINE_VERSION } from "./production-data-bootstrap.mjs";

const exec = promisify(execFile);
export const PUBLISH_STAGES = [
  ["validate", "Проверка"],
  ["prepare", "Подготовка файлов"],
  ["checks", "Lint, build и tests"],
  ["git", "Git и Pull Request"],
  ["merge", "Merge"],
  ["deploy", "Deploy"],
  ["verify", "Публичная проверка"],
];

export function createPublishBranch(isoDate = new Date().toISOString()) {
  const compact = isoDate.replace(/\D/g, "").slice(0, 14);
  return `codex/content-publish-${compact.slice(0, 8)}-${compact.slice(8)}`;
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
      if (baseline.version !== PRODUCTION_DATA_BASELINE_VERSION || baseline.source !== "canonical-main") throw new Error("invalid baseline");
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
  let worktree;
  try {
    if (job.mode === "live") {
      const expectedSupportRoot = path.join(os.homedir(), "Library", "Application Support", "Des-art Admin");
      if (path.resolve(job.supportRoot) !== path.resolve(expectedSupportRoot)) {
        throw new Error("Live environment must use the production Application Support store.");
      }
      const config = await liveConfig(job.supportRoot);
      job.liveConfig = config;
    }
    await update(jobFile, job, { status: "running" });
    for (const [stageId, label] of PUBLISH_STAGES) {
      await update(jobFile, job, { currentStage: stageId, message: label });
      if (stageId === "validate") {
        for (const file of job.files) compileAdminDraft(parseAdminDraft(await readFile(file, "utf8"), path.basename(file)));
      } else if (stageId === "prepare") {
        await mkdir(stageRoot, { recursive: true });
        for (const file of job.files) {
          const project = compileAdminDraft(parseAdminDraft(await readFile(file, "utf8"), path.basename(file)));
          await atomicJson(path.join(stageRoot, path.basename(file)), project);
        }
        if (job.mode === "live") {
          await exec("git", ["fetch", "origin", "main"], { cwd: job.repoRoot });
          const branch = createPublishBranch(job.createdAt);
          worktree = path.join(job.supportRoot, "worktrees", job.id);
          await mkdir(path.dirname(worktree), { recursive: true });
          await exec("git", ["worktree", "add", "--detach", worktree, "origin/main"], { cwd: job.repoRoot });
          await exec("git", ["switch", "-c", branch], { cwd: worktree });
          for (const file of job.files) {
            const destination = path.join(worktree, "content", "projects", path.basename(file));
            let compiled = JSON.parse(await readFile(path.join(stageRoot, path.basename(file)), "utf8"));
            if (job.scope === "project") {
              try {
                const baseline = JSON.parse(await readFile(destination, "utf8"));
                compiled = { ...compiled, catalogOrder: baseline.catalogOrder, featuredOnHome: baseline.featuredOnHome, homeOrder: baseline.homeOrder };
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
        if (job.mode === "live") await exec("npm", ["ci", "--no-audit", "--no-fund"], { cwd, maxBuffer: 20 * 1024 * 1024 });
        await exec(process.execPath, ["--experimental-strip-types", "--test", "tests/project-storage.test.mjs", "tests/project-content-contract.test.mjs"], { cwd, maxBuffer: 20 * 1024 * 1024 });
        if (job.mode === "live") {
          await exec("npm", ["run", "lint"], { cwd, maxBuffer: 20 * 1024 * 1024 });
          await exec("npm", ["run", "build"], { cwd, maxBuffer: 40 * 1024 * 1024 });
        }
      } else if (stageId === "git" && job.mode === "live") {
        await exec("git", ["add", "--", "content/projects", "public/assets/projects"], { cwd: worktree });
        try { await exec("git", ["diff", "--cached", "--quiet"], { cwd: worktree }); throw new Error("После подготовки нет изменений для публикации."); } catch (error) {
          if (error instanceof Error && error.message.includes("нет изменений")) throw error;
        }
        await exec("git", ["commit", "-m", job.scope === "project" ? `Publish project ${job.slug}` : "Publish project content updates"], { cwd: worktree });
        const { stdout: contentCommit } = await exec("git", ["rev-parse", "HEAD"], { cwd: worktree });
        job.contentCommit = contentCommit.trim();
        await exec("git", ["push", "-u", "origin", job.branch], { cwd: worktree, maxBuffer: 10 * 1024 * 1024 });
        const { stdout } = await exec("gh", ["pr", "create", "--base", "main", "--head", job.branch, "--title", job.scope === "project" ? `Publish project: ${job.slug}` : "Publish project content updates", "--body", "Публикация подготовлена локальной Des-art Admin после успешных проверок."], { cwd: worktree });
        job.pullRequestUrl = stdout.trim();
      } else if (stageId === "merge" && job.mode === "live") {
        await exec("gh", ["pr", "merge", job.pullRequestUrl, "--merge", "--delete-branch"], { cwd: worktree, maxBuffer: 10 * 1024 * 1024 });
        await exec("git", ["fetch", "origin", "main"], { cwd: worktree });
        const { stdout } = await exec("git", ["rev-parse", "origin/main"], { cwd: worktree });
        job.publishedSha = stdout.trim();
        await exec("git", ["merge-base", "--is-ancestor", job.contentCommit, job.publishedSha], { cwd: worktree });
        await exec("git", ["switch", "--detach", "origin/main"], { cwd: worktree });
        await exec("npm", ["ci", "--no-audit", "--no-fund"], { cwd: worktree, maxBuffer: 20 * 1024 * 1024 });
        await exec("npm", ["run", "lint"], { cwd: worktree, maxBuffer: 20 * 1024 * 1024 });
        await exec("npm", ["run", "build"], { cwd: worktree, maxBuffer: 40 * 1024 * 1024 });
        job.productionState = "main-updated";
      } else if (stageId === "deploy" && job.mode === "live") {
        const config = job.liveConfig;
        const archive = path.join(job.supportRoot, "jobs", `${job.publishedSha}.tar.gz`);
        await exec("tar", ["--exclude=.git", "--exclude=node_modules", "--exclude=.next", "--exclude=.next-admin-preview-*", "-czf", archive, "-C", worktree, "."], { maxBuffer: 10 * 1024 * 1024 });
        await uploadRelease({ archive, config, sha: job.publishedSha });
        await rm(archive, { force: true });
        await exec("ssh", ["-o", "BatchMode=yes", "-o", "ConnectTimeout=15", "-i", config.keyPath, `${config.user}@${config.host}`, "publish", job.publishedSha], { maxBuffer: 20 * 1024 * 1024 });
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
              featuredOnHome: baseline.featuredOnHome,
              homeOrder: baseline.homeOrder,
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
    await update(jobFile, job, {
      status: "failed",
      errorTitle: stageLabel ? `Не удалось завершить этап «${stageLabel}»` : explanation.title,
      error: explanation.message,
      productionState: job.productionState === "main-updated" ? "main-updated-deploy-failed" : "unchanged",
    });
  } finally {
    if (worktree) await exec("git", ["worktree", "remove", "--force", worktree], { cwd: job.repoRoot }).catch(() => {});
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url)) && process.argv[2]) {
  await runPublishJob(path.resolve(process.argv[2]));
}
