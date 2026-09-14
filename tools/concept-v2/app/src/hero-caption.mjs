import {nodes,position} from './network-data.mjs';

export const DEFAULT_CAPTION={key:'default',label:'Исследуйте процесс',icon:'search',active:false};

function asCaption(node){
 return {key:`${node[2]}:${node[3]}`,label:node[3],icon:node[2],active:true};
}

export function resolveCaptionCandidate(point,currentKey){
 if(!point)return null;
 const measured=nodes.map(node=>({node,distance:Math.hypot(position(node).x-point.x,position(node).y-point.y)}));
 const current=measured.find(item=>asCaption(item.node).key===currentKey);
 if(current&&current.distance<80)return asCaption(current.node);
 const nearest=measured.reduce((best,item)=>!best||item.distance<best.distance?item:best,null);
 return nearest&&nearest.distance<64?asCaption(nearest.node):null;
}

export function createCaptionController({onChange,schedule=setTimeout,cancel=clearTimeout}){
 let shown=DEFAULT_CAPTION;
 let defaultTimer=null;
 const clearDefault=()=>{if(defaultTimer!==null)cancel(defaultTimer);defaultTimer=null};
 const commit=caption=>{shown=caption;onChange(caption)};
 return {
  update(point){
   const candidate=resolveCaptionCandidate(point,shown.key);
   if(candidate){
    clearDefault();
    if(candidate.key!==shown.key)commit(candidate);
    return;
   }
   if(shown.key==='default'||defaultTimer!==null)return;
   defaultTimer=schedule(()=>{defaultTimer=null;commit(DEFAULT_CAPTION)},160);
  },
  destroy(){clearDefault()},
  current(){return shown},
 };
}
