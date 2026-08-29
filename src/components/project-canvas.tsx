import Image from "next/image";
import type { ProjectImage, ProjectSectionBlock } from "../lib/project-contract";
import styles from "./project-canvas.module.css";

type ProjectImageBlock = Extract<ProjectSectionBlock, { type: "image" }>;

type ProjectCanvasProps = Pick<ProjectImageBlock, "presentation" | "images">;

function ProjectImageAsset({ image, className, sizes }: { image: ProjectImage; className?: string; sizes: string }) {
  return (
    <Image
      className={className}
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      unoptimized
    />
  );
}

export function ProjectCanvas({ presentation, images }: ProjectCanvasProps) {
  if (presentation === "quotes") {
    return (
      <figure className={`${styles.canvas} ${styles.quotes}`}>
        <ProjectImageAsset image={images[0]} className={styles.quotesAsset} sizes="852px" />
      </figure>
    );
  }

  if (presentation === "process") {
    return (
      <figure className={`${styles.canvas} ${styles.process}`}>
        <ProjectImageAsset image={images[0]} className={styles.processAsset} sizes="906px" />
      </figure>
    );
  }

  if (presentation === "controls") {
    return (
      <figure className={`${styles.canvas} ${styles.controls}`}>
        <ProjectImageAsset image={images[0]} className={styles.buttonsAsset} sizes="428px" />
        <span className={styles.controlsDivider} aria-hidden="true" />
        <ProjectImageAsset image={images[1]} className={styles.inputsAsset} sizes="531px" />
      </figure>
    );
  }

  const image = images[0];
  return (
    <figure className={`${styles.canvas} ${styles.single}`}>
      <Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="1000px" />
    </figure>
  );
}
