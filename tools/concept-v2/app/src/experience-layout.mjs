const BASE_INNER=906;
const MIN_COMPOSITION=694;
const EXPERIENCE_NODE_ANCHORS=[164,538,923,1326,1745,2211];
const HORIZONTAL_TRAVEL=EXPERIENCE_NODE_ANCHORS.at(-1)-EXPERIENCE_NODE_ANCHORS[0];
const VERTICAL_TRAVEL=9690/1.1;
const EXPERIENCE_STOPS=Object.freeze(EXPERIENCE_NODE_ANCHORS.map(anchor=>(anchor-EXPERIENCE_NODE_ANCHORS[0])/HORIZONTAL_TRAVEL));
export const EXPERIENCE_PATTERN_MIN_HEIGHT=48;
const COMPACT_PROGRESS_GAP=24;
const COMPACT_HEADING_OFFSET=48;

export function experienceStickyHeaderOffset(sectionTop,headerHeight){
  return sectionTop<=headerHeight?headerHeight:0;
}

export function experienceTravel(){
  return {horizontal:HORIZONTAL_TRAVEL,vertical:VERTICAL_TRAVEL};
}

export function experienceStops(){
  return EXPERIENCE_STOPS;
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

export function experienceCompactPinnedSpacing(layout,isCompactPinned){
  if(!isCompactPinned)return {headingGap:layout.headingGap,progressGap:layout.progressGap,headingOffset:0};
  return {
    headingGap:layout.headingGap,
    progressGap:Math.min(layout.progressGap,COMPACT_PROGRESS_GAP),
    headingOffset:COMPACT_HEADING_OFFSET,
  };
}

export function experiencePatternVisible(outerHeight){
  return outerHeight>=EXPERIENCE_PATTERN_MIN_HEIGHT;
}

export function scrollProgress({scrollY,sectionTop,verticalTravel}){
  if(verticalTravel<=0)return 0;
  return Math.max(0,Math.min(1,(scrollY-sectionTop)/verticalTravel));
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
