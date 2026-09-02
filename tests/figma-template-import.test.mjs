import assert from "node:assert/strict";
import { access, mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import sharp from "sharp";

import { importFigmaTemplate, parseFigmaNodeUrl } from "../tools/des-art-admin/figma-template-import.mjs";

const png = (width, height) => sharp({ create: { width, height, channels: 4, background: "#ffffff" } }).png().toBuffer();

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

test("approved canvas import crops content from the whole Figma Frame and keeps shell geometry in code", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "figma-template-crop-"));
  const source = await png(2000, 714);
  const fetchImpl = async (url) => {
    const value = String(url);
    if (value.includes("/nodes?")) return new Response(JSON.stringify({ version: "7", nodes: { "1:2": { document: {
      id: "1:2", name: "Model", type: "FRAME", absoluteBoundingBox: { x: 0, y: 0, width: 1000, height: 357 },
    } } } }), { status: 200 });
    if (value.includes("/v1/images/")) return new Response(JSON.stringify({ images: { "1:2": "https://download/root" } }), { status: 200 });
    if (value === "https://download/root") return new Response(source, { status: 200 });
    throw new Error("Unexpected " + value);
  };
  const result = await importFigmaTemplate({
    url: "https://www.figma.com/design/file/Project?node-id=1-2",
    token: "test-token",
    slug: "sarafan-radio",
    templateId: "canvas.sarafan-model",
    assetRoot: root,
    fetchImpl,
  });
  assert.deepEqual({ width: result.visual.assets.content[0].width, height: result.visual.assets.content[0].height }, { width: 1776, height: 480 });
  assert.deepEqual({ width: result.source.preview.width, height: result.source.preview.height }, { width: 2000, height: 714 });
});

test("new section import detects its code-owned template from the whole Frame", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "figma-template-auto-"));
  const source = await png(2000, 960);
  const fetchImpl = async (url) => {
    const value = String(url);
    if (value.includes("/nodes?")) return new Response(JSON.stringify({ version: "8", nodes: { "1:2": { document: {
      id: "1:2", name: "Scenarios", type: "FRAME", absoluteBoundingBox: { x: 0, y: 0, width: 1000, height: 480 },
    } } } }), { status: 200 });
    if (value.includes("/v1/images/")) return new Response(JSON.stringify({ images: { "1:2": "https://download/root" } }), { status: 200 });
    if (value === "https://download/root") return new Response(source, { status: 200 });
    throw new Error("Unexpected " + value);
  };
  const result = await importFigmaTemplate({
    url: "https://www.figma.com/design/file/Project?node-id=1-2",
    token: "test-token",
    slug: "sarafan-radio",
    templateIds: ["canvas.sarafan-model", "canvas.sarafan-scenarios", "canvas.sarafan-setup"],
    assetRoot: root,
    fetchImpl,
  });
  assert.equal(result.visual.templateId, "canvas.sarafan-scenarios");
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
