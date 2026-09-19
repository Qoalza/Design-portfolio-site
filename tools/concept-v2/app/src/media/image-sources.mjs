const aboutFormats=['avif','webp'];

export function aboutImageSource(id){
 return {
  fallback:`/figma/about-${id}.png`,
  sources:aboutFormats.map(format=>({type:`image/${format}`,srcSet:`/figma/about-${id}-640.${format} 640w, /figma/about-${id}-1080.${format} 1080w`})),
 };
}

export const projectBackImage={fallback:'/figma/imgDesktop3.png',sources:[]};
export const projectFrontImage={fallback:'/figma/imgDesktop4.png',sources:[]};
