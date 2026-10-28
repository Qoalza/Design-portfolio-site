import {createPreloaderGate} from './preloader-gate.mjs';
import {createEarlyResources} from './early-preloader-resources.mjs';
import {createEarlyPresenter} from './early-preloader-presenter.mjs';

// Inline in the first HTML: the original gate runs before and after React loads.
export function startEarlyPreloader(){
 const element=document.getElementById('early-preloader');
 if(!element)return;
 const shownAt=performance.now(),resources=createEarlyResources(),presenter=createEarlyPresenter(element),listeners=new Set();
 let state,disposed=false;
 const dispose=()=>{
  if(disposed)return;
  disposed=true;gate.dispose();resources.dispose({keepApplication:true});presenter.dispose();
  button.removeEventListener('click',retry);element.remove();document.documentElement.removeAttribute('data-early-loading');
  listeners.clear();
 };
 const gate=createPreloaderGate({onState:next=>{
  state=next;presenter.paint(next);
  for(const listener of listeners)listener(next);
  if(!next.visible)dispose();
 }});
 const retry=()=>gate.retry(),button=element.querySelector('.preloader-status button');
 button.addEventListener('click',retry);
 window.__CONCEPT_EARLY_PRELOADER__={shownAt,snapshot:()=>({...state,phase:presenter.phase()}),dispose,connect(prepare,onState){
  onState(state);
  if(disposed)return()=>{};
  listeners.add(onState);const detach=resources.attach(prepare);
  return()=>{listeners.delete(onState);detach();};
 }};
 gate.start({prepare:(signal,{retryNumber,attemptId})=>resources.prepare(signal,retryNumber,attemptId)},{immediate:true,shownAt});
}
