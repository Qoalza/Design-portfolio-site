export function resolveRasterSelection(definition,requested){
 const available=definition.contexts.filter(context=>context.slides.length);
 const context=available.find(context=>context.id===requested?.contextId)
  ??available.find(context=>context.id===definition.initialContextId)??available[0];
 if(!context)throw new Error('Raster Hero requires an available context.');
 const slide=context.slides.find(slide=>slide.id===requested?.slideId)
  ??context.slides.find(slide=>slide.id===context.initialSlideId)??context.slides[0];
 return {contextId:context.id,slideId:slide.id};
}
