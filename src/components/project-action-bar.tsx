"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { getActionBarVariant } from "../lib/main-chapter-interactions";
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
  const [footerOffset, setFooterOffset] = useState(0);
  const [layout, setLayout] = useState({ fullLeft: 0, fullWidth: 1200, adaptiveLeft: 0, adaptiveWidth: 1000 });
  const { announcement, handleShare } = useProjectShare(title);

  useEffect(() => {
    const update = () => {
      frameRef.current = null;
      const informationStart = document.querySelector<HTMLElement>("[data-project-information-start]");
      const fixedHeader = document.querySelector<HTMLElement>("[data-site-header-fixed]");
      const footer = document.querySelector<HTMLElement>("[data-project-footer]");
      const contentColumn = document.querySelector<HTMLElement>("[data-project-content-column]");
      const main = document.querySelector<HTMLElement>("[data-project-information-start]");

      if (informationStart) {
        const headerBottom = Math.max(0, fixedHeader?.getBoundingClientRect().bottom ?? 0);
        setVariant(getActionBarVariant(informationStart.getBoundingClientRect().top, headerBottom));
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

      if (footer) {
        setFooterOffset(Math.max(0, window.innerHeight - footer.getBoundingClientRect().top));
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
      document.querySelector<HTMLElement>("[data-project-footer]"),
    ].filter((element): element is HTMLElement => Boolean(element));
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    measuredElements.forEach((element) => resizeObserver.observe(element));
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        className={`${styles.actionBar} ${styles[variant]}`}
        data-project-action-bar
        data-project-action-variant={variant}
        style={{
          bottom: `${footerOffset}px`,
          "--action-full-left": `${layout.fullLeft}px`,
          "--action-full-width": `${layout.fullWidth}px`,
          "--action-adaptive-left": `${layout.adaptiveLeft}px`,
          "--action-adaptive-width": `${layout.adaptiveWidth}px`,
        } as CSSProperties}
      >
        <div className={styles.barContent}>
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
