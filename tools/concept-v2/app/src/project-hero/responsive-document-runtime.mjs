import {ADAPTIVE_PRESETS,geometryFromDrag,getAdaptiveRange,getExactAdaptivePreset,getLogicalWidth,getProductHeightForDisplayWidth} from './width.mjs';
import {getMagneticPreset,isOutwardBoundaryMotion} from './motion.mjs';

// Metadata selects valid inputs; the accepted motion helpers and transitions remain the engine.
export function createResponsiveRuntime(definition){
 const adapter=definition.geometry;
 const legacy=sceneId=>!adapter||adapter.isLegacy(sceneId);
 const preset=(sceneId,id)=>adapter?adapter.resolvePreset(sceneId,id):ADAPTIVE_PRESETS[id]??null;
 function displayWidth(sceneId,value){return legacy(sceneId)?value:adapter.resolveGeometry(sceneId,getLogicalWidth(value)).displayWidth;}
 function drag(sceneId,input){
  const next=geometryFromDrag(input);
  if(legacy(sceneId))return next;
  const resolved=adapter.resolveGeometry(sceneId,next.logicalWidth,getLogicalWidth(input.startDisplayWidth));
  return {logicalWidth:resolved.logicalWidth,displayWidth:resolved.displayWidth};
 }
 return {
  preset,displayWidth,drag,
  height(sceneId,value){return legacy(sceneId)?getProductHeightForDisplayWidth(value):adapter.resolveGeometry(sceneId,getLogicalWidth(value)).productHeight;},
  range(sceneId,value){return adapter?adapter.resolveGeometry(sceneId,value).range:getAdaptiveRange(value);},
  exact(sceneId,value){return adapter?adapter.exactPreset(sceneId,value):getExactAdaptivePreset(value);},
  magnetic(sceneId,value){return adapter?adapter.magneticPreset(sceneId,value):getMagneticPreset(value);},
  outward(sceneId,value,delta){
   if(legacy(sceneId))return isOutwardBoundaryMotion(value,delta);
   return (value<=preset(sceneId,'min').displayWidth+.5&&delta<0)||(value>=preset(sceneId,'max').displayWidth-.5&&delta>0);
  },
  signature(sceneId){return adapter?JSON.stringify(adapter.rangesFor(sceneId)):'legacy';},
  controls(sceneId,layouts){
   if(legacy(sceneId))return layouts;
   const ranges=adapter.rangesFor(sceneId);
   return layouts.map(layout=>{
    const range=ranges.find(range=>range.id===layout.id),target=preset(sceneId,layout.id);
    const value=layout.id==='min'||layout.id==='max'?String(Math.round(target.logicalWidth)):range?`${Math.ceil(range.minWidth)}x${Math.ceil(range.maxWidth)-1}`:layout.value;
    return {...layout,value,disabled:target===null};
   });
  },
 };
}
