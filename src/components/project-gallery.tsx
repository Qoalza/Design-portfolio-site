"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type WheelEvent } from "react";
import { getGalleryLayout, getGalleryOffsetTarget, type StepDirection } from "../lib/main-chapter-interactions";
import { ProjectMediaLightbox } from "./project-media-lightbox";
import { SquareButton } from "./ui-controls";
import styles from "./project-gallery.module.css";

export type ProjectGalleryItem = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type ProjectGalleryGroup = {
  id: "desktop" | "tablet" | "mobile";
  label: string;
  icon: string;
  items: ProjectGalleryItem[];
};

type ProjectGalleryProps = {
  groups: ProjectGalleryGroup[];
  title: string;
  description: string;
};

type PointerStart = { id: number; x: number; y: number };

function GalleryGroup({ group }: { group: ProjectGalleryGroup }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [offsets, setOffsets] = useState([0]);
  const pointerStartRef = useRef<PointerStart | null>(null);
  const wheelLockedRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const previous = getGalleryOffsetTarget(activeIndex, -1, offsets);
  const next = getGalleryOffsetTarget(activeIndex, 1, offsets);

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
  }, [group.items]);

  const move = (direction: StepDirection) => {
    const target = getGalleryOffsetTarget(activeIndex, direction, offsets);
    if (target.available) setActiveIndex(target.index);
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    const isHorizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    if (!isHorizontalIntent || Math.abs(event.deltaX) < 16) return;
    event.preventDefault();
    if (wheelLockedRef.current) return;
    wheelLockedRef.current = true;
    move(event.deltaX > 0 ? 1 : -1);
    window.setTimeout(() => { wheelLockedRef.current = false; }, 300);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerStartRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start || start.id !== event.pointerId) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) >= 48 && Math.abs(deltaX) > Math.abs(deltaY)) move(deltaX > 0 ? -1 : 1);
  };

  const trackStyle = { "--gallery-offset": `${offsets[activeIndex] ?? 0}px` } as CSSProperties;

  return (
    <section className={`${styles.group} ${styles[group.id]}`} data-gallery-group={group.id} data-gallery-index={activeIndex}>
      <div className={styles.groupControls}>
        <div className={styles.deviceLabel}>
          <span className={styles.deviceIcon} style={{ maskImage: `url(${group.icon})` }} aria-hidden="true" />
          <span>{group.label}</span>
        </div>
        <div className={styles.arrows}>
          <SquareButton kind="button" variant="ghost" size="small" disabled={!previous.available} onClick={() => move(-1)} ariaLabel={`Предыдущее изображение: ${group.label}`} icon="/assets/projects/chevron-left.svg" />
          <SquareButton kind="button" variant="ghost" size="small" disabled={!next.available} onClick={() => move(1)} ariaLabel={`Следующее изображение: ${group.label}`} icon="/assets/projects/chevron-right.svg" />
        </div>
      </div>

      <div
        ref={viewportRef}
        className={styles.viewport}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { pointerStartRef.current = null; }}
      >
        <div ref={trackRef} className={styles.track} style={trackStyle}>
          {group.items.map((item, index) => (
            <figure className={styles.slide} key={item.src}>
              <ProjectMediaLightbox {...item} sizes={`${group.id === "desktop" ? 740 : group.id === "tablet" ? 400 : 180}px`} />
              <span className="visually-hidden">{group.label}: изображение {index + 1}</span>
            </figure>
          ))}
        </div>
      </div>

      {next.available ? <div className={`${styles.edgeFade} ${styles.edgeFadeRight}`} aria-hidden="true" /> : null}
      <span className="visually-hidden" aria-live="polite">{group.label}: позиция {activeIndex + 1} из {offsets.length}</span>
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
        {groups.map((group) => <GalleryGroup group={group} key={group.id} />)}
      </div>
    </section>
  );
}
