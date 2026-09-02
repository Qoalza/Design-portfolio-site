import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, writeFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  buildSandboxOrigin,
  buildLegacySelectedDraftTransfer,
  buildUnpublishedDraftTransfer,
  buildLegacyTransferReview,
  createLiveTransitionRequest,
  consumeLiveTransitionRequest,
  readSandboxOrigin,
  readSandboxDraftProjects,
  saveLiveTransitionRequest,
  saveSandboxOrigin,
  stageUnpublishedDraftTransfer,
  activateStagedDraftTransfer,
  collectAssetHashes,
} from "../tools/des-art-admin/live-transition.mjs";

const project = (slug, overrides = {}) => ({
  schemaVersion: 3,
  slug,
  title: "Production title",
  description: "Production description",
  role: "Designer",
  year: 2026,
  tags: [], detailTags: [], visibility: "published", catalogOrder: 1,
  detailAvailable: false, materials: { projectState: "completed", fileState: "absent" },
  platforms: [], visuals: { catalog: { templateId: "catalog.browser", assets: {} } }, content: [],
  ...overrides,
});

test("delta transfer overlays only sandbox changes and keeps production global fields", () => {
  const base = project("sarafan", { title: "Old title", content: [{ type: "section", adminId: "about", heading: "About", blocks: [] }] });
  const sandbox = project("sarafan", { title: "Sandbox title", catalogOrder: 9, homePlacement: "secondary", content: [{ type: "section", adminId: "about", heading: "Sandbox story", blocks: [] }, { type: "section", adminId: "new", heading: "New section", blocks: [] }] });
  const production = project("sarafan", { title: "Current production title", description: "Current description", catalogOrder: 2, homePlacement: "primary", content: [{ type: "section", adminId: "about", heading: "Current story", blocks: [] }] });

  const origin = buildSandboxOrigin({ sourceSha: "a".repeat(40), projects: [base], assetHashes: {} });
  const result = buildUnpublishedDraftTransfer({ origin, sandboxProjects: [sandbox], productionProjects: [production] });

  assert.equal(result.reviewRequired, false);
  assert.equal(result.drafts.length, 1);
  assert.equal(result.drafts[0].title, "Sandbox title");
  assert.equal(result.drafts[0].description, "Current description");
  assert.equal(result.drafts[0].catalogOrder, 2);
  assert.equal(result.drafts[0].homePlacement, "primary");
  assert.deepEqual(result.drafts[0].content.map((item) => item.heading), ["Sandbox story", "New section"]);
});

test("sandbox origin gives canonical sections the same stable adminId as an Admin draft", () => {
  const origin = buildSandboxOrigin({ sourceSha: "a".repeat(40), projects: [project("sarafan", { content: [{ type: "section", heading: "About", blocks: [] }] })], assetHashes: {} });
  assert.equal(origin.projects[0].content[0].adminId, "sarafan-section-1");
});

test("delta transfer does not carry a cleared field, removed section, or removed asset into live drafts", () => {
  const base = project("sarafan", { title: "Base", visuals: { catalog: { templateId: "catalog.browser", assets: { screen: [{ src: "/assets/projects/sarafan/base.png" }] } } }, content: [{ type: "section", adminId: "about", heading: "Base", blocks: [] }] });
  const sandbox = project("sarafan", { title: "", visuals: { catalog: { templateId: "catalog.browser", assets: {} } }, content: [] });
  const production = project("sarafan", { title: "Production", visuals: { catalog: { templateId: "catalog.browser", assets: { screen: [{ src: "/assets/projects/sarafan/production.png" }] } } }, content: [{ type: "section", adminId: "about", heading: "Production", blocks: [] }] });
  const result = buildUnpublishedDraftTransfer({ origin: buildSandboxOrigin({ sourceSha: "a".repeat(40), projects: [base], assetHashes: {} }), sandboxProjects: [sandbox], productionProjects: [production] });
  assert.equal(result.drafts.length, 0);
});

test("delta transfer creates new sandbox projects as unpublished live drafts and ignores deletions", () => {
  const origin = buildSandboxOrigin({ sourceSha: "a".repeat(40), projects: [project("existing")], assetHashes: {} });
  const result = buildUnpublishedDraftTransfer({
    origin,
    sandboxProjects: [project("existing", { visibility: "deleted" }), project("new-project", { visibility: "published", title: "New" })],
    productionProjects: [project("existing")],
  });

  assert.deepEqual(result.drafts.map((item) => item.slug), ["new-project"]);
  assert.equal(result.drafts[0].visibility, "draft");
  assert.equal(result.drafts[0].catalogOrder, undefined);
});

test("missing origin requires manual review and transition request is explicit", () => {
  const result = buildUnpublishedDraftTransfer({ origin: undefined, sandboxProjects: [project("legacy")], productionProjects: [] });
  assert.equal(result.reviewRequired, true);
  assert.equal(result.drafts.length, 0);
  assert.throws(() => createLiveTransitionRequest({ path: "delta" }), /selection/i);
  assert.deepEqual(createLiveTransitionRequest({ selection: "clean" }).selection, "clean");
});

test("legacy review exposes only additive or replacement units and never deletion or global placement", () => {
  const sandbox = project("sarafan", { title: "Sandbox", catalogOrder: 7, homePlacement: "secondary", content: [{ type: "section", adminId: "a", heading: "Added", blocks: [] }] });
  const production = project("sarafan", { title: "Production", catalogOrder: 2, homePlacement: "primary", content: [] });
  const review = buildLegacyTransferReview({ sandboxProjects: [sandbox, project("removed", { visibility: "deleted" })], productionProjects: [production] });
  assert.deepEqual(review.projects.map((item) => item.slug), ["sarafan"]);
  assert.ok(review.projects[0].units.some((unit) => unit.key === "title"));
  assert.ok(review.projects[0].units.some((unit) => unit.key === "section:a"));
  assert.ok(!review.projects[0].units.some((unit) => /catalogOrder|homePlacement|visibility/.test(unit.key)));
});

test("legacy review applies only explicitly selected units and never transfers a deletion", () => {
  const sandbox = project("sarafan", { title: "Sandbox", description: "Sandbox description", catalogOrder: 9, content: [{ type: "section", adminId: "about", heading: "Sandbox about", blocks: [] }] });
  const production = project("sarafan", { title: "Production", description: "Production description", catalogOrder: 2, homePlacement: "primary", content: [{ type: "section", adminId: "about", heading: "Production about", blocks: [] }] });
  const result = buildLegacySelectedDraftTransfer({ sandboxProjects: [sandbox, project("removed", { visibility: "deleted" })], productionProjects: [production], units: [{ slug: "sarafan", key: "title" }, { slug: "sarafan", key: "section:about" }] });
  assert.equal(result.drafts[0].title, "Sandbox");
  assert.equal(result.drafts[0].description, "Production description");
  assert.equal(result.drafts[0].catalogOrder, 2);
  assert.equal(result.drafts[0].homePlacement, "primary");
  assert.equal(result.drafts[0].content[0].heading, "Sandbox about");
  assert.equal(result.drafts.length, 1);
});

test("legacy new project transfers only the selected unpublished units", () => {
  const sandbox = project("new-project", { title: "New title", description: "Must remain unselected", visibility: "published" });
  const result = buildLegacySelectedDraftTransfer({ sandboxProjects: [sandbox], productionProjects: [], units: [{ slug: "new-project", key: "title" }] });
  assert.equal(result.drafts[0].title, "New title");
  assert.equal(result.drafts[0].description, undefined);
  assert.equal(result.drafts[0].visibility, "draft");
});

test("origin is immutable and a selected transition request is consumed once", async () => {
  const supportRoot = await mkdtemp(path.join(tmpdir(), "des-art-transition-"));
  await saveSandboxOrigin({ supportRoot, sourceSha: "a".repeat(40), projects: [project("base")], assetHashes: {} });
  await saveSandboxOrigin({ supportRoot, sourceSha: "b".repeat(40), projects: [project("other")], assetHashes: {} });
  assert.equal((await readSandboxOrigin(supportRoot)).sourceSha, "a".repeat(40));
  await saveLiveTransitionRequest({ supportRoot, selection: "delta" });
  await assert.rejects(saveLiveTransitionRequest({ supportRoot, selection: "clean" }), /already exists/);
  assert.equal((await consumeLiveTransitionRequest(supportRoot)).selection, "delta");
  await assert.rejects(() => consumeLiveTransitionRequest(supportRoot));
});

test("sandbox origin asset manifest hashes only local asset files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-transition-assets-"));
  await mkdir(path.join(root, "sarafan"), { recursive: true });
  await writeFile(path.join(root, "sarafan", "hero.png"), "asset bytes");
  const hashes = await collectAssetHashes(root);
  assert.match(hashes["/assets/projects/sarafan/hero.png"], /^[0-9a-f]{64}$/);
});

test("delta drafts are staged atomically away from canonical production files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-transition-stage-"));
  const archiveRoot = path.join(root, "archive");
  const stagingRoot = path.join(root, "staging");
  const canonical = path.join(root, "repository", "content", "projects", "sarafan.json");
  const base = project("sarafan", { title: "Base" });
  await mkdir(path.join(archiveRoot, "drafts"), { recursive: true });
  await writeFile(path.join(archiveRoot, "drafts", "sarafan.json"), `${JSON.stringify(project("sarafan", { title: "Sandbox" }))}\n`);
  await mkdir(path.dirname(canonical), { recursive: true });
  await writeFile(canonical, `${JSON.stringify(project("sarafan", { title: "Production" }))}\n`);
  await mkdir(path.join(archiveRoot, "draft-assets", "sarafan"), { recursive: true });
  await writeFile(path.join(archiveRoot, "draft-assets", "sarafan", "new.png"), "draft image");
  const sandboxWithAsset = project("sarafan", { title: "Sandbox", visuals: { catalog: { templateId: "catalog.browser", assets: { screen: [{ src: "/assets/projects/sarafan/new.png" }] } } } });
  await writeFile(path.join(archiveRoot, "drafts", "sarafan.json"), `${JSON.stringify(sandboxWithAsset)}\n`);

  const result = await stageUnpublishedDraftTransfer({ archiveRoot, stagingRoot, origin: buildSandboxOrigin({ sourceSha: "a".repeat(40), projects: [base], assetHashes: {} }), productionProjects: [JSON.parse(await readFile(canonical, "utf8"))] });
  assert.equal(result.reviewRequired, false);
  assert.equal(JSON.parse(await readFile(path.join(stagingRoot, "drafts", "sarafan.json"), "utf8")).title, "Sandbox");
  await access(path.join(stagingRoot, "draft-assets", "sarafan", "new.png"));
  assert.equal(JSON.parse(await readFile(canonical, "utf8")).title, "Production");
});

test("staging rejects an asset that is neither archived nor already canonical", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-transition-missing-asset-"));
  const archiveRoot = path.join(root, "archive");
  await mkdir(path.join(archiveRoot, "drafts"), { recursive: true });
  const base = project("sarafan");
  const sandbox = project("sarafan", { visuals: { catalog: { templateId: "catalog.browser", assets: { screen: [{ src: "/assets/projects/sarafan/missing.png" }] } } } });
  await writeFile(path.join(archiveRoot, "drafts", "sarafan.json"), JSON.stringify(sandbox));
  await assert.rejects(stageUnpublishedDraftTransfer({ archiveRoot, stagingRoot: path.join(root, "staging"), origin: buildSandboxOrigin({ sourceSha: "a".repeat(40), projects: [base], assetHashes: {} }), productionProjects: [base] }), /Отсутствует переносимый asset/);
  assert.deepEqual(await readSandboxDraftProjects(archiveRoot), [sandbox]);
});

test("activation rolls staged drafts back when a later live directory cannot be activated", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-transition-activate-"));
  const supportRoot = path.join(root, "support");
  const stagingRoot = path.join(root, "staging");
  await mkdir(path.join(stagingRoot, "drafts"), { recursive: true });
  await mkdir(path.join(stagingRoot, "draft-assets"), { recursive: true });
  await writeFile(path.join(stagingRoot, "drafts", "sarafan.json"), "{}\n");
  await writeFile(path.join(stagingRoot, "draft-assets", "asset.png"), "asset");
  let calls = 0;
  await assert.rejects(activateStagedDraftTransfer({
    supportRoot,
    stagingRoot,
    move: async (from, to) => {
      if (++calls === 2) throw new Error("injected activation failure");
      const { rename } = await import("node:fs/promises");
      return rename(from, to);
    },
  }), /injected activation failure/);
  await access(path.join(stagingRoot, "drafts", "sarafan.json"));
  await assert.rejects(access(path.join(supportRoot, "drafts", "sarafan.json")));
});
