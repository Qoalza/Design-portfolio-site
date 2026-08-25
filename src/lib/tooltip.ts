export type TooltipContent = {
  id: string;
  text: string;
  icon: string;
};

export type TooltipRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type TooltipPlacement = {
  left: number;
  top: number;
  side: "top" | "bottom";
};

export type TooltipPhase = "closed" | "entering" | "open" | "exiting";
export type TooltipEvent = "open" | "entered" | "close" | "exited";

export function isSameTooltipPlacement(
  current: TooltipPlacement | null,
  next: TooltipPlacement,
): boolean {
  return current !== null
    && current.left === next.left
    && current.top === next.top
    && current.side === next.side;
}

export function reduceTooltipPhase(phase: TooltipPhase, event: TooltipEvent): TooltipPhase {
  if (event === "open") return phase === "open" ? "open" : "entering";
  if (event === "close") return phase === "closed" ? "closed" : "exiting";
  if (event === "entered" && phase === "entering") return "open";
  if (event === "exited" && phase === "exiting") return "closed";
  return phase;
}

const TOOLTIP_GAP = 12;
const VIEWPORT_INSET = 12;

export function getTooltipPlacement(
  trigger: TooltipRect,
  tooltip: { width: number; height: number },
  viewport: { width: number; height: number },
): TooltipPlacement {
  const left = Math.max(
    VIEWPORT_INSET,
    Math.min(trigger.left, viewport.width - tooltip.width - VIEWPORT_INSET),
  );
  const bottomTop = trigger.bottom + TOOLTIP_GAP;
  const fitsBelow = bottomTop + tooltip.height <= viewport.height - VIEWPORT_INSET;

  return {
    left,
    top: fitsBelow ? bottomTop : Math.max(VIEWPORT_INSET, trigger.top - TOOLTIP_GAP - tooltip.height),
    side: fitsBelow ? "bottom" : "top",
  };
}
