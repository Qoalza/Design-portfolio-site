import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, writeFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  buildSandboxOrigin,
  buildOverlayDraftTransfer,
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

const section = (adminId, heading, blocks = []) => ({ type: "section", adminId, heading, blocks });
const paragraph = (text) => ({ type: "paragraph", content: [{ type: "text", text }] });
const canonicalSection = (value) => Object.fromEntries(Object.entries(value).filter(([key]) => key !== "adminId"));

test("delta transfer overlays independent sandbox units and preserves raw production sections", () => {
  const base = project("sarafan", { title: "Old title", content: [section("about", "About"), section("method", "Method")] });
  const sandbox = project("sarafan", { title: "Sandbox title", catalogOrder: 9, homePlacement: "secondary", content: [section("about", "Sandbox story"), section("method", "Method"), section("new", "New section")] });
  const production = project("sarafan", { title: "Old title", description: "Current description", catalogOrder: 2, homePlacement: "primary", content: [canonicalSection(section("about", "About")), canonicalSection(section("method", "Method")), { type: "section", heading: "Production addition", blocks: [] }] });

  const origin = buildSandboxOrigin({ sourceSha: "a".repeat(40), projects: [base], assetHashes: {} });
  const result = buildUnpublishedDraftTransfer({ origin, sandboxProjects: [sandbox], productionProjects: [production] });

  assert.equal(result.reviewRequired, false);
  assert.deepEqual(result.conflicts, []);
  assert.equal(result.drafts.length, 1);
  assert.equal(result.drafts[0].title, "Sandbox title");
  assert.equal(result.drafts[0].description, "Current description");
  assert.equal(result.drafts[0].catalogOrder, 2);
  assert.equal(result.drafts[0].homePlacement, "primary");
  assert.deepEqual(result.drafts[0].content.map((item) => item.heading), ["Sandbox story", "Method", "Production addition", "New section"]);
});

test("delta transfer stops before staging when the same field changed in sandbox and production", () => {
  const base = project("sarafan", { title: "Base title" });
  const result = buildUnpublishedDraftTransfer({
    origin: buildSandboxOrigin({ sourceSha: "a".repeat(40), projects: [base], assetHashes: {} }),
    sandboxProjects: [project("sarafan", { title: "Sandbox title" })],
    productionProjects: [project("sarafan", { title: "Production title" })],
  });

  assert.equal(result.blocked, true);
  assert.deepEqual(result.drafts, []);
  assert.deepEqual(result.conflicts, [{ slug: "sarafan", unit: "field:title" }]);
});

test("delta transfer stops before staging when the same visual surface changed in sandbox and production", () => {
  const catalog = (src) => ({ catalog: { templateId: "catalog.browser", assets: { screen: [{ src }] } } });
  const base = project("sarafan", { visuals: catalog("/assets/projects/sarafan/base.png") });
  const result = buildUnpublishedDraftTransfer({
    origin: buildSandboxOrigin({ sourceSha: "a".repeat(40), projects: [base], assetHashes: {} }),
    sandboxProjects: [project("sarafan", { visuals: catalog("/assets/projects/sarafan/sandbox.png") })],
    productionProjects: [project("sarafan", { visuals: catalog("/assets/projects/sarafan/production.png") })],
  });

  assert.equal(result.blocked, true);
  assert.deepEqual(result.conflicts, [{ slug: "sarafan", unit: "visual:catalog" }]);
});

test("delta transfer stops before staging when both sides change the same section", () => {
  const base = project("sarafan", { content: [section("about", "About", [paragraph("A"), paragraph("B")])] });
  const sandbox = project("sarafan", { content: [section("about", "About", [paragraph("Sandbox addition"), paragraph("A"), paragraph("B")])] });
  const production = project("sarafan", { content: [canonicalSection(section("about", "About", [paragraph("A"), paragraph("B"), paragraph("Production addition")]))] });
  const result = buildUnpublishedDraftTransfer({ origin: buildSandboxOrigin({ sourceSha: "a".repeat(40), projects: [base], assetHashes: {} }), sandboxProjects: [sandbox], productionProjects: [production] });

  assert.equal(result.blocked, true);
  assert.deepEqual(result.conflicts, [{ slug: "sarafan", unit: "section:about" }]);
});

test("delta transfer stops before staging when production removed a sandbox-changed section", () => {
  const base = project("sarafan", { content: [section("about", "About")] });
  const result = buildUnpublishedDraftTransfer({
    origin: buildSandboxOrigin({ sourceSha: "a".repeat(40), projects: [base], assetHashes: {} }),
    sandboxProjects: [project("sarafan", { content: [section("about", "Sandbox about")] })],
    productionProjects: [project("sarafan", { content: [] })],
  });

  assert.equal(result.blocked, true);
  assert.deepEqual(result.conflicts, [{ slug: "sarafan", unit: "section:about" }]);
});

test("delta transfer stops before staging when production removed a sandbox-changed project", () => {
  const base = project("sarafan", { title: "Base" });
  const result = buildUnpublishedDraftTransfer({
    origin: buildSandboxOrigin({ sourceSha: "a".repeat(40), projects: [base], assetHashes: {} }),
    sandboxProjects: [project("sarafan", { title: "Sandbox" })],
    productionProjects: [],
  });

  assert.equal(result.blocked, true);
  assert.deepEqual(result.conflicts, [{ slug: "sarafan", unit: "project" }]);
});

test("delta transfer stops before staging when both sides change the gallery", () => {
  const gallery = (src) => ({ type: "gallery", templateId: "gallery.devices-v1", groups: [{ deviceId: "desktop", images: [{ src }] }] });
  const base = project("sarafan", { content: [gallery("/assets/projects/sarafan/base.png")] });
  const result = buildUnpublishedDraftTransfer({
    origin: buildSandboxOrigin({ sourceSha: "a".repeat(40), projects: [base], assetHashes: {} }),
    sandboxProjects: [project("sarafan", { content: [gallery("/assets/projects/sarafan/sandbox.png")] })],
    productionProjects: [project("sarafan", { content: [gallery("/assets/projects/sarafan/production.png")] })],
  });

  assert.equal(result.blocked, true);
  assert.deepEqual(result.conflicts, [{ slug: "sarafan", unit: "gallery" }]);
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

test("overlay has no manual review: sandbox values including empty, deletion and placement win", () => {
  const result = buildOverlayDraftTransfer({
    sandboxProjects: [project("legacy", { title: "", visibility: "deleted", catalogOrder: 9, homePlacement: "secondary", content: [] })],
    productionProjects: [project("legacy", { title: "Production", visibility: "published", catalogOrder: 1, homePlacement: "primary", content: [section("a", "Production")] })],
  });
  assert.equal(result.reviewRequired, false);
  assert.equal(result.drafts[0].title, "");
  assert.equal(result.drafts[0].visibility, "deleted");
  assert.equal(result.drafts[0].catalogOrder, 9);
  assert.deepEqual(result.drafts[0].content, []);
  assert.throws(() => createLiveTransitionRequest({ choice: "overlay" }), /SHA/);
  assert.equal(createLiveTransitionRequest({ choice: "clean", targetSha: "a".repeat(40), transitionId: "transition-test", requestedAt: "2026-09-02T00:00:00.000Z" }).choice, "clean");
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

test("legacy review exposes a complete project page as one atomic unit", () => {
  const sandbox = project("sarafan", {
    detailAvailable: true,
    visuals: {
      catalog: { templateId: "catalog.browser", assets: {} },
      hero: { templateId: "hero.sarafan-collage", assets: { image: [{ src: "/assets/projects/sarafan/hero.png" }] } },
    },
  });
  const review = buildLegacyTransferReview({ sandboxProjects: [sandbox], productionProjects: [project("sarafan")] });
  const units = review.projects[0].units;
  const page = units.find((unit) => unit.key === "page");

  assert.equal(page?.label, "Страница проекта");
  assert.ok(!units.some((unit) => unit.key === "detailAvailable" || unit.key === "visual:hero"));
});

test("legacy review does not offer an incomplete project page for transfer", () => {
  const sandbox = project("sarafan", { detailAvailable: true });
  const review = buildLegacyTransferReview({ sandboxProjects: [sandbox], productionProjects: [project("sarafan")] });

  assert.equal(review.projects.length, 0);
});

test("legacy page transfer applies page availability and hero together", () => {
  const hero = { templateId: "hero.sarafan-collage", assets: { image: [{ src: "/assets/projects/sarafan/hero.png" }] } };
  const sandbox = project("sarafan", { detailAvailable: true, visuals: { catalog: { templateId: "catalog.browser", assets: {} }, hero } });
  const production = project("sarafan", { detailAvailable: false });
  const review = buildLegacyTransferReview({ sandboxProjects: [sandbox], productionProjects: [production] });
  const page = review.projects[0].units.find((unit) => unit.key === "page");
  const result = buildLegacySelectedDraftTransfer({ sandboxProjects: [sandbox], productionProjects: [production], units: [{ slug: "sarafan", ...page }] });

  assert.equal(result.blocked, false);
  assert.equal(result.drafts[0].detailAvailable, true);
  assert.deepEqual(result.drafts[0].visuals.hero, hero);
});

test("three-way delta transfer treats a project page as one atomic unit", () => {
  const baseHero = { templateId: "hero.sarafan-collage", assets: { image: [{ src: "/assets/projects/sarafan/base.png" }] } };
  const sandboxHero = { templateId: "hero.sarafan-collage", assets: { image: [{ src: "/assets/projects/sarafan/sandbox.png" }] } };
  const productionHero = { templateId: "hero.sarafan-collage", assets: { image: [{ src: "/assets/projects/sarafan/production.png" }] } };
  const base = project("sarafan", { detailAvailable: true, visuals: { catalog: { templateId: "catalog.browser", assets: {} }, hero: baseHero } });
  const sandbox = project("sarafan", { detailAvailable: true, visuals: { catalog: { templateId: "catalog.browser", assets: {} }, hero: sandboxHero } });
  const production = project("sarafan", { detailAvailable: true, visuals: { catalog: { templateId: "catalog.browser", assets: {} }, hero: productionHero } });
  const result = buildUnpublishedDraftTransfer({ origin: buildSandboxOrigin({ sourceSha: "a".repeat(40), projects: [base], assetHashes: {} }), sandboxProjects: [sandbox], productionProjects: [production] });

  assert.equal(result.blocked, true);
  assert.deepEqual(result.conflicts, [{ slug: "sarafan", unit: "page" }]);
});

test("legacy review applies only explicitly selected units and never transfers a deletion", () => {
  const sandbox = project("sarafan", { title: "Sandbox", description: "Sandbox description", catalogOrder: 9, content: [{ type: "section", adminId: "about", heading: "Sandbox about", blocks: [] }] });
  const production = project("sarafan", { title: "Production", description: "Production description", catalogOrder: 2, homePlacement: "primary", content: [{ type: "section", adminId: "about", heading: "Production about", blocks: [] }] });
  const review = buildLegacyTransferReview({ sandboxProjects: [sandbox, project("removed", { visibility: "deleted" })], productionProjects: [production] });
  const units = review.projects[0].units.filter((unit) => unit.key === "title" || unit.key === "section:about").map((unit) => ({ slug: "sarafan", ...unit }));
  const result = buildLegacySelectedDraftTransfer({ sandboxProjects: [sandbox, project("removed", { visibility: "deleted" })], productionProjects: [production], units });
  assert.equal(result.blocked, false);
  assert.equal(result.drafts[0].title, "Sandbox");
  assert.equal(result.drafts[0].description, "Production description");
  assert.equal(result.drafts[0].catalogOrder, 2);
  assert.equal(result.drafts[0].homePlacement, "primary");
  assert.equal(result.drafts[0].content[0].heading, "Sandbox about");
  assert.equal(result.drafts.length, 1);
});

test("legacy new project transfers only the selected unpublished units", () => {
  const sandbox = project("new-project", { title: "New title", description: "Must remain unselected", visibility: "published" });
  const review = buildLegacyTransferReview({ sandboxProjects: [sandbox], productionProjects: [] });
  const units = review.projects[0].units.filter((unit) => unit.key === "title").map((unit) => ({ slug: "new-project", ...unit }));
  const result = buildLegacySelectedDraftTransfer({ sandboxProjects: [sandbox], productionProjects: [], units });
  assert.equal(result.blocked, false);
  assert.equal(result.drafts[0].title, "New title");
  assert.equal(result.drafts[0].description, undefined);
  assert.equal(result.drafts[0].visibility, "draft");
});

test("legacy selection replaces one raw canonical section and stops if its reviewed target changed", () => {
  const sandbox = project("sarafan", { content: [section("sarafan-section-1", "Sandbox first"), section("sarafan-section-2", "Sandbox second")] });
  const production = project("sarafan", { content: [canonicalSection(section("sarafan-section-1", "Production first")), canonicalSection(section("sarafan-section-2", "Production second"))] });
  const review = buildLegacyTransferReview({ sandboxProjects: [sandbox], productionProjects: [production] });
  const unit = review.projects[0].units.find((candidate) => candidate.key === "section:sarafan-section-1");
  const selected = [{ slug: "sarafan", ...unit }];

  const result = buildLegacySelectedDraftTransfer({ sandboxProjects: [sandbox], productionProjects: [production], units: selected });
  assert.equal(result.blocked, false);
  assert.deepEqual(result.drafts[0].content.map((item) => item.heading), ["Sandbox first", "Production second"]);

  const changedProduction = project("sarafan", { content: [canonicalSection(section("sarafan-section-1", "Updated production first")), canonicalSection(section("sarafan-section-2", "Production second"))] });
  const stale = buildLegacySelectedDraftTransfer({ sandboxProjects: [sandbox], productionProjects: [changedProduction], units: selected });
  assert.equal(stale.blocked, true);
  assert.deepEqual(stale.conflicts, [{ slug: "sarafan", unit: "legacy:section:sarafan-section-1" }]);
});

test("origin is immutable and a selected transition request is consumed once", async () => {
  const supportRoot = await mkdtemp(path.join(tmpdir(), "des-art-transition-"));
  await saveSandboxOrigin({ supportRoot, sourceSha: "a".repeat(40), projects: [project("base")], assetHashes: {} });
  await saveSandboxOrigin({ supportRoot, sourceSha: "b".repeat(40), projects: [project("other")], assetHashes: {} });
  assert.equal((await readSandboxOrigin(supportRoot)).sourceSha, "a".repeat(40));
  await saveLiveTransitionRequest({ supportRoot, choice: "overlay", targetSha: "a".repeat(40), transitionId: "transition-test", requestedAt: "2026-09-02T00:00:00.000Z" });
  await assert.rejects(saveLiveTransitionRequest({ supportRoot, choice: "clean", targetSha: "a".repeat(40), transitionId: "transition-other", requestedAt: "2026-09-02T00:00:00.000Z" }), /already exists/);
  assert.equal((await consumeLiveTransitionRequest(supportRoot)).choice, "overlay");
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
  await writeFile(canonical, `${JSON.stringify(project("sarafan", { title: "Base" }))}\n`);
  await mkdir(path.join(archiveRoot, "draft-assets", "sarafan"), { recursive: true });
  await writeFile(path.join(archiveRoot, "draft-assets", "sarafan", "new.png"), "draft image");
  const sandboxWithAsset = project("sarafan", { title: "Sandbox", visuals: { catalog: { templateId: "catalog.browser", assets: { screen: [{ src: "/assets/projects/sarafan/new.png" }] } } } });
  await writeFile(path.join(archiveRoot, "drafts", "sarafan.json"), `${JSON.stringify(sandboxWithAsset)}\n`);

  const result = await stageUnpublishedDraftTransfer({ archiveRoot, stagingRoot, origin: buildSandboxOrigin({ sourceSha: "a".repeat(40), projects: [base], assetHashes: {} }), productionProjects: [JSON.parse(await readFile(canonical, "utf8"))] });
  assert.equal(result.reviewRequired, false);
  assert.equal(JSON.parse(await readFile(path.join(stagingRoot, "drafts", "sarafan.json"), "utf8")).title, "Sandbox");
  await access(path.join(stagingRoot, "draft-assets", "sarafan", "new.png"));
  assert.equal(JSON.parse(await readFile(canonical, "utf8")).title, "Base");
});

test("blocked delta staging leaves no partial draft files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-transition-blocked-stage-"));
  const archiveRoot = path.join(root, "archive");
  const stagingRoot = path.join(root, "staging");
  const base = project("sarafan", { title: "Base" });
  await mkdir(path.join(archiveRoot, "drafts"), { recursive: true });
  await writeFile(path.join(archiveRoot, "drafts", "sarafan.json"), JSON.stringify(project("sarafan", { title: "Sandbox" })));

  const result = await stageUnpublishedDraftTransfer({
    archiveRoot,
    stagingRoot,
    origin: buildSandboxOrigin({ sourceSha: "a".repeat(40), projects: [base], assetHashes: {} }),
    productionProjects: [project("sarafan", { title: "Production" })],
  });

  assert.equal(result.blocked, true);
  await assert.rejects(access(path.join(stagingRoot, "drafts", "sarafan.json")));
});

test("staging keeps an unchanged production asset without requiring a sandbox copy", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-transition-canonical-asset-"));
  const archiveRoot = path.join(root, "archive");
  const stagingRoot = path.join(root, "staging");
  const visual = { catalog: { templateId: "catalog.browser", assets: { screen: [{ src: "/assets/projects/sarafan/canonical.png", alt: "Canonical", width: 2880, height: 1920 }] } } };
  const base = project("sarafan", { title: "Base", visuals: visual });
  const sandbox = project("sarafan", { title: "Sandbox title", visuals: visual });
  const production = project("sarafan", { title: "Base", visuals: visual });
  await mkdir(path.join(archiveRoot, "drafts"), { recursive: true });
  await writeFile(path.join(archiveRoot, "drafts", "sarafan.json"), `${JSON.stringify(sandbox)}\n`);

  const result = await stageUnpublishedDraftTransfer({
    archiveRoot,
    stagingRoot,
    origin: buildSandboxOrigin({ sourceSha: "a".repeat(40), projects: [base], assetHashes: {} }),
    productionProjects: [production],
  });

  assert.equal(result.drafts[0].title, "Sandbox title");
  await assert.rejects(access(path.join(stagingRoot, "draft-assets", "sarafan", "canonical.png")));
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
