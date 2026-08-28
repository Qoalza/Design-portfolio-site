import assert from "node:assert/strict";
import test from "node:test";

import {
  compileAdminDraft,
  createAdminDraft,
  DraftValidationError,
  parseAdminDraft,
} from "../tools/des-art-admin/draft-contract.mjs";

const project = (overrides = {}) => ({
  schemaVersion: 2,
  title: "Тестовый проект",
  slug: "draft-test",
  description: "Описание",
  role: "Product Designer",
  year: 2026,
  tags: [],
  detailTags: [],
  visibility: "draft",
  catalogOrder: 1,
  featuredOnHome: false,
  detailAvailable: true,
  materials: { projectState: "completed", fileState: "absent" },
  platforms: [],
  content: [],
  ...overrides,
});

test("admin draft persists an incomplete required Figma URL", () => {
  const draft = createAdminDraft(project({
    materials: { projectState: "completed", fileState: "available", figmaUrl: "" },
  }));

  assert.equal(parseAdminDraft(JSON.stringify(draft)).materials.figmaUrl, "");
  assert.throws(
    () => compileAdminDraft(draft),
    (error) => error instanceof DraftValidationError
      && error.issues[0]?.field === "materials.figmaUrl"
      && error.issues[0]?.message === "Укажите ссылку на Figma.",
  );
});

test("compiled admin draft strips local metadata and preserves valid public data", () => {
  const draft = createAdminDraft(project({
    content: [{ type: "section", heading: "Секция", blocks: [{ type: "divider" }] }],
  }));
  const section = draft.content[0];
  assert.equal(typeof section.adminId, "string");
  draft.admin = {
    sections: {
      [section.adminId]: {
        noticeEnabled: false,
        interactive: { enabled: true, figmaUrl: "https://www.figma.com/design/example", status: "connected" },
      },
    },
  };

  const compiled = compileAdminDraft(draft);
  assert.equal("admin" in compiled, false);
  assert.equal("adminId" in compiled.content[0], false);
  assert.deepEqual(compiled.content[0].blocks, [{ type: "divider" }]);
});

test("pending interactive frame stays in the draft and blocks preview or publish", () => {
  const draft = createAdminDraft(project({
    content: [{ type: "section", heading: "Секция", blocks: [] }],
  }));
  const section = draft.content[0];
  draft.admin = {
    sections: {
      [section.adminId]: {
        interactive: {
          enabled: true,
          figmaUrl: "https://www.figma.com/design/example?node-id=1-2",
          status: "pending",
        },
      },
    },
  };

  assert.throws(
    () => compileAdminDraft(draft),
    (error) => error instanceof DraftValidationError
      && error.issues[0]?.field === `admin.sections.${section.adminId}.interactive`
      && error.issues[0]?.message === "Интерактивный экран ещё не подготовлен.",
  );
});

test("admin draft keeps stable section ids when parsed repeatedly", () => {
  const first = createAdminDraft(project({
    content: [{ type: "section", heading: "Секция", blocks: [] }],
  }));
  const second = parseAdminDraft(JSON.stringify(first));
  assert.equal(second.content[0].adminId, first.content[0].adminId);
});
