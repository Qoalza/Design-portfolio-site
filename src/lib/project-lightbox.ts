export type LightboxScaleInput = {
  availableHeight: number;
  availableWidth: number;
  baseHeight: number;
  baseWidth: number;
  dpr: number;
  intrinsicHeight: number;
  intrinsicWidth: number;
};

export type LightboxMediaSizeInput = {
  baseHeight: number;
  baseWidth: number;
  intrinsicHeight: number;
  intrinsicWidth: number;
};

export function calculateContainedPreviewSize({ baseHeight, baseWidth, intrinsicHeight, intrinsicWidth }: LightboxMediaSizeInput) {
  if (![baseHeight, baseWidth, intrinsicHeight, intrinsicWidth].every((value) => Number.isFinite(value) && value > 0)) {
    return { width: 0, height: 0 };
  }
  const scale = Math.min(baseWidth / intrinsicWidth, baseHeight / intrinsicHeight);
  return { width: intrinsicWidth * scale, height: intrinsicHeight * scale };
}

export function calculateLightboxMediaSize({ baseHeight, baseWidth, intrinsicHeight, intrinsicWidth }: LightboxMediaSizeInput) {
  if (![baseHeight, baseWidth, intrinsicHeight, intrinsicWidth].every((value) => Number.isFinite(value) && value > 0)) {
    return { width: 0, height: 0 };
  }
  return {
    width: baseWidth,
    height: baseWidth * intrinsicHeight / intrinsicWidth,
  };
}

export function calculateLightboxScale({
  availableHeight,
  availableWidth,
  baseHeight,
  baseWidth,
  dpr,
  intrinsicHeight,
  intrinsicWidth,
}: LightboxScaleInput): number {
  if ([availableHeight, availableWidth, baseHeight, baseWidth, dpr, intrinsicHeight, intrinsicWidth].some((value) => !Number.isFinite(value) || value <= 0)) {
    return 0;
  }

  return Math.min(
    1.5,
    availableWidth / baseWidth,
    availableHeight / baseHeight,
    intrinsicWidth / (baseWidth * dpr),
    intrinsicHeight / (baseHeight * dpr),
  );
}
