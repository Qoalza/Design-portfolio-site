import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type ProjectPlatform = "Desktop" | "Tablet" | "Mobile";

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
  figmaUrl?: string;
  logo?: string;
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

function readProject(fileName: string): ProjectWithContent {
  const filePath = path.join(projectsDirectory, fileName);
  const { content, data } = matter(readFileSync(filePath, "utf8"));

  if (!isRecord(data)) {
    throw new Error(`Project frontmatter in "${fileName}" must be an object.`);
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
    updatedAt: readOptionalString(data.updatedAt, "updatedAt"),
    platforms: readOptionalPlatforms(data.platforms),
    visibility: readOptionalString(data.visibility, "visibility"),
    ndaNote: readOptionalString(data.ndaNote, "ndaNote"),
    figmaUrl: readOptionalString(data.figmaUrl, "figmaUrl"),
    logo: readOptionalString(data.logo, "logo"),
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
    figmaUrl: project.figmaUrl,
    logo: project.logo,
  };
}

export function getAllProjects(): Project[] {
  return getProjectFileNames()
    .map(readProject)
    .map(withoutContent)
    .sort((firstProject, secondProject) => secondProject.year - firstProject.year);
}

export function getProjectBySlug(slug: string): ProjectWithContent | undefined {
  return getProjectFileNames().map(readProject).find((project) => project.slug === slug);
}
