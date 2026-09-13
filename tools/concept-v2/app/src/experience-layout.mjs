const BASE_INNER=906;
const MIN_COMPOSITION=694;
const HORIZONTAL_TRAVEL=1615;
export const EXPERIENCE_PATTERN_MIN_HEIGHT=48;

export function experienceTravel(){
  return {horizontal:HORIZONTAL_TRAVEL,vertical:HORIZONTAL_TRAVEL*6};
}

export function experienceLayout(viewportHeight){
  let outer;
  let center;
  if(viewportHeight>=1506){
    outer=240;
    center=viewportHeight-outer*2;
  }else if(viewportHeight>=1026){
    center=1026;
    outer=(viewportHeight-center)/2;
  }else{
    outer=0;
    center=viewportHeight;
  }

  const free=Math.max(0,(center-BASE_INNER)/2);
  let deficit=Math.max(0,BASE_INNER-center);
  const take=(amount)=>{const used=Math.min(deficit,amount);deficit-=used;return amount-used;};
  const headingGap=take(48);
  const tapeTop=take(24);
  const progressGap=24+take(84);
  const bottom=24+take(56);
  const scale=deficit?center/MIN_COMPOSITION:1;
  return {outer,center,free,headingGap,tapeTop,progressGap,bottom,scale};
}

export function experiencePatternVisible(outerHeight){
  return outerHeight>=EXPERIENCE_PATTERN_MIN_HEIGHT;
}

export function scrollProgress({scrollY,sectionTop,verticalTravel}){
  if(verticalTravel<=0)return 0;
  return Math.max(0,Math.min(1,(scrollY-sectionTop)/verticalTravel));
}

export function activeExperienceIndex(progress){
  return Math.min(5,Math.max(0,Math.floor(progress*5)));
}

export function experienceReachedIndexes(progress){
  const active=activeExperienceIndex(progress);
  return Array.from({length:active+1},(_,index)=>index);
}

export function horizontalSpeedBlur(speed){
  if(speed<=100)return 0;
  return Math.min(.6,(speed-100)/1700*.6);
}
