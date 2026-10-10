import {useLayoutEffect, useRef, useState} from 'react';
import {MORPH_PATHS} from './preloader-morph-paths.mjs';

export const MORPH_DURATION=370;

import {drawPreloaderMorph as draw} from './preloader-morph-draw.mjs';
const clamp=value=>Math.max(0,Math.min(1,value));

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
