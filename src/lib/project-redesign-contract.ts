import type { ProjectImage, ProjectInlineContent } from "./project-contract.ts";

export type RedesignParagraph = ProjectInlineContent[];
export type RedesignCopyBlock =
  | { type: "paragraph"; content: RedesignParagraph }
  | { type: "heading"; level: 3; content: RedesignParagraph }
  | { type: "list"; style: "ordered" | "unordered"; items: RedesignParagraph[] }
  | { type: "hardBreak" }
  | { type: "notice"; variant: "system"; title: string; body: string };
export type RedesignAction = { label: string; href: string };
export type RedesignNotice = { title: string; body: string };
export type RedesignMetric = {
  id: "adaptives" | "components" | "tokens" | "icons"; label: string; value: string;
  secondaryValue?: string; copy: RedesignParagraph[]; action: RedesignAction;
};
export type RedesignPage =
  | { templateId: "corvo-redesign-v1"; summary: RedesignParagraph[]; notice: RedesignNotice;
      metrics: { heading: string; description: string; aside: string; items: RedesignMetric[] };
      sections: Array<{ id: "context" | "scenarios" | "system" | "result"; heading: string; blocks: RedesignCopyBlock[] }>;
      showcase: { eyebrow: string; title: string; description: RedesignParagraph; image: ProjectImage } }
  | { templateId: "sarafan-redesign-v1"; summary: RedesignParagraph[]; notice: RedesignNotice;
      flow: { title: string; paragraphs: RedesignParagraph[]; action: RedesignAction; image: ProjectImage };
      sections: Array<{ id: "receiving" | "states"; heading: string; paragraphs: RedesignParagraph[] }>;
      result: { heading: string; paragraphs: RedesignParagraph[] } };
export type RedesignAdaptiveId = "mobile" | "tablet" | "desktop";
export type RedesignAdaptive = { id: RedesignAdaptiveId; minWidth: number; maxWidth: number; presetWidth: number; height: number };
export type RedesignSceneId = "media-campaigns" | "statistics" | "my-space" | "authorization";
export type RedesignLayoutSource =
  | { kind: "url"; url: string }
  | { kind: "package"; entry: string; assetBase: string; files: Array<{ path: string; sha256: string; size: number; mime: string }> };
export type RedesignHero =
  | { kind: "layout"; chromeProfile: "layout-four-scenes-v1"; initialSceneId: RedesignSceneId;
      scenes: Array<{ id: RedesignSceneId; title: string; source: RedesignLayoutSource; adaptives: RedesignAdaptive[] }>;
      adaptives: { enabled: RedesignAdaptiveId[] } }
  | { kind: "raster"; initialSlideId: string; slides: Array<{ id: string; title: string; image: ProjectImage }> };
export type ProjectRedesign = {
  version: 1; card: { preview: { back: ProjectImage; front: ProjectImage }; tag?: string };
  page: RedesignPage; hero: RedesignHero;
};

// Core primitives are injected so this module stays browser-safe and shares the v3 text/image rules.
export type RedesignValidationContext = {
  slug: string; profile: string;
  image: (value: unknown, location: string) => ProjectImage;
  paragraph: (value: unknown, location: string) => RedesignParagraph;
  href: (value: unknown, location: string) => string;
};
type RecordValue = Record<string, unknown>;
const scenes = ["media-campaigns", "statistics", "my-space", "authorization"] as const;
const MIN_LAYOUT_WIDTH = 360;
const MAX_LAYOUT_WIDTH = 1160 / 0.6;
const MAX_DOCUMENT_HEIGHT = 16384;
const adaptiveIds = ["mobile", "tablet", "desktop"] as const;
const digestPattern = /^[a-f0-9]{64}$/;
const identifierPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const packageMimes = ["text/html", "text/css", "text/javascript", "application/javascript", "application/json", "image/png", "image/webp", "image/jpeg", "image/avif", "image/svg+xml", "image/gif", "font/woff", "font/woff2", "font/ttf", "font/otf", "application/wasm"];

function object(value: unknown, keys: readonly string[], location: string): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${location} must be an object.`);
  const result = value as RecordValue;
  for (const key of Object.keys(result)) if (!keys.includes(key)) throw new Error(`${location} contains unknown field "${key}".`);
  return result;
}
function text(value: unknown, location: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${location} must be a non-empty string.`);
  return value;
}
function number(value: unknown, location: string, minimum: number, integral = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || (integral && !Number.isInteger(value))) throw new Error(`${location} must be a finite ${integral ? "integer" : "number"} >= ${minimum}.`);
  return value;
}
function list<T>(value: unknown, location: string, parse: (value: unknown, location: string) => T, minimum = 1): T[] {
  if (!Array.isArray(value) || value.length < minimum) throw new Error(`${location} must be an array with at least ${minimum} items.`);
  return value.map((entry, index) => parse(entry, `${location}[${index}]`));
}
function choice<T extends string>(value: unknown, choices: readonly T[], location: string): T {
  if (typeof value !== "string" || !choices.includes(value as T)) throw new Error(`${location} is not supported.`);
  return value as T;
}
function unique(values: readonly string[], location: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${location} must contain unique ids/paths.`);
}
function ordered<T extends { id: string }>(values: T[], ids: readonly string[], location: string): T[] {
  if (values.length !== ids.length || values.some((entry, index) => entry.id !== ids[index])) throw new Error(`${location}.id must match the fixed slots and order.`);
  return values;
}
function identifier(value: unknown, location: string): string {
  const result = text(value, location);
  if (!identifierPattern.test(result)) throw new Error(`${location} must be a lowercase identifier.`);
  return result;
}
function relativePath(value: unknown, location: string): string {
  const result = text(value, location);
  if (/[:\\%?#\u0000-\u001f\u007f]/.test(result) || result.split("/").some(part => !part || part === "." || part === "..")) throw new Error(`${location} must be a normalized relative package path.`);
  return result;
}
function notice(value: unknown, location: string): RedesignNotice {
  const input = object(value, ["title", "body"], location);
  return { title: text(input.title, `${location}.title`), body: text(input.body, `${location}.body`) };
}
function action(value: unknown, location: string, context: RedesignValidationContext): RedesignAction {
  const input = object(value, ["label", "href"], location);
  return { label: text(input.label, `${location}.label`), href: context.href(input.href, `${location}.href`) };
}
function paragraphs(value: unknown, location: string, context: RedesignValidationContext, minimum = 1): RedesignParagraph[] {
  return list(value, location, context.paragraph, minimum);
}
function copyBlock(value: unknown, location: string, context: RedesignValidationContext): RedesignCopyBlock {
  const kind = object(value, ["type", "content", "level", "style", "items", "variant", "title", "body"], location).type;
  if (kind === "paragraph" || kind === "heading") {
    const input = object(value, kind === "paragraph" ? ["type", "content"] : ["type", "level", "content"], location);
    const content = context.paragraph(input.content, `${location}.content`);
    if (kind === "paragraph") return { type: kind, content };
    if (input.level !== 3) throw new Error(`${location}.level must be 3.`);
    return { type: kind, level: 3, content };
  }
  if (kind === "list") {
    const input = object(value, ["type", "style", "items"], location);
    return { type: kind, style: choice(input.style, ["ordered", "unordered"], `${location}.style`), items: paragraphs(input.items, `${location}.items`, context) };
  }
  if (kind === "hardBreak") { object(value, ["type"], location); return { type: kind }; }
  if (kind === "notice") {
    const input = object(value, ["type", "variant", "title", "body"], location);
    return { type: kind, variant: choice(input.variant, ["system"], `${location}.variant`), title: text(input.title, `${location}.title`), body: text(input.body, `${location}.body`) };
  }
  throw new Error(`${location}.type is not supported.`);
}
function page(value: unknown, location: string, context: RedesignValidationContext): RedesignPage {
  const header = object(value, ["templateId", "summary", "notice", "metrics", "sections", "showcase", "flow", "result"], location);
  const templateId = choice(header.templateId, ["corvo-redesign-v1", "sarafan-redesign-v1"], `${location}.templateId`);
  if ((templateId === "corvo-redesign-v1" && context.profile !== "corvo-v1") || (templateId === "sarafan-redesign-v1" && context.profile !== "sarafan-v1")) throw new Error(`${location}.templateId does not match designProfile.`);
  const common = { summary: paragraphs(header.summary, `${location}.summary`, context, templateId === "corvo-redesign-v1" ? 0 : 1), notice: notice(header.notice, `${location}.notice`) };
  if (templateId === "corvo-redesign-v1") {
    const input = object(value, ["templateId", "summary", "notice", "metrics", "sections", "showcase"], location);
    const metric = object(input.metrics, ["heading", "description", "aside", "items"], `${location}.metrics`);
    const items = list(metric.items, `${location}.metrics.items`, (value, at): RedesignMetric => {
      const item = object(value, ["id", "label", "value", "secondaryValue", "copy", "action"], at);
      return { id: choice(item.id, ["adaptives", "components", "tokens", "icons"], `${at}.id`), label: text(item.label, `${at}.label`), value: text(item.value, `${at}.value`), ...(item.secondaryValue !== undefined ? { secondaryValue: text(item.secondaryValue, `${at}.secondaryValue`) } : {}), copy: paragraphs(item.copy, `${at}.copy`, context), action: action(item.action, `${at}.action`, context) };
    });
    ordered(items, ["adaptives", "components", "tokens", "icons"], `${location}.metrics.items`);
    const sections = list(input.sections, `${location}.sections`, (value, at) => {
      const section = object(value, ["id", "heading", "blocks"], at);
      return { id: choice(section.id, ["context", "scenarios", "system", "result"], `${at}.id`), heading: text(section.heading, `${at}.heading`), blocks: list(section.blocks, `${at}.blocks`, (value, at) => copyBlock(value, at, context)) };
    });
    ordered(sections, ["context", "scenarios", "system", "result"], `${location}.sections`);
    for (const [index, section] of sections.entries()) if (section.id !== "system" && section.blocks.some(block => block.type === "notice")) throw new Error(`${location}.sections[${index}].blocks.notice belongs only to the system section.`);
    if (sections.find(section => section.id === "system")?.blocks.filter(block => block.type === "notice").length !== 1) throw new Error(`${location}.sections.system.blocks.notice requires exactly one fixed notice.`);
    const showcase = object(input.showcase, ["eyebrow", "title", "description", "image"], `${location}.showcase`);
    return { templateId, ...common, metrics: { heading: text(metric.heading, `${location}.metrics.heading`), description: text(metric.description, `${location}.metrics.description`), aside: text(metric.aside, `${location}.metrics.aside`), items }, sections, showcase: { eyebrow: text(showcase.eyebrow, `${location}.showcase.eyebrow`), title: text(showcase.title, `${location}.showcase.title`), description: context.paragraph(showcase.description, `${location}.showcase.description`), image: context.image(showcase.image, `${location}.showcase.image`) } };
  }
  const input = object(value, ["templateId", "summary", "notice", "flow", "sections", "result"], location);
  const flow = object(input.flow, ["title", "paragraphs", "action", "image"], `${location}.flow`);
  const sections = list(input.sections, `${location}.sections`, (value, at) => {
    const section = object(value, ["id", "heading", "paragraphs"], at);
    return { id: choice(section.id, ["receiving", "states"], `${at}.id`), heading: text(section.heading, `${at}.heading`), paragraphs: paragraphs(section.paragraphs, `${at}.paragraphs`, context) };
  });
  ordered(sections, ["receiving", "states"], `${location}.sections`);
  const result = object(input.result, ["heading", "paragraphs"], `${location}.result`);
  return { templateId, ...common, flow: { title: text(flow.title, `${location}.flow.title`), paragraphs: paragraphs(flow.paragraphs, `${location}.flow.paragraphs`, context), action: action(flow.action, `${location}.flow.action`, context), image: context.image(flow.image, `${location}.flow.image`) }, sections, result: { heading: text(result.heading, `${location}.result.heading`), paragraphs: paragraphs(result.paragraphs, `${location}.result.paragraphs`, context) } };
}

// This is lexical validation, not an SSRF-safe fetch authorization. DNS/redirect checks belong to the importer.
function sourceUrl(value: unknown, location: string): string {
  const result = text(value, location);
  let url: URL;
  try { url = new URL(result); } catch { throw new Error(`${location} must be a public HTTPS page URL.`); }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.+$/, "");
  const parts = host.split(".").map(Number);
  const ipv4 = parts.length === 4 && parts.every(part => Number.isInteger(part) && part >= 0 && part <= 255);
  const reservedIPv4 = ipv4 && (parts[0] === 0 || parts[0] === 10 || parts[0] === 127 || parts[0] >= 224 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168) || (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127));
  // Literal IPv6 is excluded; hostname resolution is verified independently by the importer if fetched.
  if (url.protocol !== "https:" || url.username || url.password || host.includes(":") || reservedIPv4 || !host.includes(".") || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || ((host === "figma.com" || host.endsWith(".figma.com")) && /^\/(design|file|board|proto)(\/|$)/.test(url.pathname))) throw new Error(`${location} must be a public HTTPS page URL without credentials or private addresses.`);
  return result;
}
function source(value: unknown, location: string, context: RedesignValidationContext): RedesignLayoutSource {
  const header = object(value, ["kind", "url", "entry", "assetBase", "files"], location);
  if (header.kind === "url") { const input = object(value, ["kind", "url"], location); return { kind: "url", url: sourceUrl(input.url, `${location}.url`) }; }
  if (header.kind !== "package") throw new Error(`${location}.kind is not supported.`);
  const input = object(value, ["kind", "entry", "assetBase", "files"], location);
  const entry = relativePath(input.entry, `${location}.entry`);
  const assetBase = text(input.assetBase, `${location}.assetBase`);
  const prefix = `/assets/projects/${context.slug}/hero-layout/`;
  if (!assetBase.startsWith(prefix) || !digestPattern.test(assetBase.slice(prefix.length, -1)) || !assetBase.endsWith("/")) throw new Error(`${location}.assetBase must belong to this slug and an immutable digest.`);
  const files = list(input.files, `${location}.files`, (value, at) => {
    const file = object(value, ["path", "sha256", "size", "mime"], at);
    const hash = text(file.sha256, `${at}.sha256`);
    if (!digestPattern.test(hash)) throw new Error(`${at}.sha256 must be SHA-256.`);
    const size = number(file.size, `${at}.size`, 0, true);
    if (size > 20 * 1024 * 1024) throw new Error(`${at}.size exceeds 20 MB.`);
    return { path: relativePath(file.path, `${at}.path`), sha256: hash, size, mime: choice(file.mime, packageMimes, `${at}.mime`) };
  });
  unique(files.map(file => file.path), `${location}.files.path`);
  if (files.length > 512 || files.reduce((sum, file) => sum + file.size, 0) > 64 * 1024 * 1024) throw new Error(`${location}.files exceeds package limits.`);
  if (!files.some(file => file.path === entry && file.mime === "text/html")) throw new Error(`${location}.entry must reference an HTML file in the manifest.`);
  return { kind: "package", entry, assetBase, files };
}
function adaptive(value: unknown, location: string): RedesignAdaptive {
  const input = object(value, ["id", "minWidth", "maxWidth", "presetWidth", "height"], location);
  const result = { id: choice(input.id, adaptiveIds, `${location}.id`), minWidth: number(input.minWidth, `${location}.minWidth`, 1), maxWidth: number(input.maxWidth, `${location}.maxWidth`, 1), presetWidth: number(input.presetWidth, `${location}.presetWidth`, 1), height: number(input.height, `${location}.height`, 1) };
  if (result.minWidth < MIN_LAYOUT_WIDTH || result.maxWidth > MAX_LAYOUT_WIDTH || result.height > MAX_DOCUMENT_HEIGHT) throw new Error(`${location} exceeds the supported shell width envelope or document height limit.`);
  if (result.minWidth > result.maxWidth || result.presetWidth < result.minWidth || result.presetWidth > result.maxWidth) throw new Error(`${location}.presetWidth must be inside the ordered min/max range.`);
  const integerMaximum = result.maxWidth === MAX_LAYOUT_WIDTH ? Math.ceil(result.maxWidth) : Math.ceil(result.maxWidth) - 1;
  if (result.minWidth === result.maxWidth || Math.ceil(result.minWidth) > integerMaximum) throw new Error(`${location} must contain an integer iframe viewport width.`);
  return result;
}
function hero(value: unknown, location: string, context: RedesignValidationContext): RedesignHero {
  const header = object(value, ["kind", "initialSlideId", "slides", "chromeProfile", "initialSceneId", "scenes", "adaptives"], location);
  if (header.kind === "raster") {
    const input = object(value, ["kind", "initialSlideId", "slides"], location);
    const slides = list(input.slides, `${location}.slides`, (value, at) => {
      const slide = object(value, ["id", "title", "image"], at);
      const image = context.image(slide.image, `${at}.image`);
      if (Math.abs(image.width / image.height / (4096 / 2958) - 1) > 0.001) throw new Error(`${at}.image has incompatible proportion.`);
      if (image.width < 1880 || image.height < 1880 * 2958 / 4096 || image.width * image.height > 40_000_000) throw new Error(`${at}.image is outside the allowed pixel range (minimum 2× display frame).`);
      return { id: identifier(slide.id, `${at}.id`), title: text(slide.title, `${at}.title`), image };
    }, 3);
    if (slides.length % 2 !== 1) throw new Error(`${location}.slides must have an odd count >=3.`);
    unique(slides.map(slide => slide.id), `${location}.slides.id`);
    const firstRatio = slides[0].image.width / slides[0].image.height;
    for (const [index, slide] of slides.entries()) if (Math.abs(slide.image.width / slide.image.height / firstRatio - 1) > 0.001) throw new Error(`${location}.slides[${index}].image must match the first image proportion.`);
    const initialSlideId = identifier(input.initialSlideId, `${location}.initialSlideId`);
    if (!slides.some(slide => slide.id === initialSlideId)) throw new Error(`${location}.initialSlideId must reference a slide.`);
    return { kind: "raster", initialSlideId, slides };
  }
  if (header.kind !== "layout") throw new Error(`${location}.kind is not supported.`);
  const input = object(value, ["kind", "chromeProfile", "initialSceneId", "scenes", "adaptives"], location);
  const chromeProfile = choice(input.chromeProfile, ["layout-four-scenes-v1"], `${location}.chromeProfile`);
  const initialSceneId = choice(input.initialSceneId, scenes, `${location}.initialSceneId`);
  const selection = object(input.adaptives, ["enabled"], `${location}.adaptives`);
  const enabled = list(selection.enabled, `${location}.adaptives.enabled`, (value, at) => choice(value, adaptiveIds, at));
  unique(enabled, `${location}.adaptives.enabled`);
  const parsedScenes = list(input.scenes, `${location}.scenes`, (value, at) => {
    const scene = object(value, ["id", "title", "source", "adaptives"], at);
    const adaptives = list(scene.adaptives, `${at}.adaptives`, adaptive);
    unique(adaptives.map(item => item.id), `${at}.adaptives.id`);
    for (const id of enabled) if (!adaptives.some(item => item.id === id)) throw new Error(`${at}.adaptives lacks an enabled range.`);
    const sorted = [...adaptives].sort((a, b) => a.minWidth - b.minWidth);
    if (sorted.some((item, index) => index > 0 && item.minWidth < sorted[index - 1].maxWidth)) throw new Error(`${at}.adaptives ranges must not overlap.`);
    return { id: choice(scene.id, scenes, `${at}.id`), title: text(scene.title, `${at}.title`), source: source(scene.source, `${at}.source`, context), adaptives };
  });
  ordered(parsedScenes, scenes, `${location}.scenes`);
  return { kind: "layout", chromeProfile, initialSceneId, scenes: parsedScenes, adaptives: { enabled } };
}
export function validateProjectRedesign(value: unknown, context: RedesignValidationContext): ProjectRedesign {
  const location = "Project document.redesign";
  const input = object(value, ["version", "card", "page", "hero"], location);
  if (input.version !== 1) throw new Error(`${location}.version must be 1.`);
  if (context.profile === "catalog-only-v1") throw new Error(`${location} is unavailable for catalog-only-v1.`);
  const card = object(input.card, ["preview", "tag"], `${location}.card`);
  const preview = object(card.preview, ["back", "front"], `${location}.card.preview`);
  return { version: 1, card: { preview: { back: context.image(preview.back, `${location}.card.preview.back`), front: context.image(preview.front, `${location}.card.preview.front`) }, ...(card.tag !== undefined ? { tag: text(card.tag, `${location}.card.tag`) } : {}) }, page: page(input.page, `${location}.page`, context), hero: hero(input.hero, `${location}.hero`, context) };
}
