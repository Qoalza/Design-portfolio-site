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
      fills: [{ type: "IMAGE", imageRef: "root-image-ref", scaleMode: "FILL" }],
      strokes: [{ type: "SOLID", color: { r: 0.2, g: 0.3, b: 0.4 } }], strokeWeight: 4, strokeAlign: "INSIDE",
      effects: [{ type: "DROP_SHADOW", visible: true, color: { r: 0, g: 0, b: 0, a: 0.25 }, offset: { x: 0, y: 8 }, radius: 16, spread: 2 }],
      children: [
        { id: "2:3", name: "Mark", type: "VECTOR", absoluteBoundingBox: { x: 500, y: 300, width: 200, height: 200 }, constraints: { horizontal: "CENTER", vertical: "CENTER" }, fills: [{ type: "SOLID", color: { r: 1, g: 0, b: 0 } }] },
        { id: "2:4", name: "Backdrop", type: "RECTANGLE", absoluteBoundingBox: { x: 0, y: 0, width: 1200, height: 800 }, constraints: { horizontal: "STRETCH", vertical: "STRETCH" }, fills: [{ type: "IMAGE", imageRef: "image-ref", scaleMode: "FILL", opacity: 0.8 }], strokes: [{ type: "SOLID", color: { r: 0.1, g: 0.2, b: 0.3 } }], strokeWeight: 3, strokeAlign: "CENTER", effects: [{ type: "LAYER_BLUR", visible: true, radius: 2 }] },
        { id: "2:5", name: "Nested row", type: "FRAME", layoutMode: "HORIZONTAL", itemReverseZIndex: true, itemSpacing: 24, paddingLeft: 16, paddingRight: 16, primaryAxisAlignItems: "CENTER", counterAxisAlignItems: "MAX", absoluteBoundingBox: { x: 40, y: 40, width: 320, height: 80 }, constraints: { horizontal: "MIN", vertical: "MIN" }, fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }], strokes: [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }], strokeWeight: 2, strokeAlign: "OUTSIDE", children: [
          { id: "2:6", name: "Nested icon", type: "VECTOR", absoluteBoundingBox: { x: 56, y: 56, width: 48, height: 48 }, constraints: { horizontal: "MIN", vertical: "CENTER" }, layoutGrow: 1, layoutAlign: "CENTER" },
        ] },
      ],
    } } } }), { status: 200, headers: { "content-type": "application/json" } });
    if (String(url).includes("/v1/images/")) return new Response(JSON.stringify({ images: { "2:3": "https://download/vector", "2:6": "https://download/nested-vector" } }), { status: 200 });
    if (String(url).endsWith("/images")) return new Response(JSON.stringify({ meta: { images: { "image-ref": "https://download/raster", "root-image-ref": "https://download/root-raster" } } }), { status: 200 });
    if (String(url) === "https://download/vector") return new Response('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1z"/></svg>', { status: 200, headers: { "content-type": "image/svg+xml" } });
    if (String(url) === "https://download/nested-vector") return new Response('<svg xmlns="http://www.w3.org/2000/svg"><circle cx="1" cy="1" r="1"/></svg>', { status: 200, headers: { "content-type": "image/svg+xml" } });
    if (String(url) === "https://download/raster") return new Response(Uint8Array.from([137, 80, 78, 71]), { status: 200, headers: { "content-type": "image/png" } });
    if (String(url) === "https://download/root-raster") return new Response(Uint8Array.from([137, 80, 78, 71]), { status: 200, headers: { "content-type": "image/png" } });
    throw new Error(`Unexpected ${url}`);
  };
  const manifest = await importFigmaFrame({ url: "https://www.figma.com/design/file/Preview?node-id=1-2", token: "test-token", slug: "demo", slot: "hero", assetRoot: root, fetchImpl });
  assert.equal(manifest.nodes[0].name, "Preview background");
  assert.deepEqual(manifest.stroke, { color: "#334d66", width: 4, align: "INSIDE" });
  assert.deepEqual(manifest.effects, [{ type: "drop-shadow", color: "#00000040", offsetX: 0, offsetY: 8, blur: 16, spread: 2 }]);
  assert.equal(manifest.nodes[0].asset.format, "raster");
  assert.deepEqual(manifest.nodes[0].constraints, { horizontal: "STRETCH", vertical: "STRETCH" });
  assert.equal(manifest.nodes[1].asset.format, "svg");
  assert.equal(manifest.nodes[1].background, undefined, "exported SVG leaves must not receive a duplicate solid background");
  assert.equal(manifest.nodes[2].asset.format, "raster");
  assert.equal(manifest.nodes[2].asset.opacity, 0.8);
  assert.deepEqual(manifest.nodes[2].stroke, { color: "#1a334d", width: 3, align: "CENTER" });
  assert.deepEqual(manifest.nodes[2].effects, [{ type: "layer-blur", radius: 2 }]);
  assert.match(manifest.nodes[2].asset.src, /\.png$/);
  assert.equal(manifest.nodes[3].layout.direction, "horizontal");
  assert.equal(manifest.nodes[3].layout.crossAlign, "end");
  assert.equal(manifest.nodes[3].background, "#ffffff");
  assert.deepEqual(manifest.nodes[3].stroke, { color: "#808080", width: 2, align: "OUTSIDE" });
  assert.equal(manifest.nodes[3].children[0].asset.format, "svg");
  assert.equal(manifest.nodes[3].children[0].layoutGrow, 1);
  assert.equal(manifest.nodes[3].children[0].layoutAlign, "center");
  assert.equal(manifest.nodes[3].children[0].zIndex, 1);
  const saved = JSON.parse(await readFile(path.join(root, "demo", "frames", path.basename(path.dirname(manifest.nodes[1].asset.src)), "manifest.json"), "utf8"));
  assert.equal(saved.nodes.length, 4);
  assert.ok(calls.some((url) => url.endsWith("/files/file/images")));
});

test("frame constraints become responsive CSS positions", () => {
  const centered = frameNodeStyle({ x: 77, y: 65, width: 720, height: 612, constraints: { horizontal: "CENTER", vertical: "CENTER" } }, 1200, 533);
  assert.equal(centered.left, "calc(50% + -13.583333%)");
  assert.equal(centered.top, "calc(50% + 19.606004%)");
  assert.equal(centered.transform, "translateX(-50%) translateY(-50%)");

  const stretch = frameNodeStyle({ x: 20, y: 10, width: 1160, height: 780, constraints: { horizontal: "STRETCH", vertical: "STRETCH" } }, 1200, 800);
  assert.deepEqual({ left: stretch.left, right: stretch.right, top: stretch.top, bottom: stretch.bottom }, { left: "1.666667%", right: "1.666667%", top: "1.25%", bottom: "1.25%" });
});
