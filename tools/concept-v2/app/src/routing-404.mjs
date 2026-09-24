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

// A placed packet makes its destination reachable. Fixed markers do not
// interrupt either branch; progress is still used for their visual state.
export function routeProgress(state){
 const research=state.research==='research',concept=state.concept==='concept',delivery=state.delivery==='delivery';
 const gitBranch=state.gitBranch==='gitBranch',connector=state.connector==='connector';
 return {
  topReach:state.delivery?6:state.concept?3:state.research?1:0,
  topBlue:research?(concept?(delivery?6:3):1):0,
  lowerReach:state.connector?12:state.gitBranch?9:0,
  lowerBlue:gitBranch?(connector?12:9):0,
 };
}

export function chooseRoutes(placed,launched,signal){
 if(launched)return routeLayers.final.map((layer,index)=>({state:[0,7,8,13].includes(index)?'white':'final',layer}));
 const states=routeLayers.final.map(()=>'neutral');
 if(signal.topReach)states[0]='white';
 if(signal.lowerReach)states[8]='white';
 const paintBranch=(triggers,entrance)=>{
  let previous=-1,previousEnd=entrance;
  triggers.forEach(({slot,end},index)=>{
   const packet=placed[slot];if(!packet)return;
   const gap=triggers.slice(previous+1,index).some(trigger=>!placed[trigger.slot]);
   const color=packet!==slot?'red':gap?'white':'final';
   for(let segment=previousEnd+1;segment<=end;segment++)states[segment]=color;
   previous=index;previousEnd=end;
  });
 };
 paintBranch([{slot:'research',end:1},{slot:'concept',end:3},{slot:'delivery',end:6}],0);
 paintBranch([{slot:'gitBranch',end:9},{slot:'connector',end:11}],8);
 if(placed.delivery)states[7]='white';
 if(placed.connector){states[12]=states[11];states[13]='white';}
 return routeLayers.final.map((layer,index)=>({state:states[index],layer}));
}

export function fixedNodeVisual(node,signal,routes){
 const thresholds={'01':['topReach',1],'03':['topReach',2],'05.1':['topReach',4],
  '05.2':['topReach',5],'А2':['lowerReach',9],'C1':['lowerReach',10],'Б8':['lowerReach',12]};
 const [reachKey,threshold]=thresholds[node.id];
 if(signal[reachKey]<threshold)return 'default';
 if(node.final==='other')return 'other';
 const throughSegment={'03':2,'05.1':4,'05.2':5,'C1':10};
 if(Object.hasOwn(throughSegment,node.id)){
  const state=routes[throughSegment[node.id]].state;
  return state==='final'?'active':state==='red'?'error':'other';
 }
 const blueKey=reachKey==='topReach'?'topBlue':'lowerBlue';
 return signal[blueKey]>=threshold?'active':'other';
}
