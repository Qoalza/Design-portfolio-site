import { readdirSync, readFileSync } from "node:fs";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  parseProjectDocument,
  resolveProjectDocumentPath,
  serializeProjectDocument,
  validateProjectDocument,
  type ProjectDocument,
} from "./project-contract.ts";

export type { ProjectDocument, ProjectPlatform } from "./project-contract.ts";

export type ProjectAvailability = {
  detail: "available" | "unavailable";
  figma: "available" | "unavailable" | "absent";
};

export type Project = ProjectDocument & {
  availability: ProjectAvailability;
  figmaUrl?: string;
  updatedAt?: string;
};

const projectsDirectory = path.join(process.cwd(), "content", "projects");

function withAvailability(project: ProjectDocument): Project {
  const available = project.materials.fileState === "available" ? project.materials : undefined;
  return {
    ...project,
    ...(available ? { figmaUrl: available.figmaUrl } : {}),
    ...(available && "updatedAt" in available && available.updatedAt ? { updatedAt: available.updatedAt } : {}),
    availability: {
      detail: project.detailAvailable ? "available" : "unavailable",
      figma: project.materials.fileState === "available"
        ? "available"
        : project.materials.fileState === "absent" ? "absent" : "unavailable",
    },
  };
}

function projectFileNames(contentRoot: string): string[] {
  return readdirSync(contentRoot)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort((first, second) => first.localeCompare(second, "en"));
}

export function readAllProjectDocuments(contentRoot = projectsDirectory): ProjectDocument[] {
  const projects = projectFileNames(contentRoot).map((fileName) => {
    const filePath = path.join(contentRoot, fileName);
    const project = parseProjectDocument(readFileSync(filePath, "utf8"), fileName);
    const fileSlug = path.basename(fileName, ".json");
    if (fileSlug !== project.slug) {
      throw new Error(`Project filename "${fileName}" must match slug "${project.slug}".`);
    }
    return project;
  });

  const duplicate = projects.find((project, index) => projects.findIndex(({ slug }) => slug === project.slug) !== index);
  if (duplicate) {
    throw new Error(`Project slug "${duplicate.slug}" is duplicated.`);
  }

  return projects;
}

export function getAllProjects(contentRoot = projectsDirectory): Project[] {
  return readAllProjectDocuments(contentRoot)
    .filter((project) => project.visibility === "published")
    .map(withAvailability)
    .sort((first, second) => first.catalogOrder - second.catalogOrder);
}

export function getCatalogProjects(contentRoot = projectsDirectory): Project[] {
  return getAllProjects(contentRoot)
    .filter((project) => project.featuredOnHome)
    .sort((first, second) => (first.homeOrder ?? Number.MAX_SAFE_INTEGER) - (second.homeOrder ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 3);
}

export function getProjectBySlug(projectSlug: string, contentRoot = projectsDirectory): Project | undefined {
  return getAllProjects(contentRoot).find(
    (project) => project.slug === projectSlug && project.detailAvailable,
  );
}

export function getProjectBySlugForPreview(projectSlug: string, contentRoot = projectsDirectory): Project | undefined {
  const project = readAllProjectDocuments(contentRoot).find(({ slug }) => slug === projectSlug);
  return project ? withAvailability(project) : undefined;
}

export async function writeProjectDocument(value: unknown, contentRoot = projectsDirectory): Promise<string> {
  const project = validateProjectDocument(value);
  await mkdir(contentRoot, { recursive: true });
  const destination = resolveProjectDocumentPath(contentRoot, project.slug);
  const temporary = path.join(contentRoot, `.${project.slug}.${process.pid}.${Date.now()}.tmp`);

  try {
    await writeFile(temporary, serializeProjectDocument(project), {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    await rename(temporary, destination);
  } finally {
    await rm(temporary, { force: true });
  }

  return destination;
}
