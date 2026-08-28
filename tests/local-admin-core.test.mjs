import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { PROJECT_DOCUMENT_VERSION } from "../src/lib/project-contract.ts";
import {
  AdminStore,
  inspectImage,
  safeUploadName,
  validateLocalRequest,
} from "../tools/des-art-admin/core.mjs";

const project = (slug = "admin-test", overrides = {}) => ({
  schemaVersion: PROJECT_DOCUMENT_VERSION,
  title: "Тестовый проект",
  slug,
  description: "Описание",
  role: "Product Designer",
  year: 2026,
  status: "Черновик",
  tags: [],
  visibility: "draft",
  catalogVisible: false,
  catalogOrder: 1,
  detailAvailable: false,
  figmaAvailable: false,
  platforms: [],
  content: [],
  ...overrides,
});

async function roots() {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-admin-"));
  return {
    contentRoot: path.join(root, "repo", "content", "projects"),
    assetRoot: path.join(root, "repo", "public", "assets", "projects"),
    draftRoot: path.join(root, "drafts"),
  };
}

test("local request boundary accepts only loopback Host, trusted Origin and CSRF", () => {
  const token = "known-token";
  assert.doesNotThrow(() => validateLocalRequest({ method: "POST", host: "127.0.0.1:41731", origin: "http://127.0.0.1:41731", csrf: token }, token, 41731));
  assert.throws(() => validateLocalRequest({ method: "POST", host: "evil.example", origin: "http://127.0.0.1:41731", csrf: token }, token, 41731), /host/i);
  assert.throws(() => validateLocalRequest({ method: "POST", host: "127.0.0.1:41731", origin: "https://evil.example", csrf: token }, token, 41731), /origin/i);
  assert.throws(() => validateLocalRequest({ method: "POST", host: "127.0.0.1:41731", origin: "http://127.0.0.1:41731", csrf: "wrong" }, token, 41731), /csrf/i);
});

test("admin CRUD preserves lifecycle data and archives instead of deleting", async () => {
  const store = new AdminStore(await roots());
  await store.saveProject(project());
  assert.equal((await store.getProject("admin-test")).title, "Тестовый проект");
  const duplicate = await store.duplicateProject("admin-test", "admin-copy");
  assert.equal(duplicate.visibility, "draft");
  assert.equal(duplicate.catalogVisible, false);
  const archived = await store.setVisibility("admin-test", "archived");
  assert.equal(archived.visibility, "archived");
  assert.equal(archived.detailAvailable, false);
  assert.equal((await store.getProject("admin-test")).description, "Описание");
  const restored = await store.setVisibility("admin-test", "draft");
  assert.equal(restored.visibility, "draft");
});

test("draft survives a new store instance", async () => {
  const configured = await roots();
  await new AdminStore(configured).saveDraft("admin-test", project());
  assert.deepEqual(await new AdminStore(configured).getDraft("admin-test"), project());
});

test("reorder updates only catalog order and rejects unknown slugs", async () => {
  const store = new AdminStore(await roots());
  await store.saveProject(project("one"));
  await store.saveProject(project("two", { catalogOrder: 2 }));
  await store.reorder(["two", "one"]);
  assert.equal((await store.getProject("two")).catalogOrder, 1);
  assert.equal((await store.getProject("one")).catalogOrder, 2);
  await assert.rejects(() => store.reorder(["missing"]), /unknown/i);
});

test("image inspection validates MIME, extension and intrinsic PNG dimensions", async () => {
  const png = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(png);
  png.writeUInt32BE(640, 16);
  png.writeUInt32BE(360, 20);
  assert.deepEqual(inspectImage(png, "image.png", "image/png"), { extension: ".png", width: 640, height: 360, mime: "image/png" });
  assert.throws(() => inspectImage(png, "image.jpg", "image/png"), /extension/i);
  assert.throws(() => inspectImage(Buffer.from("not image"), "image.png", "image/png"), /signature/i);
});

test("uploads use safe names, reject traversal and warn on duplicates", async () => {
  assert.equal(safeUploadName("Hero Screen (1).PNG"), "hero-screen-1.png");
  assert.throws(() => safeUploadName("../secret.png"), /filename/i);
  const configured = await roots();
  const store = new AdminStore(configured);
  await store.saveProject(project());
  const png = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(png);
  png.writeUInt32BE(20, 16);
  png.writeUInt32BE(10, 20);
  const first = await store.saveImage("admin-test", "Hero.png", "image/png", png, "Hero alt");
  const second = await store.saveImage("admin-test", "Another.png", "image/png", png, "Hero alt");
  assert.equal(first.width, 20);
  assert.equal(second.duplicateOf, first.src);
  assert.equal(await readFile(path.join(configured.assetRoot, "admin-test", "hero.png"), "hex"), png.toString("hex"));
  await assert.rejects(() => store.saveImage("../escape", "x.png", "image/png", png, "Alt"), /slug/i);
});
