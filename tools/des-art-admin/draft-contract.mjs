import { validateProjectDocument } from "../../src/lib/project-contract.ts";

export class DraftValidationError extends Error {
  constructor(issues) {
    super(issues[0]?.message ?? "Черновик заполнен не полностью.");
    this.name = "DraftValidationError";
    this.issues = issues;
  }
}

function clone(value) {
  return structuredClone(value);
}

function requireRecord(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DraftValidationError([{ field: label, message: "Черновик повреждён." }]);
  }
  return value;
}

function sectionId(slug, index) {
  return `${slug}-section-${index + 1}`;
}

export function createAdminDraft(value) {
  const input = clone(requireRecord(value, "project"));
  if (typeof input.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    throw new DraftValidationError([{ field: "slug", message: "Некорректный адрес проекта." }]);
  }
  if (!Array.isArray(input.content)) input.content = [];
  input.content = input.content.map((block, index) => block?.type === "section"
    ? { ...block, adminId: typeof block.adminId === "string" ? block.adminId : sectionId(input.slug, index) }
    : block);
  if (input.admin !== undefined) requireRecord(input.admin, "admin");
  return input;
}

export function parseAdminDraft(source, sourceName = "draft.json") {
  try {
    return createAdminDraft(JSON.parse(source));
  } catch (error) {
    if (error instanceof DraftValidationError) throw error;
    throw new DraftValidationError([{ field: "project", message: `Не удалось прочитать ${sourceName}.` }]);
  }
}

function issueFrom(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("materials.figmaUrl")) {
    return { field: "materials.figmaUrl", message: "Укажите ссылку на Figma." };
  }
  if (message.includes("materials.updatedAt")) {
    return { field: "materials.updatedAt", message: "Проверьте дату последнего обновления." };
  }
  if (message.includes("title")) return { field: "title", message: "Укажите название проекта." };
  if (message.includes("description")) return { field: "description", message: "Укажите описание проекта." };
  return { field: "project", message: "Проверьте обязательные поля проекта." };
}

export function compileAdminDraft(value) {
  const draft = createAdminDraft(value);
  const settings = draft.admin?.sections ?? {};
  for (const [id, sectionSettings] of Object.entries(settings)) {
    if (sectionSettings?.interactive?.enabled && sectionSettings.interactive.status === "pending") {
      throw new DraftValidationError([{
        field: `admin.sections.${id}.interactive`,
        message: "Интерактивный экран ещё не подготовлен.",
      }]);
    }
  }
  const publicValue = clone(draft);
  delete publicValue.admin;
  publicValue.content = publicValue.content.map((block) => {
    if (block?.type !== "section") return block;
    const id = block.adminId;
    const sectionSettings = settings[id];
    const next = { ...block };
    delete next.adminId;
    let blocks = [...next.blocks];
    if (sectionSettings?.noticeEnabled === false) blocks = blocks.filter((item) => item.type !== "notice");
    if (sectionSettings?.noticeVariant) {
      blocks = blocks.map((item) => item.type === "notice" ? { ...item, variant: sectionSettings.noticeVariant } : item);
    }
    if (sectionSettings?.interactive?.enabled === false) blocks = blocks.filter((item) => item.type !== "image");
    const hasImage = blocks.some((item) => item.type === "image");
    blocks = blocks.filter((item) => item.type !== "divider");
    if (!hasImage) blocks.push({ type: "divider" });
    return { ...next, blocks };
  });
  try {
    return validateProjectDocument(publicValue);
  } catch (error) {
    throw new DraftValidationError([issueFrom(error)]);
  }
}

export function draftValidation(value) {
  try {
    compileAdminDraft(value);
    return { valid: true, issues: [] };
  } catch (error) {
    if (error instanceof DraftValidationError) return { valid: false, issues: error.issues };
    throw error;
  }
}
