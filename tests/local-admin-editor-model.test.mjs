import assert from "node:assert/strict";
import test from "node:test";

import { formatTagInput, parseTagInput, sectionText, textBlocks } from "../tools/des-art-admin/src/admin-model.ts";

test("slash tag input preserves text while editing and parses only on commit", () => {
  assert.deepEqual(parseTagInput("B2B / SaaS / Внутренняя система"), ["B2B", "SaaS", "Внутренняя система"]);
  assert.equal(formatTagInput(["B2B", "SaaS"]), "B2B / SaaS");
});

test("section editor markup round-trips into structured inline content", () => {
  const source = "Обычный **жирный** _курсив_ <u>подчёркнутый</u> [ссылка](https://example.com).\n\n- Первый\n- **Второй**";
  const blocks = textBlocks(source);
  assert.deepEqual(blocks[0].content.map((item) => item.type), ["text", "strong", "text", "emphasis", "text", "underline", "text", "link", "text"]);
  assert.equal(blocks[1].type, "list");
  assert.equal(blocks[1].items[1][0].type, "strong");
  assert.equal(sectionText({ type: "section", adminId: "section-1", heading: "Секция", blocks }), source);
});
