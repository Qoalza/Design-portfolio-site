import type { ProjectFrameComposition } from "./project-contract";

export function hasVisibleFrameFill(composition: Pick<ProjectFrameComposition, "background" | "hasVisualFill">) {
  if (composition.hasVisualFill !== undefined) return composition.hasVisualFill;
  const background = composition.background.trim().toLowerCase();
  if (!background || background === "transparent") return false;

  const rgba = background.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\s*\)$/);
  if (rgba) return Number(rgba[1]) > 0;

  const hsla = background.match(/^hsla\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\s*\)$/);
  if (hsla) return Number(hsla[1]) > 0;

  return true;
}
