// Shared prepared-rendition mapping; renderer and release validation use the same closure.
export function projectImageSource(image){
 const canonical=image.src.replace(/^\/(?:__content|api\/preview-artifacts)\/[a-f0-9]{64}(?=\/assets\/projects\/)/,'');
 const prepared=/^\/assets\/projects\/[a-z0-9]+(?:-[a-z0-9]+)*\/redesign\/imgDesktop[34]\.png$/.test(canonical);
 return {fallback:image.src,sources:prepared?[{type:'image/avif',srcSet:`${image.src.replace('.png','-640.avif')} 640w, ${image.src.replace('.png','-1080.avif')} 1080w`}]:[]};
}
