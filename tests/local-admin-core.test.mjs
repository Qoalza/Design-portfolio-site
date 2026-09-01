import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { PROJECT_DOCUMENT_VERSION } from "../src/lib/project-contract.ts";
import { AdminStore, createProjectSlug, inspectImage, inspectSvg, safeUploadName, validateLocalRequest } from "../tools/des-art-admin/core.mjs";
import { compileAdminDraft } from "../tools/des-art-admin/draft-contract.mjs";
import { humanError, UserFacingError } from "../tools/des-art-admin/human-errors.mjs";

const image = (src, alt = "") => ({ src, alt, width: 2960, height: 2400 });
const corvoVisuals = () => {
  const backdrop = image("/assets/homepage/corvo-dashboard.png");
  const foreground = image("/assets/homepage/corvo-product.png", "Corvo");
  return {
    catalog: { templateId: "catalog.corvo-stack", assets: { backdrop: [backdrop], foreground: [foreground] } },
    home: { templateId: "catalog.corvo-stack", assets: { backdrop: [backdrop], foreground: [foreground] } },
    hero: { templateId: "hero.corvo-browser", assets: { backdrop: [backdrop], foreground: [foreground] } },
  };
};

const project = (slug = "admin-test", overrides = {}) => ({
  schemaVersion: PROJECT_DOCUMENT_VERSION,
  designProfile: "corvo-v1",
  title: "Тестовый проект",
  slug,
  description: "Описание",
  role: "Product Designer",
  year: 2026,
  tags: [],
  detailTags: [],
  visibility: "draft",
  catalogOrder: 1,
  detailAvailable: false,
  materials: { projectState: "completed", fileState: "absent" },
  platforms: [],
  visuals: corvoVisuals(),
  content: [],
  ...overrides,
});

async function roots() {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-admin-"));
  return {
    contentRoot: path.join(root, "repo", "content", "projects"),
    assetRoot: path.join(root, "repo", "public", "assets", "projects"),
    draftRoot: path.join(root, "drafts"),
    snapshotRoot: path.join(root, "published-snapshots"),
    draftAssetRoot: path.join(root, "draft-assets"),
  };
}

test("user-facing errors keep known causes actionable and hide unknown diagnostics", () => {
  assert.deepEqual(humanError(new UserFacingError("Изображение не обновлено", "Экспортируйте слот заново.")), {
    title: "Изображение не обновлено", message: "Экспортируйте слот заново.", status: 400,
  });
  const unknown = humanError(new Error("internal registry exploded"));
  assert.match(unknown.message, /ручная диагностика разработчиком/i);
  assert.doesNotMatch(`${unknown.title} ${unknown.message}`, /registry exploded/);
  assert.deepEqual(humanError(new Error("asset has an incompatible proportion.")), {
    title: "Пропорции изображения не подходят",
    message: "Этот слот принимает только изображение с утверждённым соотношением сторон. Экспортируйте изображение в нужных пропорциях и загрузите его снова.",
    status: 400,
  });
  assert.equal(humanError(new Error("asset is below the minimum 2× source size.")).title, "Изображение слишком маленькое");
});

test("project slugs are readable, Unicode-safe and collision resistant", () => {
  assert.equal(createProjectSlug("Новый проект. Тест", []), "novyi-proekt-test");
  assert.equal(createProjectSlug("Sarafan.Radio", []), "sarafan-radio");
  assert.equal(createProjectSlug("NEW project", ["new-project"]), "new-project-2");
  assert.match(createProjectSlug("🎉", []), /^project-[a-f0-9]{8}$/);
});

test("project creation is atomic and starts with the safe catalog-only profile", async () => {
  const store = new AdminStore(await roots());
  const first = await store.createProject({ title: "Новый проект. Тест" });
  const second = await store.createProject({ title: "Новый проект. Тест" });
  assert.equal(first.slug, "novyi-proekt-test");
  assert.equal(second.slug, "novyi-proekt-test-2");
  assert.equal(first.designProfile, "catalog-only-v1");
  assert.equal(first.visuals.catalog.templateId, "catalog.browser");
  assert.equal(first.homePlacement, undefined);
});

test("SVG and image inspection reject unsafe or mismatched uploads", () => {
  const safe = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>');
  assert.deepEqual(inspectSvg(safe, "Logo.svg"), { mime: "image/svg+xml", width: 24, height: 24, extension: ".svg" });
  assert.throws(() => inspectSvg(Buffer.from('<svg viewBox="0 0 24 24"><script>alert(1)</script></svg>'), "x.svg"), /active|unsafe/i);
  const png = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(png);
  png.writeUInt32BE(936, 16); png.writeUInt32BE(624, 20);
  assert.deepEqual(inspectImage(png, "image.png", "image/png"), { extension: ".png", width: 936, height: 624, mime: "image/png" });
  assert.throws(() => inspectImage(png, "image.jpg", "image/png"), /extension/i);
  const tooLarge = Buffer.from(png);
  tooLarge.writeUInt32BE(8_000, 16); tooLarge.writeUInt32BE(6_000, 20);
  assert.throws(() => inspectImage(tooLarge, "too-large.png", "image/png"), /40 megapixels/i);
});

test("local request boundary accepts only loopback Host, trusted Origin and CSRF", () => {
  const token = "known-token";
  assert.doesNotThrow(() => validateLocalRequest({ method: "POST", host: "127.0.0.1:41731", origin: "http://127.0.0.1:41731", csrf: token }, token, 41731));
  assert.throws(() => validateLocalRequest({ method: "POST", host: "evil.example", origin: "http://127.0.0.1:41731", csrf: token }, token, 41731), /host/i);
  assert.throws(() => validateLocalRequest({ method: "POST", host: "127.0.0.1:41731", origin: "https://evil.example", csrf: token }, token, 41731), /origin/i);
});

test("CRUD preserves drafts, strips homepage placement on delete and keeps stable Admin ids", async () => {
  const configured = await roots();
  const store = new AdminStore(configured);
  await store.saveProject(project("admin-test", { visibility: "published", homePlacement: "primary" }));
  const duplicate = await store.duplicateProject("admin-test", "admin-copy");
  assert.equal(duplicate.designProfile, "catalog-only-v1");
  assert.equal(duplicate.homePlacement, undefined);
  const deleted = await store.setVisibility("admin-test", "deleted");
  assert.equal(deleted.homePlacement, undefined);
  const withSection = project("stable", { content: [{ type: "section", adminId: "stable-section", heading: "О проекте", blocks: [] }] });
  await store.saveDraft("stable", withSection);
  assert.equal((await new AdminStore(configured).getDraft("stable")).content[0].adminId, "stable-section");
});

test("preview compiles exact home, catalog and project overlays and rejects a missing hero", async () => {
  const configured = await roots();
  const store = new AdminStore(configured);
  const previewRoot = path.join(path.dirname(configured.draftRoot), "preview-drafts");
  await store.saveDraft("preview", project("preview", { visibility: "published", homePlacement: "primary", detailAvailable: true }));
  for (const route of ["home", "catalog", "project"]) {
    await store.preparePreview("preview", previewRoot, route);
    const compiled = JSON.parse(await readFile(path.join(previewRoot, "preview.json"), "utf8"));
    assert.equal(compiled.visibility, "published");
    assert.equal("admin" in compiled, false);
  }
  await store.saveDraft("preview", project("preview", { visuals: { catalog: corvoVisuals().catalog } }));
  await assert.rejects(() => store.preparePreview("preview", previewRoot, "project"), /hero-шаблон/i);
});

test("reorder validates template compatibility before preserving draft metadata", async () => {
  const configured = await roots();
  const store = new AdminStore(configured);
  await store.saveProject(project("wide", { visibility: "published", catalogOrder: 1 }));
  const compact = {
    ...project("compact", { visibility: "published", catalogOrder: 2 }),
    designProfile: "catalog-only-v1",
    visuals: { catalog: { templateId: "catalog.browser", assets: { screen: [{ src: "/assets/projects/catalog/boff-transactions.png", alt: "", width: 2880, height: 1920 }] } } },
  };
  await store.saveProject(compact);
  await store.saveDraft("wide", { ...project("wide", { visibility: "published", catalogOrder: 1 }), admin: { marker: "kept" } });
  await assert.rejects(() => store.reorder(["compact", "wide"]), /incompatible/i);
  await store.reorder(["wide", "compact"]);
  assert.equal((await store.getDraft("wide")).admin.marker, "kept");
});

test("gallery uploads reject wrong proportions, preserve duplicates and cannot bypass Figma-only surfaces", async () => {
  assert.equal(safeUploadName("Hero Screen (1).PNG"), "hero-screen-1.png");
  assert.throws(() => safeUploadName("../secret.png"), /filename/i);
  const configured = await roots();
  const store = new AdminStore(configured);
  const png = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(png);
  png.writeUInt32BE(1480, 16); png.writeUInt32BE(1024, 20);
  const policy = { templateId: "gallery.devices-v1", slot: "desktop", operation: "add" };
  const first = await store.saveImage("admin-test", "screen.png", "image/png", png, "Экран", policy);
  const second = await store.saveImage("admin-test", "copy.png", "image/png", png, "Экран", policy);
  assert.equal(second.src, first.src);
  await readFile(path.join(configured.draftAssetRoot, "admin-test", "screen.png"));
  const wrong = Buffer.from(png); wrong.writeUInt32BE(700, 20);
  await assert.rejects(() => store.saveImage("admin-test", "wrong.png", "image/png", wrong, "Экран", policy), /proportion/i);
  const tooSmall = Buffer.from(png); tooSmall.writeUInt32BE(740, 16); tooSmall.writeUInt32BE(512, 20);
  await assert.rejects(() => store.saveImage("admin-test", "small.png", "image/png", tooSmall, "Экран", policy), /minimum 2× source size/i);
  await assert.rejects(() => store.saveImage("admin-test", "card.png", "image/png", png, "Экран", { templateId: "catalog.browser", slot: "screen", operation: "replace" }), /только целым Figma Frame/i);
});

test("approved Figma import replaces a whole code-owned surface and keeps source only in Admin metadata", async () => {
  const configured = await roots();
  const imported = corvoVisuals().catalog;
  const store = new AdminStore({
    ...configured,
    figmaImporter: async ({ url, templateId }) => ({
      visual: { ...imported, templateId },
      source: { url, templateId },
    }),
  });
  await store.saveDraft("figma-card", project("figma-card"));
  const next = await store.importFigmaVisual("figma-card", {
    surface: "catalog",
    templateId: "catalog.corvo-stack",
    url: "https://www.figma.com/design/file/Test?node-id=1-2",
  });
  assert.deepEqual(next.visuals.catalog, imported);
  assert.deepEqual(next.visuals.home.assets, imported.assets);
  assert.equal(next.admin.visualSources.catalog.templateId, "catalog.corvo-stack");
  assert.equal("admin" in compileAdminDraft(next), false);
});

test("approved Figma import adds one interactive block to a section and rejects profile mismatches", async () => {
  const configured = await roots();
  const store = new AdminStore({
    ...configured,
    figmaImporter: async ({ url, templateId, templateIds }) => {
      const resolved = templateId ?? templateIds[0];
      return {
        visual: { templateId: resolved, assets: { content: [{ src: "/assets/projects/figma-section/figma/content.png", alt: "Цитаты", width: 1704, height: 732 }] } },
        source: { url, templateId: resolved },
      };
    },
  });
  await store.saveDraft("figma-section", project("figma-section", { content: [{ type: "section", adminId: "section-a", heading: "Решение", blocks: [] }] }));
  const next = await store.importFigmaVisual("figma-section", { surface: "section", sectionId: "section-a", url: "https://www.figma.com/design/file/Test?node-id=1-3" });
  assert.equal(next.content[0].blocks[0].type, "visual");
  assert.equal(next.content[0].blocks[0].templateId, "canvas.corvo-quotes");
  assert.equal(next.admin.visualSources["section-a"].url.includes("figma.com"), true);
  await assert.rejects(() => store.importFigmaVisual("figma-section", { surface: "section", sectionId: "section-a", templateId: "canvas.sarafan-model", url: "https://www.figma.com/design/file/Test?node-id=1-4" }), /не может быть переключён/i);
});

test("failed Figma import leaves the saved draft unchanged", async () => {
  const configured = await roots();
  const store = new AdminStore({ ...configured, figmaImporter: async () => { throw new Error("Frame содержит неверную структуру."); } });
  const before = project("figma-atomic", { content: [{ type: "section", adminId: "section-a", heading: "Решение", blocks: [] }] });
  await store.saveDraft("figma-atomic", before);
  await assert.rejects(() => store.importFigmaVisual("figma-atomic", { surface: "section", sectionId: "section-a", url: "https://www.figma.com/design/file/Test?node-id=1-5" }), /Сохранённый черновик не изменён/i);
  assert.deepEqual(await store.getDraft("figma-atomic"), before);
});

test("sandbox publish validates global placements and keeps them outside project-only scope", async () => {
  const configured = await roots();
  const store = new AdminStore(configured);
  const baseline = project("placed", { visibility: "published", catalogOrder: 1, homePlacement: "primary" });
  await store.saveProject(baseline);
  await store.ensureSnapshotBaseline();
  await store.saveDraft("placed", project("placed", { visibility: "published", catalogOrder: 2, title: "Изменённый проект" }));
  const inventory = await store.getChangeInventory();
  assert.deepEqual(inventory.globalProjects, ["placed"]);
  await store.publishSandbox({ scope: "project", slug: "placed" });
  const snapshot = await store.getSandboxPublishedProject("placed");
  assert.equal(snapshot.catalogOrder, 1);
  assert.equal(snapshot.homePlacement, "primary");
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
