export const packets=[
 {id:'research',target:'research',label:'02'}, {id:'concept',target:'concept',label:'04'},
 {id:'delivery',target:'delivery',label:'06'}, {id:'connector',target:'connector'}, {id:'gitBranch',target:'gitBranch'}
];
export const slots=['research','concept','delivery','gitBranch','connector'];
import {routeLayers} from './routing-404-design.mjs';
export function dropResult(state,id,point,radius=56){
 const packet=packets.find(item=>item.id===id); if(!packet) return {state,slot:null,displaced:null};
 const occupied=Object.entries(state).find(([,value])=>value===id)?.[0];
 const next={...state}; if(occupied) delete next[occupied];
 const target=Object.entries(point.slots||{}).map(([slot,pos])=>({slot,d:Math.hypot(point.x-pos.x,point.y-pos.y)})).sort((a,b)=>a.d-b.d)[0];
 if(!target||target.d>radius)return {state:next,slot:null,displaced:null};
 const displaced=next[target.slot]||null;
 next[target.slot]=id;
 return {state:next,slot:target.slot,displaced};
}
export function drop(state,id,point,radius=56){return dropResult(state,id,point,radius).state;}
export function status(state){
 const correct=Object.entries(state).filter(([slot,id])=>packets.find(item=>item.id===id)?.target===slot).length;
 const wrong=Object.entries(state).filter(([slot,id])=>packets.find(item=>item.id===id)?.target!==slot);
 return {correct,total:packets.length,wrong,launched:correct===packets.length};
}

// A placed packet makes its destination reachable. Blue runs only through an
// uninterrupted sequence of correct packets; gaps on the way are neutral.
export function routeProgress(state){
 const research=state.research==='research',concept=state.concept==='concept',delivery=state.delivery==='delivery';
 const gitBranch=state.gitBranch==='gitBranch',connector=state.connector==='connector';
 return {
  topReach:state.delivery?6:state.concept?3:state.research?1:0,
  topBlue:research?(concept?(delivery?6:3):1):0,
  lowerReach:state.connector?(state.gitBranch?12:11):state.gitBranch?9:0,
  lowerBlue:gitBranch?(connector?12:9):0,
 };
}

export function chooseRoutes(placed,launched,signal){
 if(launched)return routeLayers.final.map((layer,index)=>({state:index===7||index===13?'white':'final',layer}));
 const wrongTop=Object.entries(placed).some(([slot,id])=>slot!==id&&['research','concept','delivery'].includes(slot))?signal.topReach:-1;
 const wrongLower=Object.entries(placed).some(([slot,id])=>slot!==id&&['gitBranch','connector'].includes(slot))?signal.lowerReach:-1;
 return routeLayers.final.map((layer,index)=>{
  if(index<=wrongTop||(index>=8&&index<=wrongLower))return {state:'red',layer};
  if(index===0)return {state:signal.topReach?'final':'neutral',layer};
  if(index===8)return {state:signal.lowerReach?'final':'neutral',layer};
  if(index===7)return {state:placed.delivery==='delivery'?'white':'neutral',layer};
  if(index===13)return {state:placed.connector==='connector'&&placed.gitBranch==='gitBranch'?'white':'neutral',layer};
  const bottom=index>=9,blue=bottom?signal.lowerBlue:signal.topBlue,reach=bottom?signal.lowerReach:signal.topReach;
  if(index<=blue)return {state:'final',layer};
  if(index<=reach)return {state:'white',layer};
  return {state:'neutral',layer};
 });
}
