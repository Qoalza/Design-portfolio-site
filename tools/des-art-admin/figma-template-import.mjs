import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import sharp from "sharp";

import { validateTemplateAssets } from "../../src/lib/project-visual-registry.ts";
import { FIGMA_TEMPLATE_IMPORTS } from "./figma-template-map.mjs";

const execFileAsync = promisify(execFile);
const FIGMA_HOSTS = new Set(["figma.com", "www.figma.com"]);
const KEYCHAIN_SERVICE = "des-art-admin-figma";
const KEYCHAIN_ACCOUNT = "file-content-read";
const ROOT_TYPES = new Set(["FRAME", "COMPONENT", "INSTANCE", "GROUP", "SECTION"]);

export function parseFigmaNodeUrl(value) {
  let url;
  try { url = new URL(String(value)); } catch { throw new Error("Укажите корректную ссылку на Figma Frame."); }
  if (url.protocol !== "https:" || !FIGMA_HOSTS.has(url.hostname)) throw new Error("Ссылка должна вести на Figma.");
  const parts = url.pathname.split("/").filter(Boolean);
  if (!["design", "file"].includes(parts[0]) || !parts[1]) throw new Error("В ссылке Figma не найден ключ файла.");
  const rawNode = url.searchParams.get("node-id");
  if (!rawNode) throw new Error("Ссылка должна вести на конкретный Frame Figma.");
  const nodeId = rawNode.replace(/-/g, ":");
  if (!/^\d+:\d+$/.test(nodeId)) throw new Error("В ссылке Figma указан некорректный node-id.");
  return { fileKey: parts[1], nodeId, url: url.toString() };
}

export async function readFigmaToken() {
  if (process.env.DES_ART_FIGMA_TOKEN) return process.env.DES_ART_FIGMA_TOKEN;
  if (process.platform !== "darwin") throw new Error("Figma не подключена. Настройте локальный токен.");
  try {
    const { stdout } = await execFileAsync("/usr/bin/security", ["find-generic-password", "-s", KEYCHAIN_SERVICE, "-a", KEYCHAIN_ACCOUNT, "-w"], { encoding: "utf8" });
    return stdout.trim();
  } catch {
    throw new Error("Figma не подключена. Добавьте локальный токен с доступом file_content:read.");
  }
}

export async function saveFigmaToken(token) {
  const value = String(token ?? "").trim();
  if (value.length < 20) throw new Error("Токен Figma выглядит неполным.");
  if (process.platform !== "darwin") throw new Error("Хранилище macOS Keychain недоступно.");
  await execFileAsync("/usr/bin/security", ["add-generic-password", "-U", "-s", KEYCHAIN_SERVICE, "-a", KEYCHAIN_ACCOUNT, "-w", value]);
}

async function figmaJson(fetchImpl, endpoint, token) {
  const response = await fetchImpl(endpoint, { headers: { "X-Figma-Token": token } });
  if (!response.ok) {
    if (response.status === 403) throw new Error("Figma отклонила токен или доступ к файлу.");
    if (response.status === 404) throw new Error("Файл или Frame Figma больше не найден.");
    if (response.status === 429) throw new Error("Figma временно ограничила запросы. Повторите импорт позже.");
    throw new Error(`Figma API вернула ошибку ${response.status}.`);
  }
  return response.json();
}

async function download(fetchImpl, url, label) {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`Не удалось скачать элемент «${label}» из Figma.`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0 || buffer.length > 20 * 1024 * 1024) throw new Error(`Элемент «${label}» имеет недопустимый размер файла.`);
  return buffer;
}

function imageFill(node) {
  return node.fills?.find((fill) => fill.visible !== false && fill.type === "IMAGE" && fill.imageRef);
}

function box(node) {
  return node.absoluteBoundingBox ?? node.absoluteRenderBounds;
}

function withinTolerance(actual, expected) {
  return Math.abs(actual - expected) / expected <= 0.001;
}

async function normalizedPng(buffer, destination) {
  const pipeline = sharp(buffer);
  const metadata = await pipeline.metadata();
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > 40_000_000) throw new Error("Figma вернула изображение с недопустимым разрешением.");
  await pipeline.png().toFile(destination);
  return { width: metadata.width, height: metadata.height };
}

async function importChildren({ fetchImpl, fileKey, root, token, spec, temporary, publicRoot }) {
  const children = (root.children ?? []).filter((child) => child.visible !== false);
  if (children.length !== spec.slots.length) {
    throw new Error(`Frame содержит ${children.length} верхнеуровневых элементов вместо утверждённых ${spec.slots.length}.`);
  }
  const fills = children.filter((child) => imageFill(child));
  const exports = children.filter((child) => !imageFill(child));
  const fillData = fills.length
    ? await figmaJson(fetchImpl, `https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}/images`, token)
    : { meta: { images: {} } };
  const exportData = exports.length
    ? await figmaJson(fetchImpl, `https://api.figma.com/v1/images/${encodeURIComponent(fileKey)}?ids=${exports.map((child) => encodeURIComponent(child.id)).join(",")}&format=png&scale=2&use_absolute_bounds=true`, token)
    : { images: {} };
  const assets = {};
  for (const [index, child] of children.entries()) {
    const slot = spec.slots[index];
    const fill = imageFill(child);
    const url = fill ? fillData.meta?.images?.[fill.imageRef] : exportData.images?.[child.id];
    if (!url) throw new Error(`Figma не вернула элемент «${child.name ?? child.id}».`);
    const destination = path.join(temporary, `${slot.name}.png`);
    const dimensions = await normalizedPng(await download(fetchImpl, url, child.name ?? child.id), destination);
    assets[slot.name] = [{ src: `${publicRoot}/${slot.name}.png`, alt: slot.alt, ...dimensions }];
  }
  return assets;
}

async function importRootCrops({ root, spec, temporary, publicRoot, source }) {
  const bounds = box(root);
  if (!bounds || !withinTolerance(bounds.width, spec.width) || !withinTolerance(bounds.height, spec.height)) {
    throw new Error(`Frame имеет размер ${bounds?.width ?? 0}×${bounds?.height ?? 0}, ожидается утверждённый ${spec.width}×${spec.height}.`);
  }
  const metadata = await sharp(source).metadata();
  if (!metadata.width || !metadata.height || !withinTolerance(metadata.width, spec.width * 2) || !withinTolerance(metadata.height, spec.height * 2)) {
    throw new Error("Figma экспортировала Frame не в утверждённом размере 2×.");
  }
  const assets = {};
  for (const slot of spec.slots) {
    const destination = path.join(temporary, `${slot.name}.png`);
    const left = Math.round(slot.x * 2);
    const top = Math.round(slot.y * 2);
    const width = Math.round(slot.width * 2);
    const height = Math.round(slot.height * 2);
    await sharp(source).extract({ left, top, width, height }).png().toFile(destination);
    assets[slot.name] = [{ src: `${publicRoot}/${slot.name}.png`, alt: slot.alt, width, height }];
  }
  return assets;
}

export async function importFigmaTemplate({ url, token, slug, templateId, templateIds, assetRoot, fetchImpl = fetch }) {
  const candidates = templateId ? [templateId] : Array.isArray(templateIds) ? templateIds : [];
  if (candidates.length === 0 || candidates.some((candidate) => !FIGMA_TEMPLATE_IMPORTS[candidate])) {
    throw new Error("Для этого утверждённого шаблона не настроен импорт из Figma.");
  }
  const parsed = parseFigmaNodeUrl(url);
  const auth = token || await readFigmaToken();
  const nodeData = await figmaJson(fetchImpl, `https://api.figma.com/v1/files/${encodeURIComponent(parsed.fileKey)}/nodes?ids=${encodeURIComponent(parsed.nodeId)}`, auth);
  const root = nodeData.nodes?.[parsed.nodeId]?.document;
  if (!root || !ROOT_TYPES.has(root.type)) throw new Error("Figma Frame не найден по указанной ссылке.");
  const matches = candidates.filter((candidate) => {
    const candidateSpec = FIGMA_TEMPLATE_IMPORTS[candidate];
    if (candidateSpec.kind !== "root-crops") return candidates.length === 1;
    const bounds = box(root);
    return bounds && withinTolerance(bounds.width, candidateSpec.width) && withinTolerance(bounds.height, candidateSpec.height);
  });
  if (matches.length !== 1) {
    throw new Error(matches.length === 0
      ? "Размер Frame не соответствует ни одному интерактивному шаблону этого проекта."
      : "Frame неоднозначно соответствует нескольким шаблонам; требуется уточнение code-owned mapping.");
  }
  const resolvedTemplateId = matches[0];
  const spec = FIGMA_TEMPLATE_IMPORTS[resolvedTemplateId];
  if (spec.kind === "children") {
    const visibleChildren = (root.children ?? []).filter((child) => child.visible !== false);
    if (visibleChildren.length !== spec.slots.length) {
      throw new Error(`Frame содержит ${visibleChildren.length} верхнеуровневых элементов вместо утверждённых ${spec.slots.length}.`);
    }
  }
  const version = String(nodeData.version ?? createHash("sha256").update(JSON.stringify(root)).digest("hex").slice(0, 12));
  const folder = createHash("sha256").update(`preview-v1:${resolvedTemplateId}:${parsed.fileKey}:${parsed.nodeId}:${version}`).digest("hex").slice(0, 16);
  const projectRoot = path.join(assetRoot, slug, "figma");
  const destination = path.join(projectRoot, folder);
  const temporary = path.join(projectRoot, `.${folder}.${process.pid}.${Date.now()}.tmp`);
  const publicRoot = `/assets/projects/${slug}/figma/${folder}`;
  await mkdir(temporary, { recursive: true });
  try {
    const previewData = await figmaJson(fetchImpl, `https://api.figma.com/v1/images/${encodeURIComponent(parsed.fileKey)}?ids=${encodeURIComponent(root.id)}&format=png&scale=2&use_absolute_bounds=true`, auth);
    const previewUrl = previewData.images?.[root.id];
    if (!previewUrl) throw new Error("Figma не вернула превью корневого Frame.");
    const rootSource = await download(fetchImpl, previewUrl, root.name ?? root.id);
    const previewDimensions = await normalizedPng(rootSource, path.join(temporary, "preview.png"));
    const assets = spec.kind === "children"
      ? await importChildren({ fetchImpl, fileKey: parsed.fileKey, root, token: auth, spec, temporary, publicRoot })
      : await importRootCrops({ root, spec, temporary, publicRoot, source: rootSource });
    validateTemplateAssets(resolvedTemplateId, assets, `Figma Frame для ${resolvedTemplateId}`);
    await mkdir(projectRoot, { recursive: true });
    await rename(temporary, destination).catch(async (error) => {
      if (error?.code !== "EEXIST" && error?.code !== "ENOTEMPTY") throw error;
      await rm(temporary, { recursive: true, force: true });
    });
    return {
      visual: { templateId: resolvedTemplateId, assets },
      source: {
        url: parsed.url,
        templateId: resolvedTemplateId,
        preview: { src: `${publicRoot}/preview.png`, ...previewDimensions },
      },
    };
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
}
