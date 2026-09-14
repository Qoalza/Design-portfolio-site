export const ABOUT_CARD_ANIMATION_MS=500;
export const ABOUT_CARD_FRAME={width:480,height:420,frontWidth:320,frontHeight:420,backWidth:256,backHeight:336};
export const ABOUT_VIEWER_SCALE=1.5;
export const ABOUT_VIEWER_STAGE={width:720,height:630,scale:ABOUT_VIEWER_SCALE};

const FRONT={x:80,y:0,width:320,height:420};
const LEFT={x:24,y:42,width:256,height:336};
const RIGHT={x:200,y:42,width:256,height:336};
const FRONT_SCALE=1;
const BACK_SCALE=.8;

const clamp=value=>Math.max(0,Math.min(1,value));
const lerp=(from,to,progress)=>from+(to-from)*progress;
const easing=progress=>.5-Math.cos(Math.PI*clamp(progress))/2;

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
 const start=aboutDeckFrames(active,count);
 const finish=aboutDeckFrames(aboutNextCard(active,direction,count),count);
 return interpolateDeckFrames(start,finish,progress);
}

export function interpolateDeckFrames(fromFrames,toFrames,progress,initialVelocity=[]){
 const p=easing(progress);
 return fromFrames.map((from,index)=>{
  const to=toFrames[index];
  const frame={
   x:lerp(from.x,to.x,p),
   y:lerp(from.y,to.y,p),
   width:lerp(from.width,to.width,p),
   height:lerp(from.height,to.height,p),
  };
  return compose(frame,lerp(from.frontness,to.frontness,p),p<.5?from.zIndex:to.zIndex,lerp(from.contentScale,to.contentScale,p));
 });
}

export function aboutCardFrame({role,direction=1,progress=0}){
 const frames=aboutTransitionFrames({active:0,direction,progress});
 if(role==='outgoing')return frames[0];
 if(role==='incoming')return frames[direction===-1?2:1];
 return frames[direction===-1?1:2];
}
