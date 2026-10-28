import {useState} from 'react';
import {resolveRasterSelection} from './raster-selection.mjs';

// Only the document owner persists selection; renderers own their motion state.
export function useRasterSelection(definition,provided,onChange){
 const [local,setLocal]=useState(()=>resolveRasterSelection(definition));
 const selection=resolveRasterSelection(definition,provided??local);
 const context=definition.contexts.find(context=>context.id===selection.contextId);
 const index=context.slides.findIndex(slide=>slide.id===selection.slideId);
 const update=next=>{
  const resolve=current=>resolveRasterSelection(definition,typeof next==='function'?next(current):next);
  if(provided===undefined)setLocal(resolve);
  else onChange(resolve);
 };
 return {selection,context,index,update};
}
