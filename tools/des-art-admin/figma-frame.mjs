const FIGMA_HOSTS = new Set(["figma.com", "www.figma.com"]);
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const KEYCHAIN_SERVICE = "des-art-admin-figma";
const KEYCHAIN_ACCOUNT = "file-content-read";

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
  return { fileKey: parts[1], nodeId };
}

const percent = (value) => `${Number(value.toFixed(6))}%`;

export function frameNodeStyle(node, parentWidth, parentHeight) {
  const style = { position: "absolute", width: percent(node.width / parentWidth * 100), height: percent(node.height / parentHeight * 100) };
  const horizontal = node.constraints?.horizontal ?? "MIN";
  const vertical = node.constraints?.vertical ?? "MIN";
  if (horizontal === "MAX") style.right = percent((parentWidth - node.x - node.width) / parentWidth * 100);
  else if (horizontal === "CENTER") {
    style.left = `calc(50% + ${percent((node.x + node.width / 2 - parentWidth / 2) / parentWidth * 100)})`;
    style.transform = "translateX(-50%)";
  }
  else if (horizontal === "STRETCH") { style.left = percent(node.x / parentWidth * 100); style.right = percent((parentWidth - node.x - node.width) / parentWidth * 100); delete style.width; }
  else { style.left = percent(node.x / parentWidth * 100); }
  if (vertical === "MAX") style.bottom = percent((parentHeight - node.y - node.height) / parentHeight * 100);
  else if (vertical === "CENTER") {
    style.top = `calc(50% + ${percent((node.y + node.height / 2 - parentHeight / 2) / parentHeight * 100)})`;
    style.transform = `${style.transform ?? ""} translateY(-50%)`.trim();
  }
  else if (vertical === "STRETCH") { style.top = percent(node.y / parentHeight * 100); style.bottom = percent((parentHeight - node.y - node.height) / parentHeight * 100); delete style.height; }
  else { style.top = percent(node.y / parentHeight * 100); }
  return style;
}

export async function readFigmaToken() {
  if (process.env.DES_ART_FIGMA_TOKEN) return process.env.DES_ART_FIGMA_TOKEN;
  if (process.platform !== "darwin") throw new Error("Figma не подключена. Настройте локальный токен.");
  try {
    const { stdout } = await execFileAsync("/usr/bin/security", ["find-generic-password", "-s", KEYCHAIN_SERVICE, "-a", KEYCHAIN_ACCOUNT, "-w"], { encoding: "utf8" });
    return stdout.trim();
  } catch { throw new Error("Figma не подключена. Добавьте локальный токен с доступом file_content:read."); }
}

export async function saveFigmaToken(token) {
  const value = String(token ?? "").trim();
  if (value.length < 20) throw new Error("Токен Figma выглядит неполным.");
  if (process.platform !== "darwin") throw new Error("Хранилище macOS Keychain недоступно.");
  await execFileAsync("/usr/bin/security", ["add-generic-password", "-U", "-s", KEYCHAIN_SERVICE, "-a", KEYCHAIN_ACCOUNT, "-w", value]);
}

const rgba = (paint) => {
  if (!paint || paint.type !== "SOLID" || paint.visible === false) return undefined;
  const color = paint.color ?? {};
  const alpha = (paint.opacity ?? 1) * (color.a ?? 1);
  const channel = (value) => Math.round((value ?? 0) * 255).toString(16).padStart(2, "0");
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}${alpha < 1 ? channel(alpha) : ""}`;
};

const CSS_BLEND_MODES = new Set(["NORMAL", "PASS_THROUGH", "MULTIPLY", "SCREEN", "OVERLAY", "DARKEN", "LIGHTEN", "COLOR_DODGE", "COLOR_BURN", "HARD_LIGHT", "SOFT_LIGHT", "DIFFERENCE", "EXCLUSION", "HUE", "SATURATION", "COLOR", "LUMINOSITY"]);

const blendMode = (node) => {
  const mode = node.blendMode ?? "PASS_THROUGH";
  if (!CSS_BLEND_MODES.has(mode)) throw new Error(`Слой «${node.name ?? node.id}» использует неподдерживаемый blend mode ${mode}.`);
  if (mode === "NORMAL" || mode === "PASS_THROUGH") return undefined;
  return mode.toLowerCase().replaceAll("_", "-");
};

const effects = (node) => (node.effects ?? []).filter((effect) => effect.visible !== false).map((effect) => {
  if (effect.type === "DROP_SHADOW" || effect.type === "INNER_SHADOW") {
    const color = rgba({ type: "SOLID", color: effect.color, opacity: 1 });
    if (!color) throw new Error(`Эффект слоя «${node.name ?? node.id}» не содержит корректный цвет.`);
    return { type: effect.type === "DROP_SHADOW" ? "drop-shadow" : "inner-shadow", color, offsetX: effect.offset?.x ?? 0, offsetY: effect.offset?.y ?? 0, blur: effect.radius ?? 0, spread: effect.spread ?? 0 };
  }
  if (effect.type === "LAYER_BLUR" || effect.type === "BACKGROUND_BLUR") return { type: effect.type === "LAYER_BLUR" ? "layer-blur" : "background-blur", radius: effect.radius ?? 0 };
  throw new Error(`Слой «${node.name ?? node.id}» использует неподдерживаемый эффект ${effect.type}.`);
});

const stroke = (node) => {
  const color = rgba(node.strokes?.find((paint) => paint.visible !== false));
  const width = node.strokeWeight;
  if (!color || typeof width !== "number" || !Number.isFinite(width) || width <= 0) return undefined;
  const align = ["INSIDE", "OUTSIDE", "CENTER"].includes(node.strokeAlign) ? node.strokeAlign : "CENTER";
  return { color, width, align };
};

function safeSvg(source) {
  if (!/^\s*<svg\b/i.test(source) || /<!DOCTYPE|<script\b|<foreignObject\b|\son[a-z]+\s*=|javascript:|(?:href|src)\s*=\s*["']https?:/i.test(source)) {
    throw new Error("Figma вернула небезопасный SVG-слой.");
  }
  return source;
}

function box(node) {
  return node.absoluteBoundingBox ?? node.absoluteRenderBounds;
}

function collectLeaves(node, target = []) {
  for (const child of node.children ?? []) {
    if (child.visible === false) continue;
    if (child.children?.some((item) => item.isMask)) target.push(child);
    else if (child.children?.length) collectLeaves(child, target);
    else target.push(child);
  }
  return target;
}

function imageFill(node) {
  return node.fills?.find((paint) => paint.visible !== false && paint.type === "IMAGE" && paint.imageRef);
}

function validateContainerVisuals(node) {
  const visibleFills = (node.fills ?? []).filter((paint) => paint.visible !== false && (paint.opacity ?? 1) > 0);
  const unsupportedFill = visibleFills.find((paint) => !["SOLID", "IMAGE"].includes(paint.type));
  if (unsupportedFill) throw new Error(`Слой «${node.name ?? node.id}» использует неподдерживаемый fill ${unsupportedFill.type}.`);
  if (visibleFills.filter((paint) => paint.type === "SOLID").length > 1 || visibleFills.filter((paint) => paint.type === "IMAGE").length > 1) throw new Error(`Слой «${node.name ?? node.id}» содержит несколько одинаковых fills, которые нельзя воспроизвести без потерь.`);
  const visibleStrokes = (node.strokes ?? []).filter((paint) => paint.visible !== false && (paint.opacity ?? 1) > 0);
  if (visibleStrokes.length > 1 || visibleStrokes.some((paint) => paint.type !== "SOLID")) throw new Error(`Слой «${node.name ?? node.id}» использует сложную обводку, которую нельзя воспроизвести без потерь.`);
  if (node.strokeDashes?.length || node.individualStrokeWeights) throw new Error(`Слой «${node.name ?? node.id}» использует нестандартную обводку, которую нельзя воспроизвести без потерь.`);
  if (node.rectangleCornerRadii && new Set(node.rectangleCornerRadii).size > 1) throw new Error(`Слой «${node.name ?? node.id}» использует разные радиусы углов, которые пока не поддерживаются.`);
  if ((node.cornerSmoothing ?? 0) !== 0) throw new Error(`Слой «${node.name ?? node.id}» использует corner smoothing, который пока не поддерживается.`);
  if (node.layoutMode === "GRID" || node.layoutWrap === "WRAP") throw new Error(`Слой «${node.name ?? node.id}» использует неподдерживаемый режим Auto Layout.`);
  effects(node);
  blendMode(node);
}

function collectNodes(node, target = []) {
  target.push(node);
  for (const child of node.children ?? []) collectNodes(child, target);
  return target;
}

function rasterExtension(contentType) {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("gif")) return "gif";
  return "jpg";
}

async function figmaJson(fetchImpl, endpoint, token) {
  const response = await fetchImpl(endpoint, { headers: { "X-Figma-Token": token } });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 403) throw new Error("Figma отклонила токен или доступ к файлу.");
    if (response.status === 404) throw new Error("Файл или Frame Figma больше не найден.");
    if (response.status === 429) throw new Error("Figma временно ограничила запросы. Повторите импорт позже.");
    throw new Error(`Figma API: ${response.status}${detail ? ` — ${detail.slice(0, 160)}` : ""}`);
  }
  return response.json();
}

function relativeNode(node, parentBox, assetMap) {
  const bounds = box(node);
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) throw new Error(`Слой «${node.name ?? node.id}» не имеет пригодной геометрии.`);
  const constraints = node.constraints ?? { horizontal: "MIN", vertical: "MIN" };
  const compoundAsset = assetMap.has(node.id);
  const rasterAsset = Boolean(imageFill(node));
  const visibleChildren = node.children?.filter((child) => child.visible !== false) ?? [];
  const children = compoundAsset ? undefined : visibleChildren.map((child, index) => ({
    ...relativeNode(child, bounds, assetMap),
    ...(node.itemReverseZIndex ? { zIndex: visibleChildren.length - index } : {}),
  }));
  const isContainer = Boolean(children?.length);
  if (isContainer || rasterAsset) validateContainerVisuals(node);
  const layoutMode = node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL" ? node.layoutMode : undefined;
  const backgroundAsset = isContainer && imageFill(node) ? assetMap.get(node.id) : undefined;
  const renderedChildren = backgroundAsset ? [{
    id: `${node.id}:background`, name: `${node.name || node.id} background`, type: "asset",
    x: 0, y: 0, width: bounds.width, height: bounds.height, opacity: imageFill(node).opacity ?? 1, rotation: 0,
    constraints: { horizontal: "STRETCH", vertical: "STRETCH" }, clip: true, asset: backgroundAsset,
  }, ...children] : children;
  const nodeEffects = isContainer || rasterAsset ? effects(node) : undefined;
  const nodeBlendMode = blendMode(node);
  return {
    id: node.id,
    name: node.name || node.id,
    type: isContainer ? "container" : "asset",
    x: bounds.x - parentBox.x,
    y: bounds.y - parentBox.y,
    width: bounds.width,
    height: bounds.height,
    opacity: node.opacity ?? 1,
    rotation: node.rotation ?? 0,
    constraints: {
      horizontal: ["MIN", "MAX", "CENTER", "STRETCH", "SCALE"].includes(constraints.horizontal) ? constraints.horizontal : "MIN",
      vertical: ["MIN", "MAX", "CENTER", "STRETCH", "SCALE"].includes(constraints.vertical) ? constraints.vertical : "MIN",
    },
    ...(node.clipsContent === undefined ? {} : { clip: Boolean(node.clipsContent) }),
    ...(node.cornerRadius === undefined ? {} : { radius: node.cornerRadius }),
    ...((isContainer || rasterAsset) && rgba(node.fills?.find((paint) => paint.visible !== false && paint.type === "SOLID")) ? { background: rgba(node.fills.find((paint) => paint.visible !== false && paint.type === "SOLID")) } : {}),
    ...((isContainer || rasterAsset) && stroke(node) ? { stroke: stroke(node) } : {}),
    ...(nodeEffects?.length ? { effects: nodeEffects } : {}),
    ...(nodeBlendMode ? { blendMode: nodeBlendMode } : {}),
    ...(node.layoutPositioning === "ABSOLUTE" ? { absoluteInLayout: true } : {}),
    ...(typeof node.layoutGrow === "number" && node.layoutGrow > 0 ? { layoutGrow: node.layoutGrow } : {}),
    ...(node.layoutAlign && node.layoutAlign !== "INHERIT" ? { layoutAlign: node.layoutAlign === "STRETCH" ? "stretch" : node.layoutAlign === "CENTER" ? "center" : node.layoutAlign === "MAX" ? "end" : "start" } : {}),
    ...(layoutMode ? { layout: {
      direction: layoutMode === "HORIZONTAL" ? "horizontal" : "vertical",
      gap: node.itemSpacing ?? 0,
      padding: [node.paddingTop ?? 0, node.paddingRight ?? 0, node.paddingBottom ?? 0, node.paddingLeft ?? 0],
      align: node.primaryAxisAlignItems === "SPACE_BETWEEN" ? "space-between" : node.primaryAxisAlignItems === "CENTER" ? "center" : node.primaryAxisAlignItems === "MAX" ? "end" : "start",
      crossAlign: node.counterAxisAlignItems === "CENTER" ? "center" : node.counterAxisAlignItems === "MAX" ? "end" : node.counterAxisAlignItems === "STRETCH" ? "stretch" : node.counterAxisAlignItems === "BASELINE" ? "baseline" : "start",
    } } : {}),
    ...(isContainer ? { children: renderedChildren } : { asset: assetMap.get(node.id) }),
  };
}

export async function importFigmaFrame({ url, token, slug, slot, assetRoot, fetchImpl = fetch }) {
  const { fileKey, nodeId } = parseFigmaNodeUrl(url);
  const auth = token || await readFigmaToken();
  const nodeData = await figmaJson(fetchImpl, `https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}/nodes?ids=${encodeURIComponent(nodeId)}&geometry=paths`, auth);
  const entry = nodeData.nodes?.[nodeId];
  const root = entry?.document;
  if (!root) throw new Error("Frame Figma не найден по указанной ссылке.");
  if (!["FRAME", "COMPONENT", "INSTANCE", "GROUP", "SECTION"].includes(root.type)) throw new Error("Ссылка должна вести на Frame, Component, Instance, Group или Section.");
  const rootBox = box(root);
  if (!rootBox || rootBox.width <= 0 || rootBox.height <= 0) throw new Error("Корневой Frame не имеет пригодного размера.");

  validateContainerVisuals(root);
  const leaves = collectLeaves(root);
  const allNodes = collectNodes(root, []);
  const rootRasterFill = imageFill(root);
  const rasterLeaves = allNodes.filter((node) => imageFill(node));
  const vectorLeaves = leaves.filter((leaf) => !imageFill(leaf));
  const vectorIds = vectorLeaves.map((leaf) => leaf.id);
  const exports = vectorIds.length ? await figmaJson(fetchImpl, `https://api.figma.com/v1/images/${encodeURIComponent(fileKey)}?ids=${vectorIds.map(encodeURIComponent).join(",")}&format=svg&svg_outline_text=true&svg_include_node_id=true`, auth) : { images: {} };
  const fills = rasterLeaves.length ? await figmaJson(fetchImpl, `https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}/images`, auth) : { meta: { images: {} } };
  const version = String(nodeData.version ?? entry.version ?? createHash("sha256").update(JSON.stringify(root)).digest("hex").slice(0, 12));
  const folderName = `${slot}-${createHash("sha256").update(`${fileKey}:${nodeId}:${version}`).digest("hex").slice(0, 12)}`;
  const projectRoot = path.join(assetRoot, slug, "frames");
  const temporary = path.join(projectRoot, `.${folderName}.${process.pid}.tmp`);
  const destination = path.join(projectRoot, folderName);
  const assets = new Map();
  await mkdir(temporary, { recursive: true });
  try {
    for (const leaf of vectorLeaves) {
      const download = exports.images?.[leaf.id];
      if (!download) throw new Error(`Figma не смогла экспортировать слой «${leaf.name ?? leaf.id}».`);
      const response = await fetchImpl(download);
      if (!response.ok) throw new Error(`Не удалось скачать слой «${leaf.name ?? leaf.id}».`);
      const svg = safeSvg(await response.text());
      const name = `${createHash("sha256").update(leaf.id).digest("hex").slice(0, 10)}.svg`;
      await writeFile(path.join(temporary, name), svg, { encoding: "utf8", mode: 0o600 });
      assets.set(leaf.id, { src: `/assets/projects/${slug}/frames/${folderName}/${name}`, format: "svg", fit: "contain" });
    }
    for (const leaf of rasterLeaves) {
      const fill = imageFill(leaf);
      const download = fills.meta?.images?.[fill.imageRef];
      if (!download) throw new Error(`Figma не вернула raster fill слоя «${leaf.name ?? leaf.id}».`);
      const response = await fetchImpl(download);
      if (!response.ok) throw new Error(`Не удалось скачать raster fill слоя «${leaf.name ?? leaf.id}».`);
      const extension = rasterExtension(response.headers?.get?.("content-type"));
      const name = `${createHash("sha256").update(leaf.id).digest("hex").slice(0, 10)}.${extension}`;
      await writeFile(path.join(temporary, name), Buffer.from(await response.arrayBuffer()), { mode: 0o600 });
      assets.set(leaf.id, { src: `/assets/projects/${slug}/frames/${folderName}/${name}`, format: "raster", fit: fill.scaleMode === "FILL" ? "cover" : fill.scaleMode === "STRETCH" ? "fill" : "contain", ...(fill.opacity === undefined ? {} : { opacity: fill.opacity }) });
    }
    const rootBackground = rootRasterFill ? {
      id: `${root.id}:background`, name: `${root.name || root.id} background`, type: "asset",
      x: 0, y: 0, width: rootBox.width, height: rootBox.height, opacity: 1, rotation: 0,
      constraints: { horizontal: "STRETCH", vertical: "STRETCH" }, clip: true,
      asset: assets.get(root.id),
    } : undefined;
    const manifest = {
      source: { url, fileKey, nodeId, version }, width: rootBox.width, height: rootBox.height,
      clip: Boolean(root.clipsContent), radius: root.cornerRadius ?? 0, background: rgba(root.fills?.find((paint) => paint.visible !== false && paint.type === "SOLID")) ?? "transparent",
      ...(stroke(root) ? { stroke: stroke(root) } : {}),
      ...(effects(root).length ? { effects: effects(root) } : {}),
      ...(blendMode(root) ? { blendMode: blendMode(root) } : {}),
      nodes: [...(rootBackground ? [rootBackground] : []), ...(root.children ?? []).filter((child) => child.visible !== false).map((child) => relativeNode(child, rootBox, assets))],
    };
    await writeFile(path.join(temporary, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
    await mkdir(projectRoot, { recursive: true });
    const backup = `${destination}.${process.pid}.backup`;
    let hasBackup = false;
    try {
      await rename(destination, backup);
      hasBackup = true;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    try {
      await rename(temporary, destination);
    } catch (error) {
      if (hasBackup) await rename(backup, destination).catch(() => {});
      throw error;
    }
    if (hasBackup) await rm(backup, { recursive: true, force: true }).catch(() => {});
    return manifest;
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
}
