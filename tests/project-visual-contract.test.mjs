import assert from "node:assert/strict";
import test from "node:test";

import {
  PROJECT_VISUAL_TEMPLATES,
  validateTemplateAssets,
  validateProjectCollection,
} from "../src/lib/project-visual-registry.ts";
import {
  PROJECT_DOCUMENT_VERSION,
  validateProjectDocument,
} from "../src/lib/project-contract.ts";
import { migrateProjectV2ToV3 } from "../tools/des-art-admin/project-v2-migration.ts";

const image = (name, width = 2880, height = 1920) => ({
  src: `/assets/projects/test/${name}.png`,
  alt: name,
  width,
  height,
});

const project = (overrides = {}) => ({
  schemaVersion: 3,
  designProfile: "catalog-only-v1",
  title: "Тест",
  slug: "test",
  description: "Описание",
  role: "Product Designer",
  year: 2026,
  tags: [],
  detailTags: [],
  visibility: "published",
  catalogOrder: 1,
  detailAvailable: false,
  materials: { projectState: "completed", fileState: "absent" },
  platforms: [],
  visuals: {
    catalog: { templateId: "catalog.browser", assets: { screen: [image("screen")] } },
  },
  content: [],
  ...overrides,
});

test("schema v3 exposes only approved templates and named content assets", () => {
  assert.equal(PROJECT_DOCUMENT_VERSION, 3);
  assert.deepEqual(Object.keys(PROJECT_VISUAL_TEMPLATES).sort(), [
    "canvas.corvo-controls",
    "canvas.corvo-process",
    "canvas.corvo-quotes",
    "canvas.sarafan-model",
    "canvas.sarafan-scenarios",
    "canvas.sarafan-setup",
    "catalog.browser",
    "catalog.corvo-stack",
    "catalog.sarafan-collage",
    "gallery.devices-v1",
    "hero.corvo-browser",
    "hero.sarafan-collage",
    "home.sarafan-radio",
    "notice.info-v1",
  ]);
  assert.deepEqual(validateProjectDocument(project()), project());
});

test("schema v3 rejects every legacy visual-authority field", () => {
  for (const field of ["catalogFrame", "heroFrame", "featuredOnHome", "homeOrder", "catalogImage", "hero", "homeImages"]) {
    assert.throws(() => validateProjectDocument({ ...project(), [field]: {} }), /unknown field/i, field);
  }
  assert.throws(() => validateProjectDocument({ ...project(), content: [{ type: "section", heading: "A", blocks: [{ type: "frame", composition: {} }] }] }), /not a supported/i);
  assert.throws(() => validateProjectDocument({ ...project(), content: [{ type: "section", heading: "A", blocks: [{ type: "heading", level: 4, content: [{ type: "text", text: "No" }] }] }] }), /level/i);
});

test("registry enforces slot names, counts, ratio and minimum source size", () => {
  const missing = project({ visuals: { catalog: { templateId: "catalog.browser", assets: {} } } });
  assert.throws(() => validateProjectDocument(missing), /screen/i);
  const wrongRatio = project({ visuals: { catalog: { templateId: "catalog.browser", assets: { screen: [image("wrong", 2000, 1000)] } } } });
  assert.throws(() => validateProjectDocument(wrongRatio), /proportion/i);
  const tooSmall = project({ visuals: { catalog: { templateId: "catalog.browser", assets: { screen: [image("small", 935, 623)] } } } });
  assert.throws(() => validateProjectDocument(tooSmall), /minimum/i);
});

test("Sarafan scenarios keeps legacy crops preview-valid until their Frame is refreshed", () => {
  assert.doesNotThrow(() => validateTemplateAssets(
    "canvas.sarafan-scenarios",
    { content: [image("legacy-scenarios", 1722, 699)] },
    "legacy Sarafan scenarios",
  ));
});

test("Sarafan model accepts the current complete-card crop independently from scenarios", () => {
  assert.doesNotThrow(() => validateTemplateAssets(
    "canvas.sarafan-model",
    { content: [image("current-model", 1520, 768)] },
    "current Sarafan model",
  ));
});

test("Sarafan model keeps the legacy migration crop preview-valid until its Frame is refreshed", () => {
  assert.doesNotThrow(() => validateTemplateAssets(
    "canvas.sarafan-model",
    { content: [image("legacy-model", 1776, 480)] },
    "legacy Sarafan model",
 ));
});

test("gallery device pools inherit the proportion of their first image", () => {
  const mixed = project({
    designProfile: "corvo-v1",
    visuals: {
      catalog: { templateId: "catalog.corvo-stack", assets: { backdrop: [image("back", 2960, 2400)], foreground: [image("front", 2960, 2400)] } },
      hero: { templateId: "hero.corvo-browser", assets: { backdrop: [image("back", 2960, 2400)], foreground: [image("front", 2960, 2400)] } },
    },
    content: [{ type: "gallery", templateId: "gallery.devices-v1", groups: [{ deviceId: "desktop", images: [image("one", 1480, 1024), image("two", 1920, 1080)] }] }],
  });
  assert.throws(() => validateProjectDocument(mixed), /first image proportion/i);
});

test("gallery device pools accept high-density images with the first image proportion", () => {
  const valid = project({
    designProfile: "corvo-v1",
    visuals: {
      catalog: { templateId: "catalog.corvo-stack", assets: { backdrop: [image("back", 2960, 2400)], foreground: [image("front", 2960, 2400)] } },
      hero: { templateId: "hero.corvo-browser", assets: { backdrop: [image("back", 2960, 2400)], foreground: [image("front", 2960, 2400)] } },
    },
    content: [{ type: "gallery", templateId: "gallery.devices-v1", groups: [{ deviceId: "desktop", images: [image("one", 1480, 1280), image("two", 4440, 3840)] }] }],
  });
  assert.doesNotThrow(() => validateProjectDocument(valid));
});

test("profile, homepage and catalog positions are validated globally", () => {
  const primary = project({ slug: "corvo", designProfile: "corvo-v1", homePlacement: "primary", visuals: {
    catalog: { templateId: "catalog.corvo-stack", assets: { backdrop: [image("back", 2960, 2400)], foreground: [image("front", 2960, 2400)] } },
    home: { templateId: "catalog.corvo-stack", assets: { backdrop: [image("back", 2960, 2400)], foreground: [image("front", 2960, 2400)] } },
    hero: { templateId: "hero.corvo-browser", assets: { backdrop: [image("back", 2960, 2400)], foreground: [image("front", 2960, 2400)] } },
  } });
  assert.doesNotThrow(() => validateProjectCollection([primary, project({ slug: "boff", catalogOrder: 2 })]));
  assert.throws(() => validateProjectCollection([primary, { ...primary, slug: "other", catalogOrder: 2 }]), /primary/i);
  assert.throws(() => validateProjectCollection([project({ slug: "wide-mismatch", catalogOrder: 1 })]), /wide/i);
});

test("v2 is read only by the dedicated migrator and serializer target is v3", () => {
  const legacy = {
    ...project(),
    schemaVersion: 2,
    featuredOnHome: false,
    catalogImage: image("screen"),
  };
  delete legacy.designProfile;
  delete legacy.visuals;
  assert.throws(() => validateProjectDocument(legacy), /schemaVersion|unknown field/i);
  const migrated = migrateProjectV2ToV3(legacy);
  assert.equal(migrated.schemaVersion, 3);
  assert.equal(migrated.visuals.catalog.templateId, "catalog.browser");
  assert.equal("catalogImage" in migrated, false);
});
