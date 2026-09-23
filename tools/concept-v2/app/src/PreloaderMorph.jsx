import {useLayoutEffect, useRef, useState} from 'react';
import {MORPH_PATHS} from './preloader-morph-paths.mjs';

export const MORPH_DURATION=370;

const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=(from,to,value)=>{
  const t=clamp((value-from)/(to-from));
  return t*t*(3-2*t);
};

function draw(svg,progress){
  const a=svg.querySelector('.preloader-morph-a');
  const left=svg.querySelector('.preloader-morph-left');
  const right=svg.querySelector('.preloader-morph-right');
  const fragments=svg.querySelector('.preloader-morph-fragments');
  const collapse=smooth(.12,.68,progress);
  const aOpacity=1-smooth(.48,.70,progress);
  const plugOpacity=1-aOpacity;
  const fragmentOpacity=smooth(.45,.88,progress);
  const color=[0,1,2].map((_,index)=>{
    const start=[242,244,245][index],end=[200,72,40][index];
    return Math.round(start+(end-start)*smooth(.16,.56,progress));
  });
  a.setAttribute('fill',`rgb(${color.join(',')})`);
  const scale=(1-.08*collapse).toFixed(3);
  a.setAttribute('transform',`translate(48 48) scale(${scale}) translate(-48 -48)`);
  const spread=1-smooth(.30,.84,progress);
  left.setAttribute('transform',`translate(${(8*spread).toFixed(2)} ${(-8*spread).toFixed(2)})`);
  right.setAttribute('transform',`translate(${(-8*spread).toFixed(2)} ${(8*spread).toFixed(2)})`);
  for(const [node,opacity] of [[a,aOpacity],[left,plugOpacity],[right,plugOpacity],[fragments,fragmentOpacity]]){
    node.style.display=opacity<=0?'none':'';
    node.setAttribute('opacity',opacity.toFixed(3));
  }
}

export function PreloaderMorph({connection,onReturnComplete}){
  const svg=useRef(null);
  const progress=useRef(connection?1:0);
  const first=useRef(true);
  const [active,setActive]=useState(connection);

  useLayoutEffect(()=>{
    const element=svg.current;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(first.current){
      first.current=false;
      draw(element,progress.current);
      return;
    }
    let frame=0;
    if(connection)setActive(true);
    const from=progress.current;
    const to=connection?1:0;
    if(reduced){
      progress.current=to;
      draw(element,to);
      if(!connection){
        setActive(false);
        onReturnComplete();
      }
      return;
    }
    const start=performance.now();
    const tick=now=>{
      const fraction=clamp((now-start)/MORPH_DURATION);
      progress.current=from+(to-from)*fraction;
      draw(element,progress.current);
      if(fraction<1)frame=requestAnimationFrame(tick);
      else if(!connection){
        setActive(false);
        onReturnComplete();
      }
    };
    frame=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(frame);
  },[connection]);

  return <svg ref={svg} className={`preloader-morph ${active?'is-active':''}`} viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs>
      {Object.entries(MORPH_PATHS).map(([id,d])=><path key={id} id={`preloader-morph-${id}`} d={d}/>)}
    </defs>
    <g className="preloader-morph-a" fill="#f2f4f5">
      <use href="#preloader-morph-body-source" transform="scale(2)"/>
      <use href="#preloader-morph-dot-source" transform="scale(2)"/>
    </g>
    <g className="preloader-morph-left" fill="#c84828"><use href="#preloader-morph-plug-1"/></g>
    <g className="preloader-morph-right" fill="#c84828"><use href="#preloader-morph-plug-2"/></g>
    <g className="preloader-morph-fragments" fill="#c84828">
      <use href="#preloader-morph-plug-0"/><use href="#preloader-morph-plug-3"/><use href="#preloader-morph-plug-4"/>
    </g>
  </svg>;
}
