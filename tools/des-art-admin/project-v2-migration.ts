import { validateProjectDocument, type ProjectDocument, type ProjectImage } from "../../src/lib/project-contract.ts";

type LegacyRecord = Record<string, unknown>;

function record(value: unknown, location: string): LegacyRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${location} must be an object.`);
  return value as LegacyRecord;
}

function legacyImage(value: unknown, location: string): ProjectImage {
  const input = record(value, location);
  if (typeof input.src !== "string" || typeof input.alt !== "string" || !Number.isInteger(input.width) || !Number.isInteger(input.height)) {
    throw new Error(`${location} is not a complete image asset.`);
  }
  return { src: input.src, alt: input.alt, width: input.width as number, height: input.height as number };
}

function migrateSectionBlock(value: unknown): unknown {
  const block = record(value, "Legacy section block");
  if (block.type === "notice") return { type: "notice", templateId: "notice.info-v1", content: block.content };
  if (block.type === "image") {
    const images = Array.isArray(block.images) ? block.images.map((item, index) => legacyImage(item, `Legacy section block.images[${index}]`)) : [];
    const templates = {
      quotes: ["canvas.corvo-quotes", { content: images }],
      process: ["canvas.corvo-process", { content: images }],
      controls: ["canvas.corvo-controls", { buttons: images.slice(0, 1), inputs: images.slice(1, 2) }],
    } as const;
    const migrated = templates[block.presentation as keyof typeof templates];
    if (!migrated) throw new Error(`Legacy image presentation ${String(block.presentation)} requires an explicit migration mapping.`);
    return { type: "visual", templateId: migrated[0], assets: migrated[1] };
  }
  if (block.type === "frame") throw new Error("Legacy Frame requires an explicit approved-template migration mapping.");
  if (block.type === "heading" && block.level !== 3) return { ...block, level: 3 };
  return block;
}

function migrateContent(value: unknown, profile: ProjectDocument["designProfile"]): unknown[] {
  if (!Array.isArray(value)) return [];
  let sectionIndex = -1;
  return value.map((item) => {
    const block = record(item, "Legacy content block");
    if (block.type === "section") {
      sectionIndex += 1;
      if (!Array.isArray(block.blocks)) throw new Error("Legacy section blocks must be an array.");
      const migratedBlocks = block.blocks.map(migrateSectionBlock);
      if (profile === "corvo-v1") {
        const breakBeforeParagraph = sectionIndex === 0 ? 2 : sectionIndex === 2 ? 2 : sectionIndex === 3 ? 3 : -1;
        if (breakBeforeParagraph > 0) {
          let paragraph = 0;
          const withBreaks = [];
          for (const migratedBlock of migratedBlocks) {
            if ((migratedBlock as { type?: unknown }).type === "paragraph") paragraph += 1;
            if (paragraph === breakBeforeParagraph && (migratedBlock as { type?: unknown }).type === "paragraph") withBreaks.push({ type: "hardBreak" });
            withBreaks.push(migratedBlock);
          }
          return { type: "section", heading: block.heading, blocks: withBreaks };
        }
      }
      return { type: "section", heading: block.heading, blocks: migratedBlocks };
    }
    if (block.type === "gallery") {
      if (!Array.isArray(block.groups)) throw new Error("Legacy gallery groups must be an array.");
      return {
        type: "gallery",
        templateId: "gallery.devices-v1",
        groups: block.groups.map((value, index) => {
          const group = record(value, `Legacy gallery group[${index}]`);
          return {
            deviceId: group.id,
            images: Array.isArray(group.items) ? group.items.map((image, imageIndex) => legacyImage(image, `Legacy gallery group[${index}].items[${imageIndex}]`)) : [],
          };
        }),
      };
    }
    return block;
  });
}

function migrateVisuals(input: LegacyRecord, profile: ProjectDocument["designProfile"]): ProjectDocument["visuals"] {
  if (input.catalogFrame || input.heroFrame) throw new Error("Legacy Frame requires an explicit approved-template migration mapping.");
  if (profile === "catalog-only-v1") {
    return { catalog: { templateId: "catalog.browser", assets: { screen: [legacyImage(input.catalogImage, "Legacy catalogImage")] } } };
  }
  if (profile === "corvo-v1") {
    const hero = record(input.hero, "Legacy hero");
    const backdrop = legacyImage(hero.backdrop, "Legacy hero.backdrop");
    const foreground = legacyImage(hero.foreground ?? hero.image, "Legacy hero.foreground");
    const stack = { templateId: "catalog.corvo-stack" as const, assets: { backdrop: [backdrop], foreground: [foreground] } };
    return {
      catalog: stack,
      home: stack,
      hero: { templateId: "hero.corvo-browser", assets: { backdrop: [backdrop], foreground: [foreground] } },
    };
  }
  const images = input.homeImages;
  if (!Array.isArray(images) || images.length !== 3) throw new Error("Legacy Sarafan project requires three homeImages for explicit migration.");
  const dashboard = legacyImage(images[0], "Legacy homeImages[0]");
  const player = legacyImage(images[1], "Legacy homeImages[1]");
  const payment = legacyImage(images[2], "Legacy homeImages[2]");
  return {
    catalog: { templateId: "catalog.sarafan-collage", assets: { dashboard: [dashboard], player: [player], payment: [payment] } },
    home: { templateId: "home.sarafan-radio", assets: { dashboard: [dashboard], player: [player], payment: [payment] } },
  };
}

export function migrateProjectV2ToV3(value: unknown): ProjectDocument {
  const input = record(value, "Legacy project document");
  if (input.schemaVersion !== 2) throw new Error("Legacy project document schemaVersion must be 2.");
  const profile: ProjectDocument["designProfile"] = input.slug === "corvo"
    ? "corvo-v1"
    : input.slug === "sarafan-radio" ? "sarafan-v1" : "catalog-only-v1";
  const homePlacement = input.featuredOnHome === true
    ? (profile === "corvo-v1" ? "primary" : profile === "sarafan-v1" ? "secondary" : undefined)
    : undefined;
  const migrated: Record<string, unknown> = {
    schemaVersion: 3,
    designProfile: profile,
    title: input.title,
    slug: input.slug,
    description: input.description,
    ...(input.subtitle === undefined ? {} : { subtitle: input.subtitle }),
    role: input.role,
    year: input.year,
    tags: input.tags,
    detailTags: input.detailTags,
    visibility: input.visibility,
    catalogOrder: input.catalogOrder,
    ...(homePlacement ? { homePlacement } : {}),
    detailAvailable: input.detailAvailable,
    materials: input.materials,
    platforms: input.platforms,
    ...(input.logo === undefined ? {} : { logo: input.logo }),
    visuals: migrateVisuals(input, profile),
    ...(input.workSummary === undefined ? {} : { workSummary: input.workSummary }),
    content: migrateContent(input.content, profile),
  };
  return validateProjectDocument(migrated);
}
