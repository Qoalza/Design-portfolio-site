export const rasterPreviewVariants = [
  {id: '3', count: 3},
  {id: '5', count: 5},
  {id: '5+', count: 7},
];

export function rasterVariantDefinition(base, variantId) {
  const variant = rasterPreviewVariants.find(item => item.id === variantId) ?? rasterPreviewVariants[0];
  const sourceContext = base.contexts.find(context => context.id === base.initialContextId);
  const sourceSlides = sourceContext.slides;
  const initialIndex = Math.min(variant.count - 1,
    Math.max(0, sourceSlides.findIndex(slide => slide.id === sourceContext.initialSlideId)));
  const slides = Array.from({length: variant.count}, (_, index) => {
    // Keep the outer-left comparison frame identical in the 5 and 5+ previews.
    const sourceIndex = variant.count > 5 && index === variant.count - 1
      ? initialIndex
      : index % sourceSlides.length;
    const source = sourceSlides[sourceIndex];
    return {
      ...source,
      id: `${source.id}-${index + 1}`,
      title: index < sourceSlides.length ? source.title : `${source.title} · кадр ${index + 1}`,
    };
  });

  return {
    ...base,
    contexts: base.contexts.map(context => context.id === sourceContext.id ? {
      ...context,
      slides,
      initialSlideId: `${sourceSlides[initialIndex].id}-${initialIndex + 1}`,
    } : context),
  };
}
