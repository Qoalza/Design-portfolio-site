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

export function getActionBarVariant(
  informationStartTop: number,
  headerBottom: number,
): "full" | "adaptive" {
  return informationStartTop <= headerBottom ? "adaptive" : "full";
}
