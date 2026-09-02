export type ProjectDesignProfile = "catalog-only-v1" | "corvo-v1" | "sarafan-v1";
export type ProjectHomePlacement = "primary" | "secondary";
export type ProjectVisualSurface = "catalog" | "home" | "hero" | "section" | "gallery" | "notice";
export type ProjectAssetOperation = "replace" | "add" | "remove" | "reorder";
export type ProjectCatalogPosition = "wide" | "compact";

type ImageLike = { src: string; alt: string; width: number; height: number };

export type ProjectVisualAssetSlot = {
  label: string;
  operations: readonly ProjectAssetOperation[];
  mime: readonly ("image/png" | "image/svg+xml" | "image/webp")[];
  minItems: number;
  maxItems: number;
  ratio?: number;
  logicalWidth?: number;
  logicalHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  legacyDimensions?: readonly {
    ratio?: number;
    logicalWidth?: number;
    logicalHeight?: number;
  }[];
};

export type ProjectVisualTemplateDefinition = {
  surface: ProjectVisualSurface;
  label: string;
  profiles: readonly ProjectDesignProfile[];
  slots: Readonly<Record<string, ProjectVisualAssetSlot>>;
  catalogPositions?: readonly ProjectCatalogPosition[];
  homePlacements?: readonly ProjectHomePlacement[];
};

const singlePng = (label: string, ratio: number, logicalWidth: number, logicalHeight: number): ProjectVisualAssetSlot => ({
  label,
  operations: ["replace"],
  mime: ["image/png", "image/webp"],
  minItems: 1,
  maxItems: 1,
  ratio,
  logicalWidth,
  logicalHeight,
});

const galleryPng = (label: string, logicalWidth: number, logicalHeight: number, maxWidth: number, maxHeight: number): ProjectVisualAssetSlot => ({
  label,
  operations: ["replace", "add", "remove", "reorder"],
  mime: ["image/png", "image/webp"],
  minItems: 0,
  maxItems: 20,
  logicalWidth,
  logicalHeight,
  maxWidth,
  maxHeight,
});

export const PROJECT_VISUAL_TEMPLATES = {
  "catalog.browser": {
    surface: "catalog", label: "Браузерная карточка", profiles: ["catalog-only-v1"], catalogPositions: ["compact"],
    slots: { screen: singlePng("Изображение интерфейса", 3 / 2, 468, 312) },
  },
  "catalog.corvo-stack": {
    surface: "catalog", label: "Corvo — многослойная карточка", profiles: ["corvo-v1"], catalogPositions: ["wide"], homePlacements: ["primary"],
    slots: {
      backdrop: singlePng("Задний экран", 2960 / 2400, 740, 600),
      foreground: singlePng("Передний экран", 2960 / 2400, 740, 600),
    },
  },
  "catalog.sarafan-collage": {
    surface: "catalog", label: "Sarafan — коллаж карточки", profiles: ["sarafan-v1"], catalogPositions: ["compact"],
    slots: {
      dashboard: singlePng("Главный экран", 2880 / 2518, 428, 373),
      player: singlePng("Плеер", 1688 / 612, 265, 96),
      payment: singlePng("Оплата", 760 / 1100, 120, 173),
    },
  },
  "home.sarafan-radio": {
    surface: "home", label: "Sarafan.Radio на главной", profiles: ["sarafan-v1"], homePlacements: ["secondary"],
    slots: {
      dashboard: singlePng("Главный экран", 2880 / 2518, 1440, 1259),
      player: singlePng("Плеер", 1688 / 612, 844, 306),
      payment: singlePng("Оплата", 760 / 1100, 380, 550),
    },
  },
  "hero.corvo-browser": {
    surface: "hero", label: "Browser hero", profiles: ["catalog-only-v1", "corvo-v1", "sarafan-v1"],
    slots: {
      backdrop: singlePng("Фоновый экран", 2960 / 2400, 740, 600),
      foreground: singlePng("Передний экран", 2960 / 2400, 740, 600),
    },
  },
  "hero.sarafan-collage": {
    surface: "hero", label: "Collage hero", profiles: ["catalog-only-v1", "corvo-v1", "sarafan-v1"],
    slots: {
      illustration: singlePng("Иллюстрация", 2714 / 2144, 678, 536),
      decoration: singlePng("Декоративный круг", 1, 618, 618),
      dashboard: singlePng("Главный экран", 2896 / 2464, 726, 618),
      player: singlePng("Плеер", 1688 / 920, 421, 230),
      payment: singlePng("Оплата", 1099 / 536, 274, 134),
    },
  },
  "canvas.corvo-quotes": {
    surface: "section", label: "Corvo — цитаты", profiles: ["corvo-v1"],
    slots: { content: singlePng("Цитаты", 1704 / 732, 852, 366) },
  },
  "canvas.corvo-process": {
    surface: "section", label: "Corvo — процесс", profiles: ["corvo-v1"],
    slots: { content: singlePng("Схема процесса", 1812 / 780, 906, 390) },
  },
  "canvas.corvo-controls": {
    surface: "section", label: "Corvo — компоненты", profiles: ["corvo-v1"],
    slots: {
      buttons: singlePng("Кнопки", 856 / 456, 428, 228),
      inputs: singlePng("Поля ввода", 1062 / 456, 531, 228),
    },
  },
  "canvas.sarafan-model": {
    surface: "section", label: "Sarafan — модель", profiles: ["sarafan-v1"],
    slots: { content: singlePng("Модель", 888 / 240, 888, 240) },
  },
  "canvas.sarafan-scenarios": {
    surface: "section", label: "Sarafan — сценарии", profiles: ["sarafan-v1"],
    slots: {
      content: {
        ...singlePng("Сценарии", 760 / 384, 760, 384),
        legacyDimensions: [{ ratio: 861 / 349.5, logicalWidth: 861, logicalHeight: 349.5 }],
      },
    },
  },
  "canvas.sarafan-setup": {
    surface: "section", label: "Sarafan — настройка", profiles: ["sarafan-v1"],
    slots: {
      desktop: singlePng("Desktop", 603 / 414, 603, 414),
      panel: singlePng("Панель", 464 / 588, 464, 588),
    },
  },
  "gallery.devices-v1": {
    surface: "gallery", label: "Галерея устройств", profiles: ["corvo-v1", "sarafan-v1"],
    slots: {
      desktop: galleryPng("Desktop", 740, 512, 2960, 2048),
      tablet: galleryPng("Tablet", 400, 566, 1600, 2266),
      mobile: galleryPng("Mobile", 180, 320, 1080, 1920),
    },
  },
  "notice.info-v1": {
    surface: "notice", label: "Информационное примечание", profiles: ["corvo-v1", "sarafan-v1"], slots: {},
  },
} as const satisfies Record<string, ProjectVisualTemplateDefinition>;

export type ProjectVisualTemplateId = keyof typeof PROJECT_VISUAL_TEMPLATES;
export type ProjectVisualInstance = {
  templateId: ProjectVisualTemplateId;
  assets: Record<string, ImageLike[]>;
};

const PROFILE_HOME_PLACEMENT: Partial<Record<ProjectDesignProfile, ProjectHomePlacement>> = {
  "corvo-v1": "primary",
  "sarafan-v1": "secondary",
};

function assetMime(src: string): "image/png" | "image/svg+xml" | "image/webp" | undefined {
  if (src.endsWith(".png")) return "image/png";
  if (src.endsWith(".svg")) return "image/svg+xml";
  if (src.endsWith(".webp")) return "image/webp";
  return undefined;
}

export function validateTemplateAssets(
  templateId: ProjectVisualTemplateId,
  assets: Record<string, ImageLike[]>,
  location: string,
): void {
  const template = PROJECT_VISUAL_TEMPLATES[templateId];
  const allowedSlots = Object.keys(template.slots);
  for (const name of Object.keys(assets)) {
    if (!allowedSlots.includes(name)) throw new Error(`${location}.assets contains unknown slot "${name}".`);
  }
  for (const [name, slot] of Object.entries(template.slots) as [string, ProjectVisualAssetSlot][]) {
    const images = assets[name] ?? (slot.minItems === 0 ? [] : undefined);
    if (!Array.isArray(images) || images.length < slot.minItems || images.length > slot.maxItems) {
      throw new Error(`${location}.assets.${name} must contain between ${slot.minItems} and ${slot.maxItems} asset(s).`);
    }
    for (const [index, image] of images.entries()) validateAssetForSlot(templateId, name, image, `${location}.assets.${name}[${index}]`);
  }
}

export function validateAssetForSlot(templateId: ProjectVisualTemplateId, slotName: string, image: ImageLike, location: string): void {
  const template = PROJECT_VISUAL_TEMPLATES[templateId];
  const slot = (template.slots as Record<string, ProjectVisualAssetSlot>)[slotName];
  if (!slot) throw new Error(`${location} uses unknown slot "${slotName}".`);
  const mime = assetMime(image.src);
  if (!mime || !slot.mime.includes(mime)) throw new Error(`${location} uses an unsupported MIME type.`);
  const dimensions = [slot, ...(slot.legacyDimensions ?? [])];
  const ratioMatches = dimensions.filter((candidate) => candidate.ratio === undefined
    || Math.abs(image.width / image.height - candidate.ratio) / candidate.ratio <= 0.001);
  if (ratioMatches.length === 0) throw new Error(`${location} has an incompatible proportion.`);
  const compatible = ratioMatches.find((candidate) => candidate.logicalWidth === undefined || candidate.logicalHeight === undefined
    || (image.width >= candidate.logicalWidth * 2 && image.height >= candidate.logicalHeight * 2));
  if (!compatible) {
    throw new Error(`${location} is below the minimum 2× source size.`);
  }
  if ((slot.maxWidth !== undefined && image.width > slot.maxWidth)
    || (slot.maxHeight !== undefined && image.height > slot.maxHeight)) {
    throw new Error(`${location} is outside the allowed pixel range.`);
  }
}

type CollectionProject = {
  slug: string;
  visibility: "draft" | "published" | "deleted";
  catalogOrder: number;
  designProfile: ProjectDesignProfile;
  homePlacement?: ProjectHomePlacement;
  visuals: { catalog: ProjectVisualInstance; home?: ProjectVisualInstance; hero?: ProjectVisualInstance };
};

export function validateProjectCollection(projects: readonly CollectionProject[]): void {
  const published = projects.filter((project) => project.visibility === "published");
  for (const placement of ["primary", "secondary"] as const) {
    const occupants = published.filter((project) => project.homePlacement === placement);
    if (occupants.length > 1) throw new Error(`Homepage placement ${placement} must have at most one project.`);
  }
  for (const project of projects) {
    const expectedPlacement = PROFILE_HOME_PLACEMENT[project.designProfile];
    if (project.homePlacement && project.homePlacement !== expectedPlacement) {
      throw new Error(`${project.designProfile} is not compatible with homepage ${project.homePlacement}.`);
    }
    if (project.homePlacement && !project.visuals.home) throw new Error(`${project.slug} requires visuals.home for homepage placement.`);
  }
  for (const [index, project] of [...published].sort((a, b) => a.catalogOrder - b.catalogOrder).entries()) {
    const position: ProjectCatalogPosition = index % 3 === 0 ? "wide" : "compact";
    const template = PROJECT_VISUAL_TEMPLATES[project.visuals.catalog.templateId] as ProjectVisualTemplateDefinition;
    if (!template.catalogPositions?.includes(position)) {
      throw new Error(`${project.slug} template ${project.visuals.catalog.templateId} is incompatible with catalog ${position} position.`);
    }
  }
}
