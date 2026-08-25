"use client";

import { createPortal } from "react-dom";
import { type CSSProperties, type ReactNode, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import {
  getTooltipPlacement,
  reduceTooltipPhase,
  type TooltipContent,
  type TooltipPhase,
  type TooltipPlacement,
} from "../lib/tooltip";
import styles from "./tooltip.module.css";

type TooltipProps = {
  children: ReactNode;
  content: Omit<TooltipContent, "id">;
};

type TooltipIconStyle = CSSProperties & { "--tooltip-icon": string };

export function Tooltip({ children, content }: TooltipProps) {
  const reactId = useId();
  const id = `tooltip-${reactId.replace(/:/g, "")}`;
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<TooltipPhase>("closed");
  const [placement, setPlacement] = useState<TooltipPlacement | null>(null);
  const rendered = phase !== "closed";
  const requestOpen = useCallback(() => setPhase((current) => reduceTooltipPhase(current, "open")), []);
  const requestClose = useCallback(() => setPhase((current) => reduceTooltipPhase(current, "close")), []);

  useLayoutEffect(() => {
    if (!rendered) return;

    const update = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      const tooltip = tooltipRef.current?.getBoundingClientRect();
      if (!trigger || !tooltip || tooltip.width <= 0 || tooltip.height <= 0) return;
      setPlacement(getTooltipPlacement(trigger, tooltip, {
        width: window.innerWidth,
        height: window.innerHeight,
      }));
    };

    update();
    const observer = new ResizeObserver(update);
    if (triggerRef.current) observer.observe(triggerRef.current);
    if (tooltipRef.current) observer.observe(tooltipRef.current);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [rendered]);

  useEffect(() => {
    if (phase !== "entering" || !placement) return;
    const frame = window.requestAnimationFrame(() => {
      setPhase((current) => reduceTooltipPhase(current, "entered"));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [phase, placement]);

  useEffect(() => {
    if (phase !== "exiting") return;
    const watchdog = window.setTimeout(() => {
      setPhase((current) => reduceTooltipPhase(current, "exited"));
      setPlacement(null);
    }, 250);
    return () => window.clearTimeout(watchdog);
  }, [phase]);

  useEffect(() => {
    if (!rendered) return;
    const closeOutside = (event: PointerEvent) => {
      if (!triggerRef.current?.contains(event.target as Node)) requestClose();
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [rendered, requestClose]);

  return (
    <>
      <span
        aria-describedby={rendered ? id : undefined}
        className={styles.trigger}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) requestClose();
        }}
        onFocus={requestOpen}
        onMouseEnter={requestOpen}
        onMouseLeave={requestClose}
        onPointerDown={(event) => {
          if (event.pointerType === "touch") {
            event.preventDefault();
            requestOpen();
          }
        }}
        ref={triggerRef}
        tabIndex={0}
      >
        {children}
      </span>
      {rendered && typeof document !== "undefined" ? createPortal(
        <div
          className={styles.tooltip}
          data-open={phase === "open" ? "true" : "false"}
          id={id}
          onTransitionEnd={(event) => {
            if (event.propertyName !== "opacity" || phase !== "exiting") return;
            setPhase((current) => reduceTooltipPhase(current, "exited"));
            setPlacement(null);
          }}
          ref={tooltipRef}
          role="tooltip"
          style={placement ? { left: placement.left, top: placement.top } : undefined}
        >
          <span
            aria-hidden="true"
            className={styles.icon}
            style={{ "--tooltip-icon": `url("${content.icon}")` } as TooltipIconStyle}
          />
          <p className={styles.text}>{content.text}</p>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
