import { validateProjectDocument } from "../../src/lib/project-contract.ts";
import { changeProjectFileState, changeProjectMaterialsState } from "./material-state.mjs";

export { changeProjectFileState, changeProjectMaterialsState };

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

function removeFileMetadata(value) {
  if (Array.isArray(value)) return value.map(removeFileMetadata);
  if (!value || typeof value !== "object") return value;
  const result = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, removeFileMetadata(item)]));
  if (typeof result.src === "string" && Number.isFinite(result.width) && Number.isFinite(result.height)) {
    delete result.mime;
    delete result.duplicateOf;
  }
  return result;
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
  const input = removeFileMetadata(clone(requireRecord(value, "project")));
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
    return { field: "materials.figmaUrl", label: "Ссылка на Figma", tab: "page", message: "Укажите ссылку на Figma." };
  }
  if (message.includes("materials.updatedAt")) {
    return { field: "materials.updatedAt", label: "Дата последнего обновления", tab: "page", message: "Проверьте дату последнего обновления." };
  }
  if (message.includes("title")) return { field: "title", label: "Название", tab: "card", message: "Укажите название проекта." };
  if (message.includes("description")) return { field: "description", label: "Описание", tab: "card", message: "Укажите описание проекта." };
  if (message.includes("role")) return { field: "role", label: "Роль", tab: "card", message: "Укажите роль в проекте." };
  const location = /Project document\.([^ ]+)/.exec(message)?.[1]?.replace(/[".]+$/g, "");
  return {
    field: location ?? "project",
    label: location ? `Поле ${location}` : "Данные проекта",
    tab: location?.startsWith("content") || location?.startsWith("materials") ? "page" : "card",
    message: location ? `Поле «${location}» содержит некорректные данные.` : `Не удалось проверить проект: ${message}`,
  };
}

function requiredIssues(draft) {
  const issues = [];
  const required = [
    ["title", "Название", "card", "Укажите название проекта."],
    ["description", "Описание", "card", "Укажите описание проекта."],
    ["role", "Роль", "card", "Укажите роль в проекте."],
  ];
  for (const [field, label, tab, message] of required) {
    if (typeof draft[field] !== "string" || !draft[field].trim()) issues.push({ field, label, tab, message });
  }
  if (!Number.isInteger(draft.year) || draft.year < 1900) {
    issues.push({ field: "year", label: "Год", tab: "card", message: "Укажите корректный год." });
  }
  if (typeof draft.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) {
    issues.push({ field: "slug", label: "Адрес", tab: "card", message: "Системный адрес проекта повреждён." });
  }
  if (draft.materials?.fileState === "available" && !(draft.materials.figmaUrl ?? "").trim()) {
    issues.push(issueFrom(new Error("materials.figmaUrl")));
  }
  for (const block of draft.content ?? []) {
    if (block?.type === "section" && !(block.heading ?? "").trim()) {
      issues.push({ field: `content.${block.adminId}.heading`, label: "Заголовок секции", tab: "page", sectionId: block.adminId, message: "Укажите заголовок секции." });
    }
  }
  return issues;
}

export function compileAdminDraft(value) {
  const draft = createAdminDraft(value);
  const issues = requiredIssues(draft);
  const settings = draft.admin?.sections ?? {};
  for (const [id, sectionSettings] of Object.entries(settings)) {
    if (sectionSettings?.interactive?.enabled && sectionSettings.interactive.status === "pending") {
      issues.push({
        field: `admin.sections.${id}.interactive`,
        label: "Интерактивный экран",
        tab: "page",
        sectionId: id,
        message: "Интерактивный экран ещё не подготовлен.",
      });
    }
  }
  if (issues.length) throw new DraftValidationError(issues);
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
