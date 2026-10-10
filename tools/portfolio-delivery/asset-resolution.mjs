import { projectImageSource } from '../../src/lib/project-image-source.mjs';
import { independentProjectCopy } from '../../src/lib/project-copy.ts';
import { digestPattern } from './contract.mjs';
function prefix(generation) {
 if (!digestPattern.test(generation.contentId)) throw new Error('Invalid content identity.');
 return `/__content/${generation.contentId}`;
}
export function scopedAssetPath(generation, canonical) {
 if (!generation.assets.some(asset => asset.publicPath === canonical)) throw new Error('Asset is outside generation manifest.');
 return prefix(generation) + canonical;
}
export function canonicalAssetPath(generation, scoped) {
 const base = prefix(generation);
 if (typeof scoped !== 'string' || !scoped.startsWith(base + '/assets/projects/')) throw new Error('Wrong scoped generation.');
 const canonical = scoped.slice(base.length);
 scopedAssetPath(generation,canonical);
 return canonical;
}
// Map only manifest-owned exact URL values, including package bases. No string rewriting
// of text, external URLs, immutable package bytes or authoring documents occurs.
export function renderedProjects(generation,base=prefix(generation)) {
 if(!/^\/(?:__content|api\/preview-artifacts)\/[a-f0-9]{64}$/.test(base))throw new Error('Invalid resource presentation namespace.');
 const urls = new Map(generation.assets.map(asset => [asset.publicPath,base + asset.publicPath]));
 for (const project of generation.projects) if (project.redesign.hero.kind === 'layout') for (const scene of project.redesign.hero.scenes) if (scene.source.kind === 'package') urls.set(scene.source.assetBase,base + scene.source.assetBase);
 function map(value,key) {
  if (typeof value === 'string') {
   if(base.startsWith('/api/preview-artifacts/')&&key==='href'&&/^\/projects(?:\/|$)/.test(value))return base+value;
   return ['src','href','assetBase'].includes(key) ? urls.get(value) ?? value : value;
  }
  if (Array.isArray(value)) return value.map(child => map(child,key));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,child]) => [key,map(child,key)]));
  return value;
 }
 return generation.projects.map(project => map(independentProjectCopy(project)));
}
export function scopedProjectImageSource(generation,image) {
 const canonical = image.src.startsWith('/__content/') ? canonicalAssetPath(generation,image.src) : image.src;
 const source = projectImageSource({...image,src:canonical});
 return {fallback:scopedAssetPath(generation,source.fallback),sources:source.sources.map(source => ({...source,srcSet:source.srcSet.split(',').map(part => {
  const [src,...descriptor] = part.trim().split(/\s+/);
  return [scopedAssetPath(generation,src),...descriptor].join(' ');
 }).join(', ')}))};
}
