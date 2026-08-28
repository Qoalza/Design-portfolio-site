import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { PROJECT_DOCUMENT_VERSION, serializeProjectDocument } from "../src/lib/project-contract.ts";
import {
  getAllProjects,
  getCatalogProjects,
  getProjectBySlug,
  getProjectBySlugForPreview,
  readAllProjectDocuments,
  writeProjectDocument,
} from "../src/lib/projects.ts";

function project(slug, visibility = "published", overrides = {}) {
  return {
    schemaVersion: PROJECT_DOCUMENT_VERSION,
    title: slug,
    slug,
    description: `${slug} description`,
    role: "Product Designer",
    year: 2026,
    tags: [],
    detailTags: [],
    visibility,
    catalogOrder: 1,
    featuredOnHome: false,
    detailAvailable: true,
    materials: { projectState: "completed", fileState: "absent" },
    platforms: [],
    content: [],
    ...overrides,
  };
}

async function projectRoot() {
  return mkdtemp(path.join(tmpdir(), "des-art-project-storage-"));
}

test("storage reads canonical project documents and requires filename/slug equality", async () => {
  const root = await projectRoot();
  await writeFile(path.join(root, "wrong-name.json"), serializeProjectDocument(project("right-name")));

  assert.throws(() => readAllProjectDocuments(root), /filename.*slug/i);
});

test("storage rejects duplicate slugs even when filenames differ", async () => {
  const root = await projectRoot();
  await writeFile(path.join(root, "same.json"), serializeProjectDocument(project("same")));
  await writeFile(path.join(root, "other.json"), serializeProjectDocument(project("other")));
  const duplicate = serializeProjectDocument(project("same")).replace('"slug": "same"', '"slug": "other"');
  await writeFile(path.join(root, "duplicate.json"), duplicate);

  assert.throws(() => readAllProjectDocuments(root), /filename.*slug|duplicate/i);
});

test("public readers expose every published project and a maximum of three homepage projects", async () => {
  const root = await projectRoot();
  const fixtures = [
    project("published", "published", { catalogOrder: 2, featuredOnHome: true, homeOrder: 2 }),
    project("catalog-hidden", "published", { catalogOrder: 1, featuredOnHome: true, homeOrder: 1 }),
    project("detail-hidden", "published", { detailAvailable: false, catalogOrder: 3, featuredOnHome: true, homeOrder: 3 }),
    project("fourth", "published", { catalogOrder: 4, featuredOnHome: true, homeOrder: 4 }),
    project("draft", "draft", { detailAvailable: false, catalogOrder: 5 }),
    project("deleted", "deleted", { detailAvailable: false, catalogOrder: 6 }),
  ];
  for (const fixture of fixtures) {
    await writeFile(path.join(root, `${fixture.slug}.json`), serializeProjectDocument(fixture));
  }

  assert.deepEqual(getAllProjects(root).map(({ slug }) => slug), ["catalog-hidden", "published", "detail-hidden", "fourth"]);
  assert.deepEqual(getCatalogProjects(root).map(({ slug }) => slug), ["catalog-hidden", "published", "detail-hidden"]);
  assert.equal(getProjectBySlug("published", root)?.slug, "published");
  assert.equal(getProjectBySlug("detail-hidden", root), undefined);
  assert.equal(getProjectBySlug("draft", root), undefined);
  assert.equal(getProjectBySlugForPreview("draft", root)?.slug, "draft");
  assert.equal(getProjectBySlugForPreview("deleted", root)?.slug, "deleted");
});

test("writer emits a canonical document at the validated slug path", async () => {
  const root = await projectRoot();
  const value = project("written-project");
  const writtenPath = await writeProjectDocument(value, root);

  assert.equal(writtenPath, path.join(root, "written-project.json"));
  assert.equal(await readFile(writtenPath, "utf8"), serializeProjectDocument(value));
});

test("preview reads the draft overlay without changing the public reader", async () => {
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
    if (previousPreview === undefined) delete process.env.DES_ART_ADMIN_PREVIEW;
    else process.env.DES_ART_ADMIN_PREVIEW = previousPreview;
    if (previousDraftRoot === undefined) delete process.env.DES_ART_ADMIN_DRAFT_ROOT;
    else process.env.DES_ART_ADMIN_DRAFT_ROOT = previousDraftRoot;
  }
});
