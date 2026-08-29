import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { parseFigmaNodeUrl, frameNodeStyle, importFigmaFrame } from "../tools/des-art-admin/figma-frame.mjs";

test("Figma node URLs normalize file keys and node ids", () => {
  assert.deepEqual(
    parseFigmaNodeUrl("https://www.figma.com/design/abc123/Project?node-id=30741-404&t=x"),
    { fileKey: "abc123", nodeId: "30741:404" },
  );
  assert.throws(() => parseFigmaNodeUrl("https://example.com/design/a/b?node-id=1-2"), /Figma/i);
});

test("frame import preserves vector and raster leaves as separate local assets", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "des-art-figma-frame-"));
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    if (String(url).includes("/nodes?")) return new Response(JSON.stringify({ version: "42", nodes: { "1:2": { document: {
      id: "1:2", name: "Preview", type: "FRAME", clipsContent: true, cornerRadius: 24,
      absoluteBoundingBox: { x: 0, y: 0, width: 1200, height: 800 },
      children: [
        { id: "2:3", name: "Mark", type: "VECTOR", absoluteBoundingBox: { x: 500, y: 300, width: 200, height: 200 }, constraints: { horizontal: "CENTER", vertical: "CENTER" } },
        { id: "2:4", name: "Backdrop", type: "RECTANGLE", absoluteBoundingBox: { x: 0, y: 0, width: 1200, height: 800 }, constraints: { horizontal: "STRETCH", vertical: "STRETCH" }, fills: [{ type: "IMAGE", imageRef: "image-ref", scaleMode: "FILL" }] },
        { id: "2:5", name: "Nested row", type: "FRAME", layoutMode: "HORIZONTAL", itemSpacing: 24, paddingLeft: 16, paddingRight: 16, primaryAxisAlignItems: "CENTER", absoluteBoundingBox: { x: 40, y: 40, width: 320, height: 80 }, constraints: { horizontal: "MIN", vertical: "MIN" }, children: [
          { id: "2:6", name: "Nested icon", type: "VECTOR", absoluteBoundingBox: { x: 56, y: 56, width: 48, height: 48 }, constraints: { horizontal: "MIN", vertical: "CENTER" } },
        ] },
      ],
    } } } }), { status: 200, headers: { "content-type": "application/json" } });
    if (String(url).includes("/v1/images/")) return new Response(JSON.stringify({ images: { "2:3": "https://download/vector", "2:6": "https://download/nested-vector" } }), { status: 200 });
    if (String(url).endsWith("/images")) return new Response(JSON.stringify({ meta: { images: { "image-ref": "https://download/raster" } } }), { status: 200 });
    if (String(url) === "https://download/vector") return new Response('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1z"/></svg>', { status: 200, headers: { "content-type": "image/svg+xml" } });
    if (String(url) === "https://download/nested-vector") return new Response('<svg xmlns="http://www.w3.org/2000/svg"><circle cx="1" cy="1" r="1"/></svg>', { status: 200, headers: { "content-type": "image/svg+xml" } });
    if (String(url) === "https://download/raster") return new Response(Uint8Array.from([137, 80, 78, 71]), { status: 200, headers: { "content-type": "image/png" } });
    throw new Error(`Unexpected ${url}`);
  };
  const manifest = await importFigmaFrame({ url: "https://www.figma.com/design/file/Preview?node-id=1-2", token: "test-token", slug: "demo", slot: "hero", assetRoot: root, fetchImpl });
  assert.equal(manifest.nodes[0].asset.format, "svg");
  assert.equal(manifest.nodes[1].asset.format, "raster");
  assert.match(manifest.nodes[1].asset.src, /\.png$/);
  assert.equal(manifest.nodes[2].layout.direction, "horizontal");
  assert.equal(manifest.nodes[2].children[0].asset.format, "svg");
  const saved = JSON.parse(await readFile(path.join(root, "demo", "frames", path.basename(path.dirname(manifest.nodes[0].asset.src)), "manifest.json"), "utf8"));
  assert.equal(saved.nodes.length, 3);
  assert.ok(calls.some((url) => url.endsWith("/files/file/images")));
});

test("frame constraints become responsive CSS positions", () => {
  const centered = frameNodeStyle({ x: 500, y: 300, width: 200, height: 200, constraints: { horizontal: "CENTER", vertical: "CENTER" } }, 1200, 800);
  assert.equal(centered.left, "50%");
  assert.equal(centered.top, "50%");
  assert.match(centered.transform, /translate/);

  const stretch = frameNodeStyle({ x: 20, y: 10, width: 1160, height: 780, constraints: { horizontal: "STRETCH", vertical: "STRETCH" } }, 1200, 800);
  assert.deepEqual({ left: stretch.left, right: stretch.right, top: stretch.top, bottom: stretch.bottom }, { left: "1.666667%", right: "1.666667%", top: "1.25%", bottom: "1.25%" });
});
