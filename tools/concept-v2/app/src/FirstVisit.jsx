import {useEffect,useRef,useState} from 'react';
import {Preloader,INITIAL_MESSAGES,RETRY_MESSAGES} from './Preloader';
import {createPreloaderGate} from './preloader-gate.mjs';
import {prepareFirstView} from './first-view-readiness.mjs';

const initial={visible:true,mode:'normal',reason:null,retryNumber:0,showReadyMessage:false,leaving:false};
const early=window.__CONCEPT_EARLY_PRELOADER__;

export function FirstVisit({children}){
  const page=useRef(null);
  const gate=useRef(null);
  const [state,setState]=useState(()=>early?.snapshot()??initial);
  useEffect(()=>{
    // The first HTML owns the same session and SVG until readiness, including retries.
    if(early)return early.connect((signal,retryNumber)=>prepareFirstView(page.current,signal,retryNumber),setState);
    const session=createPreloaderGate({onState:setState});
    gate.current=session;
    session.start({prepare:(signal,{retryNumber})=>prepareFirstView(page.current,signal,retryNumber)},{immediate:true});
    return()=>{session.dispose();if(gate.current===session)gate.current=null;};
  },[]);
  useEffect(()=>{
    if(state.visible||!location.hash)return;
    let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
    document.getElementById(id)?.scrollIntoView({behavior:'instant',block:'start'});
  },[state.visible]);
  const captions=state.reason
    ?RETRY_MESSAGES[state.reason][Math.min(state.retryNumber,2)-1]
    :INITIAL_MESSAGES;
  return <>
    <div ref={page} inert={state.visible} aria-hidden={state.visible}>{children}</div>
    {!early&&state.visible&&<Preloader state={state.mode} captionSet={captions} onRetry={()=>gate.current?.retry()} showReadyMessage={state.showReadyMessage} overlay leaving={state.leaving}/>}
  </>;
}
