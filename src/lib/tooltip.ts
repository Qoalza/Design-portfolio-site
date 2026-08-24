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
