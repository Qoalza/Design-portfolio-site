import type { ProjectGalleryDeviceId, ProjectImage } from "./project-contract.ts";

const DEVICE_WIDTHS: Record<ProjectGalleryDeviceId, number> = {
  desktop: 740,
  tablet: 400,
  mobile: 180,
};

export function galleryPresentation(deviceId: ProjectGalleryDeviceId, image: Pick<ProjectImage, "width" | "height">) {
  const width = DEVICE_WIDTHS[deviceId];
  return { width, height: width * image.height / image.width };
}
