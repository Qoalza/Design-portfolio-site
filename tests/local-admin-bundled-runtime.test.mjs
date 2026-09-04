import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { loadImageProcessor } from "../dist/Des-art Admin.app/Contents/Resources/source/tools/des-art-admin/figma-template-import.mjs";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const bundledSource = path.join(repositoryRoot, "dist", "Des-art Admin.app", "Contents", "Resources", "source");
const runtimeFiles = [
  "admin-errors.mjs", "core.mjs", "draft-contract.mjs", "figma-frame.mjs", "figma-template-import.mjs", "figma-template-map.mjs",
  "human-errors.mjs", "material-state.mjs", "preview-runtime.mjs", "production-data-bootstrap.mjs",
  "deploy-v2.mjs", "publish-job-state.mjs", "publish-diagnostics.mjs", "publish-worker.mjs", "server.mjs", "public/admin.css", "public/admin.js", "public/index.html",
];
const sharedFiles = ["project-contract.ts", "project-visual-registry.ts", "projects.ts"];

async function allFiles(root, prefix = "") {
  const result = [];
  for (const entry of await readdir(path.join(root, prefix), { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) result.push(...await allFiles(root, relative));
    else result.push(relative);
  }
  return result.sort();
}

test("bundled Admin resolves native image processing from the managed repository", () => {
  const processor = loadImageProcessor(process.cwd());
  assert.equal(typeof processor, "function");
  assert.equal(typeof processor.versions?.sharp, "string");
});

test("bundled Admin is byte-identical to the explicit runtime allowlist", async () => {
  const expected = [
    "package.json",
    ...runtimeFiles.map((file) => path.join("tools", "des-art-admin", file)),
    ...sharedFiles.map((file) => path.join("src", "lib", file)),
  ].sort();
  assert.deepEqual(await allFiles(bundledSource), expected);
  for (const file of runtimeFiles) {
    assert.deepEqual(
      await readFile(path.join(bundledSource, "tools", "des-art-admin", file)),
      await readFile(path.join(repositoryRoot, "tools", "des-art-admin", file)),
    );
  }
  for (const file of sharedFiles) {
    assert.deepEqual(
      await readFile(path.join(bundledSource, "src", "lib", file)),
      await readFile(path.join(repositoryRoot, "src", "lib", file)),
    );
  }
});
