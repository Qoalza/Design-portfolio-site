"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ProjectShareButton, useProjectShare } from "./project-share-button";
import styles from "./project-action-bar.module.css";

type ProjectActionBarProps = {
  title: string;
  figmaAvailable: boolean;
  figmaUrl?: string;
  updatedAt?: string;
};

type ActionBarContentProps = Omit<ProjectActionBarProps, "title"> & {
  onShare: () => Promise<void>;
};

function ActionBarContent({
  figmaAvailable,
  figmaUrl,
  updatedAt,
  onShare,
}: ActionBarContentProps) {
  return (
    <div className={styles.bar}>
      {figmaAvailable && figmaUrl && updatedAt ? (
        <div className={styles.availableContent}>
          <a className={styles.figmaLink} data-project-action="figma" href={figmaUrl} target="_blank" rel="noreferrer">
            Figma
            <span className={`${styles.icon} ${styles.externalIcon}`} aria-hidden="true" />
          </a>
          <span className={styles.updatedAt}>Обновлен {updatedAt}</span>
        </div>
      ) : (
        <div className={styles.unavailableContent}>
          <span className={`${styles.icon} ${styles.infoIcon}`} aria-hidden="true" />
          <span>Figma - файл пока недоступен, в процессе подготовки</span>
        </div>
      )}

      <ProjectShareButton className={styles.shareButton} onShare={onShare} />
    </div>
  );
}

export function ProjectActionBar({ title, figmaAvailable, figmaUrl, updatedAt }: ProjectActionBarProps) {
  const inlineRef = useRef<HTMLDivElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const pendingFocusRef = useRef<"figma" | "share" | null>(null);
  const [inlineVisible, setInlineVisible] = useState(false);
  const [floatingReady, setFloatingReady] = useState(false);
  const { announcement, handleShare } = useProjectShare(title);
  const floatingVisible = !inlineVisible;
  const floatingInteractive = floatingVisible && floatingReady;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setFloatingReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const inlineBar = inlineRef.current;

    if (!inlineBar) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      const nextInlineVisible = entry.isIntersecting;
      const activeContainer = nextInlineVisible ? floatingRef.current : inlineRef.current;
      const focusedAction = activeContainer?.contains(document.activeElement)
        ? document.activeElement?.getAttribute("data-project-action")
        : null;

      pendingFocusRef.current = focusedAction === "figma" || focusedAction === "share" ? focusedAction : null;
      setInlineVisible(nextInlineVisible);
    }, { threshold: 0 });

    observer.observe(inlineBar);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const action = pendingFocusRef.current;

    if (!action) {
      return;
    }

    const activeContainer = inlineVisible ? inlineRef.current : floatingRef.current;
    const target = activeContainer?.querySelector<HTMLElement>(`[data-project-action="${action}"]`);

    target?.focus({ preventScroll: true });
    pendingFocusRef.current = null;
  }, [inlineVisible]);

  const contentProps = { figmaAvailable, figmaUrl, updatedAt, onShare: handleShare };

  return (
    <div data-project-action-bar data-floating-visible={floatingVisible ? "true" : "false"}>
      <div
        ref={inlineRef}
        className={styles.inlineBar}
        aria-hidden={!inlineVisible || undefined}
        inert={!inlineVisible || undefined}
      >
        <ActionBarContent {...contentProps} />
      </div>

      <div
        ref={floatingRef}
        className={`${styles.floatingBar} ${floatingInteractive ? styles.floatingBarVisible : ""}`}
        aria-hidden={!floatingInteractive || undefined}
        inert={!floatingInteractive || undefined}
      >
        <ActionBarContent {...contentProps} />
      </div>

      <span aria-live="polite" className="visually-hidden">{announcement}</span>
    </div>
  );
}
