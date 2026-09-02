import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { parseTransitionRequestArgs, recordTransitionRequest } from "../tools/des-art-admin/prepare-live-transition.mjs";
import { assertCandidateSandboxSupportRoot, candidateSandboxEnvironment, parseCandidateSandboxArgs } from "../tools/des-art-admin/run-candidate-sandbox.mjs";

test("operator transition command requires an explicit path and exact production SHA", () => {
  const supportRoot = path.join(os.tmpdir(), "des-art-transition-operator");
  assert.deepEqual(parseTransitionRequestArgs(["--support-root", supportRoot, "--choice", "overlay", "--target-sha", "a".repeat(40)]), { supportRoot, choice: "overlay", targetSha: "a".repeat(40) });
  assert.throws(() => parseTransitionRequestArgs(["--support-root", supportRoot]), /Usage/);
  assert.throws(() => parseTransitionRequestArgs(["--support-root", supportRoot, "--choice", "publish", "--target-sha", "a".repeat(40)]), /Usage/);
});

test("operator records only the explicit local request", async () => {
  const supportRoot = await mkdtemp(path.join(os.tmpdir(), "des-art-transition-request-"));
  const request = await recordTransitionRequest({ supportRoot, choice: "clean", targetSha: "a".repeat(40), transitionId: "transition-test", requestedAt: "2026-09-02T00:00:00.000Z" });
  assert.equal(request.choice, "clean");
  assert.deepEqual(JSON.parse(await readFile(path.join(supportRoot, "live-transition-request-v2.json"), "utf8")), request);
});

test("candidate sandbox is confined to a new temporary store and always starts in sandbox mode", () => {
  const supportRoot = path.join(os.tmpdir(), "des-art-candidate-sandbox");
  assert.equal(assertCandidateSandboxSupportRoot(supportRoot), supportRoot);
  assert.throws(() => assertCandidateSandboxSupportRoot(path.join(os.homedir(), "Library", "Application Support", "Des-art Admin")), /temporary directory/);
  const parsed = parseCandidateSandboxArgs(["--support-root", supportRoot, "--port", "42731", "--preview-port", "42732"]);
  assert.equal(parsed.port, 42731);
  assert.equal(candidateSandboxEnvironment(parsed).DES_ART_ADMIN_PUBLISH_MODE, "sandbox");
});
