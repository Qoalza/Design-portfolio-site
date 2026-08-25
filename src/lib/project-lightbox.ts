export type LightboxScaleInput = {
  availableHeight: number;
  availableWidth: number;
  baseHeight: number;
  baseWidth: number;
  dpr: number;
  intrinsicHeight: number;
  intrinsicWidth: number;
};

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
