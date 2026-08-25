"use client";

import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  getProjectActionBarInitialState,
  getProjectActionBarScrollState,
} from "../lib/main-chapter-interactions";
import { invalidateScrollFrameSubscriber, registerScrollFrameSubscriber } from "../lib/scroll-frame-coordinator";
import { useProjectShare } from "./project-share-button";
import { ControlButton } from "./ui-controls";
import styles from "./project-action-bar.module.css";

type ProjectActionBarProps = {
  title: string;
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
  initialVariant: ActionLayout["variant"] = "full",
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
    : getProjectActionBarScrollState(geometry, initialVariant);
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

const ACTION_BAR_BOOTSTRAP = `(()=>{const b=document.querySelector('[data-project-action-bar]'),i=document.querySelector('[data-project-information-start]'),c=document.querySelector('[data-project-content-column]'),t=document.querySelector('[data-project-action-terminal]');if(!b||!i||!c||!t)return;const ir=i.getBoundingClientRect(),cr=c.getBoundingClientRect(),tr=t.getBoundingClientRect(),d=window.devicePixelRatio||1,n=v=>Math.round(v*d)/d,barTop=n(window.innerHeight-88),values=[ir.top,ir.bottom,ir.left,ir.width,cr.left,cr.width,tr.top];if(!values.every(Number.isFinite))return;const variant=n(ir.top)<=barTop&&n(ir.bottom)>barTop?'adaptive':'full',bottom=Math.max(0,window.innerHeight-(tr.top+48)-88);b.dataset.projectActionVariant=variant;b.dataset.projectActionMeasurement='valid';b.dataset.projectActionTransitions='false';b.style.setProperty('--action-bottom',bottom+'px');b.style.setProperty('--action-full-left',ir.left+'px');b.style.setProperty('--action-full-width',ir.width+'px');b.style.setProperty('--action-adaptive-left',cr.left+'px');b.style.setProperty('--action-adaptive-width',cr.width+'px')})()`;

export function ProjectActionBar({ title, figmaAvailable, figmaUrl, updatedAt }: ProjectActionBarProps) {
  const [layout, setLayout] = useState<ActionLayout>(() => measureActionLayout("initial"));
  const [transitionsEnabled, setTransitionsEnabled] = useState(false);
  const initialVariantRef = useRef<ActionLayout["variant"] | null>(
    layout.measurement === "valid" ? layout.variant : null,
  );
  const { announcement, handleShare } = useProjectShare(title);

  useLayoutEffect(() => {
    const update = () => {
      const nextLayout = initialVariantRef.current === null
        ? measureActionLayout("initial")
        : measureActionLayout("scroll", initialVariantRef.current);
      if (initialVariantRef.current === null && nextLayout.measurement === "valid") {
        initialVariantRef.current = nextLayout.variant;
      }
      setLayout((current) => Object.keys(nextLayout).every((key) => (
        current[key as keyof ActionLayout] === nextLayout[key as keyof ActionLayout]
      )) ? current : nextLayout);
    };

    const scheduleUpdate = () => invalidateScrollFrameSubscriber("project-action-bar-geometry");
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
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("scrollend", scheduleUpdate);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("scrollend", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver.disconnect();
      unregisterFrame();
      pendingImages.forEach((image) => image.removeEventListener("load", scheduleUpdate));
    };
  }, []);

  useEffect(() => {
    if (layout.measurement === "valid") setTransitionsEnabled(true);
  }, [layout.measurement]);

  return (
    <>
      <div
        className={styles.actionBar}
        data-project-action-bar
        data-project-action-variant={layout.variant}
        data-project-action-measurement={layout.measurement}
        data-project-action-transitions={transitionsEnabled ? "true" : "false"}
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
      <script dangerouslySetInnerHTML={{ __html: ACTION_BAR_BOOTSTRAP }} />
      <span aria-live="polite" className="visually-hidden">{announcement}</span>
    </>
  );
}
