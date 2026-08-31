import type {
  ProjectContentBlock,
  ProjectGalleryGroup,
  ProjectDocument,
  ProjectInlineContent,
} from "../../../src/lib/project-contract";

export type AdminInteractiveSetting = {
  enabled: boolean;
  figmaUrl?: string;
  status?: "pending" | "connected";
};

export type AdminSectionSetting = {
  noticeEnabled?: boolean;
  noticeVariant?: "default" | "wide";
  interactive?: AdminInteractiveSetting;
};

export type AdminGallerySetting = {
  pendingDeviceIds?: ProjectGalleryGroup["id"][];
};

export type AdminProject = Omit<ProjectDocument, "content"> & {
  admin?: {
    sections?: Record<string, AdminSectionSetting>;
    gallery?: AdminGallerySetting;
  };
  content: AdminContentBlock[];
};

export type AdminSection = Extract<ProjectContentBlock, { type: "section" }> & {
  adminId: string;
};

export type AdminContentBlock = AdminSection | Extract<ProjectContentBlock, { type: "gallery" }>;

export type FieldIssue = {
  field: string;
  label?: string;
  title?: string;
  tab?: "card" | "page";
  sectionId?: string;
  projectSlug?: string;
  projectTitle?: string;
  message: string;
};
export type ChangeProject = { slug: string; title: string; valid: boolean; issues: FieldIssue[] };
export type ChangeInventory = { count: number; projects: ChangeProject[] };

export type PublishJob = {
  id: string;
  status: "queued" | "running" | "complete" | "failed";
  message: string;
  errorTitle?: string;
  error?: string;
  currentStage?: string;
  productionState?: "unchanged" | "main-updated" | "main-updated-deploy-failed";
  publishedSha?: string;
  pullRequestUrl?: string;
  stages: Array<{ id: string; label: string; status: "pending" | "complete" }>;
};

export class ApiError extends Error {
  title: string;
  issues: FieldIssue[];

  constructor(title: string, message: string, issues: FieldIssue[] = []) {
    super(message);
    this.name = "ApiError";
    this.title = title;
    this.issues = issues;
  }
}

export const parseTagInput = (value: string) => value
  .split("/")
  .map((item) => item.trim())
  .filter(Boolean);

export const formatTagInput = (value: string[]) => value.join(" / ");

/** @deprecated use parseTagInput */
export const list = parseTagInput;

const cyrillicSlug: Record<string, string> = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" };

export function createSlugPreview(value: string, existing: string[] = []): string {
  const base = value.normalize("NFKD").toLowerCase().split("").map((character) => cyrillicSlug[character] ?? character).join("")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "project-…";
  if (!existing.includes(base)) return base;
  let suffix = 2;
  while (existing.includes(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export const textOf = (content: ProjectInlineContent[] = []) => content
  .map((item) => item.text)
  .join("");

export const inline = (value: string): ProjectInlineContent[] => [{ type: "text", text: value }];

export function sectionSetting(project: AdminProject, id: string): AdminSectionSetting {
  return project.admin?.sections?.[id] ?? {};
}

export function withSectionSetting(
  project: AdminProject,
  id: string,
  patch: Partial<AdminSectionSetting>,
): AdminProject {
  const previous = sectionSetting(project, id);
  return {
    ...project,
    admin: {
      ...project.admin,
      sections: {
        ...project.admin?.sections,
        [id]: { ...previous, ...patch },
      },
    },
  };
}

export function pendingGalleryDevices(project: AdminProject): ProjectGalleryGroup["id"][] {
  return project.admin?.gallery?.pendingDeviceIds ?? [];
}

export function withPendingGalleryDevices(
  project: AdminProject,
  pendingDeviceIds: ProjectGalleryGroup["id"][],
): AdminProject {
  return {
    ...project,
    admin: {
      ...project.admin,
      gallery: pendingDeviceIds.length ? { pendingDeviceIds } : undefined,
    },
  };
}

export function issueFor(issues: FieldIssue[], field: string): string | undefined {
  return issues.find((item) => item.field === field)?.message;
}
