import assert from "node:assert/strict";
import test from "node:test";

import {
  changeProjectFileState, changeProjectMaterialsState, compileAdminDraft, createAdminDraft,
  DraftValidationError, draftValidation, parseAdminDraft,
} from "../tools/des-art-admin/draft-contract.mjs";

const project = (overrides = {}) => ({
  schemaVersion: 3,
  designProfile: "catalog-only-v1",
  title: "Тестовый проект",
  slug: "draft-test",
  description: "Описание",
  role: "Product Designer",
  year: 2026,
  tags: [],
  detailTags: [],
  visibility: "draft",
  catalogOrder: 2,
  detailAvailable: false,
  materials: { projectState: "completed", fileState: "absent" },
  platforms: [],
  visuals: { catalog: { templateId: "catalog.browser", assets: { screen: [{ src: "/assets/projects/catalog/boff-transactions.png", alt: "Экран", width: 2880, height: 1920 }] } } },
  content: [],
  ...overrides,
});

test("validation accumulates field navigation metadata", () => {
  const draft = createAdminDraft(project({ title: "", description: "", role: "", materials: { projectState: "completed", fileState: "available", figmaUrl: "" }, content: [{ type: "section", heading: "", blocks: [] }] }));
  const validation = draftValidation(draft);
  assert.equal(validation.valid, false);
  assert.deepEqual(validation.issues.slice(0, 4).map(({ field, tab }) => [field, tab]), [["title", "card"], ["description", "card"], ["role", "card"], ["materials.figmaUrl", "page"]]);
  assert.equal(validation.issues.some((issue) => issue.sectionId === draft.content[0].adminId), true);
});

test("admin draft persists incomplete authoring values but compile fails with a Russian instruction", () => {
  const draft = createAdminDraft(project({ materials: { projectState: "completed", fileState: "available", figmaUrl: "" } }));
  assert.equal(parseAdminDraft(JSON.stringify(draft)).materials.figmaUrl, "");
  assert.throws(() => compileAdminDraft(draft), (error) => error instanceof DraftValidationError && error.issues[0]?.field === "materials.figmaUrl" && /Вставьте HTTPS-ссылку/.test(error.issues[0]?.message));
});

test("material state changes preserve real Figma links but never invent one", () => {
  assert.deepEqual(changeProjectMaterialsState({ projectState: "completed", fileState: "available", figmaUrl: "" }, "in_progress"), { projectState: "in_progress", fileState: "unavailable" });
  assert.deepEqual(changeProjectFileState({ projectState: "completed", fileState: "available", figmaUrl: " https://figma.com/file " }, "available"), { projectState: "completed", fileState: "available", figmaUrl: "https://figma.com/file" });
  assert.deepEqual(changeProjectFileState({ projectState: "in_progress", fileState: "unavailable" }, "available"), { projectState: "in_progress", fileState: "available", figmaUrl: "" });
});

test("compiled draft strips local metadata and preserves only declared public slots", () => {
  const draft = createAdminDraft(project({ content: [{ type: "section", heading: "Секция", blocks: [{ type: "divider" }] }] }));
  const sectionId = draft.content[0].adminId;
  draft.admin = { sections: { [sectionId]: { localCollapsed: true } } };
  const compiled = compileAdminDraft(draft);
  assert.equal("admin" in compiled, false);
  assert.equal("adminId" in compiled.content[0], false);
  assert.deepEqual(compiled.content[0].blocks, [{ type: "divider" }]);
});

test("pending gallery device remains local and blocks preview or publish", () => {
  const draft = createAdminDraft(project({ admin: { gallery: { pendingDeviceIds: ["desktop"] } } }));
  assert.throws(() => compileAdminDraft(draft), (error) => error instanceof DraftValidationError && error.issues[0]?.field === "admin.gallery" && /Галерея ещё не подготовлена/.test(error.issues[0]?.title));
});

test("Admin keeps stable section ids and rejects legacy schema before compilation", () => {
  const first = createAdminDraft(project({ content: [{ type: "section", heading: "Секция", blocks: [] }] }));
  const second = parseAdminDraft(JSON.stringify(first));
  assert.equal(second.content[0].adminId, first.content[0].adminId);
  assert.throws(() => createAdminDraft({ ...project(), schemaVersion: 2 }), /миграци/i);
});

test("slot validation translates ratio and minimum-size errors into actionable Russian messages", () => {
  const wrongRatio = structuredClone(project());
  wrongRatio.visuals.catalog.assets.screen[0].height = 1800;
  const ratio = draftValidation(createAdminDraft(wrongRatio));
  assert.equal(ratio.valid, false);
  assert.match(ratio.issues[0].title, /Неверные пропорции/);
  const tooSmall = structuredClone(project());
  tooSmall.visuals.catalog.assets.screen[0] = { src: "/assets/projects/draft-test/small.png", alt: "", width: 468, height: 312 };
  const minimum = draftValidation(createAdminDraft(tooSmall));
  assert.match(minimum.issues[0].title, /слишком маленькое/i);
});
