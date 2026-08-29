export function changeProjectMaterialsState(materials, projectState) {
  const hasAvailableFile = materials?.fileState === "available" && Boolean(materials.figmaUrl?.trim());
  if (projectState === "completed") {
    return hasAvailableFile
      ? { projectState: "completed", fileState: "available", figmaUrl: materials.figmaUrl.trim() }
      : { projectState: "completed", fileState: "absent" };
  }
  return hasAvailableFile
    ? {
        projectState: "in_progress",
        fileState: "available",
        figmaUrl: materials.figmaUrl.trim(),
        ...(materials.updatedAt ? { updatedAt: materials.updatedAt } : {}),
      }
    : { projectState: "in_progress", fileState: "unavailable" };
}

export function changeProjectFileState(materials, fileState) {
  if (fileState === "available") {
    return {
      projectState: materials.projectState,
      fileState: "available",
      figmaUrl: materials.figmaUrl?.trim() ?? "",
      ...(materials.projectState === "in_progress" && materials.updatedAt
        ? { updatedAt: materials.updatedAt }
        : {}),
    };
  }
  return materials.projectState === "completed"
    ? { projectState: "completed", fileState: "absent" }
    : { projectState: "in_progress", fileState: "unavailable" };
}
