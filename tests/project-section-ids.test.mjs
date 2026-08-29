import assert from "node:assert/strict";
import test from "node:test";

import { createProjectSectionIds } from "../src/lib/project-section-ids.mjs";

test("section ids stay unique when headings repeat", () => {
  assert.deepEqual(
    createProjectSectionIds(["Новая секция", "Новая секция", "Детали", "Новая секция"]),
    ["новая-секция", "новая-секция-2", "детали", "новая-секция-3"],
  );
});

test("empty headings receive stable unique fallback ids", () => {
  assert.deepEqual(createProjectSectionIds(["", " "]), ["section", "section-2"]);
});
