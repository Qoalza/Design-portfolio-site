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
      && error.issues[0]?.title === "Не указана ссылка на файл проекта"
      && error.issues[0]?.message === "Вы выбрали состояние «Файл доступен». Вставьте ссылку на Figma или измените состояние файла.",
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
      && error.issues[0]?.title === "Интерактивный экран ещё не подготовлен"
      && error.issues[0]?.message.includes("дождитесь успешного импорта"),
  );
});

test("admin draft keeps stable section ids when parsed repeatedly", () => {
  const first = createAdminDraft(project({
    content: [{ type: "section", heading: "Секция", blocks: [] }],
  }));
  const second = parseAdminDraft(JSON.stringify(first));
  assert.equal(second.content[0].adminId, first.content[0].adminId);
});

test("frame contract errors are translated into human asset instructions", () => {
  const draft = createAdminDraft(project({
    catalogFrame: {
      source: { url: "https://www.figma.com/design/key/file?node-id=1-2", fileKey: "key", nodeId: "1:2", version: "1" },
      width: 1200,
      height: 800,
      clip: true,
      radius: 24,
      background: "#ffffff",
      nodes: [{
        id: "2:3", name: "Frame", type: "container", x: 0, y: 0, width: 1200, height: 800,
        opacity: 1, rotation: 0, constraints: { horizontal: "STRETCH", vertical: "STRETCH" },
        layout: { direction: "horizontal", gap: null, padding: [0, 0, 0, 0], align: "start" },
        children: [],
      }],
    },
  }));

  const validation = draftValidation(draft);
  assert.equal(validation.valid, false);
  assert.deepEqual(validation.issues[0], {
    field: "catalogFrame",
    label: "Обложка карточки",
    title: "Обложку карточки не удалось подготовить",
    tab: "card",
    message: "У группы «Frame» некорректно задано расстояние между элементами. Укажите в Figma числовое значение gap не меньше 0 и обновите Frame.",
  });
  assert.equal(validation.issues[0].message.includes("catalogFrame"), false);
});

test("unknown frame contract errors request manual diagnosis instead of inventing a cause", () => {
  const draft = createAdminDraft(project({
    catalogFrame: {
      source: { url: "https://www.figma.com/design/key/file?node-id=1-2", fileKey: "key", nodeId: "1:2", version: "1" },
      width: 1200,
      height: 800,
      clip: true,
      radius: 24,
      background: "#ffffff",
      nodes: [],
      unexpected: true,
    },
  }));

  const validation = draftValidation(draft);
  assert.equal(validation.valid, false);
  assert.equal(validation.issues[0].title, "Обложку карточки не удалось подготовить");
  assert.equal(validation.issues[0].message, "Причину не удалось определить автоматически. Предыдущая рабочая версия сохранена; требуется ручная диагностика разработчиком.");
});
