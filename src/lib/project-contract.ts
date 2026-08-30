import path from "node:path";

export const PROJECT_DOCUMENT_VERSION = 2 as const;

export type ProjectVisibility = "draft" | "published" | "deleted";
export type ProjectPlatform = "Desktop" | "Tablet" | "Mobile";

export type ProjectInlineContent =
  | { type: "text"; text: string; marks?: ProjectTextMark[] }
  | { type: "strong"; text: string }
  | { type: "emphasis"; text: string }
  | { type: "underline"; text: string }
  | { type: "link"; text: string; href: string; marks?: ProjectTextMark[] };

export type ProjectTextMark = "strong" | "emphasis" | "underline";

export type ProjectImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type ProjectFrameConstraints = {
  horizontal: "MIN" | "MAX" | "CENTER" | "STRETCH" | "SCALE";
  vertical: "MIN" | "MAX" | "CENTER" | "STRETCH" | "SCALE";
};

export type ProjectFrameStroke = {
  color: string;
  width: number;
  align: "INSIDE" | "OUTSIDE" | "CENTER";
};

export type ProjectFrameEffect =
  | { type: "drop-shadow" | "inner-shadow"; color: string; offsetX: number; offsetY: number; blur: number; spread: number }
  | { type: "layer-blur" | "background-blur"; radius: number };

export type ProjectFrameNode = {
  id: string;
  name: string;
  type: "container" | "asset";
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rotation: number;
  constraints: ProjectFrameConstraints;
  clip?: boolean;
  radius?: number;
  background?: string;
  stroke?: ProjectFrameStroke;
  effects?: ProjectFrameEffect[];
  blendMode?: string;
  absoluteInLayout?: boolean;
  layoutGrow?: number;
  layoutAlign?: "start" | "center" | "end" | "stretch";
  zIndex?: number;
  layout?: {
    direction: "horizontal" | "vertical";
    gap: number;
    padding: [number, number, number, number];
    align: "start" | "center" | "end" | "space-between";
    crossAlign?: "start" | "center" | "end" | "stretch" | "baseline";
  };
  asset?: {
    src: string;
    format: "svg" | "raster";
    fit: "cover" | "contain" | "fill";
    opacity?: number;
    bounds?: { x: number; y: number; width: number; height: number };
  };
  children?: ProjectFrameNode[];
};

export type ProjectFrameComposition = {
  source: { url: string; fileKey: string; nodeId: string; version: string };
  width: number;
  height: number;
  clip: boolean;
  radius: number;
  background: string;
  stroke?: ProjectFrameStroke;
  effects?: ProjectFrameEffect[];
  blendMode?: string;
  nodes: ProjectFrameNode[];
  preview?: ProjectImage;
};

export type ProjectHero = {
  presentation: "single" | "browser-composite";
  image: ProjectImage;
  backdrop?: ProjectImage;
  foreground?: ProjectImage;
};

export type ProjectLogo =
  | { type: "image"; src: string }
  | {
      type: "layered";
      layers: Array<{
        src: string;
        slot: "a" | "b" | "c" | "d";
      }>;
    };

export type ProjectGalleryFrame = {
  clip: boolean;
  radius: number;
  strokeColor: string;
  strokeWidth: number;
};

export type ProjectGalleryItem = ProjectImage & {
  sourceNodeId?: string;
  frame: ProjectGalleryFrame;
};

export type ProjectGalleryGroup = {
  id: "desktop" | "tablet" | "mobile";
  label: string;
  icon: string;
  baseWidth: number;
  baseHeight: number;
  items: ProjectGalleryItem[];
};

export type ProjectSectionBlock =
  | { type: "paragraph"; content: ProjectInlineContent[] }
  | { type: "heading"; level: 3 | 4 | 5 | 6; content: ProjectInlineContent[] }
  | { type: "list"; style: "ordered" | "unordered"; items: ProjectInlineContent[][] }
  | { type: "notice"; variant: "default" | "wide"; content: ProjectInlineContent[] }
  | { type: "image"; presentation: "single" | "quotes" | "process" | "controls"; images: ProjectImage[] }
  | { type: "frame"; composition: ProjectFrameComposition }
  | { type: "divider" };

export type ProjectContentBlock =
  | { type: "section"; heading: string; blocks: ProjectSectionBlock[] }
  | { type: "gallery"; title: string; description: string; groups: ProjectGalleryGroup[] };

export type ProjectDocument = {
  schemaVersion: typeof PROJECT_DOCUMENT_VERSION;
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
  featuredOnHome: boolean;
  homeOrder?: number;
  detailAvailable: boolean;
  materials:
    | { projectState: "completed"; fileState: "available"; figmaUrl: string }
    | { projectState: "completed"; fileState: "absent" }
    | { projectState: "in_progress"; fileState: "available"; figmaUrl: string; updatedAt?: string }
    | { projectState: "in_progress"; fileState: "unavailable" };
  platforms: ProjectPlatform[];
  logo?: ProjectLogo;
  hero?: ProjectHero;
  catalogImage?: ProjectImage;
  catalogFrame?: ProjectFrameComposition;
  heroFrame?: ProjectFrameComposition;
  homeImages?: ProjectImage[];
  workSummary?: string;
  content: ProjectContentBlock[];
};

type UnknownRecord = Record<string, unknown>;

const PROJECT_KEYS = [
  "schemaVersion",
  "title",
  "slug",
  "description",
  "subtitle",
  "role",
  "year",
  "tags",
  "detailTags",
  "visibility",
  "catalogOrder",
  "featuredOnHome",
  "homeOrder",
  "detailAvailable",
  "materials",
  "platforms",
  "logo",
  "hero",
  "catalogImage",
  "catalogFrame",
  "heroFrame",
  "homeImages",
  "workSummary",
  "content",
] as const;

const VISIBILITIES: ProjectVisibility[] = ["draft", "published", "deleted"];
const PLATFORMS: ProjectPlatform[] = ["Desktop", "Tablet", "Mobile"];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COLOR_PATTERN = /^(?:transparent|#[0-9a-f]{3,8})$/i;

function record(value: unknown, location: string): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${location} must be an object.`);
  }

  return value as UnknownRecord;
}

function exactKeys(value: UnknownRecord, allowed: readonly string[], location: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      throw new Error(`${location} contains unknown field "${key}".`);
    }
  }
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
  if (typeof value !== "boolean") {
    throw new Error(`${location} must be a boolean.`);
  }

  return value;
}

function integer(value: unknown, location: string, minimum = 0): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum) {
    throw new Error(`${location} must be an integer greater than or equal to ${minimum}.`);
  }

  return value;
}

function finiteNumber(value: unknown, location: string, minimum = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum) {
    throw new Error(`${location} must be a finite number greater than or equal to ${minimum}.`);
  }

  return value;
}

function stringArray(value: unknown, location: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${location} must be an array.`);
  }

  return value.map((item, index) => string(item, `${location}[${index}]`));
}

function slug(value: unknown, location = "Project slug"): string {
  const parsed = string(value, location);
  if (!SLUG_PATTERN.test(parsed)) {
    throw new Error(`${location} must use lowercase letters, numbers, and single hyphens only.`);
  }

  return parsed;
}

function publicAssetPath(value: unknown, location: string): string {
  const parsed = string(value, location);
  if (
    !parsed.startsWith("/assets/")
    || parsed.includes("\\")
    || parsed.includes("?")
    || parsed.includes("#")
    || parsed.includes("%")
    || parsed.split("/").some((segment) => segment === "." || segment === "..")
    || path.posix.normalize(parsed) !== parsed
  ) {
    throw new Error(`${location} must be a normalized public path inside /assets/.`);
  }

  return parsed;
}

function externalUrl(value: unknown, location: string): string {
  const parsed = string(value, location);
  let url: URL;
  try {
    url = new URL(parsed);
  } catch {
    throw new Error(`${location} must be a valid HTTPS URL.`);
  }

  if (url.protocol !== "https:") {
    throw new Error(`${location} must be a valid HTTPS URL.`);
  }

  return parsed;
}

function linkHref(value: unknown, location: string): string {
  const parsed = string(value, location);
  if (parsed.startsWith("#") || parsed.startsWith("/")) {
    if (parsed.includes("\\") || parsed.includes("..")) {
      throw new Error(`${location} contains an unsafe local URL.`);
    }
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

const HORIZONTAL_CONSTRAINTS = ["MIN", "MAX", "CENTER", "STRETCH", "SCALE"] as const;
const VERTICAL_CONSTRAINTS = ["MIN", "MAX", "CENTER", "STRETCH", "SCALE"] as const;

function frameNode(value: unknown, location: string): ProjectFrameNode {
  const input = record(value, location);
  exactKeys(input, ["id", "name", "type", "x", "y", "width", "height", "opacity", "rotation", "constraints", "clip", "radius", "background", "stroke", "effects", "blendMode", "absoluteInLayout", "layoutGrow", "layoutAlign", "zIndex", "layout", "asset", "children"], location);
  const type = string(input.type, `${location}.type`);
  if (type !== "container" && type !== "asset") throw new Error(`${location}.type is not supported.`);
  const constraintInput = record(input.constraints, `${location}.constraints`);
  exactKeys(constraintInput, ["horizontal", "vertical"], `${location}.constraints`);
  const horizontal = string(constraintInput.horizontal, `${location}.constraints.horizontal`) as ProjectFrameConstraints["horizontal"];
  const vertical = string(constraintInput.vertical, `${location}.constraints.vertical`) as ProjectFrameConstraints["vertical"];
  if (!HORIZONTAL_CONSTRAINTS.includes(horizontal) || !VERTICAL_CONSTRAINTS.includes(vertical)) throw new Error(`${location}.constraints is not supported.`);
  let asset: ProjectFrameNode["asset"];
  if (input.asset !== undefined) {
    const assetInput = record(input.asset, `${location}.asset`);
    exactKeys(assetInput, ["src", "format", "fit", "opacity", "bounds"], `${location}.asset`);
    const format = string(assetInput.format, `${location}.asset.format`);
    const fit = string(assetInput.fit, `${location}.asset.fit`);
    if (format !== "svg" && format !== "raster") throw new Error(`${location}.asset.format is not supported.`);
    if (fit !== "cover" && fit !== "contain" && fit !== "fill") throw new Error(`${location}.asset.fit is not supported.`);
    let bounds: NonNullable<ProjectFrameNode["asset"]>["bounds"];
    if (assetInput.bounds !== undefined) {
      const boundsInput = record(assetInput.bounds, `${location}.asset.bounds`);
      exactKeys(boundsInput, ["x", "y", "width", "height"], `${location}.asset.bounds`);
      bounds = {
        x: finiteSignedNumber(boundsInput.x, `${location}.asset.bounds.x`),
        y: finiteSignedNumber(boundsInput.y, `${location}.asset.bounds.y`),
        width: finiteNumber(boundsInput.width, `${location}.asset.bounds.width`, 0),
        height: finiteNumber(boundsInput.height, `${location}.asset.bounds.height`, 0),
      };
    }
    asset = {
      src: publicAssetPath(assetInput.src, `${location}.asset.src`), format, fit,
      ...optionalProperty("opacity", assetInput.opacity === undefined ? undefined : finiteNumber(assetInput.opacity, `${location}.asset.opacity`)),
      ...optionalProperty("bounds", bounds),
    };
  }
  let layout: ProjectFrameNode["layout"];
  if (input.layout !== undefined) {
    const layoutInput = record(input.layout, `${location}.layout`);
    exactKeys(layoutInput, ["direction", "gap", "padding", "align", "crossAlign"], `${location}.layout`);
    const direction = string(layoutInput.direction, `${location}.layout.direction`);
    const align = string(layoutInput.align, `${location}.layout.align`);
    if (direction !== "horizontal" && direction !== "vertical") throw new Error(`${location}.layout.direction is not supported.`);
    if (!Array.isArray(layoutInput.padding) || layoutInput.padding.length !== 4) throw new Error(`${location}.layout.padding must have four values.`);
    if (!["start", "center", "end", "space-between"].includes(align)) throw new Error(`${location}.layout.align is not supported.`);
    const crossAlign = layoutInput.crossAlign === undefined ? undefined : string(layoutInput.crossAlign, `${location}.layout.crossAlign`);
    if (crossAlign !== undefined && !["start", "center", "end", "stretch", "baseline"].includes(crossAlign)) throw new Error(`${location}.layout.crossAlign is not supported.`);
    layout = { direction, gap: finiteNumber(layoutInput.gap, `${location}.layout.gap`), padding: layoutInput.padding.map((item, index) => finiteNumber(item, `${location}.layout.padding[${index}]`)) as [number, number, number, number], align: align as NonNullable<ProjectFrameNode["layout"]>["align"], ...optionalProperty("crossAlign", crossAlign as NonNullable<ProjectFrameNode["layout"]>["crossAlign"]) };
  }
  if (type === "asset" && !asset) throw new Error(`${location}.asset is required.`);
  const children = input.children === undefined ? undefined : Array.isArray(input.children) ? input.children.map((item, index) => frameNode(item, `${location}.children[${index}]`)) : (() => { throw new Error(`${location}.children must be an array.`); })();
  const parsedStroke = frameStroke(input.stroke, `${location}.stroke`);
  const parsedEffects = frameEffects(input.effects, `${location}.effects`);
  const layoutAlign = input.layoutAlign === undefined ? undefined : string(input.layoutAlign, `${location}.layoutAlign`);
  if (layoutAlign !== undefined && !["start", "center", "end", "stretch"].includes(layoutAlign)) throw new Error(`${location}.layoutAlign is not supported.`);
  return {
    id: string(input.id, `${location}.id`), name: string(input.name, `${location}.name`), type,
    x: finiteSignedNumber(input.x, `${location}.x`), y: finiteSignedNumber(input.y, `${location}.y`), width: finiteNumber(input.width, `${location}.width`, 0), height: finiteNumber(input.height, `${location}.height`, 0),
    opacity: finiteNumber(input.opacity, `${location}.opacity`), rotation: typeof input.rotation === "number" && Number.isFinite(input.rotation) ? input.rotation : 0,
    constraints: { horizontal, vertical },
    ...optionalProperty("clip", input.clip === undefined ? undefined : boolean(input.clip, `${location}.clip`)),
    ...optionalProperty("radius", input.radius === undefined ? undefined : finiteNumber(input.radius, `${location}.radius`)),
    ...optionalProperty("background", input.background === undefined ? undefined : string(input.background, `${location}.background`, true)),
    ...optionalProperty("stroke", parsedStroke),
    ...optionalProperty("effects", parsedEffects),
    ...optionalProperty("blendMode", input.blendMode === undefined ? undefined : string(input.blendMode, `${location}.blendMode`)),
    ...optionalProperty("absoluteInLayout", input.absoluteInLayout === undefined ? undefined : boolean(input.absoluteInLayout, `${location}.absoluteInLayout`)),
    ...optionalProperty("layoutGrow", input.layoutGrow === undefined ? undefined : finiteNumber(input.layoutGrow, `${location}.layoutGrow`)),
    ...optionalProperty("layoutAlign", layoutAlign as ProjectFrameNode["layoutAlign"]),
    ...optionalProperty("zIndex", input.zIndex === undefined ? undefined : finiteSignedNumber(input.zIndex, `${location}.zIndex`)),
    ...optionalProperty("layout", layout), ...optionalProperty("asset", asset), ...optionalProperty("children", children),
  };
}

function frameEffects(value: unknown, location: string): ProjectFrameEffect[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new Error(`${location} must be an array.`);
  return value.map((item, index) => {
    const effect = record(item, `${location}[${index}]`);
    const type = string(effect.type, `${location}[${index}].type`);
    if (type === "drop-shadow" || type === "inner-shadow") {
      exactKeys(effect, ["type", "color", "offsetX", "offsetY", "blur", "spread"], `${location}[${index}]`);
      return { type, color: string(effect.color, `${location}[${index}].color`), offsetX: finiteSignedNumber(effect.offsetX, `${location}[${index}].offsetX`), offsetY: finiteSignedNumber(effect.offsetY, `${location}[${index}].offsetY`), blur: finiteNumber(effect.blur, `${location}[${index}].blur`), spread: finiteSignedNumber(effect.spread, `${location}[${index}].spread`) };
    }
    if (type === "layer-blur" || type === "background-blur") {
      exactKeys(effect, ["type", "radius"], `${location}[${index}]`);
      return { type, radius: finiteNumber(effect.radius, `${location}[${index}].radius`) };
    }
    throw new Error(`${location}[${index}].type is not supported.`);
  });
}

function finiteSignedNumber(value: unknown, location: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${location} must be a finite number.`);
  return value;
}

function frameComposition(value: unknown, location: string): ProjectFrameComposition {
  const input = record(value, location);
  exactKeys(input, ["source", "width", "height", "clip", "radius", "background", "stroke", "effects", "blendMode", "nodes", "preview"], location);
  const source = record(input.source, `${location}.source`);
  exactKeys(source, ["url", "fileKey", "nodeId", "version"], `${location}.source`);
  if (!Array.isArray(input.nodes)) throw new Error(`${location}.nodes must be an array.`);
  return {
    source: { url: externalUrl(source.url, `${location}.source.url`), fileKey: string(source.fileKey, `${location}.source.fileKey`), nodeId: string(source.nodeId, `${location}.source.nodeId`), version: string(source.version, `${location}.source.version`) },
    width: finiteNumber(input.width, `${location}.width`, 1), height: finiteNumber(input.height, `${location}.height`, 1), clip: boolean(input.clip, `${location}.clip`), radius: finiteNumber(input.radius, `${location}.radius`), background: string(input.background, `${location}.background`, true),
    ...optionalProperty("stroke", frameStroke(input.stroke, `${location}.stroke`)),
    ...optionalProperty("effects", frameEffects(input.effects, `${location}.effects`)),
    ...optionalProperty("blendMode", input.blendMode === undefined ? undefined : string(input.blendMode, `${location}.blendMode`)),
    nodes: input.nodes.map((item, index) => frameNode(item, `${location}.nodes[${index}]`)),
    ...optionalProperty("preview", input.preview === undefined ? undefined : image(input.preview, `${location}.preview`)),
  };
}

function frameStroke(value: unknown, location: string): ProjectFrameStroke | undefined {
  if (value === undefined) return undefined;
  const input = record(value, location);
  exactKeys(input, ["color", "width", "align"], location);
  const align = string(input.align, `${location}.align`) as ProjectFrameStroke["align"];
  if (!["INSIDE", "OUTSIDE", "CENTER"].includes(align)) throw new Error(`${location}.align is not supported.`);
  return {
    color: string(input.color, `${location}.color`),
    width: finiteNumber(input.width, `${location}.width`, 0),
    align,
  };
}

function inline(value: unknown, location: string): ProjectInlineContent {
  const input = record(value, location);
  const type = string(input.type, `${location}.type`);

  if (type === "link") {
    exactKeys(input, ["type", "text", "href", "marks"], location);
    const marks = inlineMarks(input.marks, `${location}.marks`);
    return {
      type,
      text: string(input.text, `${location}.text`),
      href: linkHref(input.href, `${location}.href`),
      ...(marks ? { marks } : {}),
    };
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

function inlineArray(value: unknown, location: string): ProjectInlineContent[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${location} must be a non-empty array.`);
  }

  return value.map((item, index) => inline(item, `${location}[${index}]`));
}

function sectionBlock(value: unknown, location: string): ProjectSectionBlock {
  const input = record(value, location);
  const type = string(input.type, `${location}.type`);

  if (type === "paragraph") {
    exactKeys(input, ["type", "content"], location);
    return { type, content: inlineArray(input.content, `${location}.content`) };
  }

  if (type === "heading") {
    exactKeys(input, ["type", "level", "content"], location);
    const level = integer(input.level, `${location}.level`, 3);
    if (level > 6) throw new Error(`${location}.level must be between 3 and 6.`);
    return { type, level: level as 3 | 4 | 5 | 6, content: inlineArray(input.content, `${location}.content`) };
  }

  if (type === "list") {
    exactKeys(input, ["type", "style", "items"], location);
    const style = string(input.style, `${location}.style`);
    if (style !== "ordered" && style !== "unordered") {
      throw new Error(`${location}.style must be ordered or unordered.`);
    }
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new Error(`${location}.items must be a non-empty array.`);
    }
    return {
      type,
      style,
      items: input.items.map((item, index) => inlineArray(item, `${location}.items[${index}]`)),
    };
  }

  if (type === "notice") {
    exactKeys(input, ["type", "variant", "content"], location);
    const variant = input.variant === undefined ? "default" : string(input.variant, `${location}.variant`);
    if (variant !== "default" && variant !== "wide") {
      throw new Error(`${location}.variant must be default or wide.`);
    }
    return { type, variant, content: inlineArray(input.content, `${location}.content`) };
  }

  if (type === "image") {
    exactKeys(input, ["type", "presentation", "images"], location);
    const presentation = string(input.presentation, `${location}.presentation`);
    if (!["single", "quotes", "process", "controls"].includes(presentation)) {
      throw new Error(`${location}.presentation is not supported.`);
    }
    if (!Array.isArray(input.images) || input.images.length === 0) {
      throw new Error(`${location}.images must be a non-empty array.`);
    }
    const expectedCount = presentation === "controls" ? 2 : 1;
    if (input.images.length !== expectedCount) {
      throw new Error(`${location}.images must contain exactly ${expectedCount} image${expectedCount === 1 ? "" : "s"} for ${presentation}.`);
    }
    return {
      type,
      presentation: presentation as "single" | "quotes" | "process" | "controls",
      images: input.images.map((item, index) => image(item, `${location}.images[${index}]`)),
    };
  }

  if (type === "frame") {
    exactKeys(input, ["type", "composition"], location);
    return { type, composition: frameComposition(input.composition, `${location}.composition`) };
  }

  if (type === "divider") {
    exactKeys(input, ["type"], location);
    return { type };
  }

  throw new Error(`${location}.type is not a supported section block.`);
}

function galleryFrame(value: unknown, location: string): ProjectGalleryFrame {
  const input = record(value, location);
  exactKeys(input, ["clip", "radius", "strokeColor", "strokeWidth"], location);
  const strokeColor = string(input.strokeColor, `${location}.strokeColor`);
  if (!COLOR_PATTERN.test(strokeColor)) {
    throw new Error(`${location}.strokeColor must be transparent or a hex color.`);
  }
  return {
    clip: boolean(input.clip, `${location}.clip`),
    radius: finiteNumber(input.radius, `${location}.radius`),
    strokeColor,
    strokeWidth: finiteNumber(input.strokeWidth, `${location}.strokeWidth`),
  };
}

function galleryItem(value: unknown, location: string): ProjectGalleryItem {
  const input = record(value, location);
  exactKeys(input, ["src", "alt", "width", "height", "sourceNodeId", "frame"], location);
  return {
    src: publicAssetPath(input.src, `${location}.src`),
    alt: string(input.alt, `${location}.alt`, true),
    width: integer(input.width, `${location}.width`, 1),
    height: integer(input.height, `${location}.height`, 1),
    ...(input.sourceNodeId === undefined ? {} : { sourceNodeId: string(input.sourceNodeId, `${location}.sourceNodeId`) }),
    frame: galleryFrame(input.frame, `${location}.frame`),
  };
}

function galleryGroup(value: unknown, location: string): ProjectGalleryGroup {
  const input = record(value, location);
  exactKeys(input, ["id", "label", "icon", "baseWidth", "baseHeight", "items"], location);
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error(`${location}.items must be a non-empty array.`);
  }
  const id = string(input.id, `${location}.id`);
  if (id !== "desktop" && id !== "tablet" && id !== "mobile") {
    throw new Error(`${location}.id must be desktop, tablet, or mobile.`);
  }
  return {
    id,
    label: string(input.label, `${location}.label`),
    icon: publicAssetPath(input.icon, `${location}.icon`),
    baseWidth: integer(input.baseWidth, `${location}.baseWidth`, 1),
    baseHeight: integer(input.baseHeight, `${location}.baseHeight`, 1),
    items: input.items.map((item, index) => galleryItem(item, `${location}.items[${index}]`)),
  };
}

function contentBlock(value: unknown, location: string): ProjectContentBlock {
  const input = record(value, location);
  const type = string(input.type, `${location}.type`);

  if (type === "section") {
    exactKeys(input, ["type", "heading", "blocks"], location);
    if (!Array.isArray(input.blocks)) throw new Error(`${location}.blocks must be an array.`);
    return {
      type,
      heading: string(input.heading, `${location}.heading`),
      blocks: input.blocks.map((item, index) => sectionBlock(item, `${location}.blocks[${index}]`)),
    };
  }

  if (type === "gallery") {
    exactKeys(input, ["type", "title", "description", "groups"], location);
    if (!Array.isArray(input.groups) || input.groups.length === 0) {
      throw new Error(`${location}.groups must be a non-empty array.`);
    }
    const groups = input.groups.map((item, index) => galleryGroup(item, `${location}.groups[${index}]`));
    if (new Set(groups.map(({ id }) => id)).size !== groups.length) {
      throw new Error(`${location}.groups must use unique ids.`);
    }
    return {
      type,
      title: string(input.title, `${location}.title`),
      description: string(input.description, `${location}.description`),
      groups,
    };
  }

  throw new Error(`${location}.type is not a supported content block.`);
}

function optionalProperty<T>(key: string, value: T | undefined): Record<string, T> {
  return value === undefined ? {} : { [key]: value };
}

export function validateProjectDocument(value: unknown): ProjectDocument {
  const input = record(value, "Project document");
  exactKeys(input, PROJECT_KEYS, "Project document");

  if (input.schemaVersion !== PROJECT_DOCUMENT_VERSION) {
    throw new Error(`Project document schemaVersion must be ${PROJECT_DOCUMENT_VERSION}.`);
  }

  const visibility = string(input.visibility, "Project document.visibility");
  if (!VISIBILITIES.includes(visibility as ProjectVisibility)) {
    throw new Error("Project document.visibility must be draft, published, or deleted.");
  }

  if (!Array.isArray(input.platforms)) throw new Error("Project document.platforms must be an array.");
  const platforms = input.platforms.map((item, index) => string(item, `Project document.platforms[${index}]`));
  if (platforms.some((item) => !PLATFORMS.includes(item as ProjectPlatform))) {
    throw new Error("Project document.platforms contains an unsupported platform.");
  }

  if (!Array.isArray(input.content)) throw new Error("Project document.content must be an array.");

  const featuredOnHome = boolean(input.featuredOnHome, "Project document.featuredOnHome");
  const homeOrder = input.homeOrder === undefined ? undefined : integer(input.homeOrder, "Project document.homeOrder", 1);
  const detailAvailable = boolean(input.detailAvailable, "Project document.detailAvailable");
  if (visibility !== "published" && featuredOnHome) {
    throw new Error("A non-published project cannot be featuredOnHome.");
  }
  if (featuredOnHome !== (homeOrder !== undefined)) {
    throw new Error("featuredOnHome and homeOrder must be set together.");
  }

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
    materials = {
      projectState,
      fileState,
      figmaUrl: externalUrl(materialInput.figmaUrl, "Project document.materials.figmaUrl"),
      ...optionalProperty("updatedAt", optionalString(materialInput.updatedAt, "Project document.materials.updatedAt")),
    };
  } else if (projectState === "in_progress" && fileState === "unavailable") {
    exactKeys(materialInput, ["projectState", "fileState"], "Project document.materials");
    materials = { projectState, fileState };
  } else {
    throw new Error("Project document.materials contains an unsupported state.");
  }

  const logoInput = input.logo === undefined ? undefined : record(input.logo, "Project document.logo");
  let logo: ProjectLogo | undefined;
  if (logoInput) {
    const logoType = string(logoInput.type, "Project document.logo.type");
    if (logoType === "image") {
      exactKeys(logoInput, ["type", "src"], "Project document.logo");
      logo = { type: logoType, src: publicAssetPath(logoInput.src, "Project document.logo.src") };
    } else if (logoType === "layered") {
      exactKeys(logoInput, ["type", "layers"], "Project document.logo");
      if (!Array.isArray(logoInput.layers) || logoInput.layers.length === 0) {
        throw new Error("Project document.logo.layers must be a non-empty array.");
      }
      logo = {
        type: logoType,
        layers: logoInput.layers.map((value, index) => {
          const layer = record(value, `Project document.logo.layers[${index}]`);
          exactKeys(layer, ["src", "slot"], `Project document.logo.layers[${index}]`);
          const slot = string(layer.slot, `Project document.logo.layers[${index}].slot`);
          if (slot !== "a" && slot !== "b" && slot !== "c" && slot !== "d") {
            throw new Error(`Project document.logo.layers[${index}].slot is not supported.`);
          }
          return {
            src: publicAssetPath(layer.src, `Project document.logo.layers[${index}].src`),
            slot,
          };
        }),
      };
    } else {
      throw new Error("Project document.logo.type must be image or layered.");
    }
  }

  const heroInput = input.hero === undefined ? undefined : record(input.hero, "Project document.hero");
  let hero: ProjectHero | undefined;
  if (heroInput) {
    exactKeys(heroInput, ["presentation", "image", "backdrop", "foreground"], "Project document.hero");
    const presentation = string(heroInput.presentation, "Project document.hero.presentation");
    if (presentation !== "single" && presentation !== "browser-composite") {
      throw new Error("Project document.hero.presentation is not supported.");
    }
    const backdrop = heroInput.backdrop === undefined ? undefined : image(heroInput.backdrop, "Project document.hero.backdrop");
    const foreground = heroInput.foreground === undefined ? undefined : image(heroInput.foreground, "Project document.hero.foreground");
    if (presentation === "browser-composite" && !backdrop) {
      throw new Error("Project document.hero.backdrop is required for browser-composite presentation.");
    }
    hero = {
      presentation,
      image: image(heroInput.image, "Project document.hero.image"),
      ...optionalProperty("backdrop", backdrop),
      ...optionalProperty("foreground", foreground),
    } as ProjectHero;
  }

  const catalogImage = input.catalogImage === undefined
    ? undefined
    : image(input.catalogImage, "Project document.catalogImage");
  const catalogFrame = input.catalogFrame === undefined ? undefined : frameComposition(input.catalogFrame, "Project document.catalogFrame");
  const heroFrame = input.heroFrame === undefined ? undefined : frameComposition(input.heroFrame, "Project document.heroFrame");
  let homeImages: ProjectImage[] | undefined;
  if (input.homeImages !== undefined) {
    if (!Array.isArray(input.homeImages) || input.homeImages.length === 0) {
      throw new Error("Project document.homeImages must be a non-empty array.");
    }
    homeImages = input.homeImages.map((value, index) => image(value, `Project document.homeImages[${index}]`));
  }

  return {
    schemaVersion: PROJECT_DOCUMENT_VERSION,
    title: string(input.title, "Project document.title"),
    slug: slug(input.slug, "Project document.slug"),
    description: string(input.description, "Project document.description"),
    ...optionalProperty("subtitle", optionalString(input.subtitle, "Project document.subtitle")),
    role: string(input.role, "Project document.role"),
    year: integer(input.year, "Project document.year", 1900),
    tags: stringArray(input.tags, "Project document.tags"),
    detailTags: stringArray(input.detailTags, "Project document.detailTags"),
    visibility: visibility as ProjectVisibility,
    catalogOrder: integer(input.catalogOrder, "Project document.catalogOrder"),
    featuredOnHome,
    ...optionalProperty("homeOrder", homeOrder),
    detailAvailable,
    materials,
    platforms: platforms as ProjectPlatform[],
    ...optionalProperty("logo", logo),
    ...optionalProperty("hero", hero),
    ...optionalProperty("catalogImage", catalogImage),
    ...optionalProperty("catalogFrame", catalogFrame),
    ...optionalProperty("heroFrame", heroFrame),
    ...optionalProperty("homeImages", homeImages),
    ...optionalProperty("workSummary", optionalString(input.workSummary, "Project document.workSummary")),
    content: input.content.map((item, index) => contentBlock(item, `Project document.content[${index}]`)),
  };
}

export function parseProjectDocument(source: string, sourceName = "project.json"): ProjectDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown JSON error";
    throw new Error(`Cannot parse project document "${sourceName}": ${message}`);
  }

  try {
    return validateProjectDocument(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown validation error";
    throw new Error(`Invalid project document "${sourceName}": ${message}`);
  }
}

export function serializeProjectDocument(value: unknown): string {
  return `${JSON.stringify(validateProjectDocument(value), null, 2)}\n`;
}

export function deleteProject(value: unknown): ProjectDocument {
  const project = validateProjectDocument(value);
  return {
    ...project,
    visibility: "deleted",
    featuredOnHome: false,
    homeOrder: undefined,
  };
}

function resolveInside(root: string, segments: string[], location: string): string {
  const absoluteRoot = path.resolve(root);
  const target = path.resolve(absoluteRoot, ...segments);
  if (target !== absoluteRoot && !target.startsWith(`${absoluteRoot}${path.sep}`)) {
    throw new Error(`${location} must remain inside its configured root.`);
  }
  return target;
}

export function resolveProjectDocumentPath(contentRoot: string, projectSlug: string): string {
  return resolveInside(contentRoot, [`${slug(projectSlug)}.json`], "Project document path");
}

export function resolveProjectAssetPath(assetRoot: string, projectSlug: string, relativeAssetPath: string): string {
  const parsedSlug = slug(projectSlug);
  const candidate = string(relativeAssetPath, "Project asset path");
  if (
    path.isAbsolute(candidate)
    || candidate.includes("\\")
    || candidate.includes("?")
    || candidate.includes("#")
    || candidate.includes("%")
    || candidate.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
    || path.posix.normalize(candidate) !== candidate
  ) {
    throw new Error("Project asset path must be a normalized relative path without traversal.");
  }
  return resolveInside(assetRoot, [parsedSlug, candidate], "Project asset path");
}
