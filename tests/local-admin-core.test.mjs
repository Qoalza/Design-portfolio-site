import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { PROJECT_DOCUMENT_VERSION } from "../src/lib/project-contract.ts";
import {
  AdminStore,
  createProjectSlug,
  inspectSvg,
  inspectImage,
  safeUploadName,
  validateLocalRequest,
} from "../tools/des-art-admin/core.mjs";

test("project slugs are readable, Unicode-safe and collision resistant", async () => {
  assert.equal(createProjectSlug("Новый проект. Тест", []), "novyi-proekt-test");
  assert.equal(createProjectSlug("Sarafan.Radio", []), "sarafan-radio");
  assert.equal(createProjectSlug("NEW project", ["new-project"]), "new-project-2");
  assert.match(createProjectSlug("🎉", []), /^project-[a-f0-9]{8}$/);
});

test("project creation is atomic and accepts a free-form title", async () => {
  const store = new AdminStore(await roots());
  const first = await store.createProject({ title: "Новый проект. Тест" });
  const second = await store.createProject({ title: "Новый проект. Тест" });
  assert.equal(first.slug, "novyi-proekt-test");
  assert.equal(second.slug, "novyi-proekt-test-2");
  assert.equal(first.title, "Новый проект. Тест");
});

test("SVG inspection accepts passive square artwork and rejects active markup", () => {
  const safe = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>');
  assert.deepEqual(inspectSvg(safe, "Logo.svg"), { mime: "image/svg+xml", width: 24, height: 24, extension: ".svg" });
  assert.throws(() => inspectSvg(Buffer.from('<svg viewBox="0 0 24 24"><script>alert(1)</script></svg>'), "x.svg"), /active|unsafe/i);
  assert.throws(() => inspectSvg(Buffer.from('<svg viewBox="0 0 24 24"><image href="https://example.com/x.png"/></svg>'), "x.svg"), /active|unsafe/i);
  assert.throws(() => inspectSvg(Buffer.from('<svg viewBox="0 0 24 12"></svg>'), "x.svg"), /square/i);
});

const project = (slug = "admin-test", overrides = {}) => ({
  schemaVersion: PROJECT_DOCUMENT_VERSION,
  title: "Тестовый проект",
  slug,
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
  content: [],
  ...overrides,
});

async function roots() {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-admin-"));
  return {
    contentRoot: path.join(root, "repo", "content", "projects"),
    assetRoot: path.join(root, "repo", "public", "assets", "projects"),
    draftRoot: path.join(root, "drafts"),
  };
}

test("local request boundary accepts only loopback Host, trusted Origin and CSRF", () => {
  const token = "known-token";
  assert.doesNotThrow(() => validateLocalRequest({ method: "POST", host: "127.0.0.1:41731", origin: "http://127.0.0.1:41731", csrf: token }, token, 41731));
  assert.throws(() => validateLocalRequest({ method: "POST", host: "evil.example", origin: "http://127.0.0.1:41731", csrf: token }, token, 41731), /host/i);
  assert.throws(() => validateLocalRequest({ method: "POST", host: "127.0.0.1:41731", origin: "https://evil.example", csrf: token }, token, 41731), /origin/i);
  assert.throws(() => validateLocalRequest({ method: "POST", host: "127.0.0.1:41731", origin: "http://127.0.0.1:41731", csrf: "wrong" }, token, 41731), /csrf/i);
});

test("admin CRUD preserves lifecycle data and soft deletes instead of destroying", async () => {
  const store = new AdminStore(await roots());
  await store.saveProject(project());
  assert.equal((await store.getProject("admin-test")).title, "Тестовый проект");
  const duplicate = await store.duplicateProject("admin-test", "admin-copy");
  assert.equal(duplicate.visibility, "draft");
  assert.equal(duplicate.featuredOnHome, false);
  const deleted = await store.setVisibility("admin-test", "deleted");
  assert.equal(deleted.visibility, "deleted");
  assert.equal(deleted.featuredOnHome, false);
  assert.equal((await store.getProject("admin-test")).description, "Описание");
  const restored = await store.setVisibility("admin-test", "draft");
  assert.equal(restored.visibility, "draft");
});

test("draft survives a new store instance", async () => {
  const configured = await roots();
  await new AdminStore(configured).saveDraft("admin-test", project());
  assert.deepEqual(await new AdminStore(configured).getDraft("admin-test"), project());
});

test("draft store accepts incomplete form values and reports real unpublished changes", async () => {
  const configured = await roots();
  const store = new AdminStore(configured);
  const canonical = project("admin-test", { visibility: "published", detailAvailable: true });
  await store.saveProject(canonical);
  assert.deepEqual(await store.getChangeInventory(), { count: 0, projects: [] });

  await store.saveDraft("admin-test", {
    ...canonical,
    materials: { projectState: "completed", fileState: "available", figmaUrl: "" },
  });

  assert.equal((await store.getDraft("admin-test")).materials.figmaUrl, "");
  const inventory = await store.getChangeInventory();
  assert.equal(inventory.count, 1);
  assert.deepEqual(inventory.projects.map(({ slug, valid }) => ({ slug, valid })), [
    { slug: "admin-test", valid: false },
  ]);
});

test("lifecycle changes do not reject an otherwise incomplete admin draft", async () => {
  const configured = await roots();
  const store = new AdminStore(configured);
  await store.saveDraft("admin-test", project("admin-test", {
    materials: { projectState: "completed", fileState: "available", figmaUrl: "" },
  }));

  const deleted = await store.setVisibility("admin-test", "deleted");
  assert.equal(deleted.visibility, "deleted");
  assert.equal(deleted.materials.figmaUrl, "");
});

test("preview preparation compiles only a valid draft into an isolated overlay", async () => {
  const configured = await roots();
  const store = new AdminStore(configured);
  const previewRoot = path.join(path.dirname(configured.draftRoot), "preview-drafts");
  await store.saveDraft("preview", project("preview", { detailAvailable: true }));
  await store.preparePreview("preview", previewRoot);
  const compiled = JSON.parse(await readFile(path.join(previewRoot, "preview.json"), "utf8"));
  assert.equal(compiled.slug, "preview");
  assert.equal("admin" in compiled, false);

  await store.saveDraft("preview", project("preview", {
    detailAvailable: true,
    materials: { projectState: "completed", fileState: "available", figmaUrl: "" },
  }));
  await assert.rejects(() => store.preparePreview("preview", previewRoot), (error) => {
    assert.equal(error.name, "DraftValidationError");
    assert.equal(error.issues[0].field, "materials.figmaUrl");
    return true;
  });
});

test("project list overlays newer drafts without changing canonical files", async () => {
  const configured = await roots();
  const store = new AdminStore(configured);
  await store.saveProject(project("admin-test", { title: "Опубликованное название" }));
  await store.saveDraft("admin-test", project("admin-test", { title: "Черновое название" }));
  assert.equal((await store.listProjects())[0].title, "Черновое название");
  assert.equal((await store.getPublishedProject("admin-test")).title, "Опубликованное название");
});

test("reorder updates drafts for published projects only and rejects unknown slugs", async () => {
  const store = new AdminStore(await roots());
  await store.saveProject(project("one", { visibility: "published" }));
  await store.saveProject(project("two", { visibility: "published", catalogOrder: 2 }));
  await store.reorder(["two", "one"]);
  assert.equal((await store.getProject("two")).catalogOrder, 1);
  assert.equal((await store.getProject("one")).catalogOrder, 2);
  await assert.rejects(() => store.reorder(["missing"]), /unknown/i);
});

test("image inspection validates MIME, extension and intrinsic PNG dimensions", async () => {
  const png = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(png);
  png.writeUInt32BE(640, 16);
  png.writeUInt32BE(360, 20);
  assert.deepEqual(inspectImage(png, "image.png", "image/png"), { extension: ".png", width: 640, height: 360, mime: "image/png" });
  assert.throws(() => inspectImage(png, "image.jpg", "image/png"), /extension/i);
  assert.throws(() => inspectImage(Buffer.from("not image"), "image.png", "image/png"), /signature/i);
});

test("uploads use safe names, reject traversal and warn on duplicates", async () => {
  assert.equal(safeUploadName("Hero Screen (1).PNG"), "hero-screen-1.png");
  assert.throws(() => safeUploadName("../secret.png"), /filename/i);
  const configured = await roots();
  const store = new AdminStore(configured);
  await store.saveProject(project());
  const png = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(png);
  png.writeUInt32BE(20, 16);
  png.writeUInt32BE(10, 20);
  const first = await store.saveImage("admin-test", "Hero.png", "image/png", png, "Hero alt");
  const second = await store.saveImage("admin-test", "Another.png", "image/png", png, "Hero alt");
  assert.equal(first.width, 20);
  assert.equal(second.duplicateOf, first.src);
  assert.equal(await readFile(path.join(configured.assetRoot, "admin-test", "hero.png"), "hex"), png.toString("hex"));
  assert.equal((await store.readImage("admin-test", "hero.png")).toString("hex"), png.toString("hex"));
  await assert.rejects(() => store.saveImage("../escape", "x.png", "image/png", png, "Alt"), /slug/i);
  await assert.rejects(() => store.readImage("admin-test", "../secret.png"), /path|filename/i);
});

test("permanent deletion is allowed only for an unpublished deleted draft", async () => {
  const configured = await roots();
  const store = new AdminStore(configured);
  await store.saveDraft("draft-deleted", project("draft-deleted", { visibility: "deleted" }));
  await store.permanentlyDelete("draft-deleted");
  await assert.rejects(() => store.getDraft("draft-deleted"));

  await store.saveProject(project("live", { visibility: "published" }));
  await store.saveDraft("live", project("live", { visibility: "deleted" }));
  await assert.rejects(() => store.permanentlyDelete("live"), /publish this deletion/i);
});
