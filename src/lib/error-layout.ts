export function calculateErrorStageScale(
  viewportHeight: number,
  footerHeight = 60,
  stageHeight = 900,
) {
  if (
    !Number.isFinite(viewportHeight) ||
    !Number.isFinite(footerHeight) ||
    !Number.isFinite(stageHeight) ||
    viewportHeight <= 0 ||
    footerHeight < 0 ||
    stageHeight <= 0
  ) {
    return 1;
  }

  return Math.min(1, Math.max(0, (viewportHeight - footerHeight) / stageHeight));
}
