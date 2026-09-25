export const RESPONSIVE_HERO_SCALE = .6;
export const MIN_LOGICAL_WIDTH = 360;
export const MAX_DISPLAY_WIDTH = 1160;
export const MIN_DISPLAY_WIDTH = 216;
export const MAX_LOGICAL_WIDTH = MAX_DISPLAY_WIDTH / RESPONSIVE_HERO_SCALE;
export const RESIZE_EDGE_VISIBLE_WIDTH = 40;
export const STAGE_TOP_HEIGHT = 60;

export const ADAPTIVE_PRESETS = {
  min: {
    id: "min",
    logicalWidth: MIN_LOGICAL_WIDTH,
    displayWidth: MIN_DISPLAY_WIDTH,
    productHeight: 384,
  },
  mobile: {
    id: "mobile",
    logicalWidth: 595.256245,
    displayWidth: 595.256245 * RESPONSIVE_HERO_SCALE,
    productHeight: 384,
  },
  tablet: {
    id: "tablet",
    logicalWidth: 1279,
    displayWidth: 1279 * RESPONSIVE_HERO_SCALE,
    productHeight: 660,
  },
  desktop: {
    id: "desktop",
    logicalWidth: 1599,
    displayWidth: 1599 * RESPONSIVE_HERO_SCALE,
    // The supplied scene owns its canvas height at each responsive range.
    // Keep the enclosing frame at the direct .6 scale instead of adding
    // blank space or reflowing the scene to meet an independently taller
    // viewport.
    productHeight: 576,
  },
  max: {
    id: "max",
    logicalWidth: MAX_LOGICAL_WIDTH,
    displayWidth: MAX_DISPLAY_WIDTH,
    productHeight: 576,
  },
};

export function clampLogicalWidth(value) {
  return Math.min(MAX_LOGICAL_WIDTH, Math.max(MIN_LOGICAL_WIDTH, value));
}

export function clampDisplayWidth(value) {
  return Math.min(MAX_DISPLAY_WIDTH, Math.max(MIN_DISPLAY_WIDTH, value));
}

export function getLogicalWidth(displayWidth) {
  return clampDisplayWidth(displayWidth) / RESPONSIVE_HERO_SCALE;
}

export function getIframeLogicalWidth(displayWidth) {
  // The iframe document rounds its viewport to whole CSS pixels. Overscan by
  // less than one logical pixel so its white body cannot peek past the scene.
  return Math.ceil(getLogicalWidth(displayWidth) - 1e-9);
}

export function getAdaptiveRange(logicalWidth) {
  const width = clampLogicalWidth(logicalWidth);
  if (width <= MIN_LOGICAL_WIDTH) return "min";
  if (width < 600) return "mobile";
  if (width < 1280) return "tablet";
  if (width < 1600) return "desktop";
  return "max";
}

export function getExactAdaptivePreset(displayWidth) {
  const preset = Object.values(ADAPTIVE_PRESETS).find(
    ({ displayWidth: presetDisplayWidth }) => Math.abs(presetDisplayWidth - displayWidth) < .5,
  );
  return preset?.id ?? null;
}

export function getProductHeight(adaptive) {
  return ADAPTIVE_PRESETS[adaptive].productHeight;
}

export function getProductHeightForDisplayWidth(displayWidth) {
  return getProductHeight(getAdaptiveRange(getIframeLogicalWidth(displayWidth)));
}

export function getIframeLogicalHeight(displayWidth) {
  return getProductHeightForDisplayWidth(displayWidth) / RESPONSIVE_HERO_SCALE;
}

export function getIframeViewportHeight(displayHeight) {
  // Match the integer document viewport, while the outer clip stays continuous.
  return Math.ceil(displayHeight / RESPONSIVE_HERO_SCALE - 1e-9);
}

export function getStageWidth(displayWidth) {
  return displayWidth + RESIZE_EDGE_VISIBLE_WIDTH;
}

export function getStageHeight(productHeight) {
  return productHeight + STAGE_TOP_HEIGHT;
}

export function geometryFromDrag({
  startDisplayWidth,
  physicalDelta,
}) {
  const displayWidth = clampDisplayWidth(startDisplayWidth + physicalDelta);
  return {
    logicalWidth: getLogicalWidth(displayWidth),
    displayWidth,
  };
}
