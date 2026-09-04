import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { readFigmaToken } from "./figma-template-import.mjs";

const FIGMA_HOSTS = new Set(["figma.com", "www.figma.com"]);
const ROOT_TYPES = new Set(["FRAME", "COMPONENT", "INSTANCE", "GROUP", "SECTION"]);
const CONSTRAINTS = new Set(["MIN", "MAX", "CENTER", "STRETCH", "SCALE"]);
const CSS_BLEND_MODES = new Set(["NORMAL", "PASS_THROUGH", "MULTIPLY", "SCREEN", "OVERLAY", "DARKEN", "LIGHTEN", "COLOR_DODGE", "COLOR_BURN", "HARD_LIGHT", "SOFT_LIGHT", "DIFFERENCE", "EXCLUSION", "HUE", "SATURATION", "COLOR", "LUMINOSITY"]);

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

const percent = (value) => `${Number(value.toFixed(6))}%`;
const scaledLength = (value, rootWidth, rootHeight) => {
  const magnitude = Math.abs(value);
  const length = `min(${Number((magnitude / rootWidth * 100).toFixed(6))}cqw, ${Number((magnitude / rootHeight * 100).toFixed(6))}cqh)`;
  return value < 0 ? `calc(0px - ${length})` : length;
};

export function frameNodeStyle(node, parentWidth, parentHeight, rootWidth = parentWidth, rootHeight = parentHeight) {
  const style = { position: "absolute" };
  const horizontal = node.constraints?.horizontal ?? "MIN";
  const vertical = node.constraints?.vertical ?? "MIN";
  if (horizontal === "SCALE") { style.left = percent(node.x / parentWidth * 100); style.width = percent(node.width / parentWidth * 100); }
  else if (horizontal === "STRETCH") { style.left = scaledLength(node.x, rootWidth, rootHeight); style.right = scaledLength(parentWidth - node.x - node.width, rootWidth, rootHeight); }
  else style.width = scaledLength(node.width, rootWidth, rootHeight);
  if (horizontal === "MAX") style.right = scaledLength(parentWidth - node.x - node.width, rootWidth, rootHeight);
  else if (horizontal === "CENTER") {
    style.left = `calc(50% + ${scaledLength(node.x + node.width / 2 - parentWidth / 2, rootWidth, rootHeight)})`;
    style.transform = "translateX(-50%)";
  } else if (horizontal === "MIN") style.left = scaledLength(node.x, rootWidth, rootHeight);
  if (vertical === "SCALE") { style.top = percent(node.y / parentHeight * 100); style.height = percent(node.height / parentHeight * 100); }
  else if (vertical === "STRETCH") { style.top = scaledLength(node.y, rootWidth, rootHeight); style.bottom = scaledLength(parentHeight - node.y - node.height, rootWidth, rootHeight); }
  else style.height = scaledLength(node.height, rootWidth, rootHeight);
  if (vertical === "MAX") style.bottom = scaledLength(parentHeight - node.y - node.height, rootWidth, rootHeight);
  else if (vertical === "CENTER") {
    style.top = `calc(50% + ${scaledLength(node.y + node.height / 2 - parentHeight / 2, rootWidth, rootHeight)})`;
    style.transform = `${style.transform ?? ""} translateY(-50%)`.trim();
  } else if (vertical === "MIN") style.top = scaledLength(node.y, rootWidth, rootHeight);
  return style;
}

function box(node) { return node.absoluteBoundingBox ?? node.absoluteRenderBounds; }
function imageFill(node) { return node.fills?.find((paint) => paint.visible !== false && paint.type === "IMAGE" && paint.imageRef); }
function visibleChildren(node) { return (node.children ?? []).filter((child) => child.visible !== false); }

function rgba(paint) {
  if (!paint || paint.type !== "SOLID" || paint.visible === false) return undefined;
  const color = paint.color ?? {};
  const alpha = (paint.opacity ?? 1) * (color.a ?? 1);
  const channel = (value) => Math.round((value ?? 0) * 255).toString(16).padStart(2, "0");
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}${alpha < 1 ? channel(alpha) : ""}`;
}

function effects(node) {
  return (node.effects ?? []).filter((effect) => effect.visible !== false).map((effect) => {
    if (effect.type !== "DROP_SHADOW" && effect.type !== "INNER_SHADOW") {
      throw new Error(`У слоя «${node.name ?? node.id}» есть эффект, отличный от тени. Добавьте его в готовое PNG и повторите импорт.`);
    }
    return {
      type: effect.type === "DROP_SHADOW" ? "drop-shadow" : "inner-shadow",
      color: rgba({ type: "SOLID", color: effect.color, opacity: 1 }) ?? "#000000",
      offsetX: effect.offset?.x ?? 0,
      offsetY: effect.offset?.y ?? 0,
      blur: effect.radius ?? 0,
      spread: effect.spread ?? 0,
    };
  });
}

function blendMode(node) {
  const mode = node.blendMode ?? "PASS_THROUGH";
  if (!CSS_BLEND_MODES.has(mode)) throw new Error(`Слой «${node.name ?? node.id}» использует неподдерживаемый blend mode ${mode}.`);
  return mode === "NORMAL" || mode === "PASS_THROUGH" ? undefined : mode.toLowerCase().replaceAll("_", "-");
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
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > 20 * 1024 * 1024) throw new Error(`Элемент «${label}» имеет недопустимый размер файла.`);
  return { bytes, contentType: response.headers?.get?.("content-type") ?? "" };
}

function rasterExtension(contentType) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

function pngDimensions(buffer) {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return undefined;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return width > 0 && height > 0 ? { width, height } : undefined;
}

function relativeNode(node, rootBox, asset) {
  const bounds = box(node);
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) throw new Error(`Слой «${node.name ?? node.id}» не имеет пригодной геометрии.`);
  const constraint = node.constraints ?? {};
  return {
    id: node.id,
    name: node.name || node.id,
    type: "asset",
    x: bounds.x - rootBox.x,
    y: bounds.y - rootBox.y,
    width: bounds.width,
    height: bounds.height,
    opacity: node.opacity ?? 1,
    rotation: node.rotation ?? 0,
    constraints: {
      horizontal: CONSTRAINTS.has(constraint.horizontal) ? constraint.horizontal : "MIN",
      vertical: CONSTRAINTS.has(constraint.vertical) ? constraint.vertical : "MIN",
    },
    ...(node.clipsContent === undefined ? {} : { clip: Boolean(node.clipsContent) }),
    ...(node.cornerRadius === undefined ? {} : { radius: node.cornerRadius }),
    ...(effects(node).length ? { effects: effects(node) } : {}),
    ...(blendMode(node) ? { blendMode: blendMode(node) } : {}),
    asset,
  };
}

async function manifestsEqual(left, right) {
  try { return (await readFile(left)).equals(await readFile(right)); } catch { return false; }
}

export async function importFigmaFrame({ url, token, slug, slot, assetRoot, fetchImpl = fetch }) {
  const { fileKey, nodeId } = parseFigmaNodeUrl(url);
  const auth = token || await readFigmaToken();
  const nodeData = await figmaJson(fetchImpl, `https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}/nodes?ids=${encodeURIComponent(nodeId)}&geometry=paths`, auth);
  const entry = nodeData.nodes?.[nodeId];
  const root = entry?.document;
  if (!root || !ROOT_TYPES.has(root.type)) throw new Error("Figma Frame не найден по указанной ссылке.");
  const rootBox = box(root);
  if (!rootBox || rootBox.width <= 0 || rootBox.height <= 0) throw new Error("Корневой Frame не имеет пригодного размера.");

  const children = visibleChildren(root);
  if (children.length === 0) throw new Error("Figma Frame не содержит видимых элементов.");
  const rootRasterFill = imageFill(root);
  const rasterChildren = children.filter((child) => imageFill(child));
  const exportChildren = children.filter((child) => !imageFill(child));
  const [exports, fills, preview] = await Promise.all([
    exportChildren.length ? figmaJson(fetchImpl, `https://api.figma.com/v1/images/${encodeURIComponent(fileKey)}?ids=${exportChildren.map((child) => encodeURIComponent(child.id)).join(",")}&format=png&scale=2&use_absolute_bounds=true`, auth) : { images: {} },
    rootRasterFill || rasterChildren.length ? figmaJson(fetchImpl, `https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}/images`, auth) : { meta: { images: {} } },
    figmaJson(fetchImpl, `https://api.figma.com/v1/images/${encodeURIComponent(fileKey)}?ids=${encodeURIComponent(root.id)}&format=png&scale=2&use_absolute_bounds=true`, auth),
  ]);
  const version = String(nodeData.version ?? entry.version ?? createHash("sha256").update(JSON.stringify(root)).digest("hex").slice(0, 12));
  const folderName = `${slot}-${createHash("sha256").update(`${fileKey}:${nodeId}:${version}`).digest("hex").slice(0, 12)}`;
  const projectRoot = path.join(assetRoot, slug, "frames");
  const temporary = path.join(projectRoot, `.${folderName}.${process.pid}.tmp`);
  const destination = path.join(projectRoot, folderName);
  await mkdir(temporary, { recursive: true });
  try {
    const nodes = [];
    for (const child of children) {
      const fill = imageFill(child);
      const exportUrl = fill ? fills.meta?.images?.[fill.imageRef] : exports.images?.[child.id];
      if (!exportUrl) throw new Error(`Figma не вернула элемент «${child.name ?? child.id}».`);
      const downloaded = await download(fetchImpl, exportUrl, child.name ?? child.id);
      const { bytes } = downloaded;
      const name = `${createHash("sha256").update(child.id).digest("hex").slice(0, 10)}${fill ? `.${rasterExtension(downloaded.contentType)}` : "@2x.png"}`;
      await writeFile(path.join(temporary, name), bytes, { mode: 0o600 });
      const dimensions = fill ? undefined : pngDimensions(bytes);
      const bounds = box(child);
      const renderedWidth = dimensions ? dimensions.width / 2 : bounds.width;
      const renderedHeight = dimensions ? dimensions.height / 2 : bounds.height;
      const bleedX = Math.max(0, (renderedWidth - bounds.width) / 2);
      const bleedY = Math.max(0, (renderedHeight - bounds.height) / 2);
      nodes.push(relativeNode(child, rootBox, {
        src: `/assets/projects/${slug}/frames/${folderName}/${name}`,
        format: "raster",
        fit: fill ? "contain" : "fill",
        ...(fill?.opacity === undefined ? {} : { opacity: fill.opacity }),
        ...(bleedX || bleedY ? { bounds: { x: -bleedX, y: -bleedY, width: renderedWidth, height: renderedHeight } } : {}),
      }));
    }
    if (rootRasterFill) {
      const rootFillUrl = fills.meta?.images?.[rootRasterFill.imageRef];
      if (!rootFillUrl) throw new Error(`Figma не вернула фон Frame «${root.name ?? root.id}».`);
      const rootFill = await download(fetchImpl, rootFillUrl, root.name ?? root.id);
      const rootFillName = `${createHash("sha256").update(`${root.id}:background`).digest("hex").slice(0, 10)}.${rasterExtension(rootFill.contentType)}`;
      await writeFile(path.join(temporary, rootFillName), rootFill.bytes, { mode: 0o600 });
      nodes.unshift({
        id: `${root.id}:background`, name: `${root.name || root.id} background`, type: "asset",
        x: 0, y: 0, width: rootBox.width, height: rootBox.height, opacity: 1, rotation: 0,
        constraints: { horizontal: "STRETCH", vertical: "STRETCH" }, clip: true,
        asset: {
          src: `/assets/projects/${slug}/frames/${folderName}/${rootFillName}`,
          format: "raster",
          fit: rootRasterFill.scaleMode === "FILL" ? "cover" : rootRasterFill.scaleMode === "STRETCH" ? "fill" : "contain",
          ...(rootRasterFill.opacity === undefined ? {} : { opacity: rootRasterFill.opacity }),
        },
      });
    }
    const previewUrl = preview.images?.[root.id];
    if (!previewUrl) throw new Error("Figma не вернула превью корневого Frame.");
    const previewDownload = await download(fetchImpl, previewUrl, root.name ?? root.id);
    const previewName = `preview.${rasterExtension(previewDownload.contentType)}`;
    await writeFile(path.join(temporary, previewName), previewDownload.bytes, { mode: 0o600 });
    const previewSize = pngDimensions(previewDownload.bytes);
    const manifest = {
      source: { url, fileKey, nodeId, version },
      width: rootBox.width,
      height: rootBox.height,
      clip: Boolean(root.clipsContent),
      radius: root.cornerRadius ?? 0,
      background: rgba(root.fills?.find((paint) => paint.visible !== false && paint.type === "SOLID")) ?? "transparent",
      hasVisualFill: Boolean(root.fills?.some((paint) => paint.visible !== false && (paint.opacity ?? 1) > 0)),
      ...(effects(root).length ? { effects: effects(root) } : {}),
      ...(blendMode(root) ? { blendMode: blendMode(root) } : {}),
      nodes,
      ...(previewSize ? { preview: { src: `/assets/projects/${slug}/frames/${folderName}/${previewName}`, alt: "", ...previewSize } } : {}),
    };
    await writeFile(path.join(temporary, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
    await mkdir(projectRoot, { recursive: true });
    const existingManifest = path.join(destination, "manifest.json");
    if (await manifestsEqual(path.join(temporary, "manifest.json"), existingManifest)) {
      await rm(temporary, { recursive: true, force: true });
      return { composition: manifest, changed: false };
    }
    const backup = `${destination}.${process.pid}.backup`;
    let hasBackup = false;
    try { await rename(destination, backup); hasBackup = true; } catch (error) { if (error?.code !== "ENOENT") throw error; }
    try { await rename(temporary, destination); } catch (error) { if (hasBackup) await rename(backup, destination).catch(() => {}); throw error; }
    if (hasBackup) await rm(backup, { recursive: true, force: true }).catch(() => {});
    return { composition: manifest, changed: true };
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
}
