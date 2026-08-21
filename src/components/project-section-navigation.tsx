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

const sectionActivationTop = 156;

export function ProjectSectionNavigation({
  sections,
  className,
  activeItemClassName,
}: ProjectSectionNavigationProps) {
  const frameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const update = () => {
      frameRef.current = null;
      const sectionTops = sections.map((section) => (
        document.getElementById(section.id)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY
      ));

      setActiveIndex(getActiveProjectSectionIndex(sectionTops, sectionActivationTop));
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
  }, [sections]);

  return (
    <nav className={className} aria-label="Разделы проекта">
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
