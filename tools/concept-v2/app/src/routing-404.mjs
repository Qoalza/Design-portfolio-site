export const packets=[
 {id:'research',target:'research',label:'02'}, {id:'concept',target:'concept',label:'04'},
 {id:'delivery',target:'delivery',label:'06'}, {id:'connector',target:'connector'}, {id:'gitBranch',target:'gitBranch'}
];
export const slots=['research','concept','delivery','gitBranch','connector'];
export function drop(state,id,point,radius=56){
 const packet=packets.find(item=>item.id===id); if(!packet) return state;
 const occupied=Object.entries(state).find(([,value])=>value===id)?.[0];
 const next={...state}; if(occupied) delete next[occupied];
 const target=Object.entries(point.slots||{}).filter(([slot])=>!next[slot]).map(([slot,pos])=>({slot,d:Math.hypot(point.x-pos.x,point.y-pos.y)})).sort((a,b)=>a.d-b.d)[0];
 if(target&&target.d<=radius) next[target.slot]=id;
 return next;
}
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
  topReach:delivery?6:concept?3:research?1:0,
  topBlue:research?(concept?(delivery?6:3):1):0,
  lowerReach:connector?(gitBranch?12:11):gitBranch?9:0,
  lowerBlue:gitBranch?(connector?12:9):0,
 };
}
