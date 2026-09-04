import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { frameNodeStyle, importFigmaFrame } from "../tools/des-art-admin/figma-frame.mjs";

function fakePng(width, height) {
  const bytes = Buffer.alloc(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

test("imports the whole Frame with arbitrary raster children, constraints, root fill and CSS shadows", async () => {
  const assetRoot = await mkdtemp(path.join(os.tmpdir(), "des-art-frame-contract-"));
  const children = Array.from({ length: 7 }, (_, index) => ({
    id: `2:${index + 1}`,
    name: `Raster ${index + 1}`,
    type: "RECTANGLE",
    absoluteBoundingBox: { x: 20 + index * 30, y: 40 + index * 20, width: 200, height: 120 },
    constraints: { horizontal: index % 2 ? "CENTER" : "SCALE", vertical: index % 2 ? "MAX" : "SCALE" },
    fills: [{ type: "IMAGE", imageRef: `image-${index + 1}`, scaleMode: "FILL" }],
    effects: index === 0 ? [{ type: "DROP_SHADOW", visible: true, color: { r: 0, g: 0, b: 0, a: 0.25 }, offset: { x: 0, y: 8 }, radius: 16, spread: 2 }] : [],
  }));
  const imageMap = { "root-background": "https://download/root-background", ...Object.fromEntries(children.map((child, index) => [`image-${index + 1}`, `https://download/${child.id}`])) };
  const fetchImpl = async (url) => {
    const value = String(url);
    if (value.includes("/nodes?")) return new Response(JSON.stringify({ version: "42", nodes: { "1:2": { document: {
      id: "1:2", name: "B.Off", type: "FRAME", clipsContent: true, cornerRadius: 24,
      absoluteBoundingBox: { x: 0, y: 0, width: 1480, height: 1200 },
      fills: [{ type: "SOLID", color: { r: 0.1, g: 0.2, b: 0.3 } }, { type: "IMAGE", imageRef: "root-background", scaleMode: "FILL" }],
      children,
    } } } }), { status: 200 });
    if (value.includes("/v1/images/") && value.includes("ids=1%3A2")) return new Response(JSON.stringify({ images: { "1:2": "https://download/preview" } }), { status: 200 });
    if (value.includes("/v1/images/")) return new Response(JSON.stringify({ images: Object.fromEntries(children.map((child) => [child.id, `https://download/${child.id}`])) }), { status: 200 });
    if (/\/v1\/files\/[^/]+\/images$/.test(value)) return new Response(JSON.stringify({ meta: { images: imageMap } }), { status: 200 });
    if (value === "https://download/preview") return new Response(fakePng(2960, 2400), { status: 200, headers: { "content-type": "image/png" } });
    if (value.startsWith("https://download/")) return new Response(fakePng(400, 240), { status: 200, headers: { "content-type": "image/png" } });
    throw new Error(`Unexpected ${value}`);
  };

  const { composition } = await importFigmaFrame({
    url: "https://www.figma.com/design/BOff/Project?node-id=1-2",
    token: "test-token",
    slug: "boff",
    slot: "hero",
    assetRoot,
    fetchImpl,
  });

  const contentNodes = composition.nodes.filter((node) => node.id !== "1:2:background");
  assert.equal(contentNodes.length, 7, "the Frame must not impose a fixed child count");
  assert.equal(composition.nodes[0].asset.fit, "cover", "the Frame raster background is preserved");
  assert.equal(composition.background, "#1a334d");
  assert.deepEqual(contentNodes[0].constraints, { horizontal: "SCALE", vertical: "SCALE" });
  assert.deepEqual(contentNodes[1].constraints, { horizontal: "CENTER", vertical: "MAX" });
  assert.deepEqual(contentNodes[0].effects, [{ type: "drop-shadow", color: "#00000040", offsetX: 0, offsetY: 8, blur: 16, spread: 2 }]);
  assert.ok(composition.nodes.every((node) => node.asset?.format === "raster"));
  const manifest = JSON.parse(await readFile(path.join(assetRoot, "boff", "frames", path.basename(path.dirname(composition.nodes[0].asset.src)), "manifest.json"), "utf8"));
  assert.equal(manifest.nodes.length, 8);
});

test("turns Figma constraints into the same responsive CSS positions as the previous importer", () => {
  const centered = frameNodeStyle({ x: 77, y: 65, width: 720, height: 612, constraints: { horizontal: "CENTER", vertical: "CENTER" } }, 1200, 533);
  assert.equal(centered.left, "calc(50% + calc(0px - min(13.583333cqw, 30.581614cqh)))");
  assert.equal(centered.top, "calc(50% + min(8.708333cqw, 19.606004cqh))");
  assert.equal(centered.transform, "translateX(-50%) translateY(-50%)");
  assert.equal(centered.width, "min(60cqw, 135.084428cqh)");
  assert.equal(centered.height, "min(51cqw, 114.821764cqh)");
});
