import {useEffect, useRef, useState} from 'react';
import {mountPreloaderLogo} from './preloader-motion.mjs';
import './preloader.css';

const messages=[
  'Посмотрю, готова ли страница...',
  'Да-да, еще чуть-чуть осталось..',
  'У осьминога 3 сердца...',
  'Простите, отвлекал внимание...',
  'Все, перехожу...',
];
const CAPTION_INTERVAL=2000;
const CAPTION_TRANSITION=300;

function AnimatedSymbol(){
  const svg=useRef(null);
  useEffect(()=>mountPreloaderLogo(svg.current),[]);
  return <svg ref={svg} className="preloader-symbol" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="preloader-tail-gradient" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#f2f4f5" stopOpacity="0"/>
        <stop offset="1" stopColor="#f2f4f5" stopOpacity=".4"/>
      </linearGradient>
      <filter id="preloader-tip-motion-filter" filterUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
        <feGaussianBlur id="preloader-tip-motion-blur" stdDeviation="0 0"/>
      </filter>
      <path id="preloader-main-geometry" d="M35.5346 39.9844C35.5892 40.1433 35.4175 40.2848 35.2719 40.2008L33.7419 39.3174C32.527 38.616 31.6065 37.4988 31.1504 36.1721L24 15.3709L19.947 27.1615H21.4708C23.2249 27.1615 24.7945 28.2234 25.4552 29.8303C25.5027 29.9456 25.4152 30.0686 25.2905 30.0686H18.9476L16.8496 36.1721C16.3936 37.4988 15.4732 38.616 14.2583 39.3174L12.7281 40.2008C12.5826 40.2848 12.4108 40.1433 12.4654 39.9844L21.987 12.284C22.0279 12.1651 22.1745 12.1225 22.2789 12.1926C22.7707 12.5234 23.3627 12.7166 24 12.7166C24.6372 12.7166 25.2292 12.5234 25.721 12.1926C25.8253 12.1225 25.972 12.165 26.0129 12.2839L35.5346 39.9844Z"/>
      <mask id="preloader-leg-tip-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
        <rect x="0" y="0" width="48" height="48" fill="white"/>
        <path id="preloader-left-tip-cut" fill="black" filter="url(#preloader-tip-motion-filter)" transform="translate(48 0) scale(-1 1)"/>
        <path id="preloader-right-tip-cut" fill="black" filter="url(#preloader-tip-motion-filter)"/>
        <circle id="preloader-ball-clearance" cx="24" cy="9.62777" r="1.85" fill="black"/>
      </mask>
    </defs>
    <g>
      <path id="preloader-tail" fill="none" stroke="url(#preloader-tail-gradient)" strokeWidth="2.9072" strokeLinecap="round"/>
      <path id="preloader-marker" d="M25.4536 9.62777C25.4536 10.4306 24.8028 11.0813 24 11.0813C23.1972 11.0813 22.5464 10.4306 22.5464 9.62777C22.5464 8.82498 23.1972 8.17419 24 8.17419C24.8028 8.17419 25.4536 8.82498 25.4536 9.62777Z" fill="#f2f4f5"/>
    </g>
    <g mask="url(#preloader-leg-tip-mask)">
      <use href="#preloader-main-geometry" fill="#f2f4f5"/>
    </g>
  </svg>;
}

export function Preloader(){
  const [frame,setFrame]=useState({current:0,outgoing:null,revision:0});
  useEffect(()=>{
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    let interval;
    const advance=()=>setFrame(previous=>({
      current:(previous.current+1)%messages.length,
      outgoing:previous.current,
      revision:previous.revision+1,
    }));
    const stop=()=>{clearInterval(interval);interval=undefined;};
    const start=()=>{
      stop();
      if(reduced.matches||document.hidden)return;
      interval=setInterval(advance,CAPTION_INTERVAL);
    };
    start();
    reduced.addEventListener('change',start);
    document.addEventListener('visibilitychange',start);
    return()=>{stop();reduced.removeEventListener('change',start);document.removeEventListener('visibilitychange',start);};
  },[]);
  useEffect(()=>{
    if(frame.outgoing===null)return;
    const timer=setTimeout(()=>setFrame(previous=>previous.revision===frame.revision?{...previous,outgoing:null}:previous),CAPTION_TRANSITION);
    return()=>clearTimeout(timer);
  },[frame.revision,frame.outgoing]);
  return <main className="preloader-page" aria-label="Прелоадер">
    <div className="preloader-content">
      <AnimatedSymbol/>
      <p className="preloader-caption">
        {frame.outgoing!==null&&<span key={`out:${frame.revision}`} className="preloader-caption-content is-outgoing" aria-hidden="true">{messages[frame.outgoing]}</span>}
        <span key={`in:${frame.revision}`} className="preloader-caption-content is-incoming" aria-hidden="true">{messages[frame.current]}</span>
        <span className="sr-only" aria-live="polite">{messages[frame.current]}</span>
      </p>
    </div>
  </main>;
}
