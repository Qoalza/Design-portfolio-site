import type { CSSProperties } from "react";
import type { ProjectFrameComposition, ProjectFrameNode } from "../lib/project-contract";
import styles from "./project-frame-composition.module.css";

/* eslint-disable @next/next/no-img-element -- imported frame leaves have dynamic SVG/raster geometry and are locally snapshotted */

type FrameStyle = CSSProperties & { [key: `--${string}`]: string | number };

function percent(value: number) { return `${Number(value.toFixed(6))}%`; }

function positionedStyle(node: ProjectFrameNode, parentWidth: number, parentHeight: number): CSSProperties {
  const style: CSSProperties = {
    position: "absolute",
    width: percent(node.width / parentWidth * 100),
    height: percent(node.height / parentHeight * 100),
    opacity: node.opacity,
  };
  const transforms: string[] = [];
  const horizontal = node.constraints.horizontal;
  const vertical = node.constraints.vertical;
  if (horizontal === "MAX") style.right = percent((parentWidth - node.x - node.width) / parentWidth * 100);
  else if (horizontal === "CENTER") {
    style.left = `calc(50% + ${percent((node.x + node.width / 2 - parentWidth / 2) / parentWidth * 100)})`;
    transforms.push("translateX(-50%)");
  }
  else if (horizontal === "STRETCH") { style.left = percent(node.x / parentWidth * 100); style.right = percent((parentWidth - node.x - node.width) / parentWidth * 100); delete style.width; }
  else style.left = percent(node.x / parentWidth * 100);
  if (vertical === "MAX") style.bottom = percent((parentHeight - node.y - node.height) / parentHeight * 100);
  else if (vertical === "CENTER") {
    style.top = `calc(50% + ${percent((node.y + node.height / 2 - parentHeight / 2) / parentHeight * 100)})`;
    transforms.push("translateY(-50%)");
  }
  else if (vertical === "STRETCH") { style.top = percent(node.y / parentHeight * 100); style.bottom = percent((parentHeight - node.y - node.height) / parentHeight * 100); delete style.height; }
  else style.top = percent(node.y / parentHeight * 100);
  if (node.rotation) transforms.push(`rotate(${node.rotation}deg)`);
  if (transforms.length) style.transform = transforms.join(" ");
  return style;
}

function FrameNodeView({ node, parentWidth, parentHeight, inLayout = false }: { node: ProjectFrameNode; parentWidth: number; parentHeight: number; inLayout?: boolean }) {
  const style: CSSProperties = inLayout ? {
    position: "relative", width: percent(node.width / parentWidth * 100), height: percent(node.height / parentHeight * 100), flex: node.constraints.horizontal === "STRETCH" ? "1 1 auto" : "0 0 auto",
  } : positionedStyle(node, parentWidth, parentHeight);
  style.overflow = node.clip ? "hidden" : "visible";
  style.borderRadius = node.radius;
  style.background = node.background;
  if (node.layout) {
    style.display = "flex";
    style.flexDirection = node.layout.direction === "horizontal" ? "row" : "column";
    style.gap = percent(node.layout.gap / (node.layout.direction === "horizontal" ? node.width : node.height) * 100);
    const [top, right, bottom, left] = node.layout.padding;
    style.padding = `${percent(top / node.height * 100)} ${percent(right / node.width * 100)} ${percent(bottom / node.height * 100)} ${percent(left / node.width * 100)}`;
    style.justifyContent = node.layout.align === "space-between" ? "space-between" : node.layout.align === "end" ? "flex-end" : node.layout.align;
  }
  return <div className={`${styles.node} ${node.layout ? styles.layout : ""}`} style={style} data-frame-node={node.name}>
    {node.asset ? <img className={styles.asset} src={node.asset.src} alt="" style={{ objectFit: node.asset.fit }} /> : null}
    {node.children?.map((child) => <FrameNodeView key={child.id} node={child} parentWidth={node.width} parentHeight={node.height} inLayout={Boolean(node.layout)} />)}
  </div>;
}

export function ProjectFrameCompositionView({ composition, className = "", fillSlot = false }: { composition: ProjectFrameComposition; className?: string; fillSlot?: boolean }) {
  const rootStyle: FrameStyle = {
    aspectRatio: `${composition.width} / ${composition.height}`,
    overflow: composition.clip ? "hidden" : "visible",
    "--frame-background": composition.background,
    "--frame-radius": `${composition.radius}px`,
  };
  return <div className={`${styles.composition} ${fillSlot ? styles.fillSlot : ""} ${className}`} style={rootStyle} data-project-frame>
    {composition.nodes.map((node) => <FrameNodeView key={node.id} node={node} parentWidth={composition.width} parentHeight={composition.height} />)}
  </div>;
}
