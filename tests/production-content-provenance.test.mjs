import assert from "node:assert/strict";
import test from "node:test";

import { verifyProductionContentProvenance } from "../tools/des-art-admin/verify-production-content-provenance.mjs";

test("provenance verifier accepts the declared v2-to-v3 project migration without asset changes", async () => {
  const report = await verifyProductionContentProvenance({ base: "main", target: "HEAD" });
  assert.equal(report.projects.length, 3);
  assert.ok(report.projects.every((project) => project.schema === "2->3"));
});
