import {useEffect,useRef,useState} from 'react';
import folder from '../../process-icons/folder.json?url';
import system from '../../process-icons/system.json?url';
import rocket from '../../process-icons/rocket.json?url';
import folderRest from '../../process-icons/originals/folder.svg?url';
import systemRest from '../../process-icons/originals/system.svg?url';
import rocketRest from '../../process-icons/rocket.svg?url';
import {advanceHoverFrame,colorizeProcessAnimation,processHoverSpeeds,easedHoverFrame} from './process-motion.mjs';
const sources=[folder,system,rocket],rests=[folderRest,systemRest,rocketRest];

export function ProcessIcon({index,active,origin}){
 const host=useRef(null),base=useRef(null),color=useRef(null),wake=useRef(null),target=useRef(active);
 const [ready,setReady]=useState(false);
 useEffect(()=>{target.current=active;wake.current?.();},[active]);
 useEffect(()=>{
  const abort=new AbortController(),players=[];
  const card=host.current.closest('.step');
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let disposed=false,loading=false,frame=0,timeFrame=0,raf=0,last=0,hold=0,fps=0,loaded=false;
  const render=()=>{
   players.forEach(player=>player.goToAndStop(frame,true));
   host.current?.setAttribute('data-frame',frame.toFixed(2));
   // The separator shares the actual frame clock, including interrupted reversals.
   card.dataset.processMotion='ready';
   card.style.setProperty('--process-progress',String(media.matches?(target.current?1:0):frame/hold));
  };
  function tick(time){
   raf=0;
   if(disposed||!loaded||document.hidden)return;
   timeFrame=media.matches?0:advanceHoverFrame(timeFrame,target.current,last?time-last:0,fps,hold,processHoverSpeeds[index]);
   frame=easedHoverFrame(timeFrame,hold);
   last=time;render();
   if(!media.matches&&timeFrame!==(target.current?hold:0))raf=requestAnimationFrame(tick);
  }
  function start(){
   if(!loaded||disposed)return;
   cancelAnimationFrame(raf);raf=0;last=0;
   if(media.matches){timeFrame=0;frame=0;render();return;}
   if(!document.hidden)raf=requestAnimationFrame(tick);
  }
  wake.current=start;
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();load();}
  },{rootMargin:'300px'});
  observer.observe(host.current);
  async function load(){
   if(loading)return;loading=true;
   try{
    const [module,response]=await Promise.all([import('lottie-web/build/player/lottie_canvas.min.js'),fetch(sources[index],{signal:abort.signal})]);
    if(!response.ok)throw new Error(`Process icon HTTP ${response.status}`);
    const data=await response.json();
    if(disposed)return;
    hold=data.markers.find(marker=>marker.cm==='hover-hold').tm;fps=data.fr;
    await Promise.all([data,colorizeProcessAnimation(data)].map((animationData,i)=>new Promise((resolve,reject)=>{
     const player=module.default.loadAnimation({container:i?color.current:base.current,renderer:'canvas',loop:false,autoplay:false,animationData,rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});
     players.push(player);player.addEventListener('DOMLoaded',resolve);player.addEventListener('data_failed',reject);
    })));
    if(disposed)return;
    loaded=true;render();setReady(true);start();
   }catch(error){
    if(disposed||error?.name==='AbortError')return;
    players.forEach(player=>player.destroy());players.length=0;
    console.error('Process icon unavailable; original SVG retained',error);
   }
  }
  media.addEventListener('change',start);document.addEventListener('visibilitychange',start);
  return()=>{delete card.dataset.processMotion;card.style.removeProperty('--process-progress');disposed=true;abort.abort();observer.disconnect();cancelAnimationFrame(raf);players.forEach(player=>player.destroy());media.removeEventListener('change',start);document.removeEventListener('visibilitychange',start);wake.current=null;};
 },[index]);
 return <span ref={host} className={`step-icon process-motion ${ready?'is-ready':''}`} aria-hidden="true" style={{'--fill-x':`${origin.x+32}px`,'--fill-y':`${origin.y+32}px`}}>
  <img className="process-motion-fallback" src={rests[index]} width="64" height="64" alt=""/>
  <span ref={base} className="process-motion-base"/>
  <span ref={color} className="process-motion-color"/>
 </span>;
}
