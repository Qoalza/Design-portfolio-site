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
    throw new DraftValidationError([{
      field: label,
      label: "Данные проекта",
      title: "Черновик проекта не удалось прочитать",
      message: "В сохранённом черновике отсутствует обязательная структура проекта. Автоматически восстановить её нельзя; требуется ручная диагностика разработчиком.",
    }]);
  }
  return value;
}

function sectionId(slug, index) {
  return `${slug}-section-${index + 1}`;
}

function fieldIssue({ field, label, title, tab, message, sectionId }) {
  return { field, label, title, tab, ...(sectionId ? { sectionId } : {}), message };
}

function frameDescriptor(location) {
  if (location.startsWith("catalogFrame")) {
    return { field: "catalogFrame", label: "Обложка карточки", title: "Обложку карточки не удалось подготовить", tab: "card" };
  }
  if (location.startsWith("heroFrame")) {
    return { field: "heroFrame", label: "Главное изображение страницы", title: "Главное изображение страницы не удалось подготовить", tab: "page" };
  }
  return undefined;
}

function frameNodeAt(draft, location) {
  const root = location.startsWith("catalogFrame") ? draft?.catalogFrame : draft?.heroFrame;
  let current = root;
  for (const match of location.matchAll(/(?:nodes|children)\[(\d+)\]/g)) {
    const collection = match[0].startsWith("nodes") ? current?.nodes : current?.children;
    current = collection?.[Number(match[1])];
  }
  return current && typeof current === "object" ? current : undefined;
}

function humanFrameIssue(message, location, draft) {
  const descriptor = frameDescriptor(location);
  if (!descriptor) return undefined;
  const node = frameNodeAt(draft, location);
  const nodeName = typeof node?.name === "string" && node.name.trim() ? node.name.trim() : "элемент без названия";
  const property = location.split(".").slice(-2).join(".");
  let explanation;
  if (property === "layout.gap") {
    explanation = `У группы «${nodeName}» некорректно задано расстояние между элементами. Укажите в Figma числовое значение gap не меньше 0 и обновите Frame.`;
  } else if (/\.(?:x|y)$/.test(location) && /finite number/i.test(message)) {
    explanation = `У элемента «${nodeName}» некорректно задана позиция. Проверьте его координаты во Frame и обновите импорт.`;
  } else if (/\.(?:width|height)$/.test(location) && /finite number/i.test(message)) {
    explanation = `У элемента «${nodeName}» некорректно задан размер. Задайте ему положительную ширину и высоту во Frame и обновите импорт.`;
  } else if (/\.asset\.src$/.test(location)) {
    explanation = `Для элемента «${nodeName}» не найден сохранённый файл изображения. Повторите импорт; если ошибка останется, требуется ручная диагностика разработчиком.`;
  } else {
    explanation = "Причину не удалось определить автоматически. Предыдущая рабочая версия сохранена; требуется ручная диагностика разработчиком.";
  }
  return fieldIssue({ ...descriptor, message: explanation });
}

export function createAdminDraft(value) {
  const input = removeFileMetadata(clone(requireRecord(value, "project")));
  if (typeof input.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    throw new DraftValidationError([{
      field: "slug",
      label: "Адрес проекта",
      title: "Адрес проекта сформирован неверно",
      message: "Системный адрес проекта отсутствует или содержит неподдерживаемые символы. Автоматически исправить сохранённый адрес нельзя; требуется ручная диагностика разработчиком.",
    }]);
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
    throw new DraftValidationError([{
      field: "project",
      label: "Черновик проекта",
      title: "Черновик проекта не удалось открыть",
      message: `Файл «${sourceName}» содержит незавершённые или нечитаемые данные. Автоматически восстановить их нельзя; требуется ручная диагностика разработчиком.`,
    }]);
  }
}

function issueFrom(error, draft) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("materials.figmaUrl")) {
    return fieldIssue({ field: "materials.figmaUrl", label: "Ссылка на Figma", title: "Не указана ссылка на файл проекта", tab: "page", message: "Вы выбрали состояние «Файл доступен». Вставьте ссылку на Figma или измените состояние файла." });
  }
  if (message.includes("materials.updatedAt")) {
    return fieldIssue({ field: "materials.updatedAt", label: "Дата последнего обновления", title: "Дата последнего обновления указана неверно", tab: "page", message: "Выберите существующую календарную дату или оставьте поле пустым." });
  }
  if (message.includes("title")) return fieldIssue({ field: "title", label: "Название", title: "Название проекта не заполнено", tab: "card", message: "Введите название проекта." });
  if (message.includes("description")) return fieldIssue({ field: "description", label: "Описание", title: "Описание проекта не заполнено", tab: "card", message: "Введите описание, которое будет показано в карточке проекта." });
  if (message.includes("role")) return fieldIssue({ field: "role", label: "Роль", title: "Роль в проекте не заполнена", tab: "card", message: "Укажите роль для карточки проекта." });
  const location = /Project document\.([^ ]+)/.exec(message)?.[1]?.replace(/[".]+$/g, "");
  const frameIssue = location ? humanFrameIssue(message, location, draft) : undefined;
  if (frameIssue) return frameIssue;
  if (location?.startsWith("logo")) {
    return fieldIssue({ field: "logo", label: "Логотип проекта", title: "Логотип проекта не удалось прочитать", tab: "card", message: "Загруженный SVG не соответствует формату логотипа. Загрузите безопасный квадратный SVG или оставьте поле пустым." });
  }
  const contentIndex = location ? /^content\[(\d+)\]/.exec(location)?.[1] : undefined;
  if (contentIndex !== undefined) {
    const index = Number(contentIndex);
    const block = draft?.content?.[index];
    if (block?.type === "section") {
      return {
        field: `content.${block.adminId ?? index}`,
        label: `Секция ${index + 1}`,
        tab: "page",
        ...(block.adminId ? { sectionId: block.adminId } : {}),
        title: `Секцию ${index + 1} не удалось подготовить`,
        message: "Причину не удалось определить автоматически. Сохранённые данные не изменены; требуется ручная диагностика разработчиком.",
      };
    }
    if (block?.type === "gallery") {
      return fieldIssue({ field: "gallery", label: "Галерея", title: "Галерею не удалось подготовить", tab: "page", message: "Причину не удалось определить автоматически. Сохранённые изображения не изменены; требуется ручная диагностика разработчиком." });
    }
  }
  return fieldIssue({
    field: "project",
    label: "Данные проекта",
    title: "Проект не удалось подготовить",
    tab: location?.startsWith("content") || location?.startsWith("materials") ? "page" : "card",
    message: "Причину не удалось определить автоматически. Сохранённые данные не изменены; требуется ручная диагностика разработчиком.",
  });
}

function requiredIssues(draft) {
  const issues = [];
  const required = [
    ["title", "Название", "Название проекта не заполнено", "card", "Введите название проекта."],
    ["description", "Описание", "Описание проекта не заполнено", "card", "Введите описание, которое будет показано в карточке проекта."],
    ["role", "Роль", "Роль в проекте не заполнена", "card", "Укажите роль для карточки проекта."],
  ];
  for (const [field, label, title, tab, message] of required) {
    if (typeof draft[field] !== "string" || !draft[field].trim()) issues.push(fieldIssue({ field, label, title, tab, message }));
  }
  if (!Number.isInteger(draft.year) || draft.year < 1900) {
    issues.push(fieldIssue({ field: "year", label: "Год", title: "Год проекта указан неверно", tab: "card", message: "Укажите год четырьмя цифрами, не раньше 1900." }));
  }
  if (typeof draft.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) {
    issues.push(fieldIssue({ field: "slug", label: "Адрес", title: "Адрес проекта сформирован неверно", tab: "card", message: "Адрес не удалось восстановить автоматически. Требуется ручная диагностика разработчиком." }));
  }
  if (draft.materials?.fileState === "available" && !(draft.materials.figmaUrl ?? "").trim()) {
    issues.push(issueFrom(new Error("materials.figmaUrl")));
  }
  if (draft.detailAvailable && !draft.heroFrame && !draft.hero) {
    issues.push(fieldIssue({ field: "heroFrame", label: "Главное изображение страницы", title: "Главное изображение страницы не добавлено", tab: "page", message: "Страница проекта доступна, поэтому добавьте главное изображение ссылкой на Figma Frame." }));
  }
  for (const block of draft.content ?? []) {
    if (block?.type === "section" && !(block.heading ?? "").trim()) {
      issues.push(fieldIssue({ field: `content.${block.adminId}.heading`, label: "Заголовок секции", title: "Заголовок секции не заполнен", tab: "page", sectionId: block.adminId, message: "Введите заголовок этой секции." }));
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
        title: "Интерактивный экран ещё не подготовлен",
        tab: "page",
        sectionId: id,
        message: "Обновите ссылку на Figma Frame и дождитесь успешного импорта либо отключите интерактивный экран в этой секции.",
      });
    }
  }
  const pendingDevices = draft.admin?.gallery?.pendingDeviceIds ?? [];
  if (pendingDevices.length) {
    issues.push({
      field: "admin.gallery",
      label: "Галерея",
      title: "Галерея ещё не подготовлена",
      tab: "page",
      message: "Добавьте изображение для включённого устройства или отключите устройство.",
    });
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
    if (sectionSettings?.interactive?.enabled === false) blocks = blocks.filter((item) => item.type !== "image" && item.type !== "frame");
    const hasImage = blocks.some((item) => item.type === "image" || item.type === "frame");
    blocks = blocks.filter((item) => item.type !== "divider");
    if (!hasImage) blocks.push({ type: "divider" });
    return { ...next, blocks };
  });
  try {
    return validateProjectDocument(publicValue);
  } catch (error) {
    throw new DraftValidationError([issueFrom(error, draft)]);
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
