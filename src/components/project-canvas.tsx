import Image from "next/image";
import type { ProjectImage, ProjectVisualInstance } from "../lib/project-contract";
import styles from "./project-canvas.module.css";

function asset(visual: ProjectVisualInstance, slot: string): ProjectImage {
  const value = visual.assets[slot]?.[0];
  if (!value) throw new Error(`${visual.templateId} is missing required asset slot ${slot}.`);
  return value;
}

function ProjectImageAsset({ image, className, sizes }: { image: ProjectImage; className?: string; sizes: string }) {
  return <Image className={className} src={image.src} alt={image.alt} width={image.width} height={image.height} sizes={sizes} unoptimized />;
}

export function ProjectCanvas({ visual }: { visual: ProjectVisualInstance }) {
  if (visual.templateId === "canvas.corvo-quotes") {
    return <figure className={`${styles.canvas} ${styles.quotes}`}><ProjectImageAsset image={asset(visual, "content")} className={styles.quotesAsset} sizes="852px" /></figure>;
  }
  if (visual.templateId === "canvas.corvo-process") {
    return <figure className={`${styles.canvas} ${styles.process}`}><ProjectImageAsset image={asset(visual, "content")} className={styles.processAsset} sizes="906px" /></figure>;
  }
  if (visual.templateId === "canvas.corvo-controls") {
    return (
      <figure className={`${styles.canvas} ${styles.controls}`}>
        <ProjectImageAsset image={asset(visual, "buttons")} className={styles.buttonsAsset} sizes="428px" />
        <span className={styles.controlsDivider} aria-hidden="true" />
        <ProjectImageAsset image={asset(visual, "inputs")} className={styles.inputsAsset} sizes="531px" />
      </figure>
    );
  }
  if (visual.templateId === "canvas.sarafan-model") {
    return <figure className={`${styles.canvas} ${styles.sarafanModel}`}><ProjectImageAsset image={asset(visual, "content")} className={styles.sarafanModelAsset} sizes="760px" /></figure>;
  }
  if (visual.templateId === "canvas.sarafan-scenarios") {
    const content = asset(visual, "content");
    const legacy = content.width === 1722 && content.height === 699;
    return <figure className={`${styles.canvas} ${styles.sarafanScenarios}`}><ProjectImageAsset image={content} className={legacy ? styles.sarafanScenariosLegacyAsset : styles.sarafanScenariosAsset} sizes={legacy ? "861px" : "760px"} /></figure>;
  }
  if (visual.templateId === "canvas.sarafan-setup") {
    return (
      <figure className={`${styles.canvas} ${styles.sarafanSetup}`}>
        <ProjectImageAsset image={asset(visual, "desktop")} className={styles.sarafanSetupDesktop} sizes="603px" />
        <ProjectImageAsset image={asset(visual, "panel")} className={styles.sarafanSetupPanel} sizes="464px" />
      </figure>
    );
  }
  throw new Error(`${visual.templateId} is not a section canvas template.`);
}
