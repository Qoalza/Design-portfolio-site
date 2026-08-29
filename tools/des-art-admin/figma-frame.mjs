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
  }
  else if (horizontal === "MIN") style.left = scaledLength(node.x, rootWidth, rootHeight);
  if (vertical === "SCALE") { style.top = percent(node.y / parentHeight * 100); style.height = percent(node.height / parentHeight * 100); }
  else if (vertical === "STRETCH") { style.top = scaledLength(node.y, rootWidth, rootHeight); style.bottom = scaledLength(parentHeight - node.y - node.height, rootWidth, rootHeight); }
  else style.height = scaledLength(node.height, rootWidth, rootHeight);
  if (vertical === "MAX") style.bottom = scaledLength(parentHeight - node.y - node.height, rootWidth, rootHeight);
  else if (vertical === "CENTER") {
    style.top = `calc(50% + ${scaledLength(node.y + node.height / 2 - parentHeight / 2, rootWidth, rootHeight)})`;
    style.transform = `${style.transform ?? ""} translateY(-50%)`.trim();
  }
  else if (vertical === "MIN") style.top = scaledLength(node.y, rootWidth, rootHeight);
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
  throw new Error(`У слоя «${node.name ?? node.id}» есть эффект, отличный от тени. Добавьте его в готовое PNG и повторите импорт.`);
});

function box(node) {
  return node.absoluteBoundingBox ?? node.absoluteRenderBounds;
}

function collectVisualUnits(root) {
  return (root.children ?? []).filter((child) => child.visible !== false);
}

function imageFill(node) {
  return node.fills?.find((paint) => paint.visible !== false && paint.type === "IMAGE" && paint.imageRef);
}

function validateContainerVisuals(node) {
  const visibleFills = (node.fills ?? []).filter((paint) => paint.visible !== false && (paint.opacity ?? 1) > 0);
  const unsupportedFill = visibleFills.find((paint) => !["SOLID", "IMAGE"].includes(paint.type));
  if (unsupportedFill) throw new Error(`Слой «${node.name ?? node.id}» использует неподдерживаемый fill ${unsupportedFill.type}.`);
  if (visibleFills.filter((paint) => paint.type === "SOLID").length > 1 || visibleFills.filter((paint) => paint.type === "IMAGE").length > 1) throw new Error(`Слой «${node.name ?? node.id}» содержит несколько одинаковых fills, которые нельзя воспроизвести без потерь.`);
  if (node.rectangleCornerRadii && new Set(node.rectangleCornerRadii).size > 1) throw new Error(`Слой «${node.name ?? node.id}» использует разные радиусы углов, которые пока не поддерживаются.`);
  if ((node.cornerSmoothing ?? 0) !== 0) throw new Error(`Слой «${node.name ?? node.id}» использует corner smoothing, который пока не поддерживается.`);
  if (node.layoutMode === "GRID" || node.layoutWrap === "WRAP") throw new Error(`Слой «${node.name ?? node.id}» использует неподдерживаемый режим Auto Layout.`);
  effects(node);
  blendMode(node);
}

function rasterExtension(contentType) {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("gif")) return "gif";
  return "jpg";
}

function pngDimensions(buffer) {
  if (buffer.length < 24 || buffer[0] !== 137 || buffer[1] !== 80 || buffer[2] !== 78 || buffer[3] !== 71) return undefined;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return width > 0 && height > 0 ? { width, height } : undefined;
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

function relativeNode(node, parentBox, assetMap, snapshotIds = new Set()) {
  const bounds = box(node);
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) throw new Error(`Слой «${node.name ?? node.id}» не имеет пригодной геометрии.`);
  const constraints = node.constraints ?? { horizontal: "MIN", vertical: "MIN" };
  const compoundAsset = snapshotIds.has(node.id);
  const rasterAsset = Boolean(imageFill(node));
  const visibleChildren = node.children?.filter((child) => child.visible !== false) ?? [];
  const children = compoundAsset ? undefined : visibleChildren.map((child, index) => ({
    ...relativeNode(child, bounds, assetMap, snapshotIds),
    ...(node.itemReverseZIndex ? { zIndex: visibleChildren.length - index } : {}),
  }));
  const isContainer = Boolean(children?.length);
  if (isContainer || (rasterAsset && !compoundAsset)) validateContainerVisuals(node);
  const layoutMode = !compoundAsset && (node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL") ? node.layoutMode : undefined;
  const backgroundAsset = isContainer && imageFill(node) ? assetMap.get(node.id) : undefined;
  const renderedChildren = backgroundAsset ? [{
    id: `${node.id}:background`, name: `${node.name || node.id} background`, type: "asset",
    x: 0, y: 0, width: bounds.width, height: bounds.height, opacity: imageFill(node).opacity ?? 1, rotation: 0,
    constraints: { horizontal: "STRETCH", vertical: "STRETCH" }, clip: true, asset: backgroundAsset,
  }, ...children] : children;
  const nodeEffects = isContainer || rasterAsset || compoundAsset ? effects(node) : undefined;
  const nodeBlendMode = blendMode(node);
  return {
    id: node.id,
    name: node.name || node.id,
    type: isContainer ? "container" : "asset",
    x: bounds.x - parentBox.x,
    y: bounds.y - parentBox.y,
    width: bounds.width,
    height: bounds.height,
    opacity: compoundAsset ? 1 : node.opacity ?? 1,
    rotation: compoundAsset ? 0 : node.rotation ?? 0,
    constraints: {
      horizontal: ["MIN", "MAX", "CENTER", "STRETCH", "SCALE"].includes(constraints.horizontal) ? constraints.horizontal : "MIN",
      vertical: ["MIN", "MAX", "CENTER", "STRETCH", "SCALE"].includes(constraints.vertical) ? constraints.vertical : "MIN",
    },
    ...(node.clipsContent === undefined ? {} : { clip: Boolean(node.clipsContent) }),
    ...(!compoundAsset && node.cornerRadius !== undefined ? { radius: node.cornerRadius } : {}),
    ...(!compoundAsset && (isContainer || rasterAsset) && rgba(node.fills?.find((paint) => paint.visible !== false && paint.type === "SOLID")) ? { background: rgba(node.fills.find((paint) => paint.visible !== false && paint.type === "SOLID")) } : {}),
    ...(nodeEffects?.length ? { effects: nodeEffects } : {}),
    ...(nodeBlendMode ? { blendMode: nodeBlendMode } : {}),
    ...(!compoundAsset && node.layoutPositioning === "ABSOLUTE" ? { absoluteInLayout: true } : {}),
    ...(!compoundAsset && typeof node.layoutGrow === "number" && node.layoutGrow > 0 ? { layoutGrow: node.layoutGrow } : {}),
    ...(!compoundAsset && node.layoutAlign && node.layoutAlign !== "INHERIT" ? { layoutAlign: node.layoutAlign === "STRETCH" ? "stretch" : node.layoutAlign === "CENTER" ? "center" : node.layoutAlign === "MAX" ? "end" : "start" } : {}),
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
  const visualUnits = collectVisualUnits(root);
  const rootRasterFill = imageFill(root);
  const fillNodes = [...(rootRasterFill ? [root] : []), ...visualUnits.filter((unit) => imageFill(unit))];
  const unitIds = visualUnits.filter((unit) => !imageFill(unit)).map((unit) => unit.id);
  const exports = unitIds.length ? await figmaJson(fetchImpl, `https://api.figma.com/v1/images/${encodeURIComponent(fileKey)}?ids=${unitIds.map(encodeURIComponent).join(",")}&format=png&scale=2&use_absolute_bounds=true`, auth) : { images: {} };
  const fills = fillNodes.length ? await figmaJson(fetchImpl, `https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}/images`, auth) : { meta: { images: {} } };
  const version = String(nodeData.version ?? entry.version ?? createHash("sha256").update(JSON.stringify(root)).digest("hex").slice(0, 12));
  const folderName = `${slot}-${createHash("sha256").update(`${fileKey}:${nodeId}:${version}`).digest("hex").slice(0, 12)}`;
  const projectRoot = path.join(assetRoot, slug, "frames");
  const temporary = path.join(projectRoot, `.${folderName}.${process.pid}.tmp`);
  const destination = path.join(projectRoot, folderName);
  const assets = new Map();
  await mkdir(temporary, { recursive: true });
  try {
    for (const unit of visualUnits) {
      const fill = imageFill(unit);
      if (fill) {
        const download = fills.meta?.images?.[fill.imageRef];
        if (!download) throw new Error(`Figma не вернула исходное изображение элемента «${unit.name ?? unit.id}».`);
        const response = await fetchImpl(download);
        if (!response.ok) throw new Error(`Не удалось скачать исходное изображение элемента «${unit.name ?? unit.id}».`);
        const extension = rasterExtension(response.headers?.get?.("content-type"));
        const name = `${createHash("sha256").update(unit.id).digest("hex").slice(0, 10)}.${extension}`;
        await writeFile(path.join(temporary, name), Buffer.from(await response.arrayBuffer()), { mode: 0o600 });
        assets.set(unit.id, {
          src: `/assets/projects/${slug}/frames/${folderName}/${name}`,
          format: "raster",
          fit: "contain",
          ...(fill.opacity === undefined ? {} : { opacity: fill.opacity }),
        });
        continue;
      }
      const download = exports.images?.[unit.id];
      if (!download) throw new Error(`Figma не смогла экспортировать элемент «${unit.name ?? unit.id}».`);
      const response = await fetchImpl(download);
      if (!response.ok) throw new Error(`Не удалось скачать элемент «${unit.name ?? unit.id}».`);
      const name = `${createHash("sha256").update(unit.id).digest("hex").slice(0, 10)}@2x.png`;
      const bytes = Buffer.from(await response.arrayBuffer());
      await writeFile(path.join(temporary, name), bytes, { mode: 0o600 });
      const dimensions = pngDimensions(bytes);
      const unitBox = box(unit);
      const renderedWidth = dimensions ? dimensions.width / 2 : unitBox.width;
      const renderedHeight = dimensions ? dimensions.height / 2 : unitBox.height;
      const bleedX = Math.max(0, (renderedWidth - unitBox.width) / 2);
      const bleedY = Math.max(0, (renderedHeight - unitBox.height) / 2);
      assets.set(unit.id, {
        src: `/assets/projects/${slug}/frames/${folderName}/${name}`, format: "raster", fit: "fill",
        ...(bleedX || bleedY ? { bounds: { x: -bleedX, y: -bleedY, width: renderedWidth, height: renderedHeight } } : {}),
      });
    }
    for (const leaf of rootRasterFill ? [root] : []) {
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
      ...(effects(root).length ? { effects: effects(root) } : {}),
      ...(blendMode(root) ? { blendMode: blendMode(root) } : {}),
      nodes: [...(rootBackground ? [rootBackground] : []), ...visualUnits.map((child) => relativeNode(child, rootBox, assets, new Set(unitIds)))],
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
