"use client";

import { useEffect, useRef, useState } from "react";
import {
  NAVIGATION_ABSOLUTE_LIMIT_MS,
  NAVIGATION_WATCHDOG_MS,
  getActiveProjectSectionIndex,
  getNavigationProgressState,
} from "../lib/main-chapter-interactions";

type ProjectSection = {
  id: string;
  label: string;
};

type ProjectSectionNavigationProps = {
  sections: ProjectSection[];
  className: string;
  activeItemClassName: string;
};

type ScrollTrackingState = { mode: "SCROLL_TRACKING" };
type ProgrammaticScrollState = {
  mode: "PROGRAMMATIC_SCROLL";
  targetIndex: number;
  startedAt: number;
  lastProgressAt: number;
  lastDistance: number;
};
type NavigationState = ScrollTrackingState | ProgrammaticScrollState;

const SCROLL_KEYS = new Set(["ArrowDown", "ArrowUp", "End", "Home", "PageDown", "PageUp", " "]);

export function ProjectSectionNavigation({
  sections,
  className,
  activeItemClassName,
}: ProjectSectionNavigationProps) {
  const frameRef = useRef<number | null>(null);
  const watchdogRef = useRef<number | null>(null);
  const absoluteLimitRef = useRef<number | null>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const navigationStateRef = useRef<NavigationState>({ mode: "SCROLL_TRACKING" });
  const startProgrammaticScrollRef = useRef<(index: number, updateHistory?: boolean) => void>(() => undefined);
  const [activeIndex, setActiveIndex] = useState(0);
  const [stickyTop, setStickyTop] = useState(160);

  useEffect(() => {
    const clearProgrammaticTimers = () => {
      if (watchdogRef.current !== null) window.clearTimeout(watchdogRef.current);
      if (absoluteLimitRef.current !== null) window.clearTimeout(absoluteLimitRef.current);
      watchdogRef.current = null;
      absoluteLimitRef.current = null;
    };

    const getGeometry = () => {
      const fixedHeader = document.querySelector<HTMLElement>("[data-site-header-fixed]");
      const measuredHeaderHeight = fixedHeader?.getBoundingClientRect().height ?? 0;
      const activationTop = Math.max(0, fixedHeader?.getBoundingClientRect().bottom ?? measuredHeaderHeight);
      const sectionElements = sections.map((section) => document.getElementById(section.id));
      const sectionTops = sectionElements.map((section) => (
        section?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY
      ));

      return { activationTop, measuredHeaderHeight, sectionElements, sectionTops };
    };

    const applyTrackingGeometry = () => {
      const { activationTop, measuredHeaderHeight, sectionTops } = getGeometry();
      setStickyTop(measuredHeaderHeight);
      navigationRef.current?.parentElement?.style.setProperty(
        "--project-fixed-stack-height",
        `${measuredHeaderHeight}px`,
      );
      setActiveIndex(getActiveProjectSectionIndex(sectionTops, activationTop));
    };

    const scheduleTrackingGeometry = () => {
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(() => {
          frameRef.current = null;
          applyTrackingGeometry();
        });
      }
    };

    const finishProgrammaticScroll = () => {
      if (navigationStateRef.current.mode !== "PROGRAMMATIC_SCROLL") return;
      navigationStateRef.current = { mode: "SCROLL_TRACKING" };
      clearProgrammaticTimers();
      scheduleTrackingGeometry();
    };

    const resetWatchdog = () => {
      if (watchdogRef.current !== null) window.clearTimeout(watchdogRef.current);
      watchdogRef.current = window.setTimeout(finishProgrammaticScroll, NAVIGATION_WATCHDOG_MS);
    };

    const update = () => {
      frameRef.current = null;
      const geometry = getGeometry();
      setStickyTop(geometry.measuredHeaderHeight);
      navigationRef.current?.parentElement?.style.setProperty(
        "--project-fixed-stack-height",
        `${geometry.measuredHeaderHeight}px`,
      );
      const state = navigationStateRef.current;

      if (state.mode === "SCROLL_TRACKING") {
        setActiveIndex(getActiveProjectSectionIndex(geometry.sectionTops, geometry.activationTop));
        return;
      }

      const target = geometry.sectionElements[state.targetIndex];
      if (!target) {
        finishProgrammaticScroll();
        return;
      }

      const distance = Math.abs(target.getBoundingClientRect().top - geometry.activationTop);
      if (distance <= 1) {
        finishProgrammaticScroll();
        return;
      }

      const progress = getNavigationProgressState({
        now: performance.now(),
        startedAt: state.startedAt,
        lastProgressAt: state.lastProgressAt,
        previousDistance: state.lastDistance,
        currentDistance: distance,
      });

      if (progress.outcome === "watchdog" || progress.outcome === "absolute-limit") {
        finishProgrammaticScroll();
        return;
      }

      navigationStateRef.current = {
        ...state,
        lastProgressAt: progress.lastProgressAt,
        lastDistance: progress.lastDistance,
      };
      if (progress.outcome === "progress") resetWatchdog();
    };

    const scheduleUpdate = () => {
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(update);
    };

    const startProgrammaticScroll = (requestedIndex: number, updateHistory = true) => {
      if (sections.length === 0) return;
      const index = Math.min(sections.length - 1, Math.max(0, requestedIndex));
      const section = sections[index];
      const target = document.getElementById(section.id);
      if (!target) {
        navigationStateRef.current = { mode: "SCROLL_TRACKING" };
        scheduleTrackingGeometry();
        return;
      }

      clearProgrammaticTimers();
      const { activationTop } = getGeometry();
      const distance = Math.abs(target.getBoundingClientRect().top - activationTop);
      const now = performance.now();
      navigationStateRef.current = {
        mode: "PROGRAMMATIC_SCROLL",
        targetIndex: index,
        startedAt: now,
        lastProgressAt: now,
        lastDistance: distance,
      };
      setActiveIndex(index);

      if (updateHistory) {
        const hash = `#${section.id}`;
        if (window.location.hash === hash) {
          history.replaceState({ ...history.state }, "", hash);
        } else {
          history.pushState({ ...history.state }, "", hash);
        }
      }

      resetWatchdog();
      absoluteLimitRef.current = window.setTimeout(finishProgrammaticScroll, NAVIGATION_ABSOLUTE_LIMIT_MS);
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - activationTop),
        behavior: reducedMotion ? "auto" : "smooth",
      });
      scheduleUpdate();
    };
    startProgrammaticScrollRef.current = startProgrammaticScroll;

    const startFromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const index = sections.findIndex((section) => section.id === id);
      if (index >= 0) startProgrammaticScroll(index, false);
      else finishProgrammaticScroll();
    };
    const cancelFromUserInput = () => finishProgrammaticScroll();
    const cancelFromKeyboard = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key)) cancelFromUserInput();
    };
    const handleScrollEnd = () => {
      const state = navigationStateRef.current;
      const hasConfirmedProgress = state.mode === "PROGRAMMATIC_SCROLL"
        && state.lastProgressAt !== state.startedAt;

      if (state.mode === "PROGRAMMATIC_SCROLL" && !hasConfirmedProgress) {
        scheduleUpdate();
        return;
      }

      finishProgrammaticScroll();
    };

    applyTrackingGeometry();
    const fixedHeader = document.querySelector<HTMLElement>("[data-site-header-fixed]");
    const information = document.querySelector<HTMLElement>("[data-project-information-start]");
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    if (fixedHeader) resizeObserver.observe(fixedHeader);
    if (information) resizeObserver.observe(information);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("scrollend", handleScrollEnd);
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("wheel", cancelFromUserInput, { passive: true, capture: true });
    window.addEventListener("touchstart", cancelFromUserInput, { passive: true, capture: true });
    window.addEventListener("keydown", cancelFromKeyboard, { capture: true });
    window.addEventListener("popstate", startFromHash);
    window.addEventListener("hashchange", startFromHash);
    if (window.location.hash) window.requestAnimationFrame(startFromHash);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("scrollend", handleScrollEnd);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("wheel", cancelFromUserInput, { capture: true });
      window.removeEventListener("touchstart", cancelFromUserInput, { capture: true });
      window.removeEventListener("keydown", cancelFromKeyboard, { capture: true });
      window.removeEventListener("popstate", startFromHash);
      window.removeEventListener("hashchange", startFromHash);
      resizeObserver.disconnect();
      clearProgrammaticTimers();
      navigationStateRef.current = { mode: "SCROLL_TRACKING" };
      startProgrammaticScrollRef.current = () => undefined;
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
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
          onClick={(event) => {
            event.preventDefault();
            startProgrammaticScrollRef.current(index);
          }}
        >
          <span aria-hidden="true" />
          {section.label}
        </a>
      ))}
    </nav>
  );
}
