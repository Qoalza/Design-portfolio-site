import {nodes,position} from './network-data.mjs';

export function getHeroVariant(height){
  return height>=1300?'large':'small';
}

export function captionForPoint(point){
  if(point){
    const nearest=nodes.find(node=>{
      const candidate=position(node);
      return Math.hypot(candidate.x-point.x,candidate.y-point.y)<64;
    });
    if(nearest)return {label:nearest[3],icon:nearest[2],active:true};
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
