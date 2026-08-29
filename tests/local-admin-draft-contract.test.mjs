import assert from "node:assert/strict";
import test from "node:test";

import {
  changeProjectFileState,
  changeProjectMaterialsState,
  compileAdminDraft,
  createAdminDraft,
  DraftValidationError,
  parseAdminDraft,
  draftValidation,
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
  detailAvailable: false,
  materials: { projectState: "completed", fileState: "absent" },
  platforms: [],
  content: [],
  ...overrides,
});

test("validation accumulates field navigation metadata", () => {
  const draft = createAdminDraft(project({
    title: "",
    description: "",
    role: "",
    materials: { projectState: "completed", fileState: "available", figmaUrl: "" },
    content: [{ type: "section", heading: "", blocks: [] }],
  }));
  const validation = draftValidation(draft);
  assert.equal(validation.valid, false);
  assert.deepEqual(validation.issues.slice(0, 4).map(({ field, tab }) => [field, tab]), [
    ["title", "card"],
    ["description", "card"],
    ["role", "card"],
    ["materials.figmaUrl", "page"],
  ]);
  assert.equal(validation.issues.some((issue) => issue.sectionId === draft.content[0].adminId), true);
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

test("switching project state defaults to a valid linkless material state", () => {
  assert.deepEqual(
    changeProjectMaterialsState({ projectState: "completed", fileState: "available", figmaUrl: "" }, "in_progress"),
    { projectState: "in_progress", fileState: "unavailable" },
  );
  assert.deepEqual(
    changeProjectMaterialsState({ projectState: "in_progress", fileState: "available", figmaUrl: "" }, "completed"),
    { projectState: "completed", fileState: "absent" },
  );
});

test("file state changes preserve a real Figma URL but never invent one", () => {
  assert.deepEqual(
    changeProjectFileState({ projectState: "completed", fileState: "available", figmaUrl: " https://figma.com/file " }, "available"),
    { projectState: "completed", fileState: "available", figmaUrl: "https://figma.com/file" },
  );
  assert.deepEqual(
    changeProjectFileState({ projectState: "in_progress", fileState: "unavailable" }, "available"),
    { projectState: "in_progress", fileState: "available", figmaUrl: "" },
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
