import { execFile } from "node:child_process";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { compileAdminDraft, parseAdminDraft } from "./draft-contract.mjs";
import { humanError } from "./human-errors.mjs";
import { readAllProjectDocuments } from "../../src/lib/projects.ts";
import { validateProjectCollection } from "../../src/lib/project-visual-registry.ts";

const exec = promisify(execFile);
export const PUBLISH_STAGES = [["validate", "Проверка"], ["prepare", "Подготовка файлов"], ["checks", "Локальные проверки"]];

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
    const replacement = scope === "project" && current ? { ...project, catalogOrder: current.catalogOrder, homePlacement: current.homePlacement } : project;
    return [replacement.slug, replacement];
  }));
  validateProjectCollection(baseline.filter((project) => !replacements.has(project.slug)).concat([...replacements.values()]));
  return replacements;
}

export async function publishReadiness({ mode = "sandbox" } = {}) {
  if (mode !== "sandbox") return { ready: false, failures: ["Admin поддерживает только локальную sandbox-проверку"], mode };
  return { ready: true, failures: [], mode: "sandbox" };
}

async function update(jobFile, job, patch) {
  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
  await atomicJson(jobFile, job);
}

export async function runPublishJob(jobFile) {
  const job = JSON.parse(await readFile(jobFile, "utf8"));
  if (job.mode !== "sandbox") throw new Error("Admin supports only sandbox publish jobs.");
  const stageRoot = path.join(path.dirname(jobFile), "staging");
  try {
    await update(jobFile, job, { status: "running" });
    for (const [stageId, label] of PUBLISH_STAGES) {
      await update(jobFile, job, { currentStage: stageId, message: label });
      if (stageId === "validate") {
        const compiled = [];
        for (const file of job.files) compiled.push(compileAdminDraft(parseAdminDraft(await readFile(file, "utf8"), path.basename(file))));
        candidateCollection(job.snapshotRoot, compiled, job.scope);
      } else if (stageId === "prepare") {
        await mkdir(stageRoot, { recursive: true });
        for (const file of job.files) {
          const project = compileAdminDraft(parseAdminDraft(await readFile(file, "utf8"), path.basename(file)));
          await atomicJson(path.join(stageRoot, path.basename(file)), project);
        }
      } else if (stageId === "checks") {
        await exec(process.execPath, ["--experimental-strip-types", "--test", "tests/project-storage.test.mjs", "tests/project-content-contract.test.mjs"], { cwd: job.repoRoot, maxBuffer: 20 * 1024 * 1024 });
      }
      job.stages = job.stages.map((stage) => stage.id === stageId ? { ...stage, status: "complete" } : stage);
      await atomicJson(jobFile, job);
    }
    await mkdir(job.snapshotRoot, { recursive: true });
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
    await update(jobFile, job, { status: "complete", currentStage: undefined, message: "Локальная репетиция завершена", productionState: "unchanged" });
  } catch (error) {
    const explanation = humanError(error);
    const stageLabel = PUBLISH_STAGES.find(([stageId]) => stageId === job.currentStage)?.[1];
    await update(jobFile, job, { status: "failed", errorTitle: stageLabel ? `Не удалось завершить этап «${stageLabel}»` : explanation.title, error: explanation.message, productionState: "unchanged" });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url)) && process.argv[2]) {
  await runPublishJob(path.resolve(process.argv[2]));
}
