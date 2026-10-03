export const rasterPreviewVariants = [
  {id: '2', count: 2},
  {id: '3', count: 3},
  {id: '4', count: 4},
  {id: '5+', count: 8},
];

export function rasterVariantDefinition(base, variantId) {
  const variant = rasterPreviewVariants.find(item => item.id === variantId) ?? rasterPreviewVariants[1];
  const sourceContext = base.contexts.find(context => context.id === base.initialContextId);
  const sourceSlides = sourceContext.slides;
  const initialIndex = Math.min(variant.count - 1,
    Math.max(0, sourceSlides.findIndex(slide => slide.id === sourceContext.initialSlideId)));
  const slides = Array.from({length: variant.count}, (_, index) => {
    const source = sourceSlides[index % sourceSlides.length];
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
