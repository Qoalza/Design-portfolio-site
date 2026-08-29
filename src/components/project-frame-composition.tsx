import type { CSSProperties } from "react";
import type { ProjectFrameComposition, ProjectFrameNode } from "../lib/project-contract";
import styles from "./project-frame-composition.module.css";

/* eslint-disable @next/next/no-img-element -- imported frame leaves have dynamic SVG/raster geometry and are locally snapshotted */

type FrameStyle = CSSProperties & { [key: `--${string}`]: string | number };

function percent(value: number) { return `${Number(value.toFixed(6))}%`; }

function scaledLength(value: number, rootWidth: number, rootHeight: number) {
  const magnitude = Math.abs(value);
  const length = `min(${Number((magnitude / rootWidth * 100).toFixed(6))}cqw, ${Number((magnitude / rootHeight * 100).toFixed(6))}cqh)`;
  return value < 0 ? `calc(0px - ${length})` : length;
}

function positionedStyle(node: ProjectFrameNode, parentWidth: number, parentHeight: number, rootWidth: number, rootHeight: number): CSSProperties {
  const style: CSSProperties = {
    position: "absolute",
    opacity: node.opacity,
  };
  const transforms: string[] = [];
  const horizontal = node.constraints.horizontal;
  const vertical = node.constraints.vertical;
  if (horizontal === "SCALE") {
    style.left = percent(node.x / parentWidth * 100);
    style.width = percent(node.width / parentWidth * 100);
  } else if (horizontal === "STRETCH") {
    style.left = scaledLength(node.x, rootWidth, rootHeight);
    style.right = scaledLength(parentWidth - node.x - node.width, rootWidth, rootHeight);
  } else {
    style.width = scaledLength(node.width, rootWidth, rootHeight);
  }
  if (horizontal === "MAX") style.right = scaledLength(parentWidth - node.x - node.width, rootWidth, rootHeight);
  else if (horizontal === "CENTER") {
    style.left = `calc(50% + ${scaledLength(node.x + node.width / 2 - parentWidth / 2, rootWidth, rootHeight)})`;
    transforms.push("translateX(-50%)");
  }
  else if (horizontal === "MIN") style.left = scaledLength(node.x, rootWidth, rootHeight);

  if (vertical === "SCALE") {
    style.top = percent(node.y / parentHeight * 100);
    style.height = percent(node.height / parentHeight * 100);
  } else if (vertical === "STRETCH") {
    style.top = scaledLength(node.y, rootWidth, rootHeight);
    style.bottom = scaledLength(parentHeight - node.y - node.height, rootWidth, rootHeight);
  } else {
    style.height = scaledLength(node.height, rootWidth, rootHeight);
  }
  if (vertical === "MAX") style.bottom = scaledLength(parentHeight - node.y - node.height, rootWidth, rootHeight);
  else if (vertical === "CENTER") {
    style.top = `calc(50% + ${scaledLength(node.y + node.height / 2 - parentHeight / 2, rootWidth, rootHeight)})`;
    transforms.push("translateY(-50%)");
  }
  else if (vertical === "MIN") style.top = scaledLength(node.y, rootWidth, rootHeight);
  if (node.rotation) transforms.push(`rotate(${node.rotation}deg)`);
  if (transforms.length) style.transform = transforms.join(" ");
  return style;
}

function rootWidthUnit(value: number, rootWidth: number) { return `${Number((value / rootWidth * 100).toFixed(6))}cqw`; }
function rootHeightUnit(value: number, rootHeight: number) { return `${Number((value / rootHeight * 100).toFixed(6))}cqh`; }
function strokeShadow(stroke: ProjectFrameNode["stroke"], rootWidth: number) {
  if (!stroke) return undefined;
  if (stroke.align === "INSIDE") return `inset 0 0 0 ${rootWidthUnit(stroke.width, rootWidth)} ${stroke.color}`;
  if (stroke.align === "OUTSIDE") return `0 0 0 ${rootWidthUnit(stroke.width, rootWidth)} ${stroke.color}`;
  const half = rootWidthUnit(stroke.width / 2, rootWidth);
  return `inset 0 0 0 ${half} ${stroke.color}, 0 0 0 ${half} ${stroke.color}`;
}

function effectStyle(effects: ProjectFrameNode["effects"], rootWidth: number, rootHeight: number) {
  const shadows: string[] = [];
  const filters: string[] = [];
  let backdropFilter: string | undefined;
  for (const effect of effects ?? []) {
    if (effect.type === "drop-shadow" || effect.type === "inner-shadow") {
      shadows.push(`${effect.type === "inner-shadow" ? "inset " : ""}${rootWidthUnit(effect.offsetX, rootWidth)} ${rootHeightUnit(effect.offsetY, rootHeight)} ${rootWidthUnit(effect.blur, rootWidth)} ${rootWidthUnit(effect.spread, rootWidth)} ${effect.color}`);
    } else if (effect.type === "layer-blur") filters.push(`blur(${rootWidthUnit(effect.radius, rootWidth)})`);
    else if (effect.type === "background-blur") backdropFilter = `blur(${rootWidthUnit(effect.radius, rootWidth)})`;
  }
  return { shadows, filter: filters.length ? filters.join(" ") : undefined, backdropFilter };
}

function FrameNodeView({ node, parentWidth, parentHeight, rootWidth, rootHeight, inLayout = false }: { node: ProjectFrameNode; parentWidth: number; parentHeight: number; rootWidth: number; rootHeight: number; inLayout?: boolean }) {
  const style: CSSProperties = inLayout ? {
    position: "relative", width: percent(node.width / parentWidth * 100), height: percent(node.height / parentHeight * 100), flex: node.layoutGrow ? `${node.layoutGrow} 1 0` : node.constraints.horizontal === "STRETCH" ? "1 1 auto" : "0 0 auto",
  } : positionedStyle(node, parentWidth, parentHeight, rootWidth, rootHeight);
  // Direct-child PNG snapshots may include visual bleed (for example a
  // centered stroke) beyond the Figma layout box. The PNG already contains
  // the child's clipping result, so clipping it again here would cut that
  // border in half.
  style.overflow = node.asset?.bounds ? "visible" : node.clip ? "hidden" : "visible";
  style.borderRadius = node.radius === undefined ? undefined : rootWidthUnit(node.radius, rootWidth);
  style.background = node.background;
  const visualEffects = effectStyle(node.effects, rootWidth, rootHeight);
  style.boxShadow = [strokeShadow(node.stroke, rootWidth), ...visualEffects.shadows].filter(Boolean).join(", ") || undefined;
  style.filter = visualEffects.filter;
  style.backdropFilter = visualEffects.backdropFilter;
  style.mixBlendMode = node.blendMode as CSSProperties["mixBlendMode"];
  style.zIndex = node.zIndex;
  if (inLayout && node.layoutAlign) style.alignSelf = node.layoutAlign === "start" ? "flex-start" : node.layoutAlign === "end" ? "flex-end" : node.layoutAlign;
  if (node.layout) {
    style.display = "flex";
    style.flexDirection = node.layout.direction === "horizontal" ? "row" : "column";
    style.gap = node.layout.direction === "horizontal" ? rootWidthUnit(node.layout.gap, rootWidth) : rootHeightUnit(node.layout.gap, rootHeight);
    const [top, right, bottom, left] = node.layout.padding;
    style.padding = `${rootHeightUnit(top, rootHeight)} ${rootWidthUnit(right, rootWidth)} ${rootHeightUnit(bottom, rootHeight)} ${rootWidthUnit(left, rootWidth)}`;
    style.justifyContent = node.layout.align === "space-between" ? "space-between" : node.layout.align === "end" ? "flex-end" : node.layout.align;
    style.alignItems = node.layout.crossAlign === "end" ? "flex-end" : node.layout.crossAlign === "start" || node.layout.crossAlign === undefined ? "flex-start" : node.layout.crossAlign;
  }
  const assetStyle: CSSProperties | undefined = node.asset ? node.asset.bounds ? {
    position: "absolute",
    left: percent(node.asset.bounds.x / node.width * 100),
    top: percent(node.asset.bounds.y / node.height * 100),
    width: percent(node.asset.bounds.width / node.width * 100),
    height: percent(node.asset.bounds.height / node.height * 100),
    objectFit: node.asset.fit,
    opacity: node.asset.opacity,
  } : { objectFit: node.asset.fit, opacity: node.asset.opacity } : undefined;
  return <div className={`${styles.node} ${node.layout ? styles.layout : ""}`} style={style} data-frame-node={node.name}>
    {node.asset ? <img className={styles.asset} src={node.asset.src} alt="" style={assetStyle} /> : null}
    {node.children?.map((child) => <FrameNodeView key={child.id} node={child} parentWidth={node.width} parentHeight={node.height} rootWidth={rootWidth} rootHeight={rootHeight} inLayout={Boolean(node.layout) && !child.absoluteInLayout} />)}
  </div>;
}

export function ProjectFrameCompositionView({ composition, className = "", fillSlot = false }: { composition: ProjectFrameComposition; className?: string; fillSlot?: boolean }) {
  const visualEffects = effectStyle(composition.effects, composition.width, composition.height);
  const rootStyle: FrameStyle = {
    aspectRatio: `${composition.width} / ${composition.height}`,
    overflow: composition.clip ? "hidden" : "visible",
    "--frame-background": composition.background,
    "--frame-radius": rootWidthUnit(composition.radius, composition.width),
    boxShadow: [strokeShadow(composition.stroke, composition.width), ...visualEffects.shadows].filter(Boolean).join(", ") || undefined,
    filter: visualEffects.filter,
    backdropFilter: visualEffects.backdropFilter,
    mixBlendMode: composition.blendMode as CSSProperties["mixBlendMode"],
  };
  return <div className={`${styles.composition} ${fillSlot ? styles.fillSlot : ""} ${className}`} style={rootStyle} data-project-frame>
    {composition.nodes.map((node) => <FrameNodeView key={node.id} node={node} parentWidth={composition.width} parentHeight={composition.height} rootWidth={composition.width} rootHeight={composition.height} />)}
  </div>;
}
