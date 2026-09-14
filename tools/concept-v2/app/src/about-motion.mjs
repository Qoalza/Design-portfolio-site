export const ABOUT_CARD_ANIMATION_MS=500;
export const ABOUT_CARD_FRAME={width:480,height:420,frontWidth:320,frontHeight:420,backWidth:256,backHeight:336};
export const ABOUT_VIEWER_SCALE=1.5;
export const ABOUT_VIEWER_STAGE={width:720,height:630,scale:ABOUT_VIEWER_SCALE};

const FRONT={x:80,y:0,width:320,height:420};
const LEFT={x:24,y:42,width:256,height:336};
const RIGHT={x:200,y:42,width:256,height:336};
const FRONT_SCALE=1;
const BACK_SCALE=.8;

/* The three cards take concurrent, single Bézier paths.  The hand-off uses
   the already approved narrow mid-geometry rather than crossing two full
   front surfaces through each other.  Unlike the retired two-part keyframe
   path, these curves have no midpoint stop or second animation phase. */
const OUTGOING_CONTROL_A={x:-4,y:12,width:300,height:400};
const OUTGOING_CONTROL_B={x:-4,y:47.5,width:249.333333,height:321};
const INCOMING_CONTROL_A={x:300,y:84,width:170,height:280};
const INCOMING_CONTROL_B={x:390.666667,y:62.757333,width:134,height:266.485333};
const THIRD_CONTROL_A={x:140,y:80,width:170,height:310};
const THIRD_CONTROL_B={x:233.333333,y:57.333333,width:168.666667,height:322.666667};

const clamp=value=>Math.max(0,Math.min(1,value));
const lerp=(from,to,progress)=>from+(to-from)*progress;
const easing=progress=>.5-Math.cos(Math.PI*clamp(progress))/2;
const retargetMomentum=(velocity,progress)=>velocity*ABOUT_CARD_ANIMATION_MS*.25*progress*(1-progress)**2;
const cubic=(from,controlA,controlB,to,progress)=>{
 const t=clamp(progress),inverse=1-t;
 return inverse**3*from+3*inverse**2*t*controlA+3*inverse*t**2*controlB+t**3*to;
};
const curveFrame=(from,controlA,controlB,to,progress)=>({
 x:cubic(from.x,controlA.x,controlB.x,to.x,progress),
 y:cubic(from.y,controlA.y,controlB.y,to.y,progress),
 width:cubic(from.width,controlA.width,controlB.width,to.width,progress),
 height:cubic(from.height,controlA.height,controlB.height,to.height,progress),
});
const mirrorFrame=frame=>({...frame,x:ABOUT_CARD_FRAME.width-(frame.x+frame.width)});

export function wrapAboutCard(index,count=3){return(index%count+count)%count;}
export function aboutCardSlots(active,count=3){return{front:active,left:wrapAboutCard(active-1,count),right:wrapAboutCard(active+1,count)};}
export function aboutNextCard(active,direction,count=3){return wrapAboutCard(active+direction,count);}

function compose(frame,frontness,zIndex,contentScale){
 const bounded={...frame,x:Math.max(0,Math.min(ABOUT_CARD_FRAME.width-frame.width,frame.x))};
 return {...bounded,contentScale,frontness,rearStrength:1-frontness,zIndex};
}

export function aboutRestFrame(slot){
 if(slot==='front')return compose(FRONT,1,3,FRONT_SCALE);
 if(slot==='left')return compose(LEFT,0,1,BACK_SCALE);
 return compose(RIGHT,0,2,BACK_SCALE);
}

export function aboutDeckFrames(active,count=3){
 const slots=aboutCardSlots(active,count);
 return Array.from({length:count},(_,index)=>aboutRestFrame(index===slots.front?'front':index===slots.left?'left':'right'));
}

export function scaleAboutFrame(frame,scale=ABOUT_VIEWER_SCALE){
 return {...frame,x:frame.x*scale,y:frame.y*scale,width:frame.width*scale,height:frame.height*scale,contentScale:Number((frame.contentScale*scale).toFixed(6))};
}

export function aboutTransitionFrames({active,direction=1,progress=0,count=3}){
 const p=easing(progress),slots=aboutCardSlots(active,count),reverse=direction===-1;
 const outgoingEnd=reverse?RIGHT:LEFT;
 const incomingStart=reverse?LEFT:RIGHT;
 const thirdStart=reverse?RIGHT:LEFT;
 const thirdEnd=reverse?LEFT:RIGHT;
 const mapCurve=(from,controlA,controlB,to)=>{
 if(!reverse)return curveFrame(from,controlA,controlB,to,p);
  return mirrorFrame(curveFrame(mirrorFrame(from),controlA,controlB,mirrorFrame(to),p));
 };
 const outgoing=compose(mapCurve(FRONT,OUTGOING_CONTROL_A,OUTGOING_CONTROL_B,outgoingEnd),1-p,p<.5?3:2,lerp(FRONT_SCALE,BACK_SCALE,p));
 const incoming=compose(mapCurve(incomingStart,INCOMING_CONTROL_A,INCOMING_CONTROL_B,FRONT),p,p<.5?2:3,lerp(BACK_SCALE,FRONT_SCALE,p));
 const third=compose(mapCurve(thirdStart,THIRD_CONTROL_A,THIRD_CONTROL_B,thirdEnd),0,1,BACK_SCALE);
 const incomingIndex=reverse?slots.left:slots.right;
 const thirdIndex=reverse?slots.right:slots.left;
 return Array.from({length:count},(_,index)=>index===slots.front?outgoing:index===incomingIndex?incoming:third);
}

export function interpolateDeckFrames(fromFrames,toFrames,progress,initialVelocity=[]){
 const t=clamp(progress),p=easing(t);
 return fromFrames.map((from,index)=>{
  const to=toFrames[index];
  const velocity=initialVelocity[index]??{};
  const frame={
   x:lerp(from.x,to.x,p)+retargetMomentum(velocity.x??0,t),
   y:lerp(from.y,to.y,p)+retargetMomentum(velocity.y??0,t),
   width:lerp(from.width,to.width,p)+retargetMomentum(velocity.width??0,t),
   height:lerp(from.height,to.height,p)+retargetMomentum(velocity.height??0,t),
  };
  return compose(frame,lerp(from.frontness,to.frontness,p)+retargetMomentum(velocity.frontness??0,t),p<.5?from.zIndex:to.zIndex,lerp(from.contentScale,to.contentScale,p)+retargetMomentum(velocity.contentScale??0,t));
 });
}

export function aboutCardFrame({role,direction=1,progress=0}){
 const frames=aboutTransitionFrames({active:0,direction,progress});
 if(role==='outgoing')return frames[0];
 if(role==='incoming')return frames[direction===-1?2:1];
 return frames[direction===-1?1:2];
}
