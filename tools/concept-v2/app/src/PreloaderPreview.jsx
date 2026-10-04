import {useEffect, useState} from 'react';
import {Preloader, INITIAL_MESSAGES, RETRY_MESSAGES} from './Preloader';
import {LONG_LOADING_MS} from './preloader-gate.mjs';
import './preloader-preview.css';

const CYCLE_STEPS=[
  {mode:'normal',advance:'timer'},
  {mode:'slow',advance:'retry'},
  {mode:'normal',reason:'slow',retryNumber:1,advance:'timer'},
  {mode:'connection',advance:'retry'},
  {mode:'normal',reason:'connection',retryNumber:1,advance:'timer'},
  {mode:'slow',advance:'retry'},
  {mode:'normal',reason:'slow',retryNumber:2,advance:'timer'},
  {mode:'connection',advance:'timer-or-retry'},
  {mode:'normal',reason:'connection',retryNumber:2,advance:'timer'},
];

export function PreloaderPreview(){
  const [stepIndex,setStepIndex]=useState(0);
  const step=CYCLE_STEPS[stepIndex];
  const advanceCycle=()=>setStepIndex(index=>(index+1)%CYCLE_STEPS.length);
  useEffect(()=>{
    if(!step.advance.includes('timer'))return undefined;
    const timer=setTimeout(advanceCycle,LONG_LOADING_MS);
    return()=>clearTimeout(timer);
  },[stepIndex]);
  const captions=step.reason
    ?RETRY_MESSAGES[step.reason][step.retryNumber-1]
    :INITIAL_MESSAGES;
  return <div className="preloader-preview">
    <Preloader state={step.mode} captionSet={captions} onRetry={advanceCycle}/>
    <nav className="preloader-preview-controls" aria-label="Состояние прелоадера">
      <div className="preloader-preview-options">
        <button type="button" onClick={()=>setStepIndex(0)}>Цикл</button>
      </div>
    </nav>
  </div>;
}
