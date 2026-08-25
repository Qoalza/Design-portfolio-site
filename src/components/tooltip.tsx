"use client";

import { createPortal } from "react-dom";
import { type CSSProperties, type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { getTooltipPlacement, type TooltipContent, type TooltipPlacement } from "../lib/tooltip";
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
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<TooltipPlacement | null>(null);

  useLayoutEffect(() => {
    if (!open) return;

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
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!triggerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  return (
    <>
      <span
        aria-describedby={open ? id : undefined}
        className={styles.trigger}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
        }}
        onFocus={() => setOpen(true)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onPointerDown={(event) => {
          if (event.pointerType === "touch") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        ref={triggerRef}
        tabIndex={0}
      >
        {children}
      </span>
      {open && typeof document !== "undefined" ? createPortal(
        <div
          className={styles.tooltip}
          data-open={placement ? "true" : "false"}
          id={id}
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
