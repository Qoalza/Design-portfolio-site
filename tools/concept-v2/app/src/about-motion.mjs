export const ABOUT_CARD_ANIMATION_MS=500;
export const ABOUT_CARD_FRAME={width:363,height:420,backWidth:217.5,backHeight:296};

const FRONT={x:0,y:0,width:363,height:420};
const LEFT={x:-44,y:62,width:217.5,height:296};
const RIGHT={x:189.5,y:62,width:217.5,height:296};

export function wrapAboutCard(index,count=3){
 return (index%count+count)%count;
}

export function aboutCardSlots(active,count=3){
 return {front:active,left:wrapAboutCard(active-1,count),right:wrapAboutCard(active+1,count)};
}

export function aboutNextCard(active,direction,count=3){
 return wrapAboutCard(active+direction,count);
}

const clamp=value=>Math.max(0,Math.min(1,value));
const lerp=(from,to,progress)=>from+(to-from)*progress;
const cubic=(start,a,b,end,progress)=>{
 const inverse=1-progress;
 return inverse**3*start+3*inverse**2*progress*a+3*inverse*progress**2*b+progress**3*end;
};

export function aboutEase(progress){
 return .5-Math.cos(Math.PI*clamp(progress))/2;
}

function mirror(frame){
 return {...frame,x:ABOUT_CARD_FRAME.width-(frame.x+frame.width)};
}

function withComposition(frame,frontness,zIndex){
 return {
  ...frame,
  contentScale:frame.height/ABOUT_CARD_FRAME.height,
  frontness,
  rearStrength:1-frontness,
  zIndex,
 };
}

export function aboutRestFrame(slot){
 if(slot==='front')return withComposition(FRONT,1,3);
 if(slot==='left')return withComposition(LEFT,0,1);
 return withComposition(RIGHT,0,2);
}

export function aboutCardFrame({role,direction=1,progress=0}){
 const p=aboutEase(progress);
 let frame;
 let frontness;
 let zIndex;
 if(role==='outgoing'){
  frame={
   x:cubic(FRONT.x,-220,-160,LEFT.x,p),
   y:cubic(FRONT.y,30,70,LEFT.y,p),
   width:cubic(FRONT.width,315,248,LEFT.width,p),
   height:cubic(FRONT.height,360,304,LEFT.height,p),
  };
  frontness=1-p;
  zIndex=p<.54?3:2;
 }else if(role==='incoming'){
  frame={
   x:cubic(RIGHT.x,225,175,FRONT.x,p),
   y:cubic(RIGHT.y,56,20,FRONT.y,p),
   width:cubic(RIGHT.width,250,320,FRONT.width,p),
   height:cubic(RIGHT.height,308,374,FRONT.height,p),
  };
  frontness=p;
  zIndex=p<.54?2:3;
 }else{
  frame={
   x:cubic(LEFT.x,-105,122,RIGHT.x,p),
   y:cubic(LEFT.y,76,48,RIGHT.y,p),
   width:cubic(LEFT.width,202,202,RIGHT.width,p),
   height:cubic(LEFT.height,278,278,RIGHT.height,p),
  };
  frontness=0;
  zIndex=1;
 }
 if(direction===-1)frame=mirror(frame);
 return withComposition(frame,frontness,zIndex);
}
