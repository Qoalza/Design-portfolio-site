import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { PUBLISH_STAGES, publishReadiness, runPublishJob } from "../tools/des-art-admin/publish-worker.mjs";

test("dry-run publish persists every stage without external mutations", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-publish-"));
  const jobFile = path.join(root, "job.json");
  await writeFile(jobFile, JSON.stringify({ id: "test", scope: "all", dryRun: true, repoRoot: process.cwd(), files: [], status: "queued", message: "Подготовка", stages: PUBLISH_STAGES.map(([id, label]) => ({ id, label, status: "pending" })) }));
  await runPublishJob(jobFile);
  const result = JSON.parse(await readFile(jobFile, "utf8"));
  assert.equal(result.status, "complete");
  assert.ok(result.stages.every((stage) => stage.status === "complete"));
});

test("readiness reports missing credentials without exposing secrets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-readiness-"));
  const result = await publishReadiness({ supportRoot: root });
  assert.equal(typeof result.ready, "boolean");
  assert.ok(Array.isArray(result.failures));
  assert.doesNotMatch(JSON.stringify(result), /BEGIN .*PRIVATE KEY/);
});
