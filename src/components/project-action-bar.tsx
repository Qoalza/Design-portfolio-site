"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { getProjectActionBarState } from "../lib/main-chapter-interactions";
import { useProjectShare } from "./project-share-button";
import { ControlButton } from "./ui-controls";
import styles from "./project-action-bar.module.css";

type ProjectActionBarProps = {
  title: string;
  figmaAvailable: boolean;
  figmaUrl?: string;
  updatedAt?: string;
};

export function ProjectActionBar({ title, figmaAvailable, figmaUrl, updatedAt }: ProjectActionBarProps) {
  const frameRef = useRef<number | null>(null);
  const [variant, setVariant] = useState<"full" | "adaptive">("full");
  const [measurementValid, setMeasurementValid] = useState(false);
  const [footerOffset, setFooterOffset] = useState(0);
  const [layout, setLayout] = useState({ fullLeft: 0, fullWidth: 1200, adaptiveLeft: 0, adaptiveWidth: 1000 });
  const { announcement, handleShare } = useProjectShare(title);

  useEffect(() => {
    const update = () => {
      frameRef.current = null;
      const informationStart = document.querySelector<HTMLElement>("[data-project-information-start]");
      const gallery = document.querySelector<HTMLElement>("[data-project-gallery]");
      const footer = document.querySelector<HTMLElement>("[data-project-footer]");
      const contentColumn = document.querySelector<HTMLElement>("[data-project-content-column]");
      const main = document.querySelector<HTMLElement>("[data-project-information-start]");

      if (informationStart && gallery && footer) {
        const informationRect = informationStart.getBoundingClientRect();
        const state = getProjectActionBarState({
          informationTop: informationRect.top,
          informationBottom: informationRect.bottom,
          galleryTop: gallery.getBoundingClientRect().top,
          footerTop: footer.getBoundingClientRect().top,
          viewportHeight: window.innerHeight,
          barHeight: 88,
          dpr: window.devicePixelRatio || 1,
        });
        setVariant(state.variant);
        setFooterOffset(state.footerOffset);
        setMeasurementValid(state.valid);
      } else {
        setVariant("full");
        setFooterOffset(0);
        setMeasurementValid(false);
      }

      if (contentColumn && main) {
        const contentRect = contentColumn.getBoundingClientRect();
        const mainRect = main.getBoundingClientRect();
        const nextLayout = {
          fullLeft: mainRect.left,
          fullWidth: mainRect.width,
          adaptiveLeft: contentRect.left,
          adaptiveWidth: contentRect.width,
        };
        setLayout((currentLayout) => (
          currentLayout.fullLeft === nextLayout.fullLeft
          && currentLayout.fullWidth === nextLayout.fullWidth
          && currentLayout.adaptiveLeft === nextLayout.adaptiveLeft
          && currentLayout.adaptiveWidth === nextLayout.adaptiveWidth
            ? currentLayout
            : nextLayout
        ));
      }

    };

    const scheduleUpdate = () => {
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(update);
      }
    };

    update();
    const measuredElements = [
      document.querySelector<HTMLElement>("[data-site-header-fixed]"),
      document.querySelector<HTMLElement>("[data-project-information-start]"),
      document.querySelector<HTMLElement>("[data-project-content-column]"),
      document.querySelector<HTMLElement>("[data-project-gallery]"),
      document.querySelector<HTMLElement>("[data-project-footer]"),
    ].filter((element): element is HTMLElement => Boolean(element));
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    measuredElements.forEach((element) => resizeObserver.observe(element));
    const pendingImages = [...document.images].filter((image) => !image.complete);
    pendingImages.forEach((image) => image.addEventListener("load", scheduleUpdate, { once: true }));
    void document.fonts.ready.then(scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("scrollend", update);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("scrollend", update);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver.disconnect();
      pendingImages.forEach((image) => image.removeEventListener("load", scheduleUpdate));
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        className={`${styles.actionBar} ${variant === "adaptive" ? styles.adaptive : ""}`}
        data-project-action-bar
        data-project-action-variant={variant}
        data-project-action-measurement={measurementValid ? "valid" : "invalid"}
        style={{
          bottom: `${footerOffset}px`,
          left: variant === "adaptive" ? `${layout.adaptiveLeft}px` : "0px",
          width: variant === "adaptive" ? `${layout.adaptiveWidth}px` : "100vw",
          "--action-full-left": `${layout.fullLeft}px`,
          "--action-full-width": `${layout.fullWidth}px`,
        } as CSSProperties}
      >
        <div
          className={styles.barContent}
          style={{
            left: variant === "adaptive" ? "0px" : `${layout.fullLeft}px`,
            width: variant === "adaptive" ? `${layout.adaptiveWidth}px` : `${layout.fullWidth}px`,
          }}
        >
          <div className={styles.leadingContent}>
            {figmaAvailable && figmaUrl && updatedAt ? (
              <>
                <ControlButton variant="neutral" dataAction="figma" href={figmaUrl} external iconRight="/assets/projects/external-link.svg">Figma</ControlButton>
                <span className={styles.updatedAt}>Обновлено {updatedAt}</span>
              </>
            ) : (
              <div className={styles.unavailableContent}>
                <span className={`${styles.icon} ${styles.infoIcon}`} aria-hidden="true" />
                <span>Figma - файл пока недоступен, в процессе подготовки</span>
              </div>
            )}
          </div>

          <ControlButton className={styles.shareButton} variant="light" dataAction="share" onClick={handleShare}>Поделиться</ControlButton>
        </div>
      </div>
      <div className={styles.actionBarSpace} aria-hidden="true" />
      <span aria-live="polite" className="visually-hidden">{announcement}</span>
    </>
  );
}
