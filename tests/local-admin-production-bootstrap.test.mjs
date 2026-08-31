import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { PRODUCTION_DATA_BASELINE_VERSION, ensureProductionDataBaseline } from "../tools/des-art-admin/production-data-bootstrap.mjs";

test("live bootstrap archives legacy test workspaces and leaves canonical portfolio data as the only source", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-production-bootstrap-"));
  const supportRoot = path.join(root, "support");
  const managedRepo = path.join(root, "repository");
  const archived = [];

  await mkdir(path.join(managedRepo, "content", "projects"), { recursive: true });
  await writeFile(path.join(managedRepo, "content", "projects", "corvo.json"), "{\"slug\":\"corvo\"}\n");
  await mkdir(path.join(supportRoot, "drafts"), { recursive: true });
  await mkdir(path.join(supportRoot, "draft-assets", "test-project"), { recursive: true });
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
    now: () => new Date("2026-08-31T12:00:00.000Z"),
  });

  assert.deepEqual(archived, ["admin", "preview"]);
  assert.equal(result.migrated, true);
  assert.equal(result.archived, true);
  const marker = JSON.parse(await readFile(path.join(supportRoot, "production-data-baseline.json"), "utf8"));
  assert.deepEqual(marker, {
    version: PRODUCTION_DATA_BASELINE_VERSION,
    source: "canonical-main",
    sourceSha: "a".repeat(40),
    archivedSandbox: true,
    createdAt: "2026-08-31T12:00:00.000Z",
  });
  await assert.rejects(access(path.join(supportRoot, "drafts", "test-project.json")));
  await assert.rejects(access(path.join(supportRoot, "draft-assets", "test-project", "test.png")));
  await assert.rejects(access(path.join(supportRoot, "published-snapshots", "test-project.json")));
  await assert.rejects(access(path.join(supportRoot, "jobs", "test.json")));
  await access(path.join(supportRoot, "sandbox-archive", "before-production-2026-08-31T12-00-00-000Z", "drafts", "test-project.json"));
  await access(path.join(supportRoot, "sandbox-archive", "before-production-2026-08-31T12-00-00-000Z", "draft-assets", "test-project", "test.png"));
  await access(path.join(managedRepo, "content", "projects", "corvo.json"));
});

test("current bootstrap marker is idempotent and preserves a clean production workspace", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-production-bootstrap-current-"));
  const supportRoot = path.join(root, "support");
  const managedRepo = path.join(root, "repository");
  await mkdir(supportRoot, { recursive: true });
  await mkdir(managedRepo, { recursive: true });
  await writeFile(path.join(supportRoot, "production-data-baseline.json"), `${JSON.stringify({
    version: PRODUCTION_DATA_BASELINE_VERSION,
    source: "canonical-main",
    sourceSha: "b".repeat(40),
    archivedSandbox: true,
    createdAt: "2026-08-31T12:00:00.000Z",
  })}\n`);
  let stopped = false;

  const result = await ensureProductionDataBaseline({
    supportRoot,
    managedRepo,
    stopService: async () => { stopped = true; },
    resolveSourceSha: async () => "c".repeat(40),
  });

  assert.deepEqual(result, { migrated: false, archived: false });
  assert.equal(stopped, false);
});
