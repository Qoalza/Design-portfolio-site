export const FIGMA_TEMPLATE_IMPORTS = {
  "catalog.browser": {
    kind: "children",
    slots: [{ name: "screen", alt: "Интерфейс проекта" }],
  },
  "catalog.corvo-stack": {
    kind: "children",
    slots: [
      { name: "backdrop", alt: "Фоновый экран Corvo" },
      { name: "foreground", alt: "Передний экран Corvo" },
    ],
  },
  "catalog.sarafan-collage": {
    kind: "children",
    slots: [
      { name: "dashboard", alt: "Интерфейс Sarafan.Radio" },
      { name: "player", alt: "Плеер Sarafan.Radio" },
      { name: "payment", alt: "Оплата Sarafan.Radio" },
    ],
  },
  "hero.corvo-browser": {
    kind: "children",
    slots: [
      { name: "backdrop", alt: "Фоновый экран Corvo" },
      { name: "foreground", alt: "Передний экран Corvo" },
    ],
  },
  "hero.sarafan-collage": {
    kind: "children",
    slots: [
      { name: "illustration", alt: "Иллюстрация пустого эфира" },
      { name: "decoration", alt: "" },
      { name: "dashboard", alt: "Интерфейс Sarafan.Radio" },
      { name: "player", alt: "Плеер Sarafan.Radio" },
      { name: "payment", alt: "Оплата Sarafan.Radio" },
    ],
  },
  "canvas.corvo-quotes": {
    kind: "root-crops", width: 1000, height: 450,
    slots: [{ name: "content", alt: "Цитаты проекта", x: 74, y: 42, width: 852, height: 366 }],
  },
  "canvas.corvo-process": {
    kind: "root-crops", width: 1000, height: 480,
    slots: [{ name: "content", alt: "Схема процесса", x: 43, y: 45, width: 906, height: 390 }],
  },
  "canvas.corvo-controls": {
    kind: "root-crops", width: 1000, height: 268,
    slots: [
      { name: "buttons", alt: "Компоненты кнопок", x: 20, y: 20, width: 428, height: 228 },
      { name: "inputs", alt: "Компоненты полей ввода", x: 469, y: 20, width: 531, height: 228 },
    ],
  },
  "canvas.sarafan-model": {
    kind: "root-crops", width: 1000, height: 480,
    slots: [{ name: "content", alt: "Модель продукта Sarafan.Radio", x: 120, y: 48, width: 760, height: 384 }],
  },
  "canvas.sarafan-scenarios": {
    kind: "root-crops", width: 1000, height: 480,
    slots: [{ name: "content", alt: "Сценарии работы Sarafan.Radio", x: 70, y: 65, width: 861, height: 349.5 }],
  },
  "canvas.sarafan-setup": {
    kind: "root-crops", width: 1000, height: 732,
    slots: [
      { name: "desktop", alt: "Настройка Sarafan.Radio на desktop", x: 68, y: 151, width: 603, height: 414 },
      { name: "panel", alt: "Панель настройки Sarafan.Radio", x: 480, y: 72, width: 464, height: 588 },
    ],
  },
};

const SARAFAN_FILE_KEY = "5ZzspE0OrqesDcTP0RRPHr";

export const FIGMA_TEMPLATE_SOURCES = {
  "canvas.sarafan-model": [{ fileKey: SARAFAN_FILE_KEY, nodeId: "992:24663" }],
  "canvas.sarafan-scenarios": [{ fileKey: SARAFAN_FILE_KEY, nodeId: "989:24607" }],
};

export function templateMatchesFigmaSource(templateId, source) {
  const approved = FIGMA_TEMPLATE_SOURCES[templateId];
  if (!approved) return true;
  return approved.some((entry) => entry.fileKey === source.fileKey && entry.nodeId === source.nodeId);
}

export function sectionTemplateOptions(profile, registry) {
  return Object.entries(registry)
    .filter(([, template]) => template.surface === "section" && template.profiles.includes(profile))
    .map(([templateId, template]) => ({ templateId, label: template.label }));
}
