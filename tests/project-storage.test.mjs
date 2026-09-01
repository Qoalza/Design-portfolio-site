import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { PROJECT_DOCUMENT_VERSION, serializeProjectDocument } from "../src/lib/project-contract.ts";
import { getAllProjects, getAllProjectsForPreview, getCatalogProjects, getProjectBySlug, getProjectBySlugForPreview, readAllProjectDocuments, writeProjectDocument } from "../src/lib/projects.ts";

const corvoImage = (src, alt = "") => ({ src, alt, width: 2960, height: 2400 });
const corvoVisuals = () => {
  const backdrop = corvoImage("/assets/homepage/corvo-dashboard.png");
  const foreground = corvoImage("/assets/homepage/corvo-product.png", "Corvo");
  const stack = { templateId: "catalog.corvo-stack", assets: { backdrop: [backdrop], foreground: [foreground] } };
  return { catalog: stack, home: stack, hero: { templateId: "hero.corvo-browser", assets: stack.assets } };
};
const browserVisuals = () => ({ catalog: { templateId: "catalog.browser", assets: { screen: [{ src: "/assets/projects/catalog/boff-transactions.png", alt: "", width: 2880, height: 1920 }] } } });
const sarafanVisuals = () => {
  const assets = {
    dashboard: [{ src: "/assets/homepage/radio-dashboard.png", alt: "", width: 2880, height: 2518 }],
    player: [{ src: "/assets/homepage/radio-player.png", alt: "", width: 1688, height: 612 }],
    payment: [{ src: "/assets/homepage/radio-payment.png", alt: "", width: 760, height: 1100 }],
  };
  return { catalog: { templateId: "catalog.sarafan-collage", assets }, home: { templateId: "home.sarafan-radio", assets } };
};

function project(slug, visibility = "published", overrides = {}) {
  return {
    schemaVersion: PROJECT_DOCUMENT_VERSION,
    designProfile: "corvo-v1",
    title: slug,
    slug,
    description: `${slug} description`,
    role: "Product Designer",
    year: 2026,
    tags: [],
    detailTags: [],
    visibility,
    catalogOrder: 1,
    detailAvailable: true,
    materials: { projectState: "completed", fileState: "absent" },
    platforms: [],
    visuals: corvoVisuals(),
    content: [],
    ...overrides,
  };
}

async function projectRoot() { return mkdtemp(path.join(tmpdir(), "des-art-project-storage-")); }

test("storage reads canonical v3 documents and requires filename/slug equality", async () => {
  const root = await projectRoot();
  await writeFile(path.join(root, "wrong-name.json"), serializeProjectDocument(project("right-name")));
  assert.throws(() => readAllProjectDocuments(root), /filename.*slug/i);
});

test("public storage rejects legacy schema-v2 documents", async () => {
  const root = await projectRoot();
  await writeFile(path.join(root, "legacy.json"), JSON.stringify({ schemaVersion: 2, slug: "legacy" }));
  assert.throws(() => readAllProjectDocuments(root), /schemaVersion must be 3/i);
});

test("public readers expose ordered projects and exactly two named homepage positions", async () => {
  const root = await projectRoot();
  const fixtures = [
    project("corvo", "published", { catalogOrder: 1, homePlacement: "primary" }),
    project("sarafan", "published", { designProfile: "sarafan-v1", catalogOrder: 2, homePlacement: "secondary", detailAvailable: false, visuals: sarafanVisuals() }),
    project("boff", "published", { designProfile: "catalog-only-v1", catalogOrder: 3, detailAvailable: false, visuals: browserVisuals() }),
    project("draft", "draft", { catalogOrder: 4, detailAvailable: false }),
    project("deleted", "deleted", { catalogOrder: 5, detailAvailable: false }),
  ];
  for (const fixture of fixtures) await writeFile(path.join(root, `${fixture.slug}.json`), serializeProjectDocument(fixture));
  assert.deepEqual(getAllProjects(root).map(({ slug }) => slug), ["corvo", "sarafan", "boff"]);
  assert.deepEqual(getCatalogProjects(root).map(({ slug }) => slug), ["corvo", "sarafan"]);
  assert.equal(getProjectBySlug("corvo", root)?.slug, "corvo");
  assert.equal(getProjectBySlug("sarafan", root), undefined);
  assert.equal(getProjectBySlugForPreview("draft", root)?.slug, "draft");
});

test("writer emits a canonical document at the validated slug path", async () => {
  const root = await projectRoot();
  const value = project("written-project");
  const writtenPath = await writeProjectDocument(value, root);
  assert.equal(writtenPath, path.join(root, "written-project.json"));
  assert.equal(await readFile(writtenPath, "utf8"), serializeProjectDocument(value));
});

test("preview reads a schema-v3 draft overlay without changing the public reader", async () => {
  const root = await projectRoot();
  const drafts = await projectRoot();
  await writeFile(path.join(root, "overlay.json"), serializeProjectDocument(project("overlay", "published", { title: "Published" })));
  await writeFile(path.join(drafts, "overlay.json"), serializeProjectDocument(project("overlay", "draft", { title: "Draft" })));
  const previousPreview = process.env.DES_ART_ADMIN_PREVIEW;
  const previousDraftRoot = process.env.DES_ART_ADMIN_DRAFT_ROOT;
  process.env.DES_ART_ADMIN_PREVIEW = "1";
  process.env.DES_ART_ADMIN_DRAFT_ROOT = drafts;
  try {
    assert.equal(getProjectBySlugForPreview("overlay", root)?.title, "Draft");
    assert.equal(getProjectBySlug("overlay", root)?.title, "Published");
  } finally {
    if (previousPreview === undefined) delete process.env.DES_ART_ADMIN_PREVIEW; else process.env.DES_ART_ADMIN_PREVIEW = previousPreview;
    if (previousDraftRoot === undefined) delete process.env.DES_ART_ADMIN_DRAFT_ROOT; else process.env.DES_ART_ADMIN_DRAFT_ROOT = previousDraftRoot;
  }
});

test("catalog preview validates a partial draft overlay only after merging canonical projects", async () => {
  const root = await projectRoot();
  const drafts = await projectRoot();
  const fixtures = [
    project("corvo", "published", { catalogOrder: 1, homePlacement: "primary" }),
    project("sarafan", "published", { designProfile: "sarafan-v1", catalogOrder: 2, homePlacement: "secondary", detailAvailable: false, visuals: sarafanVisuals() }),
    project("boff", "published", { designProfile: "catalog-only-v1", catalogOrder: 3, detailAvailable: false, visuals: browserVisuals() }),
  ];
  for (const fixture of fixtures) await writeFile(path.join(root, `${fixture.slug}.json`), serializeProjectDocument(fixture));
  await writeFile(path.join(drafts, "sarafan.json"), serializeProjectDocument({ ...fixtures[1], title: "Draft Sarafan" }));
  const previousPreview = process.env.DES_ART_ADMIN_PREVIEW;
  const previousDraftRoot = process.env.DES_ART_ADMIN_DRAFT_ROOT;
  process.env.DES_ART_ADMIN_PREVIEW = "1";
  process.env.DES_ART_ADMIN_DRAFT_ROOT = drafts;
  try {
    const projects = getAllProjectsForPreview(root);
    assert.deepEqual(projects.map(({ slug }) => slug), ["corvo", "sarafan", "boff"]);
    assert.equal(projects[1].title, "Draft Sarafan");
  } finally {
    if (previousPreview === undefined) delete process.env.DES_ART_ADMIN_PREVIEW; else process.env.DES_ART_ADMIN_PREVIEW = previousPreview;
    if (previousDraftRoot === undefined) delete process.env.DES_ART_ADMIN_DRAFT_ROOT; else process.env.DES_ART_ADMIN_DRAFT_ROOT = previousDraftRoot;
  }
});
