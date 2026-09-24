import {useEffect,useRef,useState} from 'react';
import {Preloader,INITIAL_MESSAGES,RETRY_MESSAGES} from './Preloader';
import {createPreloaderGate} from './preloader-gate.mjs';
import {prepareFirstView} from './first-view-readiness.mjs';

const initial={visible:true,mode:'normal',reason:null,retryNumber:0,showReadyMessage:false,leaving:false};

export function FirstVisit({children}){
  const page=useRef(null);
  const gate=useRef(null);
  const [state,setState]=useState(initial);
  useEffect(()=>{
    const session=createPreloaderGate({onState:setState});
    gate.current=session;
    session.start({prepare:signal=>prepareFirstView(page.current,signal)},{immediate:true});
    return()=>{session.dispose();if(gate.current===session)gate.current=null;};
  },[]);
  const captions=state.reason
    ?RETRY_MESSAGES[state.reason][Math.min(state.retryNumber,2)-1]
    :INITIAL_MESSAGES;
  return <>
    <div ref={page} inert={state.visible} aria-hidden={state.visible}>{children}</div>
    {state.visible&&<Preloader state={state.mode} captionSet={captions} onRetry={()=>gate.current?.retry()} showReadyMessage={state.showReadyMessage} overlay leaving={state.leaving}/>}
  </>;
}
