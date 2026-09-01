"use client";

import Lenis from "lenis";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { galleryInputArbiter } from "../lib/gallery-input-arbiter";
import { getGalleryLayout, getGalleryOffsetTarget, getGalleryPointerGesture, shouldScheduleGalleryFrame, type StepDirection } from "../lib/main-chapter-interactions";
import type { ProjectGalleryGroup } from "../lib/project-contract";
import { registerScrollController } from "../lib/scroll-controller";
import { invalidateScrollFrameSubscriber, registerScrollFrameSubscriber } from "../lib/scroll-frame-coordinator";
import { ProjectMediaLightbox } from "./project-media-lightbox";
import { useDesktopSmoothScrollEnabled } from "./smooth-scroll-provider";
import { SquareButton } from "./ui-controls";
import styles from "./project-gallery.module.css";

export type { ProjectGalleryGroup, ProjectGalleryItem } from "../lib/project-contract";

type ProjectGalleryProps = {
  groups: ProjectGalleryGroup[];
  title: string;
  description: string;
};

type PointerStart = { id: number; x: number; y: number; scrollLeft: number; captured: boolean };

const DEVICE_PRESENTATION = {
  desktop: { label: "Desktop", icon: "/assets/projects/corvo/desktop.svg", baseWidth: 740, baseHeight: 512 },
  tablet: { label: "Tablet", icon: "/assets/projects/corvo/tablet.svg", baseWidth: 400, baseHeight: 566 },
  mobile: { label: "Mobile", icon: "/assets/projects/corvo/mobile.svg", baseWidth: 180, baseHeight: 320 },
} as const;

function itemFrame(deviceId: ProjectGalleryGroup["deviceId"]) {
  if (deviceId === "desktop") return { clip: true, radius: 12, strokeColor: "#e8eaeb", strokeWidth: 1 };
  if (deviceId === "tablet") return { clip: true, radius: 12, strokeColor: "#e8eaeb", strokeWidth: .5 };
  return { clip: true, radius: 11, strokeColor: "#e8eaeb", strokeWidth: 1 };
}

function GalleryGroup({ group }: { group: ProjectGalleryGroup }) {
  const presentation = DEVICE_PRESENTATION[group.deviceId];
  const smoothEnabled = useDesktopSmoothScrollEnabled();
  const [activeIndex, setActiveIndex] = useState(0);
  const [offsets, setOffsets] = useState([0]);
  const pointerStartRef = useRef<PointerStart | null>(null);
  const suppressClickRef = useRef(false);
  const fallbackWheelLockedRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const lenisJustCreatedRef = useRef(false);
  const visibleRef = useRef(true);
  const previous = getGalleryOffsetTarget(activeIndex, -1, offsets);
  const next = getGalleryOffsetTarget(activeIndex, 1, offsets);
  const requestGalleryStep = useCallback((direction: StepDirection) => {
    const target = getGalleryOffsetTarget(activeIndex, direction, offsets);
    if (!target.available) return;
    const lenis = lenisRef.current;
    if (smoothEnabled && lenis) {
      // Demand-driven Gallery instances do not receive idle RAF ticks. Advance
      // any existing interpolation to the current shared-clock time. Lenis skips
      // an immediate reset when actualScroll already equals targetScroll, so use
      // an unpainted subpixel waypoint to stop the old interpolation first.
      const actual = lenis.actualScroll;
      const waypoint = actual < lenis.limit ? actual + 0.001 : actual - 0.001;
      lenis.scrollTo(waypoint, { immediate: true, force: true });
      lenis.scrollTo(actual, { immediate: true, force: true });
      lenis.raf(performance.now());
    }
    setActiveIndex(target.index);
  }, [activeIndex, offsets, smoothEnabled]);

  const handleWheel = useCallback((event: WheelEvent) => {
    if (smoothEnabled) {
      const decision = galleryInputArbiter.classify(event, group.deviceId);
      if (decision.blockRoot) event.preventDefault();
      if (decision.galleryStep !== null) requestGalleryStep(decision.galleryStep);
      return;
    }
    const isHorizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    if (!isHorizontalIntent || Math.abs(event.deltaX) < 16) return;
    event.preventDefault();
    if (fallbackWheelLockedRef.current) return;
    fallbackWheelLockedRef.current = true;
    requestGalleryStep(event.deltaX > 0 ? 1 : -1);
    window.setTimeout(() => { fallbackWheelLockedRef.current = false; }, 300);
  }, [group.deviceId, requestGalleryStep, smoothEnabled]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const measure = () => {
      const items = [...track.children].filter((node): node is HTMLElement => node instanceof HTMLElement);
      const layout = getGalleryLayout(
        items.map((item) => item.offsetLeft),
        items.map((item) => item.offsetWidth),
        viewport.clientWidth,
        window.devicePixelRatio || 1,
      );
      setOffsets(layout.offsets);
      setActiveIndex((index) => Math.min(index, layout.offsets.length - 1));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(track);
    [...track.children].forEach((item) => observer.observe(item));
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [group.images]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!smoothEnabled || !viewport || !track) return;

    const lenis = new Lenis({
      wrapper: viewport,
      content: track,
      orientation: "horizontal",
      gestureOrientation: "horizontal",
      autoRaf: false,
      smoothWheel: false,
      syncTouch: false,
      virtualScroll: () => false,
    });
    lenisRef.current = lenis;
    lenisJustCreatedRef.current = true;
    const subscriberId = `gallery-lenis-${group.deviceId}`;

    const unregisterFrame = registerScrollFrameSubscriber({
      id: subscriberId,
      priority: 20,
      update: (timestamp) => {
        lenis.raf(timestamp);
        if (shouldScheduleGalleryFrame(Boolean(lenis.isScrolling), visibleRef.current)) {
          invalidateScrollFrameSubscriber(subscriberId);
        }
      },
    });
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry?.isIntersecting ?? false;
      if (shouldScheduleGalleryFrame(Boolean(lenis.isScrolling), visibleRef.current)) {
        invalidateScrollFrameSubscriber(subscriberId);
      }
    });
    visibilityObserver.observe(viewport);
    const unregisterController = registerScrollController(`gallery-${group.deviceId}`, {
      scrollTo: (target, options = {}) => {
        lenis.scrollTo(target, {
          offset: options.offset,
          immediate: options.immediate,
          force: true,
          onComplete: options.onComplete,
        });
      },
      cancel: () => lenis.scrollTo(lenis.actualScroll, { immediate: true, force: true }),
      stop: () => lenis.stop(),
      start: () => lenis.start(),
    });

    return () => {
      unregisterController();
      unregisterFrame();
      visibilityObserver.disconnect();
      lenis.destroy();
      lenisRef.current = null;
      lenisJustCreatedRef.current = false;
      viewport.scrollLeft = 0;
    };
  }, [group.deviceId, smoothEnabled]);

  useLayoutEffect(() => {
    if (!smoothEnabled || !lenisRef.current) return;
    const immediate = lenisJustCreatedRef.current;
    lenisJustCreatedRef.current = false;
    const lenis = lenisRef.current;
    lenis.scrollTo(offsets[activeIndex] ?? 0, {
      immediate,
      lerp: immediate ? undefined : 0.1,
      force: true,
    });
    if (!immediate && visibleRef.current) {
      invalidateScrollFrameSubscriber(`gallery-lenis-${group.deviceId}`);
    }
  }, [activeIndex, group.deviceId, offsets, smoothEnabled]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    suppressClickRef.current = false;
    pointerStartRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewportRef.current?.scrollLeft ?? 0,
      captured: false,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start || start.id !== event.pointerId || start.captured) return;
    const gesture = getGalleryPointerGesture(event.clientX - start.x, event.clientY - start.y);
    if (gesture.kind !== "horizontal-drag") return;
    event.preventDefault();
    if (viewportRef.current) viewportRef.current.scrollLeft = start.scrollLeft;
    event.currentTarget.setPointerCapture(event.pointerId);
    start.captured = true;
    suppressClickRef.current = true;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start || start.id !== event.pointerId) return;
    pointerStartRef.current = null;
    const gesture = getGalleryPointerGesture(event.clientX - start.x, event.clientY - start.y);
    if (start.captured && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (start.captured) {
      if (viewportRef.current) viewportRef.current.scrollLeft = start.scrollLeft;
      if (gesture.step !== null) requestGalleryStep(gesture.step);
      window.setTimeout(() => { suppressClickRef.current = false; }, 0);
    }
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    suppressClickRef.current = false;
    if (start?.captured && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const trackStyle = { "--gallery-offset": `${offsets[activeIndex] ?? 0}px` } as CSSProperties;

  return (
    <section
      className={`${styles.group} ${styles[group.deviceId]}`}
      data-gallery-group={group.deviceId}
      data-gallery-index={activeIndex}
      data-gallery-smooth={smoothEnabled ? "true" : "false"}
    >
      <div className={styles.groupControls}>
        <div className={styles.deviceLabel}>
          <span className={styles.deviceIcon} style={{ maskImage: `url(${presentation.icon})` }} aria-hidden="true" />
          <span>{presentation.label}</span>
        </div>
        <div className={styles.arrows}>
          <SquareButton kind="button" variant="ghost" size="small" disabled={!previous.available} onClick={() => requestGalleryStep(-1)} ariaLabel={`Предыдущее изображение: ${presentation.label}`} icon="/assets/projects/chevron-left.svg" />
          <SquareButton kind="button" variant="ghost" size="small" disabled={!next.available} onClick={() => requestGalleryStep(1)} ariaLabel={`Следующее изображение: ${presentation.label}`} icon="/assets/projects/chevron-right.svg" />
        </div>
      </div>

      <div
        ref={viewportRef}
        className={styles.viewport}
        data-gallery-viewport
        data-gallery-arbiter-active={smoothEnabled ? "true" : "false"}
        data-gallery-arbiter-owner={group.deviceId}
        onClickCapture={(event) => {
          if (!suppressClickRef.current) return;
          event.preventDefault();
          event.stopPropagation();
          suppressClickRef.current = false;
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div ref={trackRef} className={styles.track} style={trackStyle}>
          {group.images.map((item, index) => (
            <figure className={styles.slide} key={item.src}>
              <ProjectMediaLightbox
                {...item}
                baseHeight={presentation.baseHeight}
                baseWidth={presentation.baseWidth}
                fit="contain"
                frame={itemFrame(group.deviceId)}
                sizes={`${presentation.baseWidth}px`}
              />
              <span className="visually-hidden">{presentation.label}: изображение {index + 1}</span>
            </figure>
          ))}
        </div>
      </div>

      {next.available ? <div className={`${styles.edgeFade} ${styles.edgeFadeRight}`} aria-hidden="true" /> : null}
      <span className="visually-hidden" aria-live="polite">{presentation.label}: позиция {activeIndex + 1} из {offsets.length}</span>
    </section>
  );
}

export function ProjectGallery({ groups, title, description }: ProjectGalleryProps) {
  return (
    <section className={styles.gallery} data-project-gallery>
      <header className={styles.title}>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className={styles.groups}>
        {groups.map((group) => <GalleryGroup group={group} key={group.deviceId} />)}
      </div>
    </section>
  );
}
