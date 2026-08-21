export type StepDirection = -1 | 1;

type BoundedTarget = {
  index: number;
};

export type ProcessStepTarget = BoundedTarget & {
  consumed: boolean;
};

export type ProcessWheelDecision = ProcessStepTarget & {
  shouldAdvance: boolean;
};

export type GalleryTarget = BoundedTarget & {
  available: boolean;
};

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

export function getProcessWheelDecision(
  currentIndex: number,
  direction: StepDirection,
  stepCount: number,
  gestureLocked: boolean,
): ProcessWheelDecision {
  if (gestureLocked) {
    return { consumed: true, index: currentIndex, shouldAdvance: false };
  }

  const target = getProcessStepTarget(currentIndex, direction, stepCount);
  return { ...target, shouldAdvance: target.consumed };
}

export function getGalleryTarget(
  currentIndex: number,
  direction: StepDirection,
  itemCount: number,
): GalleryTarget {
  const index = getBoundedTarget(currentIndex, direction, itemCount);
  return { available: index !== currentIndex, index };
}

export function getActionBarVariant(informationStartTop: number): "full" | "adaptive" {
  return informationStartTop <= 0 ? "adaptive" : "full";
}
