export const processHoverSpeeds=[1.25*1.15,1.25*1.15,1.25];

export function advanceHoverFrame(frame,active,elapsed,fps,hold,speed=1.25){
 return Math.max(0,Math.min(hold,frame+(active?1:-1)*elapsed*fps*speed/1000));
}
// Smoothstep has zero velocity at both ends; the time clock stays unchanged.
export function easedHoverFrame(timeFrame,hold){
 const progress=Math.max(0,Math.min(1,timeFrame/hold));
 return hold*progress*progress*(3-2*progress);
}

// Color-only copy: both players retain exactly the same paths and keyframes.
export function colorizeProcessAnimation(source){
 const data=structuredClone(source);
 const color=values=>{
  if(values[0]<.2)return [27.05/255,43/255,55.25/255,values[3]??1];
  const mix=Math.max(0,Math.min(1,(values[0]*255-86)/34));
  return [(29+69*mix)/255,(144+40*mix)/255,(235+17*mix)/255,values[3]??1];
 };
 function visit(value){
  if(!value||typeof value!=='object')return;
  if((value.ty==='fl'||value.ty==='st')&&value.c){
   if(value.c.a===0)value.c.k=color(value.c.k);
   else for(const frame of value.c.k){if(frame.s)frame.s=color(frame.s);if(frame.e)frame.e=color(frame.e);}
  }
  for(const child of Object.values(value))visit(child);
 }
 visit(data);return data;
}
