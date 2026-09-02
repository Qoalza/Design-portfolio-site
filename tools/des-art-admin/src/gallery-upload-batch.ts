export type GalleryUploadFailure = { fileName: string; reason: string };

export type GalleryUploadBatchResult<TImage> = {
  accepted: TImage[];
  rejected: GalleryUploadFailure[];
};

export async function uploadGalleryBatch<TFile extends { name: string }, TImage extends { src: string }>(
  files: readonly TFile[],
  availableSlots: number,
  firstImageSrc: string | undefined,
  upload: (file: TFile, referenceSrc: string | undefined) => Promise<TImage>,
): Promise<GalleryUploadBatchResult<TImage>> {
  const accepted: TImage[] = [];
  const rejected: GalleryUploadFailure[] = [];
  let referenceSrc = firstImageSrc;
  let slots = Math.max(0, availableSlots);

  for (const file of files) {
    if (slots === 0) {
      rejected.push({ fileName: file.name, reason: "Лимит пула — 20 изображений." });
      continue;
    }
    try {
      const image = await upload(file, referenceSrc);
      accepted.push(image);
      referenceSrc ??= image.src;
      slots -= 1;
    } catch (error) {
      rejected.push({ fileName: file.name, reason: error instanceof Error ? error.message : "Изображение не удалось загрузить." });
    }
  }
  return { accepted, rejected };
}
