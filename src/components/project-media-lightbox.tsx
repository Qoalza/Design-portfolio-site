"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";
import { calculateLightboxMediaSize, calculateLightboxScale } from "../lib/project-lightbox";
import { startScrollControllers, stopScrollControllers } from "../lib/scroll-controller";
import styles from "./project-media-lightbox.module.css";
import { SquareButton } from "./ui-controls";

type GalleryFrameContract = {
  clip: boolean;
  radius: number;
  strokeColor: string;
  strokeWidth: number;
};

type FrameStyle = CSSProperties & {
  "--gallery-frame-radius": string;
  "--gallery-frame-stroke": string;
  "--gallery-frame-stroke-width": string;
};

type ProjectMediaLightboxProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  fit?: "cover" | "contain";
  priority?: boolean;
  sizes?: string;
  baseHeight: number;
  baseWidth: number;
  frame: GalleryFrameContract;
  sourceNodeId?: string;
};

export function ProjectMediaLightbox({
  src,
  alt,
  width,
  height,
  fit = "cover",
  priority = false,
  sizes = "720px",
  baseHeight,
  baseWidth,
  frame,
  sourceNodeId,
}: ProjectMediaLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [intrinsicSize, setIntrinsicSize] = useState({ currentSrc: src, dpr: 1, width, height });
  const [targetScale, setTargetScale] = useState(1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mediaAreaRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef({ x: 0, y: 0 });
  const previewFrameStyle = {
    "--gallery-frame-radius": `${frame.radius}px`,
    "--gallery-frame-stroke": frame.strokeColor,
    "--gallery-frame-stroke-width": `${frame.strokeWidth}px`,
  } as FrameStyle;
  const expandedMediaSize = calculateLightboxMediaSize({
    baseHeight,
    baseWidth,
    intrinsicHeight: intrinsicSize.height,
    intrinsicWidth: intrinsicSize.width,
  });

  useLayoutEffect(() => {
    const mediaArea = mediaAreaRef.current;
    if (!isOpen || !mediaArea) return;

    const measure = () => {
      const rect = mediaArea.getBoundingClientRect();
      setTargetScale(calculateLightboxScale({
        availableHeight: rect.height,
        availableWidth: rect.width,
        baseHeight: expandedMediaSize.height,
        baseWidth: expandedMediaSize.width,
        dpr: window.devicePixelRatio || 1,
        intrinsicHeight: intrinsicSize.height,
        intrinsicWidth: intrinsicSize.width,
      }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(mediaArea);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [expandedMediaSize.height, expandedMediaSize.width, intrinsicSize.height, intrinsicSize.width, isOpen]);

  const recordIntrinsicSize = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (image.naturalWidth > 0 && image.naturalHeight > 0) {
      setIntrinsicSize({ currentSrc: image.currentSrc, dpr: window.devicePixelRatio || 1, width: image.naturalWidth, height: image.naturalHeight });
    }
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;

    if (!dialog || !isOpen) return;

    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousRootScrollBehavior = root.style.scrollBehavior;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    scrollPositionRef.current = { x: window.scrollX, y: window.scrollY };

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    root.style.overflow = "hidden";
    root.style.scrollBehavior = "auto";
    body.style.overflow = "hidden";
    stopScrollControllers();
    dialog.showModal();
    const closeFromEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", closeFromEscape, { capture: true });

    return () => {
      window.removeEventListener("keydown", closeFromEscape, { capture: true });
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
      if (dialog.open) dialog.close();
      const scrollPosition = scrollPositionRef.current;
      window.scrollTo(scrollPosition.x, scrollPosition.y);
      root.style.scrollBehavior = previousRootScrollBehavior;
      startScrollControllers();
      trigger?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        className={`${styles.trigger} ${styles.frame} ${frame.clip ? styles.frameClipped : ""}`}
        style={previewFrameStyle}
        type="button"
        aria-label={`Увеличить изображение: ${alt}`}
        data-image-fit={fit}
        data-figma-node-id={sourceNodeId}
        onClick={() => setIsOpen(true)}
      >
        <Image src={src} alt={alt} width={width} height={height} sizes={sizes} unoptimized priority={priority} draggable={false} onLoad={recordIntrinsicSize} />
      </button>

      {isOpen ? createPortal(
        <dialog
          ref={dialogRef}
          className={styles.dialog}
          aria-label={`Увеличенное изображение: ${alt}`}
          onCancel={(event) => { event.preventDefault(); setIsOpen(false); }}
          onClick={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}
        >
          <div className={styles.dialogContent} onClick={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}>
            <SquareButton
              ariaLabel="Закрыть увеличенное изображение"
              className={styles.closeButton}
              icon="/assets/projects/corvo/cross.svg"
              kind="button"
              onClick={() => setIsOpen(false)}
              variant="ghost"
            />
            <div ref={mediaAreaRef} className={styles.mediaArea} onClick={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}>
              <div
                className={styles.expandedFrame}
                data-lightbox-current-src={intrinsicSize.currentSrc}
                data-lightbox-dpr={intrinsicSize.dpr}
                data-lightbox-natural-height={intrinsicSize.height}
                data-lightbox-natural-width={intrinsicSize.width}
                data-lightbox-target-scale={targetScale}
                data-figma-node-id={sourceNodeId}
                style={{ width: `${expandedMediaSize.width * targetScale}px`, height: `${expandedMediaSize.height * targetScale}px` }}
              >
                <Image
                  className={styles.expandedImage}
                  src={src}
                  alt={alt}
                  width={width}
                  height={height}
                  sizes={`${expandedMediaSize.width * targetScale}px`}
                  unoptimized
                  priority
                  onLoad={recordIntrinsicSize}
                />
              </div>
            </div>
          </div>
        </dialog>,
        document.body,
      ) : null}
    </>
  );
}
