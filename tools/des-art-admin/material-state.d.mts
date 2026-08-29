import type { ProjectDocument } from "../../src/lib/project-contract";

export function changeProjectMaterialsState(
  materials: ProjectDocument["materials"],
  projectState: ProjectDocument["materials"]["projectState"],
): ProjectDocument["materials"];

export function changeProjectFileState(
  materials: ProjectDocument["materials"],
  fileState: ProjectDocument["materials"]["fileState"],
): ProjectDocument["materials"];
