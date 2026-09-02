import assert from "node:assert/strict";
import { access, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import sharp from "sharp";

import { importFigmaTemplate, parseFigmaNodeUrl } from "../tools/des-art-admin/figma-template-import.mjs";

const png = (width, height, background = "#ffffff") => sharp({ create: { width, height, channels: 4, background } }).png().toBuffer();

test("Figma links must target a concrete node", () => {
  assert.deepEqual(parseFigmaNodeUrl("https://www.figma.com/design/fileKey/Project?node-id=921-58611&t=x"), {
    fileKey: "fileKey",
    nodeId: "921:58611",
    url: "https://www.figma.com/design/fileKey/Project?node-id=921-58611&t=x",
  });
  assert.throws(() => parseFigmaNodeUrl("https://example.com/design/file/Project?node-id=1-2"), /Figma/i);
  assert.throws(() => parseFigmaNodeUrl("https://figma.com/design/file/Project"), /конкретный Frame/i);
});

test("approved child mapping imports one Figma Frame into hidden named assets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "figma-template-children-"));
  const dimensions = [[2880, 2518], [1688, 612], [760, 1100]];
  const fetchImpl = async (url) => {
    const value = String(url);
    if (value.includes("/nodes?")) return new Response(JSON.stringify({ version: "42", nodes: { "1:2": { document: {
      id: "1:2", name: "Catalog", type: "FRAME", children: dimensions.map((_, index) => ({ id: `2:${index + 1}`, name: `Asset ${index + 1}`, type: "FRAME" })),
    } } } }), { status: 200 });
    if (value.includes("/v1/images/")) return new Response(JSON.stringify({ images: { "1:2": "https://download/root", "2:1": "https://download/1", "2:2": "https://download/2", "2:3": "https://download/3" } }), { status: 200 });
    if (value === "https://download/root") return new Response(await png(1070, 800), { status: 200 });
    const index = Number(value.at(-1)) - 1;
    if (value.startsWith("https://download/") && dimensions[index]) return new Response(await png(...dimensions[index]), { status: 200 });
    throw new Error("Unexpected " + value);
  };
  const result = await importFigmaTemplate({
    url: "https://www.figma.com/design/file/Project?node-id=1-2",
    token: "test-token",
    slug: "sarafan-radio",
    templateId: "catalog.sarafan-collage",
    assetRoot: root,
    fetchImpl,
  });
  assert.equal(result.visual.templateId, "catalog.sarafan-collage");
  assert.deepEqual(Object.keys(result.visual.assets), ["dashboard", "player", "payment"]);
  assert.equal("source" in result.visual, false);
  assert.equal("x" in result.visual.assets.dashboard[0], false);
  assert.deepEqual({ width: result.source.preview.width, height: result.source.preview.height }, { width: 1070, height: 800 });
  await access(path.join(root, "sarafan-radio", "figma", path.basename(path.dirname(result.visual.assets.dashboard[0].src)), "dashboard.png"));
  await access(path.join(root, "sarafan-radio", "figma", path.basename(path.dirname(result.visual.assets.dashboard[0].src)), "preview.png"));
});

test("first hero import detects the approved variant from its Frame structure", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "figma-template-auto-hero-"));
  const dimensions = [[2960, 2400], [2960, 2400]];
  const fetchImpl = async (url) => {
    const value = String(url);
    if (value.includes("/nodes?")) return new Response(JSON.stringify({ version: "43", nodes: { "1:2": { document: {
      id: "1:2", name: "Hero", type: "FRAME", children: dimensions.map((_, index) => ({ id: `2:${index + 1}`, name: `Asset ${index + 1}`, type: "FRAME" })),
    } } } }), { status: 200 });
    if (value.includes("/v1/images/")) return new Response(JSON.stringify({ images: { "1:2": "https://download/root", "2:1": "https://download/1", "2:2": "https://download/2" } }), { status: 200 });
    if (value === "https://download/root") return new Response(await png(1480, 1200), { status: 200 });
    const index = Number(value.at(-1)) - 1;
    if (value.startsWith("https://download/") && dimensions[index]) return new Response(await png(...dimensions[index]), { status: 200 });
    throw new Error("Unexpected " + value);
  };
  const result = await importFigmaTemplate({
    url: "https://www.figma.com/design/file/Project?node-id=1-2",
    token: "test-token",
    slug: "boff",
    templateIds: ["hero.corvo-browser", "hero.sarafan-collage"],
    assetRoot: root,
    fetchImpl,
  });
  assert.equal(result.visual.templateId, "hero.corvo-browser");
  assert.deepEqual(Object.keys(result.visual.assets), ["backdrop", "foreground"]);
});

test("approved Sarafan model import crops the current whole Figma Frame and keeps shell geometry in code", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "figma-template-crop-"));
  const source = await png(2000, 960);
  const fetchImpl = async (url) => {
    const value = String(url);
    if (value.includes("/nodes?")) return new Response(JSON.stringify({ version: "7", nodes: { "992:24663": { document: {
      id: "992:24663", name: "Model", type: "FRAME", absoluteBoundingBox: { x: 0, y: 0, width: 1000, height: 480 },
    } } } }), { status: 200 });
    if (value.includes("/v1/images/")) return new Response(JSON.stringify({ images: { "992:24663": "https://download/root" } }), { status: 200 });
    if (value === "https://download/root") return new Response(source, { status: 200 });
    throw new Error("Unexpected " + value);
  };
  const result = await importFigmaTemplate({
    url: "https://www.figma.com/design/5ZzspE0OrqesDcTP0RRPHr/Project?node-id=992-24663",
    token: "test-token",
    slug: "sarafan-radio",
    templateId: "canvas.sarafan-model",
    assetRoot: root,
    fetchImpl,
  });
  assert.equal(result.visual.templateId, "canvas.sarafan-model");
  assert.deepEqual({ width: result.visual.assets.content[0].width, height: result.visual.assets.content[0].height }, { width: 1520, height: 768 });
  assert.deepEqual({ width: result.source.preview.width, height: result.source.preview.height }, { width: 2000, height: 960 });
});

test("new section import resolves identical Sarafan frame geometry through the approved source pair", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "figma-template-auto-"));
  const source = await png(2000, 960);
  const fetchImpl = async (url) => {
    const value = String(url);
    if (value.includes("/nodes?")) return new Response(JSON.stringify({ version: "8", nodes: { "992:24663": { document: {
      id: "992:24663", name: "Model", type: "FRAME", absoluteBoundingBox: { x: 0, y: 0, width: 1000, height: 480 },
    } } } }), { status: 200 });
    if (value.includes("/v1/images/")) return new Response(JSON.stringify({ images: { "992:24663": "https://download/root" } }), { status: 200 });
    if (value === "https://download/root") return new Response(source, { status: 200 });
    throw new Error("Unexpected " + value);
  };
  const result = await importFigmaTemplate({
    url: "https://www.figma.com/design/5ZzspE0OrqesDcTP0RRPHr/Project?node-id=992-24663",
    token: "test-token",
    slug: "sarafan-radio",
    templateIds: ["canvas.sarafan-model", "canvas.sarafan-scenarios", "canvas.sarafan-setup"],
    assetRoot: root,
    fetchImpl,
  });
  assert.equal(result.visual.templateId, "canvas.sarafan-model");
});

test("Sarafan scenarios keep their approved source and legacy crop independently from Model", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "figma-template-scenarios-bounds-"));
  const source = await png(2000, 960);
  const fetchImpl = async (url) => {
    const value = String(url);
    if (value.includes("/nodes?")) return new Response(JSON.stringify({ version: "9", nodes: { "989:24607": { document: {
      id: "989:24607", name: "Interactive flow", type: "FRAME", absoluteBoundingBox: { x: 0, y: 0, width: 1000, height: 480 },
    } } } }), { status: 200 });
    if (value.includes("/v1/images/")) return new Response(JSON.stringify({ images: { "989:24607": "https://download/root" } }), { status: 200 });
    if (value === "https://download/root") return new Response(source, { status: 200 });
    throw new Error("Unexpected " + value);
  };
  const result = await importFigmaTemplate({
    url: "https://www.figma.com/design/5ZzspE0OrqesDcTP0RRPHr/Project?node-id=989-24607",
    token: "test-token",
    slug: "sarafan-radio",
    templateId: "canvas.sarafan-scenarios",
    assetRoot: root,
    fetchImpl,
  });

  assert.deepEqual(
    { width: result.visual.assets.content[0].width, height: result.visual.assets.content[0].height },
    { width: 1722, height: 699 },
  );
});

test("Sarafan source bindings reject a different approved frame before writing assets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "figma-template-source-binding-"));
  await assert.rejects(() => importFigmaTemplate({
    url: "https://www.figma.com/design/5ZzspE0OrqesDcTP0RRPHr/Project?node-id=992-24663",
    token: "test-token",
    slug: "sarafan-radio",
    templateId: "canvas.sarafan-scenarios",
    assetRoot: root,
    fetchImpl: async () => { throw new Error("The importer must reject before Figma export."); },
  }), /утверждённому источнику/i);
  assert.deepEqual(await readdir(path.join(root, "sarafan-radio", "figma")).catch(() => []), []);
});

test("incompatible Frame structure fails before replacing any working template assets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "figma-template-invalid-"));
  const fetchImpl = async (url) => {
    if (String(url).includes("/nodes?")) return new Response(JSON.stringify({ nodes: { "1:2": { document: {
      id: "1:2", name: "Broken", type: "FRAME", children: [{ id: "2:1", type: "FRAME" }],
    } } } }), { status: 200 });
    throw new Error("Unexpected " + url);
  };
  await assert.rejects(() => importFigmaTemplate({
    url: "https://www.figma.com/design/file/Project?node-id=1-2",
    token: "test-token",
    slug: "sarafan-radio",
    templateId: "catalog.sarafan-collage",
    assetRoot: root,
    fetchImpl,
  }), /верхнеуровневых элементов/);
  assert.deepEqual(await readdir(path.join(root, "sarafan-radio", "figma")).catch(() => []), []);
});

test("same Figma node and version receive a new asset URL only when generated PNG bytes change", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "figma-template-content-hash-"));
  let source = await png(2000, 960, "#ffffff");
  const fetchImpl = async (url) => {
    const value = String(url);
    if (value.includes("/nodes?")) return new Response(JSON.stringify({ version: "unchanged-version", nodes: { "992:24663": { document: {
      id: "992:24663", name: "Model", type: "FRAME", absoluteBoundingBox: { x: 0, y: 0, width: 1000, height: 480 },
    } } } }), { status: 200 });
    if (value.includes("/v1/images/")) return new Response(JSON.stringify({ images: { "992:24663": "https://download/root" } }), { status: 200 });
    if (value === "https://download/root") return new Response(source, { status: 200 });
    throw new Error("Unexpected " + value);
  };
  const request = {
    url: "https://www.figma.com/design/5ZzspE0OrqesDcTP0RRPHr/Project?node-id=992-24663",
    token: "test-token",
    slug: "sarafan-radio",
    templateId: "canvas.sarafan-model",
    assetRoot: root,
    fetchImpl,
  };

  const first = await importFigmaTemplate(request);
  source = await png(2000, 960, "#000000");
  const second = await importFigmaTemplate(request);
  const third = await importFigmaTemplate(request);

  assert.equal(first.changed, true);
  assert.equal(second.changed, true);
  assert.equal(third.changed, false);
  assert.notEqual(first.source.preview.src, second.source.preview.src);
  assert.equal(second.source.preview.src, third.source.preview.src);
  const secondPreview = await readFile(path.join(root, "sarafan-radio", "figma", path.basename(path.dirname(second.source.preview.src)), "preview.png"));
  assert.deepEqual(secondPreview, source);
  await writeFile(path.join(root, "sarafan-radio", "figma", path.basename(path.dirname(second.source.preview.src)), "preview.png"), "corrupted");
  await assert.rejects(() => importFigmaTemplate(request), /другим содержимым/i);
});
