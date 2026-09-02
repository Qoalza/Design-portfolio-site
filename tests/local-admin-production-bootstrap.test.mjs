import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PRODUCTION_DATA_BASELINE_VERSION,
  ensureProductionDataBaseline,
  extractPublishedBuildSha,
} from "../tools/des-art-admin/production-data-bootstrap.mjs";

test("live bootstrap archives legacy test workspaces and leaves canonical portfolio data as the only source", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-production-bootstrap-"));
  const supportRoot = path.join(root, "support");
  const managedRepo = path.join(root, "repository");
  const archived = [];

  await mkdir(path.join(managedRepo, "content", "projects"), { recursive: true });
  await writeFile(path.join(managedRepo, "content", "projects", "corvo.json"), "{\"slug\":\"corvo\"}\n");
  await mkdir(path.join(supportRoot, "drafts"), { recursive: true });
  await mkdir(path.join(supportRoot, "draft-assets", "test-project"), { recursive: true });
  await mkdir(path.join(supportRoot, "preview-drafts"), { recursive: true });
  await mkdir(path.join(supportRoot, "published-snapshots"), { recursive: true });
  await mkdir(path.join(supportRoot, "jobs"), { recursive: true });
  await writeFile(path.join(supportRoot, "drafts", "test-project.json"), "{\"slug\":\"test-project\"}\n");
  await writeFile(path.join(supportRoot, "draft-assets", "test-project", "test.png"), "test asset\n");
  await writeFile(path.join(supportRoot, "published-snapshots", "test-project.json"), "{\"slug\":\"test-project\"}\n");
  await writeFile(path.join(supportRoot, "jobs", "test.json"), "{\"id\":\"test\"}\n");

  const result = await ensureProductionDataBaseline({
    supportRoot,
    managedRepo,
    stopService: async (name) => { archived.push(name); },
    resolveSourceSha: async () => "a".repeat(40),
    resolvePublishedSha: async () => "a".repeat(40),
    now: () => new Date("2026-08-31T12:00:00.000Z"),
  });

  assert.deepEqual(archived, ["admin", "preview"]);
  assert.equal(result.migrated, true);
  assert.equal(result.archived, true);
  const marker = JSON.parse(await readFile(path.join(supportRoot, "production-data-baseline.json"), "utf8"));
  assert.deepEqual(marker, {
    version: PRODUCTION_DATA_BASELINE_VERSION,
    state: "live",
    transitionId: "transition-2026-08-31T12-00-00-000Z",
    choice: "clean",
    source: "production-live",
    sourceSha: "a".repeat(40),
    activeStoreRoot: "live-generations/transition-2026-08-31T12-00-00-000Z",
    archivePath: "sandbox-archive/before-production-2026-08-31T12-00-00-000Z",
    completedAt: "2026-08-31T12:00:00.000Z",
    lastObservedAt: "2026-08-31T12:00:00.000Z",
  });
  await assert.rejects(access(path.join(supportRoot, "drafts", "test-project.json")));
  await assert.rejects(access(path.join(supportRoot, "draft-assets", "test-project", "test.png")));
  await assert.rejects(access(path.join(supportRoot, "published-snapshots", "test-project.json")));
  await assert.rejects(access(path.join(supportRoot, "jobs", "test.json")));
  await access(path.join(supportRoot, "sandbox-archive", "before-production-2026-08-31T12-00-00-000Z", "drafts", "test-project.json"));
  await access(path.join(supportRoot, "sandbox-archive", "before-production-2026-08-31T12-00-00-000Z", "draft-assets", "test-project", "test.png"));
  await access(path.join(managedRepo, "content", "projects", "corvo.json"));
});

test("later production observation updates only the marker and preserves live drafts", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-production-bootstrap-current-"));
  const supportRoot = path.join(root, "support");
  const managedRepo = path.join(root, "repository");
  await mkdir(supportRoot, { recursive: true });
  await mkdir(path.join(managedRepo, "content", "projects"), { recursive: true });
  await writeFile(path.join(managedRepo, "content", "projects", "corvo.json"), "{\"slug\":\"corvo\"}\n");
  await writeFile(path.join(supportRoot, "production-data-baseline.json"), `${JSON.stringify({
    version: PRODUCTION_DATA_BASELINE_VERSION,
    source: "production-live",
    sourceSha: "b".repeat(40),
    archivedSandbox: true,
    activatedAt: "2026-08-31T12:00:00.000Z",
    lastObservedAt: "2026-08-31T12:00:00.000Z",
  })}\n`);
  await mkdir(path.join(supportRoot, "drafts"), { recursive: true });
  await writeFile(path.join(supportRoot, "drafts", "live.json"), "live draft\n");
  let stopped = false;

  const result = await ensureProductionDataBaseline({
    supportRoot,
    managedRepo,
    stopService: async () => { stopped = true; },
    resolveSourceSha: async () => "c".repeat(40),
    resolvePublishedSha: async () => "c".repeat(40),
  });

  assert.deepEqual(result, { migrated: false, archived: false, observedProductionUpdated: true });
  assert.equal(stopped, false);
  await access(path.join(supportRoot, "drafts", "live.json"));
  const marker = JSON.parse(await readFile(path.join(supportRoot, "production-data-baseline.json"), "utf8"));
  assert.equal(marker.sourceSha, "c".repeat(40));
});

test("legacy v4 live baseline upgrades to the current confirmed SHA without archiving live drafts", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-production-bootstrap-v4-live-"));
  const supportRoot = path.join(root, "support");
  const managedRepo = path.join(root, "repository");
  await mkdir(path.join(managedRepo, "content", "projects"), { recursive: true });
  await writeFile(path.join(managedRepo, "content", "projects", "corvo.json"), "{\"slug\":\"corvo\"}\n");
  await mkdir(path.join(supportRoot, "drafts"), { recursive: true });
  await writeFile(path.join(supportRoot, "drafts", "live.json"), "live draft\n");
  await writeFile(path.join(supportRoot, "production-data-baseline.json"), `${JSON.stringify({
    version: 4,
    source: "production-live",
    sourceSha: "b".repeat(40),
    archivePath: "sandbox-archive/before-production-legacy",
    activatedAt: "2026-08-31T12:00:00.000Z",
    lastObservedAt: "2026-08-31T12:00:00.000Z",
  })}\n`);
  let stopped = false;

  const result = await ensureProductionDataBaseline({
    supportRoot,
    managedRepo,
    stopService: async () => { stopped = true; },
    resolveSourceSha: async () => "c".repeat(40),
    resolvePublishedSha: async () => "c".repeat(40),
    now: () => new Date("2026-09-02T12:00:00.000Z"),
  });

  assert.deepEqual(result, { migrated: false, archived: false, upgradedV4: true, activeStoreRoot: "." });
  assert.equal(stopped, false);
  await access(path.join(supportRoot, "drafts", "live.json"));
  const marker = JSON.parse(await readFile(path.join(supportRoot, "production-data-baseline.json"), "utf8"));
  assert.equal(marker.version, PRODUCTION_DATA_BASELINE_VERSION);
  assert.equal(marker.choice, "legacy-live");
  assert.equal(marker.sourceSha, "c".repeat(40));
  assert.equal(marker.activeStoreRoot, ".");
  assert.equal(marker.archivePath, "sandbox-archive/before-production-legacy");
  assert.equal(marker.completedAt, "2026-08-31T12:00:00.000Z");
  assert.equal(marker.lastObservedAt, "2026-09-02T12:00:00.000Z");
});

test("bootstrap rejects a public SHA mismatch before stopping services or moving sandbox data", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-production-bootstrap-mismatch-"));
  const supportRoot = path.join(root, "support");
  const managedRepo = path.join(root, "repository");
  await mkdir(path.join(managedRepo, "content", "projects"), { recursive: true });
  await mkdir(path.join(supportRoot, "drafts"), { recursive: true });
  await writeFile(path.join(managedRepo, "content", "projects", "corvo.json"), "{\"slug\":\"corvo\"}\n");
  await writeFile(path.join(supportRoot, "drafts", "local.json"), "{\"slug\":\"local\"}\n");
  let stopped = false;

  await assert.rejects(
    ensureProductionDataBaseline({
      supportRoot,
      managedRepo,
      stopService: async () => { stopped = true; },
      resolveSourceSha: async () => "a".repeat(40),
      resolvePublishedSha: async () => "b".repeat(40),
    }),
    /опубликованного Portfolio/,
  );

  assert.equal(stopped, false);
  await access(path.join(supportRoot, "drafts", "local.json"));
  await assert.rejects(access(path.join(supportRoot, "production-data-baseline.json")));
});

test("bootstrap restores every moved sandbox directory when archive transaction fails", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-production-bootstrap-transaction-"));
  const supportRoot = path.join(root, "support");
  const managedRepo = path.join(root, "repository");
  await mkdir(path.join(managedRepo, "content", "projects"), { recursive: true });
  await mkdir(path.join(supportRoot, "drafts"), { recursive: true });
  await mkdir(path.join(supportRoot, "jobs"), { recursive: true });
  await writeFile(path.join(managedRepo, "content", "projects", "corvo.json"), "{\"slug\":\"corvo\"}\n");
  await writeFile(path.join(supportRoot, "drafts", "local.json"), "draft\n");
  await writeFile(path.join(supportRoot, "jobs", "job.json"), "job\n");
  let forwardMoves = 0;

  await assert.rejects(
    ensureProductionDataBaseline({
      supportRoot,
      managedRepo,
      stopService: async () => {},
      resolveSourceSha: async () => "a".repeat(40),
      resolvePublishedSha: async () => "a".repeat(40),
      move: async (from, to) => {
        if (to.includes(".staging") && ++forwardMoves === 2) throw new Error("injected archive failure");
        const { rename } = await import("node:fs/promises");
        return rename(from, to);
      },
    }),
    /injected archive failure/,
  );

  await access(path.join(supportRoot, "drafts", "local.json"));
  await access(path.join(supportRoot, "jobs", "job.json"));
  await assert.rejects(access(path.join(supportRoot, "production-data-baseline.json")));
});

test("failed marker keeps the archive and retries the same generation without a second archive", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-production-bootstrap-journal-"));
  const supportRoot = path.join(root, "support");
  const managedRepo = path.join(root, "repository");
  await mkdir(path.join(managedRepo, "content", "projects"), { recursive: true });
  await mkdir(path.join(supportRoot, "drafts"), { recursive: true });
  await writeFile(path.join(managedRepo, "content", "projects", "corvo.json"), "{\"slug\":\"corvo\"}\n");
  await writeFile(path.join(supportRoot, "drafts", "sandbox.json"), "{}\n");
  let archiveRoot;
  await assert.rejects(ensureProductionDataBaseline({
    supportRoot,
    managedRepo,
    stopService: async () => {},
    resolveSourceSha: async () => "a".repeat(40),
    resolvePublishedSha: async () => "a".repeat(40),
    prepareTransferredDrafts: async ({ archiveRoot: archive, generationRoot }) => {
      archiveRoot = archive;
      await mkdir(path.join(generationRoot, "drafts"), { recursive: true });
      await writeFile(path.join(generationRoot, "drafts", "live.json"), "{}\n");
      return {};
    },
    writeMarker: async () => { throw new Error("injected marker failure"); },
  }), /injected marker failure/);
  await access(path.join(archiveRoot, "drafts", "sandbox.json"));
  // New live generations are isolated; a failed marker never activates them.
  await assert.rejects(access(path.join(supportRoot, "production-data-baseline.json")));
  await access(path.join(supportRoot, "live-transition-journal-v1.json"));
  const recovered = await ensureProductionDataBaseline({
    supportRoot,
    managedRepo,
    stopService: async () => {},
    resolveSourceSha: async () => "a".repeat(40),
    resolvePublishedSha: async () => "a".repeat(40),
  });
  assert.equal(recovered.recovered, true);
  const marker = JSON.parse(await readFile(path.join(supportRoot, "production-data-baseline.json"), "utf8"));
  await access(path.join(supportRoot, marker.activeStoreRoot, "drafts", "live.json"));
});

test("published build SHA parser accepts only a full SHA from the HTML root", () => {
  assert.equal(extractPublishedBuildSha(`<html lang="ru" data-build-sha="${"a".repeat(40)}">`), "a".repeat(40));
  assert.equal(extractPublishedBuildSha("<html data-build-sha=\"short\">"), undefined);
  assert.equal(extractPublishedBuildSha("<body data-build-sha=\"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\">"), undefined);
});
