import { access, cp, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const PRODUCTION_DATA_BASELINE_VERSION = 5;

const activeWorkspaceNames = ["drafts", "preview-drafts", "draft-assets", "published-snapshots", "jobs", "sandbox-origin-v1.json"];
const TRANSITION_JOURNAL = "live-transition-journal-v1.json";

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

export function extractPublishedBuildSha(html) {
  const root = String(html).match(/<html\b[^>]*\bdata-build-sha=(?:"([0-9a-f]{40})"|'([0-9a-f]{40})')/i);
  return root?.[1]?.toLowerCase() ?? root?.[2]?.toLowerCase();
}

async function availableArchiveRoot(supportRoot, timestamp) {
  const archiveParent = path.join(supportRoot, "sandbox-archive");
  const baseName = `before-production-${timestamp.replace(/[:.]/g, "-")}`;
  await mkdir(archiveParent, { recursive: true });
  for (let attempt = 1; ; attempt += 1) {
    const suffix = attempt === 1 ? "" : `-${attempt}`;
    const archiveRoot = path.join(archiveParent, `${baseName}${suffix}`);
    try {
      await access(archiveRoot);
    } catch (error) {
      if (error?.code === "ENOENT") {
        return {
          archiveRoot,
          archivePath: path.relative(supportRoot, archiveRoot),
          stagingRoot: path.join(archiveParent, `.${baseName}${suffix}.${process.pid}.staging`),
        };
      }
      throw error;
    }
  }
}

async function archiveSandboxTransaction({ supportRoot, timestamp, move }) {
  const target = await availableArchiveRoot(supportRoot, timestamp);
  const moved = [];
  let stagingCreated = false;
  try {
    for (const name of activeWorkspaceNames) {
      const source = path.join(supportRoot, name);
      try {
        await access(source);
      } catch (error) {
        if (error?.code === "ENOENT") continue;
        throw error;
      }
      if (!stagingCreated) {
        await mkdir(target.stagingRoot, { recursive: false });
        stagingCreated = true;
      }
      const destination = path.join(target.stagingRoot, name);
      await move(source, destination);
      moved.push({ source, destination });
    }
    if (!stagingCreated) return { archived: false, archivePath: undefined, archiveRoot: undefined };
    await move(target.stagingRoot, target.archiveRoot);
    return { archived: true, archivePath: target.archivePath, archiveRoot: target.archiveRoot };
  } catch (error) {
    const restoreErrors = [];
    for (const entry of moved.reverse()) {
      try {
        await move(entry.destination, entry.source);
      } catch (restoreError) {
        restoreErrors.push(restoreError);
      }
    }
    if (restoreErrors.length) {
      throw new AggregateError([error, ...restoreErrors], "Не удалось безопасно восстановить sandbox-данные после сбоя архивирования.");
    }
    throw error;
  }
}

export async function ensureProductionDataBaseline({
  supportRoot,
  managedRepo,
  stopService,
  resolveSourceSha,
  resolvePublishedSha,
  move = rename,
  now = () => new Date(),
  prepareTransferredDrafts,
  writeMarker = atomicJson,
}) {
  const marker = path.join(supportRoot, "production-data-baseline.json");
  const journal = path.join(supportRoot, TRANSITION_JOURNAL);
  const current = await readFile(marker, "utf8").then(JSON.parse).catch(() => undefined);
  const existingJournal = await readFile(journal, "utf8").then(JSON.parse).catch(() => undefined);
  if (existingJournal && existingJournal.state !== "completed") {
    throw new Error("Предыдущий перенос live drafts не завершён. Автоматический повтор остановлен до проверки локального journal.");
  }
  if (!(await hasCanonicalProjects(managedRepo))) {
    throw new Error("Канонические проекты portfolio не найдены. Миграция тестовых данных остановлена.");
  }
  const sourceSha = await resolveSourceSha();
  if (!/^[0-9a-f]{40}$/i.test(sourceSha)) {
    throw new Error("Не удалось подтвердить точный SHA канонического portfolio.");
  }
  const publishedSha = await resolvePublishedSha();
  if (!/^[0-9a-f]{40}$/i.test(publishedSha)) {
    throw new Error("Не удалось подтвердить точный SHA опубликованного Portfolio.");
  }
  if (publishedSha.toLowerCase() !== sourceSha.toLowerCase()) {
    throw new Error("SHA опубликованного Portfolio не совпадает с каноническим main. Синхронизация данных остановлена.");
  }
  if (current?.version === 4 && current.source === "production-live") {
    const upgraded = {
      version: PRODUCTION_DATA_BASELINE_VERSION, state: "live", transitionId: "legacy-v4", choice: "legacy-live",
      source: "production-live", sourceSha: current.sourceSha, activeStoreRoot: ".", archivePath: current.archivePath ?? null,
      completedAt: current.activatedAt ?? now().toISOString(), lastObservedAt: current.lastObservedAt ?? now().toISOString(),
    };
    await writeMarker(marker, upgraded);
    return { migrated: false, archived: false, upgradedV4: true, activeStoreRoot: "." };
  }
  if (current?.version === PRODUCTION_DATA_BASELINE_VERSION && current.source === "production-live" && current.state !== "recovery_required") {
    if (current.sourceSha?.toLowerCase() === sourceSha.toLowerCase()) {
      return { migrated: false, archived: false };
    }
    await writeMarker(marker, {
      ...current,
      sourceSha,
      lastObservedAt: now().toISOString(),
    });
    return { migrated: false, archived: false, observedProductionUpdated: true };
  }

  await stopService("admin");
  await stopService("preview");
  const timestamp = now().toISOString();
  const { archived, archivePath, archiveRoot } = await archiveSandboxTransaction({ supportRoot, timestamp, move });
  const transitionId = `transition-${timestamp.replace(/[:.]/g, "-")}`;
  const generationRoot = path.join(supportRoot, "live-generations", transitionId);
  await atomicJson(journal, { version: 2, state: "archived", sourceSha, archivePath, transitionId, createdAt: timestamp });
  await mkdir(generationRoot, { recursive: true });
  await cp(path.join(managedRepo, "content", "projects"), path.join(generationRoot, "published-snapshots"), { recursive: true, force: false });
  await mkdir(path.join(generationRoot, "preview-drafts"), { recursive: true });
  await mkdir(path.join(generationRoot, "jobs"), { recursive: true });
  let transfer;
  if (prepareTransferredDrafts) {
    if (!archived || !archiveRoot) throw new Error("Перенос неопубликованных черновиков невозможен: тестовый архив не создан.");
    await atomicJson(journal, { version: 2, state: "staging", sourceSha, archivePath, transitionId, createdAt: timestamp });
    transfer = await prepareTransferredDrafts({ archiveRoot, archivePath, sourceSha, journalPath: journal, generationRoot, transitionId });
  }
  try {
    await writeMarker(marker, {
      version: PRODUCTION_DATA_BASELINE_VERSION, state: "live", transitionId, choice: prepareTransferredDrafts ? "overlay" : "clean",
      source: "production-live",
      sourceSha,
      activeStoreRoot: path.relative(supportRoot, generationRoot), archivePath: archivePath ?? null,
      completedAt: timestamp,
      lastObservedAt: timestamp,
    });
  } catch (error) {
    await atomicJson(journal, { version: 2, state: "recovery_required", sourceSha, archivePath, transitionId, createdAt: timestamp });
    throw error;
  }
  await atomicJson(journal, { version: 2, state: "completed", sourceSha, archivePath, transitionId, completedAt: now().toISOString() });
  const transferEvidence = transfer && Object.fromEntries(Object.entries(transfer)
    .filter(([key]) => key !== "rollback" && key !== "finalize"));
  return { migrated: true, archived, ...(transfer ? { transfer: transferEvidence } : {}) };
}
