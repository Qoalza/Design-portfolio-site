import assert from "node:assert/strict";
import test from "node:test";

import { formatTagInput, parseTagInput } from "../tools/des-art-admin/src/admin-model.ts";

test("slash tag input preserves text while editing and parses only on commit", () => {
  assert.deepEqual(parseTagInput("B2B / SaaS / Внутренняя система"), ["B2B", "SaaS", "Внутренняя система"]);
  assert.equal(formatTagInput(["B2B", "SaaS"]), "B2B / SaaS");
});
