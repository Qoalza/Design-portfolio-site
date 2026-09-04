import type { CSSProperties } from "react";
import type { ProjectFrameComposition, ProjectFrameEffect, ProjectFrameNode } from "../lib/project-contract";
import styles from "./project-frame-composition.module.css";

/* eslint-disable @next/next/no-img-element -- Figma frame assets have dynamic geometry and are local snapshots */

type FrameStyle = CSSProperties & { [key: `--${string}`]: string | number };

const percent = (value: number) => `${Number(value.toFixed(6))}%`;
const scaledLength = (value: number, rootWidth: number, rootHeight: number) => {
  const magnitude = Math.abs(value);
  const length = `min(${Number((magnitude / rootWidth * 100).toFixed(6))}cqw, ${Number((magnitude / rootHeight * 100).toFixed(6))}cqh)`;
  return value < 0 ? `calc(0px - ${length})` : length;
};
const rootWidthUnit = (value: number, rootWidth: number) => `${Number((value / rootWidth * 100).toFixed(6))}cqw`;
const rootHeightUnit = (value: number, rootHeight: number) => `${Number((value / rootHeight * 100).toFixed(6))}cqh`;

function effectStyle(effects: ProjectFrameEffect[] | undefined, rootWidth: number, rootHeight: number) {
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

function positionedStyle(node: ProjectFrameNode, composition: ProjectFrameComposition): CSSProperties {
  const style: CSSProperties = { position: "absolute", opacity: node.opacity };
  const transforms: string[] = [];
  const { width: rootWidth, height: rootHeight } = composition;
  if (node.constraints.horizontal === "SCALE") { style.left = percent(node.x / rootWidth * 100); style.width = percent(node.width / rootWidth * 100); }
  else if (node.constraints.horizontal === "STRETCH") { style.left = scaledLength(node.x, rootWidth, rootHeight); style.right = scaledLength(rootWidth - node.x - node.width, rootWidth, rootHeight); }
  else style.width = scaledLength(node.width, rootWidth, rootHeight);
  if (node.constraints.horizontal === "MAX") style.right = scaledLength(rootWidth - node.x - node.width, rootWidth, rootHeight);
  else if (node.constraints.horizontal === "CENTER") { style.left = `calc(50% + ${scaledLength(node.x + node.width / 2 - rootWidth / 2, rootWidth, rootHeight)})`; transforms.push("translateX(-50%)"); }
  else if (node.constraints.horizontal === "MIN") style.left = scaledLength(node.x, rootWidth, rootHeight);
  if (node.constraints.vertical === "SCALE") { style.top = percent(node.y / rootHeight * 100); style.height = percent(node.height / rootHeight * 100); }
  else if (node.constraints.vertical === "STRETCH") { style.top = scaledLength(node.y, rootWidth, rootHeight); style.bottom = scaledLength(rootHeight - node.y - node.height, rootWidth, rootHeight); }
  else style.height = scaledLength(node.height, rootWidth, rootHeight);
  if (node.constraints.vertical === "MAX") style.bottom = scaledLength(rootHeight - node.y - node.height, rootWidth, rootHeight);
  else if (node.constraints.vertical === "CENTER") { style.top = `calc(50% + ${scaledLength(node.y + node.height / 2 - rootHeight / 2, rootWidth, rootHeight)})`; transforms.push("translateY(-50%)"); }
  else if (node.constraints.vertical === "MIN") style.top = scaledLength(node.y, rootWidth, rootHeight);
  if (node.rotation) transforms.push(`rotate(${node.rotation}deg)`);
  if (transforms.length) style.transform = transforms.join(" ");
  style.overflow = node.asset.bounds ? "visible" : node.clip ? "hidden" : "visible";
  style.borderRadius = node.radius === undefined ? undefined : rootWidthUnit(node.radius, rootWidth);
  const visualEffects = effectStyle(node.effects, rootWidth, rootHeight);
  style.boxShadow = visualEffects.shadows.join(", ") || undefined;
  style.filter = visualEffects.filter;
  style.backdropFilter = visualEffects.backdropFilter;
  style.mixBlendMode = node.blendMode as CSSProperties["mixBlendMode"];
  return style;
}

function FrameNodeView({ node, composition }: { node: ProjectFrameNode; composition: ProjectFrameComposition }) {
  const assetStyle: CSSProperties = node.asset.bounds ? {
    position: "absolute",
    left: percent(node.asset.bounds.x / node.width * 100),
    top: percent(node.asset.bounds.y / node.height * 100),
    width: percent(node.asset.bounds.width / node.width * 100),
    height: percent(node.asset.bounds.height / node.height * 100),
    objectFit: node.asset.fit,
    opacity: node.asset.opacity,
  } : { objectFit: node.asset.fit, opacity: node.asset.opacity };
  return <div className={styles.node} style={positionedStyle(node, composition)} data-frame-node={node.name}><img className={styles.asset} src={node.asset.src} alt="" style={assetStyle} /></div>;
}

export function ProjectFrameCompositionView({ composition, className = "", fillSlot = false, slotRadius }: { composition: ProjectFrameComposition; className?: string; fillSlot?: boolean; slotRadius?: number }) {
  const visualEffects = effectStyle(composition.effects, composition.width, composition.height);
  const rootStyle: FrameStyle = {
    aspectRatio: `${composition.width} / ${composition.height}`,
    overflow: composition.clip ? "hidden" : "visible",
    "--frame-background": composition.background,
    "--frame-radius": slotRadius === undefined ? rootWidthUnit(composition.radius, composition.width) : `${slotRadius}px`,
    boxShadow: visualEffects.shadows.join(", ") || undefined,
    filter: visualEffects.filter,
    backdropFilter: visualEffects.backdropFilter,
    mixBlendMode: composition.blendMode as CSSProperties["mixBlendMode"],
  };
  return <div className={`${styles.composition} ${fillSlot ? styles.fillSlot : ""} ${className}`} style={rootStyle} data-project-frame>{composition.nodes.map((node) => <FrameNodeView key={node.id} node={node} composition={composition} />)}</div>;
}
