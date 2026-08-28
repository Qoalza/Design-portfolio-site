import { execFile } from "node:child_process";
import { access, cp, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { parseProjectDocument } from "../../src/lib/project-contract.ts";

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

async function atomicJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, file);
}

export async function publishReadiness({ supportRoot }) {
  const failures = [];
  try { await exec("gh", ["auth", "status"]); } catch { failures.push("GitHub CLI не авторизован"); }
  try { await access(path.join(supportRoot, "ssh", "art-des-deploy")); } catch { failures.push("Фоновый SSH-ключ VPS не настроен"); }
  return { ready: failures.length === 0, failures };
}

async function update(jobFile, job, patch) {
  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
  await atomicJson(jobFile, job);
}

export async function runPublishJob(jobFile) {
  const job = JSON.parse(await readFile(jobFile, "utf8"));
  const stageRoot = path.join(path.dirname(jobFile), "staging");
  try {
    await update(jobFile, job, { status: "running" });
    for (const [stageId, label] of PUBLISH_STAGES) {
      await update(jobFile, job, { currentStage: stageId, message: label });
      if (stageId === "validate") {
        for (const file of job.files) parseProjectDocument(await readFile(file, "utf8"), path.basename(file));
      } else if (stageId === "prepare") {
        await mkdir(stageRoot, { recursive: true });
        for (const file of job.files) await cp(file, path.join(stageRoot, path.basename(file)));
      } else if (stageId === "checks") {
        await exec(process.execPath, ["--experimental-strip-types", "--test", "tests/project-storage.test.mjs", "tests/local-admin-core.test.mjs"], { cwd: job.repoRoot, maxBuffer: 10 * 1024 * 1024 });
      } else if (!job.dryRun) {
        throw new Error("Live publish закрыт до отдельного первого запуска пользователя.");
      }
      job.stages = job.stages.map((stage) => stage.id === stageId ? { ...stage, status: "complete" } : stage);
      await atomicJson(jobFile, job);
    }
    await update(jobFile, job, { status: "complete", currentStage: undefined, message: "Локальная репетиция завершена" });
  } catch (error) {
    await update(jobFile, job, { status: "failed", error: error instanceof Error ? error.message : String(error) });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url)) && process.argv[2]) {
  await runPublishJob(path.resolve(process.argv[2]));
}
