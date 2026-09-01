import path from "node:path";
import {
  PROJECT_VISUAL_TEMPLATES,
  validateTemplateAssets,
  type ProjectDesignProfile,
  type ProjectHomePlacement,
  type ProjectVisualInstance,
  type ProjectVisualTemplateId,
} from "./project-visual-registry.ts";

export const PROJECT_DOCUMENT_VERSION = 3 as const;

export type ProjectVisibility = "draft" | "published" | "deleted";
export type ProjectPlatform = "Desktop" | "Tablet" | "Mobile";
export type ProjectTextMark = "strong" | "emphasis" | "underline";

export type ProjectInlineContent =
  | { type: "text"; text: string; marks?: ProjectTextMark[] }
  | { type: "strong"; text: string }
  | { type: "emphasis"; text: string }
  | { type: "underline"; text: string }
  | { type: "link"; text: string; href: string; marks?: ProjectTextMark[] };

export type ProjectImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type ProjectLogo =
  | { type: "image"; src: string }
  | { type: "layered"; layers: Array<{ src: string; slot: "a" | "b" | "c" | "d" }> };

export type ProjectGalleryDeviceId = "desktop" | "tablet" | "mobile";
export type ProjectGalleryGroup = {
  deviceId: ProjectGalleryDeviceId;
  images: ProjectImage[];
};
export type ProjectGalleryItem = ProjectImage;

export type ProjectSectionBlock =
  | { type: "paragraph"; content: ProjectInlineContent[] }
  | { type: "heading"; level: 3; content: ProjectInlineContent[] }
  | { type: "list"; style: "ordered" | "unordered"; items: ProjectInlineContent[][] }
  | { type: "notice"; templateId: "notice.info-v1"; content: ProjectInlineContent[] }
  | { type: "visual"; templateId: ProjectVisualTemplateId; assets: Record<string, ProjectImage[]> }
  | { type: "hardBreak" }
  | { type: "divider" };

export type ProjectContentBlock =
  | { type: "section"; heading: string; blocks: ProjectSectionBlock[] }
  | { type: "gallery"; templateId: "gallery.devices-v1"; groups: ProjectGalleryGroup[] };

export type ProjectDocument = {
  schemaVersion: typeof PROJECT_DOCUMENT_VERSION;
  designProfile: ProjectDesignProfile;
  title: string;
  slug: string;
  description: string;
  subtitle?: string;
  role: string;
  year: number;
  tags: string[];
  detailTags: string[];
  visibility: ProjectVisibility;
  catalogOrder: number;
  homePlacement?: ProjectHomePlacement;
  detailAvailable: boolean;
  materials:
    | { projectState: "completed"; fileState: "available"; figmaUrl: string }
    | { projectState: "completed"; fileState: "absent" }
    | { projectState: "in_progress"; fileState: "available"; figmaUrl: string; updatedAt?: string }
    | { projectState: "in_progress"; fileState: "unavailable" };
  platforms: ProjectPlatform[];
  logo?: ProjectLogo;
  visuals: {
    catalog: ProjectVisualInstance;
    home?: ProjectVisualInstance;
    hero?: ProjectVisualInstance;
  };
  workSummary?: string;
  content: ProjectContentBlock[];
};

type UnknownRecord = Record<string, unknown>;

const PROJECT_KEYS = [
  "schemaVersion", "designProfile", "title", "slug", "description", "subtitle", "role", "year",
  "tags", "detailTags", "visibility", "catalogOrder", "homePlacement", "detailAvailable", "materials",
  "platforms", "logo", "visuals", "workSummary", "content",
] as const;
const VISIBILITIES: ProjectVisibility[] = ["draft", "published", "deleted"];
const PLATFORMS: ProjectPlatform[] = ["Desktop", "Tablet", "Mobile"];
const PROFILES: ProjectDesignProfile[] = ["catalog-only-v1", "corvo-v1", "sarafan-v1"];
const HOME_PLACEMENTS: ProjectHomePlacement[] = ["primary", "secondary"];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function record(value: unknown, location: string): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${location} must be an object.`);
  return value as UnknownRecord;
}

function exactKeys(value: UnknownRecord, allowed: readonly string[], location: string): void {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(`${location} contains unknown field "${key}".`);
}

function string(value: unknown, location: string, allowEmpty = false): string {
  if (typeof value !== "string" || (!allowEmpty && value.trim().length === 0)) {
    throw new Error(`${location} must be ${allowEmpty ? "a string" : "a non-empty string"}.`);
  }
  return value;
}

function optionalString(value: unknown, location: string): string | undefined {
  return value === undefined ? undefined : string(value, location);
}

function boolean(value: unknown, location: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${location} must be a boolean.`);
  return value;
}

function integer(value: unknown, location: string, minimum = 0): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum) {
    throw new Error(`${location} must be an integer greater than or equal to ${minimum}.`);
  }
  return value;
}

function stringArray(value: unknown, location: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${location} must be an array.`);
  return value.map((item, index) => string(item, `${location}[${index}]`));
}

function slug(value: unknown, location = "Project slug"): string {
  const parsed = string(value, location);
  if (!SLUG_PATTERN.test(parsed)) throw new Error(`${location} must use lowercase letters, numbers, and single hyphens only.`);
  return parsed;
}

function publicAssetPath(value: unknown, location: string): string {
  const parsed = string(value, location);
  if (!parsed.startsWith("/assets/") || parsed.includes("\\") || parsed.includes("?") || parsed.includes("#")
    || parsed.includes("%") || parsed.split("/").some((segment) => segment === "." || segment === "..")
    || path.posix.normalize(parsed) !== parsed) {
    throw new Error(`${location} must be a normalized public path inside /assets/.`);
  }
  return parsed;
}

function externalUrl(value: unknown, location: string): string {
  const parsed = string(value, location);
  try {
    if (new URL(parsed).protocol !== "https:") throw new Error();
  } catch {
    throw new Error(`${location} must be a valid HTTPS URL.`);
  }
  return parsed;
}

function linkHref(value: unknown, location: string): string {
  const parsed = string(value, location);
  if (parsed.startsWith("#") || parsed.startsWith("/")) {
    if (parsed.includes("\\") || parsed.includes("..")) throw new Error(`${location} contains an unsafe local URL.`);
    return parsed;
  }
  return externalUrl(parsed, location);
}

function image(value: unknown, location: string): ProjectImage {
  const input = record(value, location);
  exactKeys(input, ["src", "alt", "width", "height"], location);
  return {
    src: publicAssetPath(input.src, `${location}.src`),
    alt: string(input.alt, `${location}.alt`, true),
    width: integer(input.width, `${location}.width`, 1),
    height: integer(input.height, `${location}.height`, 1),
  };
}

function inlineMarks(value: unknown, location: string): ProjectTextMark[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new Error(`${location} must be an array.`);
  const allowed: ProjectTextMark[] = ["strong", "emphasis", "underline"];
  const marks = value.map((item, index) => {
    const mark = string(item, `${location}[${index}]`) as ProjectTextMark;
    if (!allowed.includes(mark)) throw new Error(`${location}[${index}] is not a supported text mark.`);
    return mark;
  });
  return [...new Set(marks)];
}

function inline(value: unknown, location: string): ProjectInlineContent {
  const input = record(value, location);
  const type = string(input.type, `${location}.type`);
  if (type === "link") {
    exactKeys(input, ["type", "text", "href", "marks"], location);
    const marks = inlineMarks(input.marks, `${location}.marks`);
    return { type, text: string(input.text, `${location}.text`), href: linkHref(input.href, `${location}.href`), ...(marks ? { marks } : {}) };
  }
  if (type !== "text" && type !== "strong" && type !== "emphasis" && type !== "underline") {
    throw new Error(`${location}.type is not a supported inline content type.`);
  }
  exactKeys(input, type === "text" ? ["type", "text", "marks"] : ["type", "text"], location);
  if (type === "text") {
    const marks = inlineMarks(input.marks, `${location}.marks`);
    return { type, text: string(input.text, `${location}.text`, true), ...(marks ? { marks } : {}) };
  }
  return { type, text: string(input.text, `${location}.text`) };
}

function inlineArray(value: unknown, location: string): ProjectInlineContent[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${location} must be a non-empty array.`);
  return value.map((item, index) => inline(item, `${location}[${index}]`));
}

function visualInstance(value: unknown, location: string, profile: ProjectDesignProfile, surface: "catalog" | "home" | "hero" | "section"): ProjectVisualInstance {
  const input = record(value, location);
  exactKeys(input, surface === "section" ? ["type", "templateId", "assets"] : ["templateId", "assets"], location);
  const templateId = string(input.templateId, `${location}.templateId`) as ProjectVisualTemplateId;
  const template = PROJECT_VISUAL_TEMPLATES[templateId];
  if (!template) throw new Error(`${location}.templateId is not approved.`);
  const surfaceMatches = template.surface === surface || (surface === "home" && "homePlacements" in template);
  if (!surfaceMatches) throw new Error(`${location}.templateId is not supported on the ${surface} surface.`);
  if (!(template.profiles as readonly string[]).includes(profile)) throw new Error(`${location}.templateId is not allowed by ${profile}.`);
  const assetInput = record(input.assets, `${location}.assets`);
  const assets = Object.fromEntries(Object.entries(assetInput).map(([name, value]) => {
    if (!Array.isArray(value)) throw new Error(`${location}.assets.${name} must be an array.`);
    return [name, value.map((item, index) => image(item, `${location}.assets.${name}[${index}]`))];
  }));
  validateTemplateAssets(templateId, assets, location);
  return { templateId, assets };
}

function sectionBlock(value: unknown, location: string, profile: ProjectDesignProfile): ProjectSectionBlock {
  const input = record(value, location);
  const type = string(input.type, `${location}.type`);
  if (type === "paragraph") {
    exactKeys(input, ["type", "content"], location);
    return { type, content: inlineArray(input.content, `${location}.content`) };
  }
  if (type === "heading") {
    exactKeys(input, ["type", "level", "content"], location);
    if (input.level !== 3) throw new Error(`${location}.level must be 3.`);
    return { type, level: 3, content: inlineArray(input.content, `${location}.content`) };
  }
  if (type === "list") {
    exactKeys(input, ["type", "style", "items"], location);
    const style = string(input.style, `${location}.style`);
    if (style !== "ordered" && style !== "unordered") throw new Error(`${location}.style must be ordered or unordered.`);
    if (!Array.isArray(input.items) || input.items.length === 0) throw new Error(`${location}.items must be a non-empty array.`);
    return { type, style, items: input.items.map((item, index) => inlineArray(item, `${location}.items[${index}]`)) };
  }
  if (type === "notice") {
    exactKeys(input, ["type", "templateId", "content"], location);
    if (input.templateId !== "notice.info-v1") throw new Error(`${location}.templateId is not approved.`);
    if (profile === "catalog-only-v1") throw new Error(`${location}.templateId is not allowed by ${profile}.`);
    return { type, templateId: "notice.info-v1", content: inlineArray(input.content, `${location}.content`) };
  }
  if (type === "visual") {
    return { type, ...visualInstance(input, location, profile, "section") };
  }
  if (type === "hardBreak" || type === "divider") {
    exactKeys(input, ["type"], location);
    return { type };
  }
  throw new Error(`${location}.type is not a supported section block.`);
}

function galleryGroup(value: unknown, location: string): ProjectGalleryGroup {
  const input = record(value, location);
  exactKeys(input, ["deviceId", "images"], location);
  const deviceId = string(input.deviceId, `${location}.deviceId`) as ProjectGalleryDeviceId;
  if (!(["desktop", "tablet", "mobile"] as const).includes(deviceId)) throw new Error(`${location}.deviceId must be desktop, tablet, or mobile.`);
  if (!Array.isArray(input.images) || input.images.length === 0) throw new Error(`${location}.images must be a non-empty array.`);
  const images = input.images.map((item, index) => image(item, `${location}.images[${index}]`));
  validateTemplateAssets("gallery.devices-v1", { [deviceId]: images }, location);
  return { deviceId, images };
}

function contentBlock(value: unknown, location: string, profile: ProjectDesignProfile): ProjectContentBlock {
  const input = record(value, location);
  const type = string(input.type, `${location}.type`);
  if (type === "section") {
    exactKeys(input, ["type", "heading", "blocks"], location);
    if (!Array.isArray(input.blocks)) throw new Error(`${location}.blocks must be an array.`);
    return { type, heading: string(input.heading, `${location}.heading`), blocks: input.blocks.map((item, index) => sectionBlock(item, `${location}.blocks[${index}]`, profile)) };
  }
  if (type === "gallery") {
    exactKeys(input, ["type", "templateId", "groups"], location);
    if (input.templateId !== "gallery.devices-v1") throw new Error(`${location}.templateId is not approved.`);
    if (profile === "catalog-only-v1") throw new Error(`${location}.templateId is not allowed by ${profile}.`);
    if (!Array.isArray(input.groups) || input.groups.length === 0) throw new Error(`${location}.groups must be a non-empty array.`);
    const groups = input.groups.map((item, index) => galleryGroup(item, `${location}.groups[${index}]`));
    if (new Set(groups.map(({ deviceId }) => deviceId)).size !== groups.length) throw new Error(`${location}.groups must use unique deviceId values.`);
    return { type, templateId: "gallery.devices-v1", groups };
  }
  throw new Error(`${location}.type is not a supported content block.`);
}

function optionalProperty<T>(key: string, value: T | undefined): Record<string, T> {
  return value === undefined ? {} : { [key]: value };
}

export function validateProjectDocument(value: unknown): ProjectDocument {
  const input = record(value, "Project document");
  exactKeys(input, PROJECT_KEYS, "Project document");
  if (input.schemaVersion !== PROJECT_DOCUMENT_VERSION) throw new Error(`Project document schemaVersion must be ${PROJECT_DOCUMENT_VERSION}.`);
  const profile = string(input.designProfile, "Project document.designProfile") as ProjectDesignProfile;
  if (!PROFILES.includes(profile)) throw new Error("Project document.designProfile is not supported.");
  const visibility = string(input.visibility, "Project document.visibility") as ProjectVisibility;
  if (!VISIBILITIES.includes(visibility)) throw new Error("Project document.visibility must be draft, published, or deleted.");
  const homePlacement = input.homePlacement === undefined ? undefined : string(input.homePlacement, "Project document.homePlacement") as ProjectHomePlacement;
  if (homePlacement && !HOME_PLACEMENTS.includes(homePlacement)) throw new Error("Project document.homePlacement must be primary or secondary.");
  if (visibility !== "published" && homePlacement) throw new Error("A non-published project cannot have homePlacement.");
  if (profile === "catalog-only-v1" && homePlacement) throw new Error("catalog-only-v1 cannot have homePlacement.");
  if (profile === "corvo-v1" && homePlacement && homePlacement !== "primary") throw new Error("corvo-v1 requires primary homePlacement.");
  if (profile === "sarafan-v1" && homePlacement && homePlacement !== "secondary") throw new Error("sarafan-v1 requires secondary homePlacement.");
  if (!Array.isArray(input.platforms)) throw new Error("Project document.platforms must be an array.");
  const platforms = input.platforms.map((item, index) => string(item, `Project document.platforms[${index}]`) as ProjectPlatform);
  if (platforms.some((item) => !PLATFORMS.includes(item))) throw new Error("Project document.platforms contains an unsupported platform.");
  if (!Array.isArray(input.content)) throw new Error("Project document.content must be an array.");

  const materialInput = record(input.materials, "Project document.materials");
  const projectState = string(materialInput.projectState, "Project document.materials.projectState");
  const fileState = string(materialInput.fileState, "Project document.materials.fileState");
  let materials: ProjectDocument["materials"];
  if (projectState === "completed" && fileState === "available") {
    exactKeys(materialInput, ["projectState", "fileState", "figmaUrl"], "Project document.materials");
    materials = { projectState, fileState, figmaUrl: externalUrl(materialInput.figmaUrl, "Project document.materials.figmaUrl") };
  } else if (projectState === "completed" && fileState === "absent") {
    exactKeys(materialInput, ["projectState", "fileState"], "Project document.materials");
    materials = { projectState, fileState };
  } else if (projectState === "in_progress" && fileState === "available") {
    exactKeys(materialInput, ["projectState", "fileState", "figmaUrl", "updatedAt"], "Project document.materials");
    materials = { projectState, fileState, figmaUrl: externalUrl(materialInput.figmaUrl, "Project document.materials.figmaUrl"), ...optionalProperty("updatedAt", optionalString(materialInput.updatedAt, "Project document.materials.updatedAt")) };
  } else if (projectState === "in_progress" && fileState === "unavailable") {
    exactKeys(materialInput, ["projectState", "fileState"], "Project document.materials");
    materials = { projectState, fileState };
  } else throw new Error("Project document.materials contains an unsupported state.");

  let logo: ProjectLogo | undefined;
  if (input.logo !== undefined) {
    const logoInput = record(input.logo, "Project document.logo");
    const type = string(logoInput.type, "Project document.logo.type");
    if (type === "image") {
      exactKeys(logoInput, ["type", "src"], "Project document.logo");
      logo = { type, src: publicAssetPath(logoInput.src, "Project document.logo.src") };
    } else if (type === "layered") {
      exactKeys(logoInput, ["type", "layers"], "Project document.logo");
      if (!Array.isArray(logoInput.layers) || logoInput.layers.length === 0) throw new Error("Project document.logo.layers must be a non-empty array.");
      logo = { type, layers: logoInput.layers.map((value, index) => {
        const layer = record(value, `Project document.logo.layers[${index}]`);
        exactKeys(layer, ["src", "slot"], `Project document.logo.layers[${index}]`);
        const slot = string(layer.slot, `Project document.logo.layers[${index}].slot`) as "a" | "b" | "c" | "d";
        if (!["a", "b", "c", "d"].includes(slot)) throw new Error(`Project document.logo.layers[${index}].slot is not supported.`);
        return { src: publicAssetPath(layer.src, `Project document.logo.layers[${index}].src`), slot };
      }) };
    } else throw new Error("Project document.logo.type must be image or layered.");
  }

  const visualsInput = record(input.visuals, "Project document.visuals");
  exactKeys(visualsInput, ["catalog", "home", "hero"], "Project document.visuals");
  const catalog = visualInstance(visualsInput.catalog, "Project document.visuals.catalog", profile, "catalog");
  const home = visualsInput.home === undefined ? undefined : visualInstance(visualsInput.home, "Project document.visuals.home", profile, "home");
  const hero = visualsInput.hero === undefined ? undefined : visualInstance(visualsInput.hero, "Project document.visuals.hero", profile, "hero");
  if (homePlacement && !home) throw new Error("Project document.visuals.home is required for homePlacement.");
  const detailAvailable = boolean(input.detailAvailable, "Project document.detailAvailable");
  if (detailAvailable && !hero) throw new Error("Project document.visuals.hero is required when detailAvailable is true.");

  return {
    schemaVersion: PROJECT_DOCUMENT_VERSION,
    designProfile: profile,
    title: string(input.title, "Project document.title"),
    slug: slug(input.slug, "Project document.slug"),
    description: string(input.description, "Project document.description"),
    ...optionalProperty("subtitle", optionalString(input.subtitle, "Project document.subtitle")),
    role: string(input.role, "Project document.role"),
    year: integer(input.year, "Project document.year", 1900),
    tags: stringArray(input.tags, "Project document.tags"),
    detailTags: stringArray(input.detailTags, "Project document.detailTags"),
    visibility,
    catalogOrder: integer(input.catalogOrder, "Project document.catalogOrder"),
    ...optionalProperty("homePlacement", homePlacement),
    detailAvailable,
    materials,
    platforms,
    ...optionalProperty("logo", logo),
    visuals: { catalog, ...optionalProperty("home", home), ...optionalProperty("hero", hero) },
    ...optionalProperty("workSummary", optionalString(input.workSummary, "Project document.workSummary")),
    content: input.content.map((item, index) => contentBlock(item, `Project document.content[${index}]`, profile)),
  };
}

export function parseProjectDocument(source: string, sourceName = "project.json"): ProjectDocument {
  let parsed: unknown;
  try { parsed = JSON.parse(source); }
  catch (error) { throw new Error(`Cannot parse project document "${sourceName}": ${error instanceof Error ? error.message : "Unknown JSON error"}`); }
  try { return validateProjectDocument(parsed); }
  catch (error) { throw new Error(`Invalid project document "${sourceName}": ${error instanceof Error ? error.message : "Unknown validation error"}`); }
}

export function serializeProjectDocument(value: unknown): string {
  return `${JSON.stringify(validateProjectDocument(value), null, 2)}\n`;
}

export function deleteProject(value: unknown): ProjectDocument {
  const project = validateProjectDocument(value);
  const deleted = { ...project, visibility: "deleted" as const };
  delete deleted.homePlacement;
  return deleted;
}

function resolveInside(root: string, segments: string[], location: string): string {
  const absoluteRoot = path.resolve(root);
  const target = path.resolve(absoluteRoot, ...segments);
  if (target !== absoluteRoot && !target.startsWith(`${absoluteRoot}${path.sep}`)) throw new Error(`${location} must remain inside its configured root.`);
  return target;
}

export function resolveProjectDocumentPath(contentRoot: string, projectSlug: string): string {
  return resolveInside(contentRoot, [`${slug(projectSlug)}.json`], "Project document path");
}

export function resolveProjectAssetPath(assetRoot: string, projectSlug: string, relativeAssetPath: string): string {
  const parsedSlug = slug(projectSlug);
  const candidate = string(relativeAssetPath, "Project asset path");
  if (path.isAbsolute(candidate) || candidate.includes("\\") || candidate.includes("?") || candidate.includes("#") || candidate.includes("%")
    || candidate.split("/").some((segment) => segment === "" || segment === "." || segment === "..") || path.posix.normalize(candidate) !== candidate) {
    throw new Error("Project asset path must be a normalized relative path without traversal.");
  }
  return resolveInside(assetRoot, [parsedSlug, candidate], "Project asset path");
}

export type { ProjectDesignProfile, ProjectHomePlacement, ProjectVisualInstance, ProjectVisualTemplateId } from "./project-visual-registry.ts";
