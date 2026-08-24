"use client";

import { useState, type CSSProperties } from "react";
import { getGalleryTarget, type StepDirection } from "../lib/main-chapter-interactions";
import { ProjectMediaLightbox } from "./project-media-lightbox";
import { SquareButton } from "./ui-controls";
import styles from "./project-gallery.module.css";

export type ProjectGalleryItem = {
  src: string;
  alt: string;
  width: number;
  height: number;
  fit?: "cover" | "contain";
};

type ProjectGalleryProps = {
  items: ProjectGalleryItem[];
  variant?: "standard" | "result";
};

export function ProjectGallery({ items, variant = "standard" }: ProjectGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemCount = items.length;
  const previous = getGalleryTarget(activeIndex, -1, itemCount);
  const next = getGalleryTarget(activeIndex, 1, itemCount);

  if (itemCount === 0) {
    return null;
  }

  const move = (direction: StepDirection) => {
    const target = getGalleryTarget(activeIndex, direction, itemCount);

    if (!target.available) {
      return;
    }

    setActiveIndex(target.index);
  };

  const trackStyle = {
    "--gallery-index": activeIndex,
  } as CSSProperties;

  return (
    <div className={`${styles.gallery} ${styles[variant]}`} data-gallery-count={itemCount} data-gallery-index={activeIndex}>
      {itemCount > 1 ? (
        <div className={styles.controls}>
          <SquareButton
            kind="button"
            className={styles.arrow}
            variant="ghost"
            size="small"
            disabled={!previous.available}
            onClick={() => move(-1)}
            ariaLabel="Предыдущее изображение"
            icon="/assets/projects/chevron-left.svg"
          />
          <SquareButton
            kind="button"
            className={styles.arrow}
            variant="ghost"
            size="small"
            disabled={!next.available}
            onClick={() => move(1)}
            ariaLabel="Следующее изображение"
            icon="/assets/projects/chevron-right.svg"
          />
        </div>
      ) : null}
      <div className={styles.viewport}>
        <div className={styles.track} style={trackStyle}>
          {items.map((item, index) => (
            <figure className={styles.slide} key={`${item.src}-${index}`}>
              <ProjectMediaLightbox {...item} />
            </figure>
          ))}
        </div>
      </div>

      {itemCount > 1 ? (
        <>
          <div className={`${styles.edgeFade} ${styles.edgeFadeLeft} ${previous.available ? styles.visible : ""}`} aria-hidden="true" />
          <div className={`${styles.edgeFade} ${styles.edgeFadeRight} ${next.available ? styles.visible : ""}`} aria-hidden="true" />
          <span className="visually-hidden" aria-live="polite">Изображение {activeIndex + 1} из {itemCount}</span>
        </>
      ) : null}
    </div>
  );
}
