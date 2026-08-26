"use client";

import { type CSSProperties, useLayoutEffect, useRef, useState } from "react";
import {
  getProjectActionBarInitialState,
  getProjectActionBarScrollState,
} from "../lib/main-chapter-interactions";
import { invalidateScrollFrameSubscriber, registerScrollFrameSubscriber } from "../lib/scroll-frame-coordinator";
import { useProjectShare } from "./project-share-button";
import { Tooltip } from "./tooltip";
import { ControlButton } from "./ui-controls";
import styles from "./project-action-bar.module.css";

type ProjectActionBarProps = {
  figmaAvailable: boolean;
  figmaUrl?: string;
  updatedAt?: string;
};

type ActionLayout = {
  variant: "full" | "adaptive";
  measurement: "valid" | "invalid";
  bottom: number;
  fullLeft: number;
  fullWidth: number;
  adaptiveLeft: number;
  adaptiveWidth: number;
};

const FALLBACK_LAYOUT: ActionLayout = {
  variant: "full",
  measurement: "invalid",
  bottom: 0,
  fullLeft: 0,
  fullWidth: 1200,
  adaptiveLeft: 0,
  adaptiveWidth: 1000,
};

function measureActionLayout(
  mode: "initial" | "scroll",
): ActionLayout {
  if (typeof window === "undefined") return FALLBACK_LAYOUT;
  const information = document.querySelector<HTMLElement>("[data-project-information-start]");
  const content = document.querySelector<HTMLElement>("[data-project-content-column]");
  const terminal = document.querySelector<HTMLElement>("[data-project-action-terminal]");
  if (!information || !content || !terminal) return FALLBACK_LAYOUT;

  const informationRect = information.getBoundingClientRect();
  const contentRect = content.getBoundingClientRect();
  const terminalRect = terminal.getBoundingClientRect();
  const geometry = {
    informationTop: informationRect.top,
    informationBottom: informationRect.bottom,
    viewportHeight: window.innerHeight,
    barHeight: 88,
    dpr: window.devicePixelRatio || 1,
  };
  const state = mode === "initial"
    ? getProjectActionBarInitialState(geometry)
    : getProjectActionBarScrollState(geometry);
  const values = [informationRect.left, informationRect.width, informationRect.bottom, contentRect.left, contentRect.width, terminalRect.top];
  if (!state.valid || !values.every(Number.isFinite)) return FALLBACK_LAYOUT;

  const terminalBarTop = terminalRect.top + 48;
  return {
    variant: state.variant,
    measurement: "valid",
    bottom: Math.max(0, window.innerHeight - terminalBarTop - 88),
    fullLeft: informationRect.left,
    fullWidth: informationRect.width,
    adaptiveLeft: contentRect.left,
    adaptiveWidth: contentRect.width,
  };
}

export function ProjectActionBar({ figmaAvailable, figmaUrl, updatedAt }: ProjectActionBarProps) {
  const [layout, setLayout] = useState<ActionLayout>(() => measureActionLayout("initial"));
  const actionBarRef = useRef<HTMLDivElement>(null);
  const scrollTrackingRef = useRef(false);
  const transitionsReadyRef = useRef(false);
  const { announcement, feedbackOpen, feedbackRevision, handleShare } = useProjectShare();

  useLayoutEffect(() => {
    const update = () => {
      const nextLayout = measureActionLayout(scrollTrackingRef.current ? "scroll" : "initial");
      setLayout((current) => Object.keys(nextLayout).every((key) => (
        current[key as keyof ActionLayout] === nextLayout[key as keyof ActionLayout]
      )) ? current : nextLayout);
    };

    const scheduleUpdate = () => invalidateScrollFrameSubscriber("project-action-bar-geometry");
    const handleScroll = () => {
      if (actionBarRef.current?.dataset.projectActionTransitions === "true") {
        scrollTrackingRef.current = true;
      }
      scheduleUpdate();
    };
    const unregisterFrame = registerScrollFrameSubscriber({
      id: "project-action-bar-geometry",
      priority: 30,
      update: () => update(),
    });

    update();
    const measuredElements = [
      document.querySelector<HTMLElement>("[data-site-header-fixed]"),
      document.querySelector<HTMLElement>("[data-project-information-start]"),
      document.querySelector<HTMLElement>("[data-project-content-column]"),
      document.querySelector<HTMLElement>("[data-project-action-terminal]"),
    ].filter((element): element is HTMLElement => Boolean(element));
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    measuredElements.forEach((element) => resizeObserver.observe(element));
    const pendingImages = [...document.images].filter((image) => !image.complete);
    pendingImages.forEach((image) => image.addEventListener("load", scheduleUpdate, { once: true }));
    void document.fonts.ready.then(scheduleUpdate);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scrollend", scheduleUpdate);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scrollend", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver.disconnect();
      unregisterFrame();
      pendingImages.forEach((image) => image.removeEventListener("load", scheduleUpdate));
    };
  }, []);

  useLayoutEffect(() => {
    const actionBar = actionBarRef.current;
    if (layout.measurement !== "valid" || !actionBar || transitionsReadyRef.current) return;

    actionBar.dataset.projectActionTransitions = "false";
    const expectedLeft = layout.variant === "adaptive" ? layout.adaptiveLeft : 0;
    const expectedWidth = layout.variant === "adaptive" ? layout.adaptiveWidth : window.innerWidth;
    let stableFrames = 0;
    const unregisterFrame = registerScrollFrameSubscriber({
      id: "project-action-bar-transition-ready",
      priority: 40,
      update: () => {
      const rect = actionBar.getBoundingClientRect();
        if (Math.abs(rect.left - expectedLeft) > 0.5 || Math.abs(rect.width - expectedWidth) > 0.5) {
          stableFrames = 0;
          invalidateScrollFrameSubscriber("project-action-bar-transition-ready");
          return;
        }
        stableFrames += 1;
        if (stableFrames < 2) {
          invalidateScrollFrameSubscriber("project-action-bar-transition-ready");
          return;
        }
        transitionsReadyRef.current = true;
        actionBar.dataset.projectActionTransitions = "true";
      },
    });
    invalidateScrollFrameSubscriber("project-action-bar-transition-ready");

    return unregisterFrame;
  }, [layout.adaptiveLeft, layout.adaptiveWidth, layout.measurement, layout.variant]);

  return (
    <>
      <div
        className={styles.actionBar}
        data-project-action-bar
        data-project-action-variant={layout.variant}
        data-project-action-measurement={layout.measurement}
        data-project-action-transitions="false"
        ref={actionBarRef}
        suppressHydrationWarning
        style={{
          "--action-bottom": `${layout.bottom}px`,
          "--action-full-left": `${layout.fullLeft}px`,
          "--action-full-width": `${layout.fullWidth}px`,
          "--action-adaptive-left": `${layout.adaptiveLeft}px`,
          "--action-adaptive-width": `${layout.adaptiveWidth}px`,
        } as CSSProperties}
      >
        <div
          className={styles.barContent}
        >
          <div className={styles.leadingContent}>
            {figmaAvailable && figmaUrl && updatedAt ? (
              <>
                <ControlButton variant="neutral" dataAction="figma" href={figmaUrl} external iconRight="/assets/projects/action-bar-external-link.svg">Figma</ControlButton>
                <span className={styles.updatedAt}>Обновлено {updatedAt}</span>
              </>
            ) : (
              <div className={styles.unavailableContent}>
                <span className={`${styles.icon} ${styles.infoIcon}`} aria-hidden="true" />
                <span>Файл пока недоступен</span>
              </div>
            )}
          </div>

          <Tooltip
            content={{ text: "Ссылка скопирована", icon: "/assets/projects/check.svg" }}
            open={feedbackOpen}
            restartKey={feedbackRevision}
            triggerMode="manual"
          >
            <ControlButton className={styles.shareButton} variant="light" dataAction="share" onClick={handleShare}>Поделиться</ControlButton>
          </Tooltip>
        </div>
      </div>
      <span aria-live="polite" className="visually-hidden">{announcement}</span>
    </>
  );
}
