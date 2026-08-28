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

test("dry-run compiles admin metadata into isolated public staging files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-publish-draft-"));
  const draftFile = path.join(root, "draft.json");
  const jobFile = path.join(root, "job.json");
  await writeFile(draftFile, JSON.stringify({
    schemaVersion: 2,
    title: "Черновик",
    slug: "draft",
    description: "Описание",
    role: "Product Designer",
    year: 2026,
    tags: [],
    detailTags: [],
    visibility: "draft",
    catalogOrder: 1,
    featuredOnHome: false,
    detailAvailable: false,
    materials: { projectState: "completed", fileState: "absent" },
    platforms: [],
    content: [{ type: "section", adminId: "draft-section-1", heading: "Секция", blocks: [] }],
    admin: { sections: { "draft-section-1": { noticeEnabled: false } } },
  }));
  await writeFile(jobFile, JSON.stringify({
    id: "draft-test",
    scope: "project",
    dryRun: true,
    repoRoot: process.cwd(),
    files: [draftFile],
    status: "queued",
    message: "Подготовка",
    stages: PUBLISH_STAGES.map(([id, label]) => ({ id, label, status: "pending" })),
  }));

  await runPublishJob(jobFile);
  const staged = JSON.parse(await readFile(path.join(root, "staging", "draft.json"), "utf8"));
  assert.equal("admin" in staged, false);
  assert.equal("adminId" in staged.content[0], false);
});

test("readiness reports missing credentials without exposing secrets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-readiness-"));
  const result = await publishReadiness({ supportRoot: root });
  assert.equal(typeof result.ready, "boolean");
  assert.ok(Array.isArray(result.failures));
  assert.doesNotMatch(JSON.stringify(result), /BEGIN .*PRIVATE KEY/);
});
