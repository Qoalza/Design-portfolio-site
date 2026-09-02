import assert from "node:assert/strict";
import test from "node:test";

import { verifyProductionContentProvenance } from "../tools/des-art-admin/verify-production-content-provenance.mjs";

test("provenance verifier accepts the declared v2-to-v3 project migration without asset changes", async () => {
  const report = await verifyProductionContentProvenance({
    base: "e9aa5b9baa377c2872b56908284263b88468470b",
    target: "437c9cae4f70e245891f9cc478ed7f145d1986a6",
  });
  assert.equal(report.projects.length, 3);
  assert.ok(report.projects.every((project) => project.schema === "2->3"));
});

test("provenance verifier records a candidate with no canonical content or asset changes", async () => {
  const report = await verifyProductionContentProvenance({
    base: "2d83e87f90624d08e6923bdfc26ba97a54c62474",
    target: "2d83e87f90624d08e6923bdfc26ba97a54c62474",
  });
  assert.equal(report.noCanonicalChanges, true);
  assert.deepEqual(report.projects, []);
});
