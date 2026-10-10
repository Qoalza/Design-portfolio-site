import {nodes,position} from './network-data.mjs';

export function getHeroVariant({width=0,height=0}={}){
  // Preserve the established adaptive runtime: the authored Large composition
  // is enabled only when both its 2313px canvas and 1300px height fit.
  return width>=2313&&height>=1300?'large':'small';
}

// Small Hero: 720×452 display, .75 CSS px per vector unit, matching the
// reference diagram extent. Crop the field while preserving the live routes.
// Large retains the original full-field composition.
export function getHeroMapViewport(layout){
  return layout==='small'?{viewX:20,viewY:32/3,viewWidth:960,viewHeight:1808/3}:{viewX:0,viewY:0,viewWidth:1000,viewHeight:2000/3};
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

export function clientPointToSvg({clientX,clientY,rect,viewWidth,viewHeight,viewX=0,viewY=0}){
  const scale=Math.min(rect.width/viewWidth,rect.height/viewHeight);
  const fieldX=(rect.width-viewWidth*scale)/2;
  const fieldY=(rect.height-viewHeight*scale)/2;
  return {
    x:Math.max(viewX,Math.min(viewX+viewWidth,viewX+(clientX-rect.left-fieldX)/scale)),
    y:Math.max(viewY,Math.min(viewY+viewHeight,viewY+(clientY-rect.top-fieldY)/scale)),
  };
}

export function svgPointToClient({x,y,rect,viewWidth,viewHeight,viewX=0,viewY=0}){
  const scale=Math.min(rect.width/viewWidth,rect.height/viewHeight);
  return {
    x:(rect.width-viewWidth*scale)/2+(x-viewX)*scale,
    y:(rect.height-viewHeight*scale)/2+(y-viewY)*scale,
  };
}
