import { access, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export const PRODUCTION_DATA_BASELINE_VERSION = 4;

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
    if (!stagingCreated) return { archived: false, archivePath: undefined };
    await move(target.stagingRoot, target.archiveRoot);
    return { archived: true, archivePath: target.archivePath };
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
}) {
  const marker = path.join(supportRoot, "production-data-baseline.json");
  const current = await readFile(marker, "utf8").then(JSON.parse).catch(() => undefined);
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
  if (current?.version === PRODUCTION_DATA_BASELINE_VERSION && current.source === "production-live") {
    if (current.sourceSha?.toLowerCase() === sourceSha.toLowerCase()) {
      return { migrated: false, archived: false };
    }
    await atomicJson(marker, {
      ...current,
      sourceSha,
      lastObservedAt: now().toISOString(),
    });
    return { migrated: false, archived: false, observedProductionUpdated: true };
  }

  await stopService("admin");
  await stopService("preview");
  const timestamp = now().toISOString();
  const { archived, archivePath } = await archiveSandboxTransaction({ supportRoot, timestamp, move });
  await atomicJson(marker, {
    version: PRODUCTION_DATA_BASELINE_VERSION,
    source: "production-live",
    sourceSha,
    archivedSandbox: archived,
    archivePath,
    activatedAt: timestamp,
    lastObservedAt: timestamp,
  });
  return { migrated: true, archived };
}
