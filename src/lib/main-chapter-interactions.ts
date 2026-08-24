export type StepDirection = -1 | 1;

type BoundedTarget = {
  index: number;
};

export type ProcessStepTarget = BoundedTarget & {
  consumed: boolean;
};

export type GalleryTarget = BoundedTarget & {
  available: boolean;
};

export type ProjectActionBarGeometry = {
  informationTop: number;
  informationBottom: number;
  galleryTop: number;
  footerTop: number;
  viewportHeight: number;
  barHeight: number;
  dpr: number;
};

export type ProjectActionBarState = {
  valid: boolean;
  variant: "full" | "adaptive";
  footerOffset: number;
  barTop: number;
  barBottom: number;
  visibleInformationInBarBand: number;
};

export const NAVIGATION_WATCHDOG_MS = 2000;
export const NAVIGATION_ABSOLUTE_LIMIT_MS = 30000;

type NavigationProgressInput = {
  now: number;
  startedAt: number;
  lastProgressAt: number;
  previousDistance: number;
  currentDistance: number;
};

type NavigationProgressState = {
  outcome: "pending" | "progress" | "watchdog" | "absolute-limit";
  lastProgressAt: number;
  lastDistance: number;
};

export function getNavigationProgressState({
  now,
  startedAt,
  lastProgressAt,
  previousDistance,
  currentDistance,
}: NavigationProgressInput): NavigationProgressState {
  if (now - startedAt >= NAVIGATION_ABSOLUTE_LIMIT_MS) {
    return { outcome: "absolute-limit", lastProgressAt, lastDistance: currentDistance };
  }

  if (previousDistance - currentDistance > 0.5) {
    return { outcome: "progress", lastProgressAt: now, lastDistance: currentDistance };
  }

  if (now - lastProgressAt >= NAVIGATION_WATCHDOG_MS) {
    return { outcome: "watchdog", lastProgressAt, lastDistance: currentDistance };
  }

  return { outcome: "pending", lastProgressAt, lastDistance: currentDistance };
}

export function getActiveProjectSectionIndex(
  sectionTops: number[],
  activationTop: number,
): number {
  let activeIndex = 0;

  sectionTops.forEach((top, index) => {
    if (Number.isFinite(top) && top <= activationTop) {
      activeIndex = index;
    }
  });

  return activeIndex;
}

function getBoundedTarget(currentIndex: number, direction: StepDirection, itemCount: number): number {
  const lastIndex = Math.max(0, itemCount - 1);
  return Math.min(lastIndex, Math.max(0, currentIndex + direction));
}

export function getProcessStepTarget(
  currentIndex: number,
  direction: StepDirection,
  stepCount: number,
): ProcessStepTarget {
  const index = getBoundedTarget(currentIndex, direction, stepCount);
  return { consumed: index !== currentIndex, index };
}

export function getGalleryTarget(
  currentIndex: number,
  direction: StepDirection,
  itemCount: number,
): GalleryTarget {
  const index = getBoundedTarget(currentIndex, direction, itemCount);
  return { available: index !== currentIndex, index };
}

function normalizePhysicalPixel(value: number, dpr: number): number {
  return Math.round(value * dpr) / dpr;
}

export function getProjectActionBarState(
  geometry: ProjectActionBarGeometry,
): ProjectActionBarState {
  const {
    informationTop,
    informationBottom,
    galleryTop,
    footerTop,
    viewportHeight,
    barHeight,
    dpr,
  } = geometry;
  const values = [informationTop, informationBottom, galleryTop, footerTop, viewportHeight, barHeight, dpr];
  const valid = values.every(Number.isFinite)
    && dpr > 0
    && viewportHeight > 0
    && barHeight > 0
    && informationBottom >= informationTop;
  const safeViewportHeight = Number.isFinite(viewportHeight) ? Math.max(0, viewportHeight) : 0;
  const safeBarHeight = Number.isFinite(barHeight) ? Math.max(0, barHeight) : 0;
  const invalidBarBottom = safeViewportHeight;
  const invalidBarTop = Math.max(0, invalidBarBottom - safeBarHeight);

  if (!valid) {
    return {
      valid: false,
      variant: "full",
      footerOffset: 0,
      barTop: invalidBarTop,
      barBottom: invalidBarBottom,
      visibleInformationInBarBand: 0,
    };
  }

  const normalizedViewportHeight = normalizePhysicalPixel(viewportHeight, dpr);
  const normalizedBarHeight = normalizePhysicalPixel(barHeight, dpr);
  const normalizedFooterTop = normalizePhysicalPixel(footerTop, dpr);
  const footerOffset = normalizePhysicalPixel(
    Math.max(0, normalizedViewportHeight - normalizedFooterTop),
    dpr,
  );
  const barBottom = normalizePhysicalPixel(normalizedViewportHeight - footerOffset, dpr);
  const barTop = normalizePhysicalPixel(barBottom - normalizedBarHeight, dpr);
  const normalizedInformationTop = normalizePhysicalPixel(informationTop, dpr);
  const normalizedInformationBottom = normalizePhysicalPixel(informationBottom, dpr);
  const normalizedGalleryTop = normalizePhysicalPixel(galleryTop, dpr);
  const visibleInformationInBarBand = normalizePhysicalPixel(Math.max(
    0,
    Math.min(normalizedInformationBottom, barBottom) - Math.max(normalizedInformationTop, barTop),
  ), dpr);
  const galleryHasEnteredBarBand = normalizedGalleryTop < barBottom;
  const variant = !galleryHasEnteredBarBand && visibleInformationInBarBand >= normalizedBarHeight
    ? "adaptive"
    : "full";

  return {
    valid: true,
    variant,
    footerOffset,
    barTop,
    barBottom,
    visibleInformationInBarBand,
  };
}
