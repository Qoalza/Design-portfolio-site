import assert from "node:assert/strict";
import { mkdir, mkdtemp, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PREVIEW_RUNTIME_PROTOCOL,
  createPreviewRuntimeIdentity,
  previewHealthMatches,
} from "../tools/des-art-admin/preview-runtime.mjs";

test("preview runtime identity binds the actual root and executable source bytes", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "des-art-preview-runtime-"));
  await mkdir(path.join(root, "src"));
  await writeFile(path.join(root, "src", "server.mjs"), "first");
  const first = await createPreviewRuntimeIdentity({ repoRoot: root, sourceFiles: ["src/server.mjs"], gitSha: "a".repeat(40) });
  await writeFile(path.join(root, "src", "server.mjs"), "second");
  const second = await createPreviewRuntimeIdentity({ repoRoot: root, sourceFiles: ["src/server.mjs"], gitSha: "a".repeat(40) });

  assert.equal(first.protocol, PREVIEW_RUNTIME_PROTOCOL);
  assert.equal(first.repoRoot, await realpath(root));
  assert.notEqual(first.fingerprint, second.fingerprint);
  assert.equal(first.gitSha, "a".repeat(40));
});

test("preview health accepts only the exact running identity", () => {
  const expected = { protocol: PREVIEW_RUNTIME_PROTOCOL, repoRoot: "/repo", fingerprint: "f".repeat(64), gitSha: "a".repeat(40) };
  assert.equal(previewHealthMatches({ preview: true, ...expected }, expected), true);
  assert.equal(previewHealthMatches({ preview: true, ...expected, fingerprint: "0".repeat(64) }, expected), false);
  assert.equal(previewHealthMatches({ preview: true, ...expected, repoRoot: "/other" }, expected), false);
});

test("preview health treats an omitted committed SHA as null", () => {
  const expected = { protocol: PREVIEW_RUNTIME_PROTOCOL, repoRoot: "/repo", fingerprint: "f".repeat(64), gitSha: null };
  assert.equal(previewHealthMatches({ preview: true, ...expected, gitSha: "" }, expected), true);
});
