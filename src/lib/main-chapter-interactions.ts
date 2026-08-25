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

export type GalleryLayout = {
  offsets: number[];
  maxOffset: number;
};

export type GalleryPointerGesture = {
  kind: "click" | "vertical" | "horizontal-drag";
  step: StepDirection | null;
};

export function getGalleryPointerGesture(deltaX: number, deltaY: number): GalleryPointerGesture {
  const horizontalDistance = Math.abs(deltaX);
  const verticalDistance = Math.abs(deltaY);
  if (horizontalDistance < 8 && verticalDistance < 8) return { kind: "click", step: null };
  if (horizontalDistance <= verticalDistance) return { kind: "vertical", step: null };
  return {
    kind: "horizontal-drag",
    step: horizontalDistance >= 48 ? (deltaX > 0 ? -1 : 1) : null,
  };
}

export type ProjectActionBarGeometry = {
  informationTop: number;
  informationBottom: number;
  viewportHeight: number;
  barHeight: number;
  dpr: number;
};

export type ProjectActionBarState = {
  valid: boolean;
  variant: "full" | "adaptive";
  barTop: number;
  barBottom: number;
};

export type ProjectNavigationRailGeometry = {
  informationTop: number;
  terminalSectionTop: number;
  lastItemOffset: number;
  navigationHeight: number;
};

export type ProjectNavigationMode = "SCROLL_TRACKING" | "PROGRAMMATIC_SCROLL";

export function shouldCancelProjectNavigation(mode: ProjectNavigationMode): boolean {
  return mode === "PROGRAMMATIC_SCROLL";
}

export function shouldScheduleGalleryFrame(isMoving: boolean, isVisible: boolean): boolean {
  return isMoving && isVisible;
}

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
  terminalActivationTop = activationTop,
): number {
  let activeIndex = 0;

  sectionTops.forEach((top, index) => {
    const threshold = index === sectionTops.length - 1 ? terminalActivationTop : activationTop;
    if (Number.isFinite(top) && top <= threshold) {
      activeIndex = index;
    }
  });

  return activeIndex;
}

export function getTerminalSectionActivationTop(
  stickyActivationTop: number,
  actionBarTop: number,
  terminalSectionHeight: number,
): number {
  if (![stickyActivationTop, actionBarTop, terminalSectionHeight].every(Number.isFinite)) {
    return stickyActivationTop;
  }
  const currentTerminalThreshold = Math.max(
    stickyActivationTop,
    actionBarTop - Math.max(0, terminalSectionHeight) / 2,
  );
  const currentAdvance = Math.max(0, currentTerminalThreshold - stickyActivationTop);
  return stickyActivationTop + currentAdvance / 3;
}

export function getProjectNavigationRailHeight({
  informationTop,
  terminalSectionTop,
  lastItemOffset,
  navigationHeight,
}: ProjectNavigationRailGeometry): number {
  const safeNavigationHeight = Number.isFinite(navigationHeight) ? Math.max(0, navigationHeight) : 0;
  if (![informationTop, terminalSectionTop, lastItemOffset, navigationHeight].every(Number.isFinite)) {
    return safeNavigationHeight;
  }

  return Math.max(
    safeNavigationHeight,
    terminalSectionTop - informationTop - Math.max(0, lastItemOffset) + safeNavigationHeight,
  );
}

export function getGalleryLayout(
  itemStarts: number[],
  itemWidths: number[],
  viewportWidth: number,
  dpr = 1,
): GalleryLayout {
  if (
    itemStarts.length === 0
    || itemStarts.length !== itemWidths.length
    || !Number.isFinite(viewportWidth)
    || viewportWidth <= 0
    || !Number.isFinite(dpr)
    || dpr <= 0
  ) {
    return { offsets: [0], maxOffset: 0 };
  }

  const starts = itemStarts.map((value) => normalizePhysicalPixel(value, dpr));
  const contentEnd = Math.max(...starts.map((start, index) => start + itemWidths[index]));
  const maxOffset = normalizePhysicalPixel(Math.max(0, contentEnd - viewportWidth), dpr);
  const offsets = [...new Set(starts.map((start) => Math.min(maxOffset, Math.max(0, start))))];

  if (offsets.at(-1) !== maxOffset) offsets.push(maxOffset);
  return { offsets, maxOffset };
}

export function getGalleryOffsetTarget(
  currentIndex: number,
  direction: StepDirection,
  offsets: number[],
): GalleryTarget {
  return getGalleryTarget(currentIndex, direction, Math.max(1, offsets.length));
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

function getProjectActionBarMetrics(
  geometry: ProjectActionBarGeometry,
): ProjectActionBarState & { informationTop: number; informationBottom: number } {
  const {
    informationTop,
    informationBottom,
    viewportHeight,
    barHeight,
    dpr,
  } = geometry;
  const values = [informationTop, informationBottom, viewportHeight, barHeight, dpr];
  const valid = values.every(Number.isFinite)
    && dpr > 0
    && viewportHeight > 0
    && barHeight > 0;
  const safeViewportHeight = Number.isFinite(viewportHeight) ? Math.max(0, viewportHeight) : 0;
  const safeBarHeight = Number.isFinite(barHeight) ? Math.max(0, barHeight) : 0;
  const invalidBarBottom = safeViewportHeight;
  const invalidBarTop = Math.max(0, invalidBarBottom - safeBarHeight);

  if (!valid) {
    return {
      valid: false,
      variant: "full",
      barTop: invalidBarTop,
      barBottom: invalidBarBottom,
      informationTop: 0,
      informationBottom: 0,
    };
  }

  const normalizedViewportHeight = normalizePhysicalPixel(viewportHeight, dpr);
  const normalizedBarHeight = normalizePhysicalPixel(barHeight, dpr);
  const barBottom = normalizedViewportHeight;
  const barTop = normalizePhysicalPixel(barBottom - normalizedBarHeight, dpr);
  const normalizedInformationTop = normalizePhysicalPixel(informationTop, dpr);
  const normalizedInformationBottom = normalizePhysicalPixel(informationBottom, dpr);
  return {
    valid: true,
    variant: "full",
    barTop,
    barBottom,
    informationTop: normalizedInformationTop,
    informationBottom: normalizedInformationBottom,
  };
}

export function getProjectActionBarInitialState(
  geometry: ProjectActionBarGeometry,
): ProjectActionBarState {
  const metrics = getProjectActionBarMetrics(geometry);
  if (!metrics.valid) {
    return { valid: false, variant: "full", barTop: metrics.barTop, barBottom: metrics.barBottom };
  }
  const informationVisible = metrics.informationTop <= metrics.barTop
    && metrics.informationBottom > metrics.barTop;
  return {
    valid: true,
    variant: informationVisible ? "adaptive" : "full",
    barTop: metrics.barTop,
    barBottom: metrics.barBottom,
  };
}

export function getProjectActionBarScrollState(
  geometry: ProjectActionBarGeometry,
): ProjectActionBarState {
  const metrics = getProjectActionBarMetrics(geometry);
  if (!metrics.valid) {
    return { valid: false, variant: "full", barTop: metrics.barTop, barBottom: metrics.barBottom };
  }
  const informationActive = metrics.informationBottom > metrics.barTop;
  const visibleInformation = metrics.barBottom - metrics.informationTop;
  const thresholdPassed = visibleInformation >= 200;
  const adaptive = informationActive && thresholdPassed;
  return {
    valid: true,
    variant: adaptive ? "adaptive" : "full",
    barTop: metrics.barTop,
    barBottom: metrics.barBottom,
  };
}
