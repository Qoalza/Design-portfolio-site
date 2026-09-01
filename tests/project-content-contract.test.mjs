import assert from "node:assert/strict";
import { access, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PROJECT_DOCUMENT_VERSION, deleteProject, parseProjectDocument, resolveProjectAssetPath,
  resolveProjectDocumentPath, serializeProjectDocument, validateProjectDocument,
} from "../src/lib/project-contract.ts";

const image = (src, alt = "") => ({ src, alt, width: 2960, height: 2400 });
const backdrop = image("/assets/homepage/corvo-dashboard.png");
const foreground = image("/assets/homepage/corvo-product.png", "Главный экран Corvo");
const stack = { templateId: "catalog.corvo-stack", assets: { backdrop: [backdrop], foreground: [foreground] } };

const validProject = {
  schemaVersion: PROJECT_DOCUMENT_VERSION,
  designProfile: "corvo-v1",
  title: "Тестовый проект",
  slug: "test-project",
  description: "Описание проекта",
  subtitle: "Подзаголовок проекта",
  role: "Product Designer",
  year: 2026,
  tags: ["B2B", "SaaS"],
  detailTags: ["B2B", "Product Designer", "2026"],
  visibility: "published",
  catalogOrder: 1,
  homePlacement: "primary",
  detailAvailable: true,
  materials: { projectState: "in_progress", fileState: "available", figmaUrl: "https://www.figma.com/design/example", updatedAt: "13.05.2026" },
  platforms: ["Desktop", "Tablet", "Mobile"],
  logo: { type: "image", src: "/assets/projects/test-project/logo.svg" },
  visuals: {
    catalog: stack,
    home: stack,
    hero: { templateId: "hero.corvo-browser", assets: { backdrop: [backdrop], foreground: [foreground] } },
  },
  workSummary: "Что было сделано в проекте.",
  content: [
    {
      type: "section", heading: "Задача", blocks: [
        { type: "paragraph", content: [{ type: "text", text: "Обычный " }, { type: "strong", text: "текст" }] },
        { type: "heading", level: 3, content: [{ type: "text", text: "Подзаголовок" }] },
        { type: "list", style: "unordered", items: [[{ type: "text", text: "Первый пункт" }]] },
        { type: "notice", templateId: "notice.info-v1", content: [{ type: "text", text: "Важное примечание" }] },
        { type: "hardBreak" },
        { type: "visual", templateId: "canvas.corvo-quotes", assets: { content: [{ src: "/assets/projects/corvo/canvas/corvo-quotes.png", alt: "Цитаты", width: 1704, height: 732 }] } },
        { type: "divider" },
      ],
    },
    {
      type: "gallery", templateId: "gallery.devices-v1",
      groups: [{ deviceId: "desktop", images: [{ src: "/assets/projects/corvo/gallery/desktop-01.png", alt: "Экран", width: 2960, height: 2048 }] }],
    },
  ],
};

test("the project contract validates every supported v3 field and block", () => {
  assert.deepEqual(validateProjectDocument(validProject), validProject);
});

test("visual editor marks preserve combined formatting without markup text", () => {
  const project = structuredClone(validProject);
  project.content[0].blocks[0].content = [{ type: "text", text: "Жирный курсив", marks: ["strong", "emphasis", "underline"] }];
  const parsed = parseProjectDocument(serializeProjectDocument(project), "formatted-project.json");
  assert.deepEqual(parsed.content[0].blocks[0].content, project.content[0].blocks[0].content);
});

test("unknown visual authority and lifecycle values fail closed", () => {
  assert.throws(() => validateProjectDocument({ ...validProject, unexpected: true }), /unknown field "unexpected"/i);
  assert.throws(() => validateProjectDocument({ ...validProject, visibility: "archived" }), /visibility/i);
  assert.throws(() => validateProjectDocument({ ...validProject, catalogFrame: {} }), /catalogFrame/i);
  assert.throws(() => validateProjectDocument({ ...validProject, visibility: "draft" }), /homePlacement/i);
  assert.throws(() => validateProjectDocument({ ...validProject, homePlacement: "secondary" }), /corvo-v1/i);
  const legacyGalleryCopy = structuredClone(validProject);
  legacyGalleryCopy.content[1].title = "Пользовательская подпись";
  assert.throws(() => validateProjectDocument(legacyGalleryCopy), /unknown field "title"/i);
  const overflowingGallery = structuredClone(validProject);
  overflowingGallery.content[1].groups[0].images = Array.from({ length: 21 }, () => validProject.content[1].groups[0].images[0]);
  assert.throws(() => validateProjectDocument(overflowingGallery), /between 0 and 20/i);
});

test("soft delete is non-destructive and removes homepage placement", () => {
  const deleted = deleteProject(validProject);
  assert.equal(deleted.visibility, "deleted");
  assert.equal(deleted.homePlacement, undefined);
  assert.equal(deleted.slug, validProject.slug);
  assert.deepEqual(deleted.content, validProject.content);
});

test("slug and asset paths reject traversal and unsafe forms", () => {
  for (const slug of ["../secret", "Corvo", "two--dashes", "with space", "project/"]) assert.throws(() => resolveProjectDocumentPath("/workspace/content/projects", slug), /slug/i);
  for (const assetPath of ["../secret.png", "/absolute.png", "nested/../../secret.png", "nested\\secret.png", "image.png?raw=1"]) assert.throws(() => resolveProjectAssetPath("/workspace/public/assets/projects", "test-project", assetPath), /asset path/i);
  assert.equal(resolveProjectDocumentPath("/workspace/content/projects", "test-project"), "/workspace/content/projects/test-project.json");
  assert.equal(resolveProjectAssetPath("/workspace/public/assets/projects", "test-project", "gallery/screen-01.png"), "/workspace/public/assets/projects/test-project/gallery/screen-01.png");
});

test("serialization is canonical and stable across read-write-read cycles", () => {
  const first = serializeProjectDocument(validProject);
  const parsed = parseProjectDocument(first, "test-project.json");
  assert.equal(serializeProjectDocument(parsed), first);
  assert.deepEqual(parseProjectDocument(first, "test-project.json"), parsed);
  assert.ok(first.endsWith("\n"));
});

test("every canonical project has a stable v3 round-trip", async () => {
  for (const name of ["boff", "corvo", "sarafan-radio"]) {
    const source = await readFile(new URL(`../content/projects/${name}.json`, import.meta.url), "utf8");
    const parsed = parseProjectDocument(source, `${name}.json`);
    assert.equal(parsed.schemaVersion, 3);
    assert.equal(serializeProjectDocument(parsed), source);
  }
});

test("every canonical project asset exists and declared PNG dimensions are intrinsic", async () => {
  for (const name of ["boff", "corvo", "sarafan-radio"]) {
    const project = parseProjectDocument(await readFile(new URL(`../content/projects/${name}.json`, import.meta.url), "utf8"), `${name}.json`);
    const queue = [project];
    while (queue.length) {
      const value = queue.pop();
      if (Array.isArray(value)) { queue.push(...value); continue; }
      if (!value || typeof value !== "object") continue;
      if (typeof value.src === "string") {
        const assetUrl = new URL(`../public${value.src}`, import.meta.url);
        await access(assetUrl);
        if (value.src.endsWith(".png") && Number.isInteger(value.width) && Number.isInteger(value.height)) {
          const bytes = await readFile(assetUrl);
          assert.deepEqual({ width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }, { width: value.width, height: value.height }, value.src);
        }
      }
      queue.push(...Object.values(value));
    }
  }
});

test("resolved write targets remain inside caller-provided roots", async () => {
  const sandbox = await mkdtemp(path.join(tmpdir(), "des-art-contract-"));
  const contentRoot = path.join(sandbox, "content", "projects");
  const assetRoot = path.join(sandbox, "public", "assets", "projects");
  assert.equal(path.relative(contentRoot, resolveProjectDocumentPath(contentRoot, validProject.slug)), "test-project.json");
  assert.equal(path.relative(assetRoot, resolveProjectAssetPath(assetRoot, validProject.slug, "gallery/image.png")), path.join("test-project", "gallery", "image.png"));
});
