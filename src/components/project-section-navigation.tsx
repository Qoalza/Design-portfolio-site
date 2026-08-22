"use client";

import { useEffect, useRef, useState } from "react";
import { getActiveProjectSectionIndex } from "../lib/main-chapter-interactions";

type ProjectSection = {
  id: string;
  label: string;
};

type ProjectSectionNavigationProps = {
  sections: ProjectSection[];
  className: string;
  activeItemClassName: string;
};

export function ProjectSectionNavigation({
  sections,
  className,
  activeItemClassName,
}: ProjectSectionNavigationProps) {
  const frameRef = useRef<number | null>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [stickyTop, setStickyTop] = useState(160);

  useEffect(() => {
    const update = () => {
      frameRef.current = null;
      const fixedHeader = document.querySelector<HTMLElement>("[data-site-header-fixed]");
      const measuredHeaderHeight = fixedHeader?.getBoundingClientRect().height ?? 0;
      const activationTop = Math.max(0, fixedHeader?.getBoundingClientRect().bottom ?? measuredHeaderHeight);
      const sectionTops = sections.map((section) => (
        document.getElementById(section.id)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY
      ));

      setStickyTop(measuredHeaderHeight);
      navigationRef.current?.parentElement?.style.setProperty(
        "--project-fixed-stack-height",
        `${measuredHeaderHeight}px`,
      );
      setActiveIndex(getActiveProjectSectionIndex(sectionTops, activationTop));
    };

    const scheduleUpdate = () => {
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(update);
      }
    };

    update();
    const fixedHeader = document.querySelector<HTMLElement>("[data-site-header-fixed]");
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    if (fixedHeader) {
      resizeObserver.observe(fixedHeader);
    }
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("scrollend", update);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("scrollend", update);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [sections]);

  return (
    <nav ref={navigationRef} className={className} aria-label="Разделы проекта" style={{ top: stickyTop }}>
      {sections.map((section, index) => (
        <a
          className={index === activeIndex ? activeItemClassName : undefined}
          href={`#${section.id}`}
          key={section.id}
          aria-current={index === activeIndex ? "location" : undefined}
        >
          <span aria-hidden="true" />
          {section.label}
        </a>
      ))}
    </nav>
  );
}
