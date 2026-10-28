const tolerance=1;
export function carouselStops(offsets,inset,max){
 return [...new Set([0,...offsets.map(offset=>Math.max(0,Math.min(max,offset-inset))),Math.max(0,max)])].sort((a,b)=>a-b);
}
export function stepTarget(stops,position,direction){
 return direction>0?(stops.find(stop=>stop>position+tolerance)??stops.at(-1)):
  ([...stops].reverse().find(stop=>stop<position-tolerance)??0);
}
export function carouselEdges(position,max){
 return {previous:position>tolerance,next:position<max-tolerance};
}
export function isHorizontalCarouselWheel(event){
 return !!event.target?.closest?.('[data-project-carousel]')&&Math.abs(event.deltaX)>Math.abs(event.deltaY);
}
