const BASE_INNER=906;
const MIN_COMPOSITION=694;
const DESKTOP_CENTER_MIN=1164;
const EXPERIENCE_NODE_ANCHORS=[164,538,923,1326,1745,2211];
const HORIZONTAL_TRAVEL=EXPERIENCE_NODE_ANCHORS.at(-1)-EXPERIENCE_NODE_ANCHORS[0];
const VERTICAL_TRAVEL=9690/1.1;
const EXPERIENCE_STOPS=Object.freeze(EXPERIENCE_NODE_ANCHORS.map(anchor=>(anchor-EXPERIENCE_NODE_ANCHORS[0])/HORIZONTAL_TRAVEL));
export const EXPERIENCE_PATTERN_MIN_HEIGHT=48;
export const EXPERIENCE_HEADER_RESERVE=80;

export function experienceTravel(){
  return {horizontal:HORIZONTAL_TRAVEL,vertical:VERTICAL_TRAVEL};
}

export function experienceStops(){
  return EXPERIENCE_STOPS;
}

export function experienceLayout(viewportHeight){
  const topOuter=Math.min(240,Math.max(0,viewportHeight-DESKTOP_CENTER_MIN));
  const bottomOuter=0;
  const center=viewportHeight-topOuter;

  const free=Math.max(0,(center-BASE_INNER)/2);
  let deficit=Math.max(0,BASE_INNER-center);
  const take=(amount)=>{const used=Math.min(deficit,amount);deficit-=used;return amount-used;};
  const headingGap=take(48);
  const tapeTop=take(24);
  const progressGap=24+take(84);
  const bottom=24+take(56);
  const baseScale=deficit?center/MIN_COMPOSITION:1;
  // On short desktop screens the static progress bar costs more vertical room
  // than it returns. Hide it before the content has to crowd the persistent
  // site header, and use that reclaimed room as a real top inset.
  const compact=center<1026;
  const compactFlowHeight=112+headingGap+tapeTop+530;
  // Keep the compact composition's established scale, but move the complete
  // scene 32px upward so the header no longer consumes its visual breathing room.
  const compactOffset=compact?128:0;
  const compactScale=compact?Math.max(0,(center-compactOffset-32)/compactFlowHeight):1;
  const scale=Math.min(baseScale,compactScale);
  return {outer:topOuter,topOuter,bottomOuter,center,free,headingGap,tapeTop,progressGap,bottom,scale,compact,compactOffset};
}

export function experiencePatternVisible(outerHeight){
  return outerHeight>=EXPERIENCE_PATTERN_MIN_HEIGHT;
}

export function scrollProgress({scrollY,sectionTop,verticalTravel}){
  if(verticalTravel<=0)return 0;
  return Math.max(0,Math.min(1,(scrollY-sectionTop)/verticalTravel));
}

export function experienceCompletionTransition({completed,scrollY,sectionTop,viewportHeight,allowRearm=true,reenteringFromAbove=false,verticalTravel}){
  if(completed){
    if(reenteringFromAbove)return {completed:false};
    return {completed:allowRearm&&scrollY+viewportHeight<sectionTop?false:true};
  }
  if(scrollY>sectionTop+verticalTravel){
    return {completed:true,scrollY:scrollY-verticalTravel};
  }
  return {completed:false};
}

export function experienceShouldPaint({scrollY,viewportHeight,sectionTop,sectionHeight,marginViewports=0}){
  const margin=viewportHeight*marginViewports;
  return scrollY>=sectionTop-margin&&scrollY<=sectionTop+sectionHeight+margin;
}

export function activeExperienceIndex(progress){
  const stops=experienceStops();
  return stops.reduce((active,stop,index)=>progress>=stop?index:active,0);
}

export function experienceReachedIndexes(progress){
  const active=activeExperienceIndex(progress);
  return Array.from({length:active+1},(_,index)=>index);
}

export function experienceSegmentProgress(progress,index){
  const stops=experienceStops();
  const start=stops[index];
  const end=stops[index+1];
  if(start===undefined||end===undefined)return 0;
  return Math.max(0,Math.min(1,(progress-start)/(end-start)));
}

export function horizontalSpeedBlur(speed){
  if(speed<=100)return 0;
  return Math.min(.6,(speed-100)/1700*.6);
}
