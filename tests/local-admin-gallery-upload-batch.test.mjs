import assert from "node:assert/strict";
import test from "node:test";
import { uploadGalleryBatch } from "../tools/des-art-admin/src/gallery-upload-batch.ts";

test("gallery batch preserves chosen order, skips failures and uses the first accepted image as reference", async () => {
  const requests = [];
  const result = await uploadGalleryBatch(
    [{ name: "first.png" }, { name: "invalid.png" }, { name: "third.png" }],
    3,
    undefined,
    async (file, referenceSrc) => {
      requests.push([file.name, referenceSrc]);
      if (file.name === "invalid.png") throw new Error("Пропорции не совпадают.");
      return { src: `/assets/${file.name}` };
    },
  );
  assert.deepEqual(requests, [["first.png", undefined], ["invalid.png", "/assets/first.png"], ["third.png", "/assets/first.png"]]);
  assert.deepEqual(result.accepted.map((item) => item.src), ["/assets/first.png", "/assets/third.png"]);
  assert.deepEqual(result.rejected, [{ fileName: "invalid.png", reason: "Пропорции не совпадают." }]);
});

test("gallery batch stops accepting at its available capacity", async () => {
  const result = await uploadGalleryBatch(
    [{ name: "one.png" }, { name: "two.png" }, { name: "three.png" }],
    2,
    undefined,
    async (file) => ({ src: `/assets/${file.name}` }),
  );
  assert.deepEqual(result.accepted.map((item) => item.src), ["/assets/one.png", "/assets/two.png"]);
  assert.deepEqual(result.rejected, [{ fileName: "three.png", reason: "Лимит пула — 20 изображений." }]);
});
