export const packets=[
 {id:'research',target:'research',label:'02'}, {id:'concept',target:'concept',label:'04'},
 {id:'delivery',target:'delivery',label:'06'}, {id:'connector',target:'connector'}, {id:'branch',target:'branch'}
];
export const slots=['research','concept','delivery','connector','branch'];
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
