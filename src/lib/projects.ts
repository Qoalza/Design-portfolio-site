import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type ProjectPlatform = "Desktop" | "Tablet" | "Mobile";

export type ProjectAvailability = {
  detail: "available" | "unavailable";
  figma: "available" | "unavailable";
};

export type Project = {
  title: string;
  slug: string;
  description: string;
  role: string;
  year: number;
  status: string;
  tags: string[];
  subtitle?: string;
  updatedAt?: string;
  platforms?: ProjectPlatform[];
  visibility?: string;
  ndaNote?: string;
  availability: ProjectAvailability;
  figmaUrl?: string;
  logo?: string;
  heroImage?: string;
  heroImageAlt?: string;
  heroImageWidth?: number;
  heroImageHeight?: number;
  workSummary?: string;
  catalogRole?: string;
  detailLabels?: string[];
  catalogVisible: boolean;
  catalogOrder: number;
};

export type ProjectWithContent = Project & {
  content: string;
};

const projectsDirectory = path.join(process.cwd(), "content", "projects");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, field: keyof Omit<Project, "year" | "tags">): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Project frontmatter field "${field}" must be a non-empty string.`);
  }

  return value;
}

function readYear(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error('Project frontmatter field "year" must be an integer.');
  }

  return value;
}

function readTags(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string")) {
    throw new Error('Project frontmatter field "tags" must be an array of strings.');
  }

  return value;
}

function readOptionalStringArray(value: unknown, field: "detailLabels"): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim().length === 0)) {
    throw new Error(`Project frontmatter field "${field}" must be an array of non-empty strings.`);
  }

  return value;
}

function readOptionalString(value: unknown, field: keyof Project): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Project frontmatter field "${field}" must be a non-empty string when provided.`);
  }

  return value;
}

function readOptionalPlatforms(value: unknown): ProjectPlatform[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  const allowedPlatforms: ProjectPlatform[] = ["Desktop", "Tablet", "Mobile"];

  if (!Array.isArray(value) || value.some((item) => !allowedPlatforms.includes(item as ProjectPlatform))) {
    throw new Error('Project frontmatter field "platforms" must contain only Desktop, Tablet, or Mobile.');
  }

  return value as ProjectPlatform[];
}

function readFigmaAvailability(value: unknown): boolean {
  if (value === undefined) {
    return false;
  }

  if (typeof value !== "boolean") {
    throw new Error('Project frontmatter field "figmaAvailable" must be a boolean when provided.');
  }

  return value;
}

function readOptionalBoolean(value: unknown, field: "catalogVisible" | "detailAvailable", fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== "boolean") {
    throw new Error(`Project frontmatter field "${field}" must be a boolean when provided.`);
  }

  return value;
}

function readOptionalPositiveInteger(value: unknown, field: "heroImageWidth" | "heroImageHeight"): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Project frontmatter field "${field}" must be a positive integer when provided.`);
  }

  return value;
}

function readProject(fileName: string): ProjectWithContent {
  const filePath = path.join(projectsDirectory, fileName);
  const { content, data } = matter(readFileSync(filePath, "utf8"));

  if (!isRecord(data)) {
    throw new Error(`Project frontmatter in "${fileName}" must be an object.`);
  }

  const updatedAt = readOptionalString(data.updatedAt, "updatedAt");
  const figmaAvailable = readFigmaAvailability(data.figmaAvailable);
  const detailAvailable = readOptionalBoolean(data.detailAvailable, "detailAvailable", true);
  const figmaUrl = readOptionalString(data.figmaUrl, "figmaUrl");
  const heroImage = readOptionalString(data.heroImage, "heroImage");
  const heroImageAlt = readOptionalString(data.heroImageAlt, "heroImageAlt");
  const heroImageWidth = readOptionalPositiveInteger(data.heroImageWidth, "heroImageWidth");
  const heroImageHeight = readOptionalPositiveInteger(data.heroImageHeight, "heroImageHeight");

  if (figmaAvailable && (!figmaUrl || !updatedAt)) {
    throw new Error(`Project frontmatter in "${fileName}" must provide "figmaUrl" and "updatedAt" when "figmaAvailable" is true.`);
  }

  if ([heroImage, heroImageAlt, heroImageWidth, heroImageHeight].some(Boolean)
    && ![heroImage, heroImageAlt, heroImageWidth, heroImageHeight].every(Boolean)) {
    throw new Error(`Project frontmatter in "${fileName}" must provide the complete hero image metadata.`);
  }

  return {
    title: readString(data.title, "title"),
    slug: readString(data.slug, "slug"),
    description: readString(data.description, "description"),
    role: readString(data.role, "role"),
    year: readYear(data.year),
    status: readString(data.status, "status"),
    tags: readTags(data.tags),
    subtitle: readOptionalString(data.subtitle, "subtitle"),
    updatedAt,
    platforms: readOptionalPlatforms(data.platforms),
    visibility: readOptionalString(data.visibility, "visibility"),
    ndaNote: readOptionalString(data.ndaNote, "ndaNote"),
    availability: {
      detail: detailAvailable ? "available" : "unavailable",
      figma: figmaAvailable ? "available" : "unavailable",
    },
    figmaUrl,
    logo: readOptionalString(data.logo, "logo"),
    heroImage,
    heroImageAlt,
    heroImageWidth,
    heroImageHeight,
    workSummary: readOptionalString(data.workSummary, "workSummary"),
    catalogRole: readOptionalString(data.catalogRole, "catalogRole"),
    detailLabels: readOptionalStringArray(data.detailLabels, "detailLabels"),
    catalogVisible: readOptionalBoolean(data.catalogVisible, "catalogVisible", true),
    catalogOrder: typeof data.catalogOrder === "number" && Number.isInteger(data.catalogOrder) ? data.catalogOrder : 999,
    content,
  };
}

function getProjectFileNames(): string[] {
  return readdirSync(projectsDirectory).filter((fileName) => fileName.endsWith(".mdx"));
}

function withoutContent(project: ProjectWithContent): Project {
  return {
    title: project.title,
    slug: project.slug,
    description: project.description,
    role: project.role,
    year: project.year,
    status: project.status,
    tags: project.tags,
    subtitle: project.subtitle,
    updatedAt: project.updatedAt,
    platforms: project.platforms,
    visibility: project.visibility,
    ndaNote: project.ndaNote,
    availability: project.availability,
    figmaUrl: project.figmaUrl,
    logo: project.logo,
    heroImage: project.heroImage,
    heroImageAlt: project.heroImageAlt,
    heroImageWidth: project.heroImageWidth,
    heroImageHeight: project.heroImageHeight,
    workSummary: project.workSummary,
    catalogRole: project.catalogRole,
    detailLabels: project.detailLabels,
    catalogVisible: project.catalogVisible,
    catalogOrder: project.catalogOrder,
  };
}

export function getAllProjects(): Project[] {
  return getProjectFileNames()
    .map(readProject)
    .map(withoutContent)
    .sort((firstProject, secondProject) => secondProject.year - firstProject.year);
}

export function getCatalogProjects(): Project[] {
  return getAllProjects().filter((project) => project.catalogVisible).sort((a, b) => a.catalogOrder - b.catalogOrder);
}

export function getProjectBySlug(slug: string): ProjectWithContent | undefined {
  return getProjectFileNames().map(readProject).find((project) => project.slug === slug);
}
