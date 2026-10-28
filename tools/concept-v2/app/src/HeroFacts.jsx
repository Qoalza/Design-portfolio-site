import {useRef,useState} from 'react';
import {randomEdgePoint} from './process-fill.mjs';
import './hero-facts.css';
import factDot from './figma/hero-fact-dot.svg';

function DribbbleContent(){
 return <><span className="hero-dribbble-icon" aria-hidden="true"/><span className="hero-dribbble-label">Dribbble</span></>;
}

// Library2245:1884 is a custom control, independent from the shared button master.
export function HeroDribbbleButton(){
 const [origin,setOrigin]=useState({x:0,y:.5});
 const interaction=useRef({pointer:false,focus:false,exitedAt:-Infinity});
 function begin(source){
  const state=interaction.current;
  // Preserve the origin while an interrupted withdrawal reverses, just like Process.
  if(!state.pointer&&!state.focus&&performance.now()-state.exitedAt>=200)setOrigin(randomEdgePoint(Math.random,1));
  state[source]=true;
 }
 function end(source){
  const state=interaction.current;
  state[source]=false;
  if(!state.pointer&&!state.focus)state.exitedAt=performance.now();
 }
 return <a className="hero-dribbble" style={{'--dribbble-fill-x':`${origin.x*100}%`,'--dribbble-fill-y':`${origin.y*100}%`}} onPointerEnter={()=>begin('pointer')} onPointerLeave={()=>end('pointer')} onFocus={()=>begin('focus')} onBlur={()=>end('focus')} href="https://dribbble.com/art-des" target="_blank" rel="noopener noreferrer">
  <DribbbleContent/>
  <span className="hero-dribbble-fill" aria-hidden="true"><DribbbleContent/></span>
 </a>;
}

function FactDot(){
 return <span className="hero-fact-dot" aria-hidden="true"><img src={factDot} width="4" height="4" alt=""/></span>;
}

export function HeroFacts(){
 return <div className="hero-bottom-inner"><div className="hero-facts-row">
  <p className="hero-fact-chip"><span>29 лет</span><FactDot/><span>Екатеринбург</span><FactDot/><span>Middle+ / Senior</span></p>
  <HeroDribbbleButton/>
 </div></div>;
}
