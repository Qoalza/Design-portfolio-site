const aboutFormats=['avif','webp'];

export function aboutImageSource(id){
 return {
  fallback:`/figma/about-${id}.png`,
  sources:aboutFormats.map(format=>({type:`image/${format}`,srcSet:`/figma/about-${id}-640.${format} 640w, /figma/about-${id}-1080.${format} 1080w`})),
 };
}

const projectAvif=fallback=>[{type:'image/avif',srcSet:`${fallback.replace('.png','-640.avif')} 640w, ${fallback.replace('.png','-1080.avif')} 1080w`}];

export const projectBackImage={fallback:'/figma/imgDesktop3.png',sources:projectAvif('/figma/imgDesktop3.png')};
export const projectFrontImage={fallback:'/figma/imgDesktop4.png',sources:projectAvif('/figma/imgDesktop4.png')};
export const sarafanBackImage={fallback:'/figma/sarafan-desktop-3.png',sources:projectAvif('/figma/sarafan-desktop-3.png')};
export const sarafanFrontImage={fallback:'/figma/sarafan-desktop-4.png',sources:projectAvif('/figma/sarafan-desktop-4.png')};
