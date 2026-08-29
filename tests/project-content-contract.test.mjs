import assert from "node:assert/strict";
import { access, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PROJECT_DOCUMENT_VERSION,
  deleteProject,
  parseProjectDocument,
  resolveProjectAssetPath,
  resolveProjectDocumentPath,
  serializeProjectDocument,
  validateProjectDocument,
} from "../src/lib/project-contract.ts";

const validProject = {
  schemaVersion: PROJECT_DOCUMENT_VERSION,
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
  featuredOnHome: true,
  homeOrder: 1,
  detailAvailable: true,
  materials: { projectState: "in_progress", fileState: "available", figmaUrl: "https://www.figma.com/design/example", updatedAt: "13.05.2026" },
  platforms: ["Desktop", "Tablet", "Mobile"],
  logo: { type: "image", src: "/assets/projects/test-project/logo.svg" },
  hero: {
    presentation: "browser-composite",
    image: {
      src: "/assets/projects/test-project/hero.png",
      alt: "Главный экран тестового проекта",
      width: 2960,
      height: 2400,
    },
    backdrop: {
      src: "/assets/projects/test-project/hero-back.png",
      alt: "",
      width: 2960,
      height: 2400,
    },
    foreground: {
      src: "/assets/projects/test-project/hero-front.png",
      alt: "Главный экран тестового проекта",
      width: 2960,
      height: 2400,
    },
  },
  catalogImage: {
    src: "/assets/projects/test-project/catalog.png",
    alt: "Карточка тестового проекта",
    width: 1600,
    height: 900,
  },
  homeImages: [
    {
      src: "/assets/projects/test-project/home.png",
      alt: "",
      width: 1600,
      height: 900,
    },
  ],
  workSummary: "Что было сделано в проекте.",
  content: [
    {
      type: "section",
      heading: "Задача",
      blocks: [
        { type: "paragraph", content: [{ type: "text", text: "Обычный " }, { type: "strong", text: "текст" }] },
        { type: "list", style: "unordered", items: [[{ type: "text", text: "Первый пункт" }]] },
        { type: "notice", variant: "default", content: [{ type: "text", text: "Важное примечание" }] },
        {
          type: "image",
          presentation: "single",
          images: [{ src: "/assets/projects/test-project/process.png", alt: "Схема процесса", width: 1600, height: 900 }],
        },
        { type: "divider" },
      ],
    },
    {
      type: "gallery",
      title: "Галерея",
      description: "Часть экранов интерфейса",
      groups: [
        {
          id: "desktop",
          label: "Desktop",
          icon: "/assets/projects/test-project/desktop.svg",
          baseWidth: 740,
          baseHeight: 512,
          items: [
            {
              src: "/assets/projects/test-project/gallery/desktop-01.png",
              alt: "Экран интерфейса",
              width: 2960,
              height: 2048,
              frame: { clip: true, radius: 12, strokeColor: "#e8eaeb", strokeWidth: 1 },
            },
          ],
        },
      ],
    },
  ],
};

test("the project contract validates every supported field and block", () => {
  assert.deepEqual(validateProjectDocument(validProject), validProject);
});

test("structured Figma compositions preserve containers, constraints and leaf formats", () => {
  const project = structuredClone(validProject);
  project.catalogFrame = {
    source: { url: "https://www.figma.com/design/key/name?node-id=1-2", fileKey: "key", nodeId: "1:2", version: "7" },
    width: 1200,
    height: 800,
    clip: true,
    radius: 24,
    background: "#ffffff",
    nodes: [{
      id: "2:3", name: "Centered mark", type: "asset", x: 500, y: 300, width: 200, height: 200,
      opacity: 1, rotation: 0, constraints: { horizontal: "CENTER", vertical: "CENTER" },
      asset: { src: "/assets/projects/test-project/frames/mark.svg", format: "svg", fit: "contain" },
    }],
  };
  const parsed = validateProjectDocument(project);
  assert.equal(parsed.catalogFrame.nodes[0].asset.format, "svg");
  assert.deepEqual(parsed.catalogFrame.nodes[0].constraints, { horizontal: "CENTER", vertical: "CENTER" });
});

test("visual editor marks preserve combined formatting without markup text", () => {
  const project = structuredClone(validProject);
  project.content[0].blocks[0].content = [{
    type: "text",
    text: "Жирный курсив",
    marks: ["strong", "emphasis", "underline"],
  }];
  const parsed = parseProjectDocument(serializeProjectDocument(project), "formatted-project.json");
  assert.deepEqual(parsed.content[0].blocks[0].content, project.content[0].blocks[0].content);
});

test("the project contract rejects unknown fields instead of silently losing data", () => {
  assert.throws(
    () => validateProjectDocument({ ...validProject, unexpected: true }),
    /unknown field "unexpected"/i,
  );
});

test("visibility is restricted to safe lifecycle states", () => {
  for (const visibility of ["draft", "published", "deleted"]) {
    const safeFlags = visibility === "published" ? {} : { featuredOnHome: false, homeOrder: undefined };
    assert.equal(validateProjectDocument({ ...validProject, visibility, ...safeFlags }).visibility, visibility);
  }

  assert.throws(
    () => validateProjectDocument({ ...validProject, visibility: "archived" }),
    /visibility/i,
  );

  assert.throws(
    () => validateProjectDocument({ ...validProject, visibility: "draft", featuredOnHome: true }),
    /featuredOnHome/i,
  );
});

test("soft delete is non-destructive and removes the project from the homepage", () => {
  const deleted = deleteProject(validProject);

  assert.equal(deleted.visibility, "deleted");
  assert.equal(deleted.featuredOnHome, false);
  assert.equal(deleted.homeOrder, undefined);
  assert.equal(deleted.slug, validProject.slug);
  assert.deepEqual(deleted.content, validProject.content);
});

test("slug and asset paths reject traversal and unsafe forms", () => {
  for (const slug of ["../secret", "Corvo", "two--dashes", "with space", "project/"]) {
    assert.throws(() => resolveProjectDocumentPath("/workspace/content/projects", slug), /slug/i);
  }

  for (const assetPath of ["../secret.png", "/absolute.png", "nested/../../secret.png", "nested\\secret.png", "image.png?raw=1"]) {
    assert.throws(() => resolveProjectAssetPath("/workspace/public/assets/projects", "test-project", assetPath), /asset path/i);
  }

  assert.equal(
    resolveProjectDocumentPath("/workspace/content/projects", "test-project"),
    "/workspace/content/projects/test-project.json",
  );
  assert.equal(
    resolveProjectAssetPath("/workspace/public/assets/projects", "test-project", "gallery/screen-01.png"),
    "/workspace/public/assets/projects/test-project/gallery/screen-01.png",
  );
});

test("serialization is canonical and stable across read-write-read cycles", () => {
  const first = serializeProjectDocument(validProject);
  const parsed = parseProjectDocument(first, "test-project.json");
  const second = serializeProjectDocument(parsed);

  assert.equal(first, second);
  assert.deepEqual(parseProjectDocument(second, "test-project.json"), parsed);
  assert.ok(first.endsWith("\n"));
});

test("every migrated project has a stable round-trip", async () => {
  const projectNames = ["boff", "corvo", "example-project", "sarafan-radio"];

  for (const name of projectNames) {
    const source = await readFile(new URL(`../content/projects/${name}.json`, import.meta.url), "utf8");
    const parsed = parseProjectDocument(source, `${name}.json`);
    assert.equal(parsed.slug, name);
    assert.equal(serializeProjectDocument(parsed), source);
  }
});

test("every published project asset exists and declared PNG dimensions are intrinsic", async () => {
  const projectNames = ["boff", "corvo", "sarafan-radio"];

  for (const name of projectNames) {
    const source = await readFile(new URL(`../content/projects/${name}.json`, import.meta.url), "utf8");
    const project = parseProjectDocument(source, `${name}.json`);
    const queue = [project];
    while (queue.length > 0) {
      const value = queue.pop();
      if (Array.isArray(value)) {
        queue.push(...value);
        continue;
      }
      if (!value || typeof value !== "object") continue;
      if (typeof value.src === "string") {
        const assetUrl = new URL(`../public${value.src}`, import.meta.url);
        await access(assetUrl);
        if (value.src.endsWith(".png") && Number.isInteger(value.width) && Number.isInteger(value.height)) {
          const bytes = await readFile(assetUrl);
          assert.equal(bytes.toString("ascii", 1, 4), "PNG");
          assert.deepEqual(
            { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) },
            { width: value.width, height: value.height },
            value.src,
          );
        }
      }
      queue.push(...Object.values(value));
    }
  }
});

test("resolved write targets remain inside caller-provided content and asset roots", async () => {
  const sandbox = await mkdtemp(path.join(tmpdir(), "des-art-contract-"));
  const contentRoot = path.join(sandbox, "content", "projects");
  const assetRoot = path.join(sandbox, "public", "assets", "projects");
  const documentPath = resolveProjectDocumentPath(contentRoot, validProject.slug);
  const assetPath = resolveProjectAssetPath(assetRoot, validProject.slug, "gallery/image.png");

  assert.equal(path.relative(contentRoot, documentPath), "test-project.json");
  assert.equal(path.relative(assetRoot, assetPath), path.join("test-project", "gallery", "image.png"));

  assert.throws(() => resolveProjectDocumentPath(contentRoot, "../escape"), /slug/i);
});
