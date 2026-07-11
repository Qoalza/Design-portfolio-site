import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type Project = {
  title: string;
  slug: string;
  description: string;
  role: string;
  year: number;
  status: string;
  tags: string[];
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

function readProject(fileName: string): Project {
  const filePath = path.join(projectsDirectory, fileName);
  const { data } = matter(readFileSync(filePath, "utf8"));

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
  };
}

export function getAllProjects(): Project[] {
  return readdirSync(projectsDirectory)
    .filter((fileName) => fileName.endsWith(".mdx"))
    .map(readProject)
    .sort((firstProject, secondProject) => secondProject.year - firstProject.year);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return getAllProjects().find((project) => project.slug === slug);
}
