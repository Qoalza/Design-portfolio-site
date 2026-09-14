export const ABOUT_CARD_ANIMATION_MS=500;
export const ABOUT_CARD_FRAME={width:480,height:420,frontWidth:320,frontHeight:420,backWidth:256,backHeight:336};
export const ABOUT_VIEWER_CARD_FRAME={width:480,height:420,frontWidth:320,frontHeight:420,backWidth:191,backHeight:296};

const FRONT={x:80,y:0,width:320,height:420};
const LEFT={x:24,y:42,width:256,height:336};
const RIGHT={x:200,y:42,width:256,height:336};
const OUT_MID={x:1,y:27.5625,width:278,height:364.875};
const IN_MID={x:287,y:60.284,width:193,height:299.432};
const THIRD_MID={x:168,y:62,width:191,height:296};

/* The viewer remains on its previously approved geometry.  The new 0.8×
   instance is only for the embedded About carousel. */
const VIEWER_LEFT={x:0,y:62,width:191,height:296};
const VIEWER_RIGHT={x:289,y:62,width:191,height:296};
const VIEWER_BACK_SCALE=296/420;

const FRONT_SCALE=1;
const BACK_SCALE=.8;
const OUT_MID_SCALE=.86875;
const IN_MID_SCALE=.7129333333333333;

const clamp=value=>Math.max(0,Math.min(1,value));
const lerp=(from,to,progress)=>from+(to-from)*progress;
const cubic=(from,controlA,controlB,to,progress)=>{
 const inverse=1-progress;
 return inverse**3*from+3*inverse**2*progress*controlA+3*inverse*progress**2*controlB+progress**3*to;
};
const easing=progress=>.5-Math.cos(Math.PI*clamp(progress))/2;
const mirror=frame=>({...frame,x:ABOUT_CARD_FRAME.width-(frame.x+frame.width)});

export function wrapAboutCard(index,count=3){return(index%count+count)%count;}
export function aboutCardSlots(active,count=3){return{front:active,left:wrapAboutCard(active-1,count),right:wrapAboutCard(active+1,count)};}
export function aboutNextCard(active,direction,count=3){return wrapAboutCard(active+direction,count);}

function compose(frame,frontness,zIndex,contentScale){
 const bounded={...frame,x:Math.max(0,Math.min(ABOUT_CARD_FRAME.width-frame.width,frame.x))};
 return {...bounded,contentScale,frontness,rearStrength:1-frontness,zIndex};
}

export function aboutRestFrame(slot,variant='embedded'){
 const left=variant==='viewer'?VIEWER_LEFT:LEFT;
 const right=variant==='viewer'?VIEWER_RIGHT:RIGHT;
 const backScale=variant==='viewer'?VIEWER_BACK_SCALE:BACK_SCALE;
 if(slot==='front')return compose(FRONT,1,3,FRONT_SCALE);
 if(slot==='left')return compose(left,0,1,backScale);
 return compose(right,0,2,backScale);
}

export function aboutDeckFrames(active,count=3,variant='embedded'){
 const slots=aboutCardSlots(active,count);
 return Array.from({length:count},(_,index)=>aboutRestFrame(index===slots.front?'front':index===slots.left?'left':'right',variant));
}

function hermite(from,fromTangent,to,toTangent,progress){
 const t=clamp(progress),t2=t*t,t3=t2*t;
 return (2*t3-3*t2+1)*from+(t3-2*t2+t)*fromTangent+(-2*t3+3*t2)*to+(t3-t2)*toTangent;
}

/* One continuous curve crosses the storyboard midpoint without stopping there.
   The shared tangent makes the cards keep their velocity through the handoff. */
function throughMidpoint(from,mid,to,progress,arc=0){
 const p=clamp(progress),segment=p<=.5?0:1,t=segment?p*2-1:p*2;
 const pointA=segment?mid:from,pointB=segment?to:mid;
 const tangentMid={x:(to.x-from.x)/2,y:(to.y-from.y)/2+arc,width:(to.width-from.width)/2,height:(to.height-from.height)/2};
 const zero={x:0,y:0,width:0,height:0};
 const startTangent=segment?tangentMid:zero,endTangent=segment?zero:tangentMid;
 return {
  x:hermite(pointA.x,startTangent.x,pointB.x,endTangent.x,t),
  y:hermite(pointA.y,startTangent.y,pointB.y,endTangent.y,t),
  width:hermite(pointA.width,startTangent.width,pointB.width,endTangent.width,t),
  height:hermite(pointA.height,startTangent.height,pointB.height,endTangent.height,t),
 };
}

function throughScale(from,mid,to,progress){
 const p=clamp(progress),second=p>.5,t=second?p*2-1:p*2;
 const pointA=second?mid:from,pointB=second?to:mid;
 const tangent=(to-from)/2;
 return hermite(pointA,second?tangent:0,pointB,second?0:tangent,t);
}

export function aboutTransitionFrames({active,direction=1,progress=0,count=3,variant='embedded'}){
 const p=clamp(progress);
 const slots=aboutCardSlots(active,count);
 const reverse=direction===-1;
 const left=variant==='viewer'?VIEWER_LEFT:LEFT;
 const right=variant==='viewer'?VIEWER_RIGHT:RIGHT;
 const backScale=variant==='viewer'?VIEWER_BACK_SCALE:BACK_SCALE;
 const outgoingEnd=reverse?right:left;
 const incomingStart=reverse?left:right;
 const thirdStart=reverse?right:left;
 const thirdEnd=reverse?left:right;
 const outgoingMid=reverse?mirror(OUT_MID):OUT_MID;
 const incomingMid=reverse?mirror(IN_MID):IN_MID;
 const thirdMid=reverse?mirror(THIRD_MID):THIRD_MID;
 const outgoing=compose(throughMidpoint(FRONT,outgoingMid,outgoingEnd,p,reverse?-12:12),1-p,p<.5?3:2,throughScale(FRONT_SCALE,OUT_MID_SCALE,backScale,p));
 const incoming=compose(throughMidpoint(incomingStart,incomingMid,FRONT,p,reverse?8:-8),p,p<.5?2:3,throughScale(backScale,IN_MID_SCALE,FRONT_SCALE,p));
 const third=compose(throughMidpoint(thirdStart,thirdMid,thirdEnd,p,reverse?-6:6),0,1,throughScale(backScale,backScale,backScale,p));
 const incomingIndex=reverse?slots.left:slots.right;
 const thirdIndex=reverse?slots.right:slots.left;
 return Array.from({length:count},(_,index)=>index===slots.front?outgoing:index===incomingIndex?incoming:third);
}

export function interpolateDeckFrames(fromFrames,toFrames,progress,initialVelocity=[]){
 const p=clamp(progress);
 return fromFrames.map((from,index)=>{
  const to=toFrames[index];
  const velocity=initialVelocity[index]??{};
  const frame={
   x:hermite(from.x,(velocity.x??0)*ABOUT_CARD_ANIMATION_MS,to.x,0,p),
   y:hermite(from.y,(velocity.y??0)*ABOUT_CARD_ANIMATION_MS,to.y,0,p),
   width:hermite(from.width,(velocity.width??0)*ABOUT_CARD_ANIMATION_MS,to.width,0,p),
   height:hermite(from.height,(velocity.height??0)*ABOUT_CARD_ANIMATION_MS,to.height,0,p),
  };
  return compose(frame,hermite(from.frontness,(velocity.frontness??0)*ABOUT_CARD_ANIMATION_MS,to.frontness,0,p),p<.5?from.zIndex:to.zIndex,hermite(from.contentScale,(velocity.contentScale??0)*ABOUT_CARD_ANIMATION_MS,to.contentScale,0,p));
 });
}

export function aboutCardFrame({role,direction=1,progress=0}){
 const frames=aboutTransitionFrames({active:0,direction,progress});
 if(role==='outgoing')return frames[0];
 if(role==='incoming')return frames[direction===-1?2:1];
 return frames[direction===-1?1:2];
}
