import {preloaderSymbolMarkup} from './preloader-symbol.mjs';
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {mountPreloaderLogo} from './preloader-motion.mjs';
import {PreloaderMorph, MORPH_DURATION} from './PreloaderMorph';
import {ControlButton} from './Controls';
import './preloader.css';

import {DEFAULT_MESSAGES,INITIAL_MESSAGES,RETRY_MESSAGES} from './preloader-copy.mjs';
const CAPTION_INTERVAL=2000;
const CAPTION_TRANSITION=300;
// Keep SVG descendants owned by the motion controller stable across React updates.
const SYMBOL_HTML=Object.freeze({__html:preloaderSymbolMarkup});

function AnimatedSymbol({speedMultiplier=1,running=true,initialPhase}){
  const svg=useRef(null);
  const speed=useRef(speedMultiplier);
  speed.current=speedMultiplier;
  useLayoutEffect(()=>running?mountPreloaderLogo(svg.current,speed,initialPhase):undefined,[running]);
  return <svg ref={svg} className="preloader-symbol" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={SYMBOL_HTML}/>;
}

export {INITIAL_MESSAGES,RETRY_MESSAGES};

export function Preloader({state,captionSet,onRetry,showReadyMessage=false,overlay=false,leaving=false,initialPhase}){
  const controlled=state!==undefined;
  const requested=new URLSearchParams(location.search).get('state');
  const [demoMode,setDemoMode]=useState(requested==='slow'||requested==='connection'?requested:'normal');
  const mode=controlled?state:demoMode;
  const [attempt,setAttempt]=useState(requested==='connection'?1:0);
  const [frame,setFrame]=useState({current:0,outgoing:null,revision:0});
  const [demoMessages,setDemoMessages]=useState(DEFAULT_MESSAGES);
  const messages=captionSet??demoMessages;
  useEffect(()=>{
    setFrame({current:0,outgoing:null,revision:0});
  },[captionSet]);
  const [lastStatus,setLastStatus]=useState(mode==='normal'?null:mode);
  const [logoRunning,setLogoRunning]=useState(mode!=='connection');
  const retryCounts=useRef({slow:0,connection:0});
  useEffect(()=>{
    if(mode!=='connection')return;
    const timer=setTimeout(()=>setLogoRunning(false),90);
    return()=>clearTimeout(timer);
  },[mode]);
  useEffect(()=>{
    if(mode!=='normal'){
      setLastStatus(mode);
      return;
    }
    const timer=setTimeout(()=>setLastStatus(null),MORPH_DURATION);
    return()=>clearTimeout(timer);
  },[mode]);
  useEffect(()=>{
    if(controlled||mode!=='normal'||requested==='normal')return;
    const timer=setTimeout(()=>setDemoMode(attempt%2===0?'slow':'connection'),10000);
    return()=>clearTimeout(timer);
  },[controlled,mode,attempt,requested]);
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
      if(reduced.matches||document.hidden||mode!=='normal'||showReadyMessage)return;
      interval=setInterval(advance,CAPTION_INTERVAL);
    };
    start();
    reduced.addEventListener('change',start);
    document.addEventListener('visibilitychange',start);
    return()=>{stop();reduced.removeEventListener('change',start);document.removeEventListener('visibilitychange',start);};
  },[mode,messages.length,showReadyMessage]);
  useEffect(()=>{
    if(frame.outgoing===null)return;
    const timer=setTimeout(()=>setFrame(previous=>previous.revision===frame.revision?{...previous,outgoing:null}:previous),CAPTION_TRANSITION);
    return()=>clearTimeout(timer);
  },[frame.revision,frame.outgoing]);
  const retry=()=>{
    if(controlled){
      setFrame({current:0,outgoing:null,revision:0});
      onRetry?.(mode);
      return;
    }
    const count=retryCounts.current[mode];
    setDemoMessages(RETRY_MESSAGES[mode][Math.min(count,1)]);
    retryCounts.current[mode]=count+1;
    setFrame({current:0,outgoing:null,revision:0});
    setAttempt(previous=>previous+1);
    setDemoMode('normal');
  };
  const statusMode=mode==='normal'?lastStatus:mode;
  return <main className={`preloader-page${overlay?' is-overlay':''}${leaving?' is-leaving':''}`} data-state={mode} aria-label="Прелоадер">
    <div className="preloader-content">
      <div className="preloader-symbol-slot">
        <AnimatedSymbol speedMultiplier={mode==='slow'?.5:1} running={logoRunning} initialPhase={initialPhase}/>
        <PreloaderMorph connection={mode==='connection'} onReturnComplete={()=>setLogoRunning(true)}/>
      </div>
      <p className={`preloader-caption ${mode==='normal'?'':'is-hidden'}`} aria-hidden={mode!=='normal'}>
        {!showReadyMessage&&frame.outgoing!==null&&<span key={`out:${frame.revision}`} className="preloader-caption-content is-outgoing" aria-hidden="true">{messages[frame.outgoing]}</span>}
        <span key={`in:${frame.revision}:${showReadyMessage}`} className="preloader-caption-content is-incoming" aria-hidden="true">{showReadyMessage?'Всё, перехожу':messages[frame.current]}</span>
        {mode==='normal'&&<span className="sr-only" aria-live="polite">{showReadyMessage?'Всё, перехожу':messages[frame.current]}</span>}
      </p>
      {statusMode&&<div key={statusMode} className={`preloader-status ${statusMode} ${mode==='normal'?'is-exiting':''}`} role={mode==='normal'?undefined:statusMode==='connection'?'alert':'status'} aria-hidden={mode==='normal'}>
        <div className="preloader-status-copy">
          <h1>{statusMode==='slow'?'Долгая загрузка':'Проблема с соединением'}</h1>
          <p>{statusMode==='slow'
            ?<>Страница открывается дольше обычного.<br/>Подождите или повторите попытку.</>
            :<>Не удалось открыть страницу.<br/>Проверьте соединение и попробуйте ещё раз.</>}</p>
        </div>
        <ControlButton variant="accent" iconRight="preloader-refresh" onClick={mode==='normal'?undefined:retry}>Повторить</ControlButton>
      </div>}
    </div>
  </main>;
}
