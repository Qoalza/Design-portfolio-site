"use client";

import { useRef, useState } from "react";
import { getGalleryTarget, type StepDirection } from "../lib/main-chapter-interactions";
import { ProjectMediaLightbox } from "./project-media-lightbox";
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
  const viewportRef = useRef<HTMLDivElement>(null);
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
    viewportRef.current?.scrollTo({
      left: target.index * viewportRef.current.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className={`${styles.gallery} ${styles[variant]}`} data-gallery-count={itemCount} data-gallery-index={activeIndex}>
      <div
        ref={viewportRef}
        className={styles.viewport}
        onScroll={(event) => {
          const width = event.currentTarget.clientWidth;
          if (width > 0) {
            setActiveIndex(Math.round(event.currentTarget.scrollLeft / width));
          }
        }}
      >
        <div className={styles.track}>
          {items.map((item) => (
            <figure className={styles.slide} key={item.src}>
              <ProjectMediaLightbox {...item} />
            </figure>
          ))}
        </div>
      </div>

      {itemCount > 1 ? (
        <>
          <div className={`${styles.edgeFade} ${styles.edgeFadeLeft} ${previous.available ? styles.visible : ""}`} aria-hidden="true" />
          <div className={`${styles.edgeFade} ${styles.edgeFadeRight} ${next.available ? styles.visible : ""}`} aria-hidden="true" />
          {previous.available ? (
            <button className={`${styles.arrow} ${styles.arrowLeft}`} type="button" onClick={() => move(-1)} aria-label="Предыдущее изображение" />
          ) : null}
          {next.available ? (
            <button className={`${styles.arrow} ${styles.arrowRight}`} type="button" onClick={() => move(1)} aria-label="Следующее изображение" />
          ) : null}
          <span className="visually-hidden" aria-live="polite">Изображение {activeIndex + 1} из {itemCount}</span>
        </>
      ) : null}
    </div>
  );
}
