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

const clone = (value) => structuredClone(value);
const sectionId = (slug, index) => `${slug}-section-${index + 1}`;
const fieldIssue = ({ field, label, title, tab, message, sectionId: id }) => ({ field, label, title, tab, ...(id ? { sectionId: id } : {}), message });

function requireRecord(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DraftValidationError([fieldIssue({ field: label, label: "Данные проекта", title: "Черновик проекта не удалось прочитать", tab: "card", message: "В сохранённом черновике отсутствует обязательная структура проекта. Требуется диагностика разработчиком." })]);
  }
  return value;
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

export function createAdminDraft(value) {
  const input = removeFileMetadata(clone(requireRecord(value, "project")));
  if (input.schemaVersion !== 3) {
    throw new DraftValidationError([fieldIssue({ field: "schemaVersion", label: "Версия проекта", title: "Черновик требует миграции", tab: "card", message: "Этот черновик создан старой версией Admin. Сначала выполните безопасную миграцию v2→v3." })]);
  }
  if (typeof input.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    throw new DraftValidationError([fieldIssue({ field: "slug", label: "Адрес проекта", title: "Адрес проекта сформирован неверно", tab: "card", message: "Системный адрес проекта отсутствует или содержит неподдерживаемые символы." })]);
  }
  if (!Array.isArray(input.content)) input.content = [];
  input.content = input.content.map((block, index) => block?.type === "section"
    ? { ...block, adminId: typeof block.adminId === "string" ? block.adminId : sectionId(input.slug, index) }
    : block);
  if (input.admin !== undefined) requireRecord(input.admin, "admin");
  return input;
}

export function parseAdminDraft(source, sourceName = "draft.json") {
  try { return createAdminDraft(JSON.parse(source)); }
  catch (error) {
    if (error instanceof DraftValidationError) throw error;
    throw new DraftValidationError([fieldIssue({ field: "project", label: "Черновик проекта", title: "Черновик проекта не удалось открыть", tab: "card", message: `Файл «${sourceName}» содержит незавершённые или нечитаемые данные.` })]);
  }
}

function issueFrom(error, draft) {
  const message = error instanceof Error ? error.message : String(error);
  const location = /Project document\.([^ ]+)/.exec(message)?.[1]?.replace(/[".]+$/g, "");
  if (message.includes("materials.figmaUrl")) return fieldIssue({ field: "materials.figmaUrl", label: "Ссылка на Figma", title: "Не указана ссылка на файл проекта", tab: "page", message: "Вставьте HTTPS-ссылку на Figma или измените состояние файла." });
  if (message.includes("title")) return fieldIssue({ field: "title", label: "Название", title: "Название проекта не заполнено", tab: "card", message: "Введите название проекта." });
  if (message.includes("description")) return fieldIssue({ field: "description", label: "Описание", title: "Описание проекта не заполнено", tab: "card", message: "Введите описание проекта." });
  if (message.includes("role")) return fieldIssue({ field: "role", label: "Роль", title: "Роль в проекте не заполнена", tab: "card", message: "Укажите роль в проекте." });
  if (/incompatible proportion/i.test(message)) return fieldIssue({ field: location ?? "visuals", label: "Изображение", title: "Неверные пропорции изображения", tab: location?.startsWith("content") ? "page" : "card", message: "Файл не сохранён: его пропорции не соответствуют утверждённому слоту. Экспортируйте изображение в точной пропорции шаблона." });
  if (/minimum 2×/i.test(message)) return fieldIssue({ field: location ?? "visuals", label: "Изображение", title: "Изображение слишком маленькое", tab: location?.startsWith("content") ? "page" : "card", message: "Файл не сохранён: для этого слота нужен источник минимум в два раза больше логического размера." });
  if (/MIME type/i.test(message)) return fieldIssue({ field: location ?? "visuals", label: "Изображение", title: "Формат изображения не поддерживается", tab: location?.startsWith("content") ? "page" : "card", message: "Файл не сохранён: выберите формат, разрешённый для этого слота." });
  if (/templateId|designProfile/i.test(message)) return fieldIssue({ field: location ?? "visuals", label: "Визуальный шаблон", title: "Шаблон не соответствует профилю проекта", tab: location?.startsWith("content") || location?.includes("hero") ? "page" : "card", message: "Черновик ссылается на неутверждённый или несовместимый шаблон. Назначение шаблона изменяется только через код." });
  const contentIndex = location ? /^content\[(\d+)\]/.exec(location)?.[1] : undefined;
  if (contentIndex !== undefined) {
    const block = draft?.content?.[Number(contentIndex)];
    return fieldIssue({ field: `content.${block?.adminId ?? contentIndex}`, label: `Секция ${Number(contentIndex) + 1}`, title: "Секцию не удалось подготовить", tab: "page", sectionId: block?.adminId, message: "Проверьте заполнение секции и её разрешённых slots." });
  }
  return fieldIssue({ field: location ?? "project", label: "Данные проекта", title: "Проект не удалось подготовить", tab: location?.includes("hero") ? "page" : "card", message: "Данные не соответствуют утверждённому контракту проекта. Сохранённый черновик не изменён." });
}

function requiredIssues(draft) {
  const issues = [];
  for (const [field, label, title, tab, message] of [
    ["title", "Название", "Название проекта не заполнено", "card", "Введите название проекта."],
    ["description", "Описание", "Описание проекта не заполнено", "card", "Введите описание проекта."],
    ["role", "Роль", "Роль в проекте не заполнена", "card", "Укажите роль в проекте."],
  ]) if (typeof draft[field] !== "string" || !draft[field].trim()) issues.push(fieldIssue({ field, label, title, tab, message }));
  if (!Number.isInteger(draft.year) || draft.year < 1900) issues.push(fieldIssue({ field: "year", label: "Год", title: "Год проекта указан неверно", tab: "card", message: "Укажите год четырьмя цифрами, не раньше 1900." }));
  if (draft.materials?.fileState === "available" && !(draft.materials.figmaUrl ?? "").trim()) issues.push(issueFrom(new Error("materials.figmaUrl"), draft));
  if (draft.detailAvailable && !draft.visuals?.hero) issues.push(fieldIssue({ field: "visuals.hero", label: "Главное изображение страницы", title: "Для страницы не назначен hero-шаблон", tab: "page", message: "Назначьте утверждённый hero-шаблон изменением кода; Admin не создаёт визуальные шаблоны." }));
  for (const block of draft.content ?? []) if (block?.type === "section" && !(block.heading ?? "").trim()) issues.push(fieldIssue({ field: `content.${block.adminId}.heading`, label: "Заголовок секции", title: "Заголовок секции не заполнен", tab: "page", sectionId: block.adminId, message: "Введите заголовок секции." }));
  return issues;
}

export function compileAdminDraft(value) {
  const draft = createAdminDraft(value);
  const issues = requiredIssues(draft);
  const pendingDevices = draft.admin?.gallery?.pendingDeviceIds ?? [];
  if (pendingDevices.length) issues.push(fieldIssue({ field: "admin.gallery", label: "Галерея", title: "Галерея ещё не подготовлена", tab: "page", message: "Добавьте совместимое изображение для включённого устройства или отключите устройство." }));
  if (issues.length) throw new DraftValidationError(issues);
  const publicValue = clone(draft);
  delete publicValue.admin;
  publicValue.content = publicValue.content.map((block) => {
    if (block?.type !== "section") return block;
    const next = { ...block };
    delete next.adminId;
    return next;
  });
  try { return validateProjectDocument(publicValue); }
  catch (error) { throw new DraftValidationError([issueFrom(error, draft)]); }
}

export function draftValidation(value) {
  try { compileAdminDraft(value); return { valid: true, issues: [] }; }
  catch (error) { if (error instanceof DraftValidationError) return { valid: false, issues: error.issues }; throw error; }
}
