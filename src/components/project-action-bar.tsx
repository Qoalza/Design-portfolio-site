"use client";

import { useEffect, useRef, useState } from "react";
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
  const { announcement, handleShare } = useProjectShare(title);

  useEffect(() => {
    const update = () => {
      frameRef.current = null;
      const informationStart = document.querySelector<HTMLElement>("[data-project-information-start]");
      const footer = document.querySelector<HTMLElement>("[data-project-footer]");

      if (informationStart) {
        setVariant(getActionBarVariant(informationStart.getBoundingClientRect().top));
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
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
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
        style={{ bottom: `${footerOffset}px` }}
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
      <div className={styles.actionBarSpace} aria-hidden="true" />
      <span aria-live="polite" className="visually-hidden">{announcement}</span>
    </>
  );
}
