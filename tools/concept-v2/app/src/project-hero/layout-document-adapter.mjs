import {
 ADAPTIVE_PRESETS,RESPONSIVE_HERO_SCALE,MAX_LOGICAL_WIDTH,MIN_LOGICAL_WIDTH,
 getAdaptiveRange,getExactAdaptivePreset,getIframeLogicalWidth,getProductHeightForDisplayWidth,
} from './width.mjs';
import {MAGNETIC_SNAP_RADIUS,getMagneticPreset} from './motion.mjs';
import {corvoResponsiveHero} from './definition.mjs';

const acceptedRanges=[
 {id:'mobile',minWidth:MIN_LOGICAL_WIDTH,maxWidth:600,presetWidth:ADAPTIVE_PRESETS.mobile.logicalWidth,height:ADAPTIVE_PRESETS.mobile.productHeight/RESPONSIVE_HERO_SCALE},
 {id:'tablet',minWidth:600,maxWidth:1280,presetWidth:ADAPTIVE_PRESETS.tablet.logicalWidth,height:ADAPTIVE_PRESETS.tablet.productHeight/RESPONSIVE_HERO_SCALE},
 {id:'desktop',minWidth:1280,maxWidth:MAX_LOGICAL_WIDTH,presetWidth:ADAPTIVE_PRESETS.desktop.logicalWidth,height:ADAPTIVE_PRESETS.desktop.productHeight/RESPONSIVE_HERO_SCALE},
];
// Validated metadata owns limits and heights; no scene content or motion is synthesized here.
export function createLayoutGeometry(hero){
 if(hero.kind!=='layout')throw new Error('Expected a validated layout Hero document.');
 for(const scene of hero.scenes)for(const range of scene.adaptives){
  const maximum=range.maxWidth===MAX_LOGICAL_WIDTH?Math.ceil(range.maxWidth):Math.ceil(range.maxWidth)-1;
  if(range.minWidth===range.maxWidth||Math.ceil(range.minWidth)>maximum)throw new Error('Layout range must contain an integer iframe viewport width.');
 }
 function rangesFor(sceneId){
  const scene=hero.scenes.find(scene=>scene.id===sceneId);
  if(!scene)throw new Error('Unknown layout scene.');
  return scene.adaptives.filter(range=>hero.adaptives.enabled.includes(range.id)).sort((a,b)=>a.minWidth-b.minWidth);
 }
 function upperEdge(range,ranges){
  // Interior metadata ranges are half-open. At a disabled boundary the integer iframe must stay inside the selected range.
  if(range.maxWidth===MAX_LOGICAL_WIDTH||ranges.some(next=>next.minWidth===range.maxWidth))return range.maxWidth;
  return Math.ceil(range.maxWidth)-1;
 }
 function legacy(sceneId){
  const ranges=rangesFor(sceneId);
  return ranges.length===acceptedRanges.length&&ranges.every((range,index)=>Object.entries(acceptedRanges[index]).every(([key,value])=>range[key]===value));
 }
 function constrainTarget(sceneId,value,previous=value){
  if(!Number.isFinite(value)||!Number.isFinite(previous))throw new Error('Layout width must be finite.');
  const ranges=rangesFor(sceneId);
  if(ranges.some(range=>value>=range.minWidth&&value<=upperEdge(range,ranges)))return value;
  const edges=ranges.flatMap(range=>[range.minWidth,upperEdge(range,ranges)]);
  return edges.reduce((best,edge)=>{
   const distance=Math.abs(edge-value),bestDistance=Math.abs(best-value);
   return distance<bestDistance||(distance===bestDistance&&Math.abs(edge-previous)<Math.abs(best-previous))?edge:best;
  },edges[0]);
 }
 function resolveGeometry(sceneId,value,previous=value){
  const logicalWidth=constrainTarget(sceneId,value,previous),displayWidth=logicalWidth*RESPONSIVE_HERO_SCALE;
  const iframeWidth=getIframeLogicalWidth(displayWidth),ranges=rangesFor(sceneId);
  // Integer iframe overscan follows the next touching range; a disabled/gapped range never supplies height.
  const range=ranges.find(range=>iframeWidth>=range.minWidth&&iframeWidth<range.maxWidth)
   ??ranges.find(range=>logicalWidth>=range.minWidth&&logicalWidth<=range.maxWidth);
  const productHeight=legacy(sceneId)?getProductHeightForDisplayWidth(displayWidth):range.height*RESPONSIVE_HERO_SCALE;
  const activeRange=legacy(sceneId)?getAdaptiveRange(logicalWidth)
   :logicalWidth===ranges[0].minWidth?'min':logicalWidth===upperEdge(ranges.at(-1),ranges)?'max':range.id;
  return {logicalWidth,displayWidth,iframeWidth,productHeight,iframeHeight:productHeight/RESPONSIVE_HERO_SCALE,range:activeRange};
 }
 function resolvePreset(sceneId,id){
  if(legacy(sceneId))return ADAPTIVE_PRESETS[id]??null;
  const ranges=rangesFor(sceneId),range=ranges.find(range=>range.id===id);
  if(!range&&id!=='min'&&id!=='max')return null;
  const value=id==='min'?ranges[0].minWidth:id==='max'?upperEdge(ranges.at(-1),ranges):range.presetWidth;
  const geometry=resolveGeometry(sceneId,value);
  return {id,logicalWidth:geometry.logicalWidth,displayWidth:geometry.displayWidth,productHeight:geometry.productHeight};
 }
 function getEnabledPresets(sceneId){return ['min',...rangesFor(sceneId).map(range=>range.id),'max'];}
 function nearestPreset(sceneId,displayWidth,radius){
  let closest=null,distance=Infinity;
  for(const id of getEnabledPresets(sceneId)){
   const delta=Math.abs(resolvePreset(sceneId,id).displayWidth-displayWidth);
   if(delta<=radius&&delta<distance){closest=id;distance=delta;}
  }
  return closest;
 }
 return {
  constrainTarget,resolveGeometry,resolvePreset,getEnabledPresets,rangesFor,isLegacy:legacy,
  exactPreset(sceneId,displayWidth){return legacy(sceneId)?getExactAdaptivePreset(displayWidth):nearestPreset(sceneId,displayWidth,.5-Number.EPSILON);},
  magneticPreset(sceneId,displayWidth){return legacy(sceneId)?getMagneticPreset(displayWidth):nearestPreset(sceneId,displayWidth,MAGNETIC_SNAP_RADIUS);},
 };
}

export function layoutHeroDefinition(project){
 const hero=project.redesign.hero;
 if(hero.kind!=='layout')throw new Error('Expected a validated layout Hero document.');
 return {
  kind:'responsive-viewer',sceneSetId:hero.chromeProfile,chromeAssetRoot:corvoResponsiveHero.chromeAssetRoot,initialSceneId:hero.initialSceneId,
  scenes:hero.scenes.map(scene=>{
   const chrome=corvoResponsiveHero.scenes.find(item=>item.id===scene.id);
   return {id:scene.id,label:scene.title,icon:chrome.icon,tabWidth:chrome.tabWidth,src:scene.source.kind==='url'?scene.source.url:scene.source.assetBase+scene.source.entry};
  }),
  geometry:createLayoutGeometry(hero),
 };
}
