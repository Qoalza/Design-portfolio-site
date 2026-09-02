import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadTransitionUnits, parseTransitionRequestArgs, recordTransitionRequest } from "../tools/des-art-admin/prepare-live-transition.mjs";
import { assertCandidateSandboxSupportRoot, candidateSandboxEnvironment, parseCandidateSandboxArgs } from "../tools/des-art-admin/run-candidate-sandbox.mjs";

test("operator transition command requires an explicit path and never accepts units for clean baseline", () => {
  const supportRoot = path.join(os.tmpdir(), "des-art-transition-operator");
  assert.deepEqual(parseTransitionRequestArgs(["--support-root", supportRoot, "--selection", "delta"]), { supportRoot, selection: "delta", unitsFile: undefined });
  assert.throws(() => parseTransitionRequestArgs(["--support-root", supportRoot]), /Usage/);
  assert.throws(() => parseTransitionRequestArgs(["--support-root", supportRoot, "--selection", "publish"]), /Usage/);
  assert.throws(() => parseTransitionRequestArgs(["--support-root", supportRoot, "--selection", "clean", "--units-file", path.join(os.tmpdir(), "units.json")]), /clean baseline/);
});

test("operator reads an explicit local selection file without starting a transition", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "des-art-transition-operator-"));
  const unitsFile = path.join(root, "units.json");
  await writeFile(unitsFile, "[]\n");
  assert.deepEqual(await loadTransitionUnits(unitsFile), []);
  assert.equal((await readFile(unitsFile, "utf8")).trim(), "[]");
});

test("operator records only the explicit local request", async () => {
  const supportRoot = await mkdtemp(path.join(os.tmpdir(), "des-art-transition-request-"));
  const request = await recordTransitionRequest({ supportRoot, selection: "clean" });
  assert.equal(request.selection, "clean");
  assert.deepEqual(JSON.parse(await readFile(path.join(supportRoot, "live-transition-request-v1.json"), "utf8")), request);
});

test("candidate sandbox is confined to a new temporary store and always starts in sandbox mode", () => {
  const supportRoot = path.join(os.tmpdir(), "des-art-candidate-sandbox");
  assert.equal(assertCandidateSandboxSupportRoot(supportRoot), supportRoot);
  assert.throws(() => assertCandidateSandboxSupportRoot(path.join(os.homedir(), "Library", "Application Support", "Des-art Admin")), /temporary directory/);
  const parsed = parseCandidateSandboxArgs(["--support-root", supportRoot, "--port", "42731", "--preview-port", "42732"]);
  assert.equal(parsed.port, 42731);
  assert.equal(candidateSandboxEnvironment(parsed).DES_ART_ADMIN_PUBLISH_MODE, "sandbox");
});
