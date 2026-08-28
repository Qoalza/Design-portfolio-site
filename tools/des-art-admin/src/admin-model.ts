import type {
  ProjectContentBlock,
  ProjectDocument,
  ProjectInlineContent,
  ProjectSectionBlock,
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

export type AdminProject = Omit<ProjectDocument, "content"> & {
  admin?: {
    sections?: Record<string, AdminSectionSetting>;
  };
  content: AdminContentBlock[];
};

export type AdminSection = Extract<ProjectContentBlock, { type: "section" }> & {
  adminId: string;
};

export type AdminContentBlock = AdminSection | Extract<ProjectContentBlock, { type: "gallery" }>;

export type FieldIssue = { field: string; message: string };
export type ChangeProject = { slug: string; title: string; valid: boolean; issues: FieldIssue[] };
export type ChangeInventory = { count: number; projects: ChangeProject[] };

export type PublishJob = {
  id: string;
  status: "queued" | "running" | "complete" | "failed";
  message: string;
  error?: string;
  currentStage?: string;
  stages: Array<{ id: string; label: string; status: "pending" | "complete" }>;
};

export class ApiError extends Error {
  issues: FieldIssue[];

  constructor(message: string, issues: FieldIssue[] = []) {
    super(message);
    this.name = "ApiError";
    this.issues = issues;
  }
}

export const list = (value: string) => value
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

export const textOf = (content: ProjectInlineContent[] = []) => content
  .map((item) => item.text)
  .join("");

export const inline = (value: string): ProjectInlineContent[] => [{ type: "text", text: value }];

export function inlineMarkup(content: ProjectInlineContent[] = []): string {
  return content.map((item) => {
    if (item.type === "strong") return `**${item.text}**`;
    if (item.type === "emphasis") return `_${item.text}_`;
    if (item.type === "underline") return `<u>${item.text}</u>`;
    if (item.type === "link") return `[${item.text}](${item.href})`;
    return item.text;
  }).join("");
}

export function parseInline(value: string): ProjectInlineContent[] {
  const result: ProjectInlineContent[] = [];
  const pattern = /(\*\*([^*]+)\*\*|_([^_]+)_|<u>(.*?)<\/u>|\[([^\]]+)\]\(([^)]+)\))/g;
  let cursor = 0;
  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) result.push({ type: "text", text: value.slice(cursor, index) });
    if (match[2] !== undefined) result.push({ type: "strong", text: match[2] });
    else if (match[3] !== undefined) result.push({ type: "emphasis", text: match[3] });
    else if (match[4] !== undefined) result.push({ type: "underline", text: match[4] });
    else result.push({ type: "link", text: match[5], href: match[6] });
    cursor = index + match[0].length;
  }
  if (cursor < value.length) result.push({ type: "text", text: value.slice(cursor) });
  return result.length ? result : inline(value);
}

export function sectionText(section: AdminSection): string {
  return section.blocks.flatMap((block) => {
    if (block.type === "paragraph") return [inlineMarkup(block.content), ""];
    if (block.type === "heading") return [`${"#".repeat(block.level)} ${inlineMarkup(block.content)}`, ""];
    if (block.type === "list") {
      return [
        ...block.items.map((item, index) => `${block.style === "ordered" ? `${index + 1}.` : "-"} ${inlineMarkup(item)}`),
        "",
      ];
    }
    return [];
  }).join("\n").trim();
}

export function textBlocks(value: string): ProjectSectionBlock[] {
  const result: ProjectSectionBlock[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    const text = paragraph.join("\n").trim();
    if (text) result.push({ type: "paragraph", content: parseInline(text) });
    paragraph = [];
  };
  const lines = value.replaceAll("\r", "").split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) {
      flush();
      continue;
    }
    const heading = /^(#{3,6})\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      result.push({
        type: "heading",
        level: heading[1].length as 3 | 4 | 5 | 6,
        content: parseInline(heading[2]),
      });
      continue;
    }
    const item = /^(-|\d+\.)\s+(.+)$/.exec(line);
    if (item) {
      flush();
      const style = item[1] === "-" ? "unordered" : "ordered";
      const items = [parseInline(item[2])];
      while (index + 1 < lines.length) {
        const next = /^(-|\d+\.)\s+(.+)$/.exec(lines[index + 1]);
        if (!next || (next[1] === "-" ? "unordered" : "ordered") !== style) break;
        index += 1;
        items.push(parseInline(next[2]));
      }
      result.push({ type: "list", style, items });
      continue;
    }
    paragraph.push(line);
  }
  flush();
  return result;
}

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

export function issueFor(issues: FieldIssue[], field: string): string | undefined {
  return issues.find((item) => item.field === field)?.message;
}
