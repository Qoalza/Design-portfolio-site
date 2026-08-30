import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  parseProjectDocument,
  resolveProjectAssetPath,
  resolveProjectDocumentPath,
} from "../../src/lib/project-contract.ts";
import { readAllProjectDocuments, writeProjectDocument } from "../../src/lib/projects.ts";
import { compileAdminDraft, createAdminDraft, draftValidation, parseAdminDraft } from "./draft-contract.mjs";
import { importFigmaFrame } from "./figma-frame.mjs";
import { UserFacingError } from "./human-errors.mjs";

const requireRead = (file) => readFileSync(file, "utf8");

export function humanFigmaImportError(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (/отклонила токен|доступ к файлу/i.test(message)) {
    return { title: "Figma не дала доступ к Frame", message: "Проверьте, что подключённый токен действует и у него есть доступ к этому Figma-файлу. Предыдущая рабочая версия изображения сохранена." };
  }
  if (/больше не найден|Frame Figma не найден/i.test(message)) {
    return { title: "Figma Frame не найден", message: "Frame или сам файл удалён, перемещён без доступа либо ссылка ведёт на старый node-id. Скопируйте новую ссылку на существующий Frame. Предыдущая рабочая версия сохранена." };
  }
  if (/корректную ссылку|должна вести|ключ файла|node-id/i.test(message)) {
    return { title: "Ссылка не ведёт на конкретный Figma Frame", message: "Скопируйте ссылку именно на выбранный Frame в Figma и вставьте её целиком. Предыдущая рабочая версия изображения сохранена." };
  }
  const layer = /(?:Слой|Эффект слоя|элемент) «([^»]+)»/i.exec(message)?.[1];
  if (layer) {
    if (/эффект, отличный от тени/i.test(message)) return { title: `Элемент «${layer}» содержит неподдерживаемый эффект`, message: "Импортёр сохраняет тени, но не может точно воспроизвести этот эффект. Запеките эффект в готовый PNG внутри Frame и обновите импорт. Предыдущая рабочая версия сохранена." };
    if (/fill|залив/i.test(message)) return { title: `Элемент «${layer}» содержит неподдерживаемую заливку`, message: "Экспортируйте этот элемент как готовый PNG внутри того же Frame и обновите импорт. Положение и constraints PNG будут взяты из Figma; предыдущая рабочая версия сохранена." };
    if (/радиус|corner smoothing/i.test(message)) return { title: `Элемент «${layer}» содержит неподдерживаемое оформление углов`, message: "Экспортируйте элемент вместе с обводкой и скруглениями как готовый PNG, замените им исходный слой во Frame и обновите импорт." };
    if (/Auto Layout/i.test(message)) return { title: `Элемент «${layer}» использует неподдерживаемый режим Auto Layout`, message: "Поместите визуальное содержимое этого элемента в готовый PNG, сохранив его положение во Frame, и обновите импорт." };
    if (/геометри/i.test(message)) return { title: `У элемента «${layer}» нет корректного размера`, message: "Задайте элементу ненулевую ширину и высоту во Frame либо удалите пустой элемент, затем обновите импорт." };
    if (/не вернула|не смогла экспортировать|Не удалось скачать/i.test(message)) return { title: `Элемент «${layer}» не удалось получить из Figma`, message: "Figma не предоставила файл этого элемента. Проверьте доступ к исходному изображению и повторите импорт; если ошибка останется, потребуется ручная диагностика разработчиком." };
    return { title: `Элемент «${layer}» не удалось импортировать`, message: "Причину не удалось определить автоматически. Предыдущая рабочая версия сохранена; требуется ручная диагностика разработчиком." };
  }
  if (/временно ограничила запросы/i.test(message)) {
    return { title: "Figma временно ограничила загрузку", message: "Подождите несколько минут и повторите импорт. Предыдущая рабочая версия изображения сохранена." };
  }
  return { title: "Figma Frame не удалось импортировать", message: "Причину не удалось определить автоматически. Предыдущая рабочая версия изображения сохранена; требуется ручная диагностика разработчиком." };
}

function semanticValue(value) {
  if (Array.isArray(value)) return value.map(semanticValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key, item]) => !["admin", "adminId", "savedAt", "importStatus", "lastCheckedAt"].includes(key) && item !== undefined)
    .sort(([first], [second]) => first.localeCompare(second, "en"))
    .map(([key, item]) => [key, semanticValue(item)]));
}

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);
const IMAGE_TYPES = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/gif", ".gif"],
  ["image/webp", ".webp"],
]);
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_SVG_BYTES = 512 * 1024;
const CYRILLIC = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" };

export function createProjectSlug(title, existing = []) {
  const base = String(title ?? "").normalize("NFKD").toLowerCase()
    .split("").map((character) => CYRILLIC[character] ?? character).join("")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const stem = base || `project-${createHash("sha256").update(String(title)).digest("hex").slice(0, 8)}`;
  const occupied = new Set(existing.map((value) => String(value).toLowerCase()));
  if (!occupied.has(stem)) return stem;
  let suffix = 2;
  while (occupied.has(`${stem}-${suffix}`)) suffix += 1;
  return `${stem}-${suffix}`;
}

export function inspectSvg(buffer, fileName) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > MAX_SVG_BYTES) throw new Error("SVG size is invalid.");
  if (path.extname(fileName).toLowerCase() !== ".svg") throw new Error("SVG extension is required.");
  const source = buffer.toString("utf8");
  if (!/^\s*<svg\b/i.test(source) || /<!DOCTYPE|<script\b|<foreignObject\b|\son[a-z]+\s*=|javascript:|(?:href|src)\s*=\s*["'](?!#)|url\(\s*["']?(?!#)/i.test(source)) {
    throw new Error("SVG contains active or unsafe markup.");
  }
  const viewBox = /\bviewBox\s*=\s*["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*["']/i.exec(source);
  if (!viewBox) throw new Error("SVG must contain a viewBox.");
  const width = Number(viewBox[1]); const height = Number(viewBox[2]);
  if (!(width > 0) || width !== height) throw new Error("SVG viewBox must be square.");
  return { mime: "image/svg+xml", width, height, extension: ".svg" };
}

export function validateLocalRequest(request, csrfToken, port) {
  const host = String(request.host ?? "");
  const separator = host.lastIndexOf(":");
  const hostname = separator === -1 ? host : host.slice(0, separator);
  const requestPort = separator === -1 ? "" : host.slice(separator + 1);
  if (!LOOPBACK_HOSTS.has(hostname) || requestPort !== String(port)) {
    throw new Error("Host is not the local admin endpoint.");
  }
  if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS") {
    const expectedOrigin = `http://127.0.0.1:${port}`;
    if (request.origin !== expectedOrigin) throw new Error("Origin is not trusted.");
    if (request.csrf !== csrfToken) throw new Error("CSRF token is missing or invalid.");
  }
}

export function safeUploadName(fileName) {
  if (typeof fileName !== "string" || fileName.includes("/") || fileName.includes("\\") || fileName.includes("..")) {
    throw new Error("Filename must not contain path segments.");
  }
  const extension = path.extname(fileName).toLowerCase();
  if (![...IMAGE_TYPES.values()].includes(extension) && extension !== ".jpeg" && extension !== ".svg") {
    throw new Error("Filename extension is not supported.");
  }
  const stem = path.basename(fileName, path.extname(fileName))
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "image";
  return `${stem}${extension === ".jpeg" ? ".jpg" : extension}`;
}

function pngDimensions(buffer) {
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("PNG signature is invalid.");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function gifDimensions(buffer) {
  if (buffer.length < 10 || !["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))) throw new Error("GIF signature is invalid.");
  return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
}

function jpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) throw new Error("JPEG signature is invalid.");
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2 || offset + length + 2 > buffer.length) break;
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += length + 2;
  }
  throw new Error("JPEG dimensions were not found.");
}

function webpDimensions(buffer) {
  if (buffer.length < 30 || buffer.subarray(0, 4).toString("ascii") !== "RIFF" || buffer.subarray(8, 12).toString("ascii") !== "WEBP") throw new Error("WebP signature is invalid.");
  const type = buffer.subarray(12, 16).toString("ascii");
  if (type === "VP8X") return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  if (type === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (type === "VP8 ") return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  throw new Error("WebP dimensions were not found.");
}

export function inspectImage(buffer, fileName, mime) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) throw new Error("Image size must be between 1 byte and 20 MB.");
  const expectedExtension = IMAGE_TYPES.get(mime);
  if (!expectedExtension) throw new Error("Image MIME type is not supported.");
  const safeName = safeUploadName(fileName);
  if (path.extname(safeName) !== expectedExtension) throw new Error("Image extension does not match its MIME type.");
  const dimensions = mime === "image/png" ? pngDimensions(buffer)
    : mime === "image/jpeg" ? jpegDimensions(buffer)
      : mime === "image/gif" ? gifDimensions(buffer)
        : webpDimensions(buffer);
  if (dimensions.width < 1 || dimensions.height < 1 || dimensions.width * dimensions.height > MAX_IMAGE_PIXELS) {
    throw new Error("Image resolution is invalid or exceeds 40 megapixels.");
  }
  return { extension: expectedExtension, ...dimensions, mime };
}

async function canonicalDraftPath(root, slug) {
  await mkdir(root, { recursive: true });
  return resolveProjectDocumentPath(root, slug);
}

export class AdminStore {
  constructor({ contentRoot, assetRoot, draftRoot, draftAssetRoot = assetRoot, snapshotRoot = path.join(path.dirname(draftRoot), "published-snapshots") }) {
    this.contentRoot = contentRoot;
    this.assetRoot = assetRoot;
    this.draftRoot = draftRoot;
    this.draftAssetRoot = draftAssetRoot;
    this.snapshotRoot = snapshotRoot;
  }

  async listProjects() {
    await mkdir(this.contentRoot, { recursive: true });
    const published = readAllProjectDocuments(this.contentRoot);
    await mkdir(this.draftRoot, { recursive: true });
    const draftFiles = (await readdir(this.draftRoot)).filter((name) => name.endsWith(".json"));
    const drafts = (await Promise.all(draftFiles.map(async (name) => {
      try {
        return parseAdminDraft(await readFile(path.join(this.draftRoot, name), "utf8"), name);
      } catch {
        return undefined;
      }
    }))).filter(Boolean);
    const merged = new Map(published.map((project) => [project.slug, project]));
    for (const draft of drafts) merged.set(draft.slug, draft);
    return [...merged.values()];
  }

  async getProject(slug) {
    try {
      return await this.getDraft(slug);
    } catch {}
    return this.getPublishedProject(slug);
  }

  async getPublishedProject(slug) {
    const file = resolveProjectDocumentPath(this.contentRoot, slug);
    return parseProjectDocument(await readFile(file, "utf8"), path.basename(file));
  }

  async getSandboxPublishedProject(slug) {
    const file = resolveProjectDocumentPath(this.snapshotRoot, slug);
    return parseProjectDocument(await readFile(file, "utf8"), path.basename(file));
  }

  async listSandboxPublished() {
    await mkdir(this.snapshotRoot, { recursive: true });
    const names = (await readdir(this.snapshotRoot)).filter((name) => name.endsWith(".json"));
    if (names.length) return names.map((name) => parseProjectDocument(
      requireRead(path.join(this.snapshotRoot, name)), name,
    ));
    await mkdir(this.contentRoot, { recursive: true });
    return readAllProjectDocuments(this.contentRoot);
  }

  async ensureSnapshotBaseline() {
    await mkdir(this.snapshotRoot, { recursive: true });
    const names = (await readdir(this.snapshotRoot)).filter((name) => name.endsWith(".json"));
    if (names.length) return;
    await mkdir(this.contentRoot, { recursive: true });
    for (const project of readAllProjectDocuments(this.contentRoot)) {
      const destination = resolveProjectDocumentPath(this.snapshotRoot, project.slug);
      await writeFile(destination, `${JSON.stringify(project, null, 2)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
    }
  }

  async saveProject(value) {
    return writeProjectDocument(value, this.contentRoot);
  }

  async createProject({ title, slug: requestedSlug }) {
    const cleanTitle = typeof title === "string" ? title.trim() : "";
    if (!cleanTitle) throw new Error("Укажите название проекта.");
    await mkdir(this.draftRoot, { recursive: true });
    const existing = (await this.listProjects()).map((item) => item.slug);
    const requested = requestedSlug ? createProjectSlug(requestedSlug, []) : createProjectSlug(cleanTitle, []);
    let slug = createProjectSlug(requested, existing);
    for (;;) {
      const file = resolveProjectDocumentPath(this.draftRoot, slug);
      const project = createAdminDraft({ schemaVersion: 2, title: cleanTitle, slug, description: "", role: "", year: new Date().getFullYear(), tags: [], detailTags: [], visibility: "draft", catalogOrder: existing.length + 1, featuredOnHome: false, detailAvailable: false, materials: { projectState: "completed", fileState: "absent" }, platforms: [], content: [] });
      try {
        const firstSection = { type: "section", adminId: `${slug}-section-1`, heading: "Новая секция", blocks: [] };
        project.content = [firstSection];
        await writeFile(file, `${JSON.stringify(project, null, 2)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
        return project;
      } catch (error) {
        if (error?.code !== "EEXIST") throw error;
        existing.push(slug); slug = createProjectSlug(requested, existing);
      }
    }
  }

  async duplicateProject(sourceSlug, newSlug) {
    const source = await this.getProject(sourceSlug);
    const copy = createAdminDraft({
      ...source,
      title: `${source.title} — копия`,
      slug: newSlug,
      visibility: "draft",
      featuredOnHome: false,
      homeOrder: undefined,
    });
    await this.saveDraft(newSlug, copy);
    return copy;
  }

  async setVisibility(slug, visibility) {
    const current = await this.getProject(slug);
    const next = createAdminDraft({
      ...current,
      visibility,
      ...(visibility === "published" ? {} : { featuredOnHome: false, homeOrder: undefined }),
    });
    await this.saveDraft(slug, next);
    return next;
  }

  async reorder(slugs) {
    const projects = await this.listProjects();
    const bySlug = new Map(projects.map((item) => [item.slug, item]));
    for (const slug of slugs) if (!bySlug.has(slug)) throw new Error(`Unknown project slug "${slug}".`);
    const published = projects.filter((item) => item.visibility === "published");
    if (slugs.length !== published.length || slugs.some((slug) => bySlug.get(slug)?.visibility !== "published")) {
      throw new Error("Only published projects can be reordered.");
    }
    for (const [index, slug] of slugs.entries()) await this.saveDraft(slug, { ...bySlug.get(slug), catalogOrder: index + 1 });
    return this.listProjects();
  }

  async saveDraft(slug, value) {
    const file = await canonicalDraftPath(this.draftRoot, slug);
    const project = createAdminDraft(value);
    if (project.slug !== slug) throw new Error("Draft slug does not match its file name.");
    const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(project, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await rename(temporary, file);
    return file;
  }

  async getDraft(slug) {
    const file = await canonicalDraftPath(this.draftRoot, slug);
    return parseAdminDraft(await readFile(file, "utf8"), path.basename(file));
  }

  async preparePreview(slug, previewRoot, context = "page") {
    const draft = await this.getProject(slug);
    const compiled = compileAdminDraft(draft);
    const project = {
      ...compiled,
      visibility: "published",
      ...(context === "page" ? { detailAvailable: true } : {}),
    };
    const file = await canonicalDraftPath(previewRoot, slug);
    const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(project, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await rename(temporary, file);
    return project;
  }

  async getChangeInventory() {
    await mkdir(this.contentRoot, { recursive: true });
    await mkdir(this.snapshotRoot, { recursive: true });
    const snapshots = (await readdir(this.snapshotRoot)).filter((name) => name.endsWith(".json"));
    const baseline = snapshots.length
      ? snapshots.map((name) => parseProjectDocument(requireRead(path.join(this.snapshotRoot, name)), name))
      : readAllProjectDocuments(this.contentRoot);
    const published = new Map(baseline.map((item) => [item.slug, item]));
    await mkdir(this.draftRoot, { recursive: true });
    const names = (await readdir(this.draftRoot)).filter((name) => name.endsWith(".json"));
    const projects = [];
    const changedSlugs = [];
    const globalProjects = [];
    const withoutGlobalPlacement = (project) => {
      const content = { ...project };
      delete content.catalogOrder;
      delete content.featuredOnHome;
      delete content.homeOrder;
      return content;
    };
    for (const name of names) {
      const draft = parseAdminDraft(await readFile(path.join(this.draftRoot, name), "utf8"), name);
      const validation = draftValidation(draft);
      let changed = false;
      let globalChanged = false;
      const canonical = published.get(draft.slug);
      let comparable;
      try { comparable = compileAdminDraft(draft); }
      catch { comparable = semanticValue(draft); }
      if (canonical) {
        let canonicalComparable = canonical;
        try { canonicalComparable = compileAdminDraft(createAdminDraft(canonical)); } catch { /* canonical is already validated */ }
        changed = JSON.stringify(semanticValue(withoutGlobalPlacement(comparable))) !== JSON.stringify(semanticValue(withoutGlobalPlacement(canonicalComparable)));
        globalChanged = !canonical
          || comparable.catalogOrder !== canonical.catalogOrder
          || comparable.featuredOnHome !== canonical.featuredOnHome
          || comparable.homeOrder !== canonical.homeOrder;
      } else { changed = true; globalChanged = true; }
      if (changed) projects.push({ slug: draft.slug, title: draft.title, valid: validation.valid, issues: validation.issues });
      if (changed || globalChanged) changedSlugs.push(draft.slug);
      if (globalChanged) globalProjects.push(draft.slug);
    }
    projects.sort((first, second) => first.title.localeCompare(second.title, "ru"));
    return { count: changedSlugs.length, projects, changedSlugs, globalProjects };
  }

  async publishSandbox({ scope, slug }) {
    await this.ensureSnapshotBaseline();
    const inventory = await this.getChangeInventory();
    const selected = scope === "project"
      ? inventory.projects.filter((item) => item.slug === slug)
      : inventory.projects;
    if (scope === "project" && selected.length !== 1) throw new Error("У проекта нет неопубликованных изменений.");
    await mkdir(this.snapshotRoot, { recursive: true });
    for (const item of selected) {
      const compiled = compileAdminDraft(await this.getProject(item.slug));
      const destination = resolveProjectDocumentPath(this.snapshotRoot, item.slug);
      const temporary = `${destination}.${process.pid}.${Date.now()}.tmp`;
      await writeFile(temporary, `${JSON.stringify(compiled, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
      await rename(temporary, destination);
    }
    return selected.map((item) => item.slug);
  }

  async permanentlyDelete(slug) {
    const project = await this.getProject(slug);
    if (project.visibility !== "deleted") throw new Error("Only deleted projects can be removed permanently.");
    try {
      const published = await this.getSandboxPublishedProject(slug).catch(() => this.getPublishedProject(slug));
      if (published.visibility === "published") {
        throw new Error("Publish this deletion before removing the project permanently.");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Publish this deletion")) throw error;
    }
    await rm(resolveProjectDocumentPath(this.draftRoot, slug), { force: true });
    await rm(path.join(this.draftAssetRoot, slug), { recursive: true, force: true });
  }

  async saveImage(slug, fileName, mime, buffer, alt) {
    if (typeof alt !== "string" || alt.trim().length === 0) throw new Error("Alt text is required.");
    const inspected = inspectImage(buffer, fileName, mime);
    const safeName = safeUploadName(fileName);
    const destination = resolveProjectAssetPath(this.draftAssetRoot, slug, safeName);
    await mkdir(path.dirname(destination), { recursive: true });
    const digest = createHash("sha256").update(buffer).digest("hex");
    let duplicateOf;
    for (const existing of await readdir(path.dirname(destination)).catch(() => [])) {
      const existingPath = resolveProjectAssetPath(this.draftAssetRoot, slug, existing);
      const existingBuffer = await readFile(existingPath);
      if (createHash("sha256").update(existingBuffer).digest("hex") === digest) {
        duplicateOf = `/assets/projects/${slug}/${existing}`;
        break;
      }
    }
    if (!duplicateOf) await writeFile(destination, buffer, { flag: "wx", mode: 0o600 });
    return {
      src: duplicateOf ?? `/assets/projects/${slug}/${safeName}`,
      alt: alt.trim(),
      width: inspected.width,
      height: inspected.height,
    };
  }

  async saveLogo(slug, fileName, buffer) {
    inspectSvg(buffer, fileName);
    const destination = resolveProjectAssetPath(this.draftAssetRoot, slug, "logo.svg");
    await mkdir(path.dirname(destination), { recursive: true });
    const temporary = `${destination}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporary, buffer, { mode: 0o600 });
    await rename(temporary, destination);
    return { type: "image", src: `/assets/projects/${slug}/logo.svg` };
  }

  async importFrame(slug, { url, slot, sectionId }) {
    if (!['catalog', 'hero', 'interactive'].includes(slot)) throw new Error("Неизвестное назначение Figma Frame.");
    const project = await this.getProject(slug);
    let composition;
    try {
      composition = await importFigmaFrame({ url, slug, slot: sectionId ? `${slot}-${sectionId}` : slot, assetRoot: this.draftAssetRoot });
    } catch (error) {
      const explanation = humanFigmaImportError(error);
      throw new UserFacingError(explanation.title, explanation.message, { cause: error });
    }
    let next;
    if (slot === 'catalog') next = { ...project, catalogFrame: composition };
    else if (slot === 'hero') next = { ...project, heroFrame: composition };
    else {
      const content = project.content.map((block) => {
        if (block.type !== 'section' || block.adminId !== sectionId) return block;
        return { ...block, blocks: [...block.blocks.filter((item) => item.type !== 'frame'), { type: 'frame', composition }] };
      });
      next = { ...project, content, admin: { ...project.admin, sections: { ...project.admin?.sections, [sectionId]: { ...project.admin?.sections?.[sectionId], interactive: { enabled: true, figmaUrl: url, status: 'connected' } } } } };
    }
    await this.saveDraft(slug, next);
    return { project: next, composition };
  }

  async readImage(slug, fileName) {
    const safeName = fileName.includes("/") ? fileName : safeUploadName(fileName);
    const draftPath = resolveProjectAssetPath(this.draftAssetRoot, slug, safeName);
    try {
      return await readFile(draftPath);
    } catch {
      return readFile(resolveProjectAssetPath(this.assetRoot, slug, safeName));
    }
  }
}
