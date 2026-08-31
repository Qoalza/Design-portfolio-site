import { access, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export const PRODUCTION_DATA_BASELINE_VERSION = 2;

const activeWorkspaceNames = ["drafts", "preview-drafts", "draft-assets", "published-snapshots", "jobs"];

async function hasCanonicalProjects(managedRepo) {
  const contentRoot = path.join(managedRepo, "content", "projects");
  const entries = await readdir(contentRoot, { withFileTypes: true }).catch(() => []);
  return entries.some((entry) => entry.isFile() && entry.name.endsWith(".json"));
}

async function atomicJson(file, value) {
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, file);
}

export async function ensureProductionDataBaseline({
  supportRoot,
  managedRepo,
  stopService,
  resolveSourceSha,
  now = () => new Date(),
}) {
  const marker = path.join(supportRoot, "production-data-baseline.json");
  const current = await readFile(marker, "utf8").then(JSON.parse).catch(() => undefined);
  if (current?.version === PRODUCTION_DATA_BASELINE_VERSION && current.source === "canonical-main") {
    return { migrated: false, archived: false };
  }
  if (!(await hasCanonicalProjects(managedRepo))) {
    throw new Error("Канонические проекты portfolio не найдены. Миграция тестовых данных остановлена.");
  }
  const sourceSha = await resolveSourceSha();
  if (!/^[0-9a-f]{40}$/i.test(sourceSha)) {
    throw new Error("Не удалось подтвердить точный SHA канонического portfolio.");
  }

  await stopService("admin");
  await stopService("preview");
  const timestamp = now().toISOString();
  const archiveRoot = path.join(supportRoot, "sandbox-archive", `before-production-${timestamp.replace(/[:.]/g, "-")}`);
  let archived = false;
  for (const name of activeWorkspaceNames) {
    const source = path.join(supportRoot, name);
    try {
      await access(source);
      await mkdir(archiveRoot, { recursive: true });
      await rename(source, path.join(archiveRoot, name));
      archived = true;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  await atomicJson(marker, {
    version: PRODUCTION_DATA_BASELINE_VERSION,
    source: "canonical-main",
    sourceSha,
    archivedSandbox: archived,
    createdAt: timestamp,
  });
  return { migrated: true, archived };
}
