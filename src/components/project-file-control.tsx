import type { ProjectAvailability } from "../lib/projects";
import { ControlButton } from "./ui-controls";

const assetRoot = "/assets/homepage";

type ProjectFileControlProps = {
  className?: string;
  figmaUrl?: string;
  fileState: ProjectAvailability["figma"];
};

export function ProjectFileControl({ className, figmaUrl, fileState }: ProjectFileControlProps) {
  if (fileState === "available" && figmaUrl) {
    return (
      <ControlButton
        className={className}
        variant="ghost"
        href={figmaUrl}
        external
        iconRight={`${assetRoot}/project-share.svg`}
      >
        Figma
      </ControlButton>
    );
  }

  if (fileState === "unavailable") {
    return (
      <ControlButton
        className={className}
        variant="ghost"
        disabled
        iconLeft={`${assetRoot}/project-info.svg`}
      >
        Файл пока недоступен
      </ControlButton>
    );
  }

  return null;
}
