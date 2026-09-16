import {nodes,position} from './network-data.mjs';

export function getHeroVariant({width=0}={}){
  // The authored compositions have different structural layouts. Keep Small
  // until the viewport can show the Large source at its 2313 px canvas width.
  return width>=2313?'large':'small';
}

export function captionForPoint(point){
  if(point){
    const nearest=nodes.reduce((best,node)=>{
      const candidate=position(node);
      const distance=Math.hypot(candidate.x-point.x,candidate.y-point.y);
      return !best||distance<best.distance?{node,distance}:best;
    },null);
    if(nearest?.distance<64)return {label:nearest.node[3],icon:nearest.node[2],active:true};
  }
  return {label:'Исследуйте процесс',icon:'search',active:false};
}

export function clientPointToSvg({clientX,clientY,rect,viewWidth,viewHeight}){
  const scale=Math.min(rect.width/viewWidth,rect.height/viewHeight);
  const fieldX=(rect.width-viewWidth*scale)/2;
  const fieldY=(rect.height-viewHeight*scale)/2;
  return {
    x:Math.max(0,Math.min(viewWidth,(clientX-rect.left-fieldX)/scale)),
    y:Math.max(0,Math.min(viewHeight,(clientY-rect.top-fieldY)/scale)),
  };
}

export function svgPointToClient({x,y,rect,viewWidth,viewHeight}){
  const scale=Math.min(rect.width/viewWidth,rect.height/viewHeight);
  return {
    x:(rect.width-viewWidth*scale)/2+x*scale,
    y:(rect.height-viewHeight*scale)/2+y*scale,
  };
}
