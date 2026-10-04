import {createFrameTask} from './frame-task.mjs';

export function createViewActivity({target,rootMargin='0px',threshold=0,documentRef=document,createObserver=(callback,options)=>new IntersectionObserver(callback,options),requestFrame=requestAnimationFrame,cancelFrame=cancelAnimationFrame,onChange=()=>{}}){
 let disposed=false;
 let observed=false;
 let intersecting=false;
 let documentVisible=!documentRef.hidden;
 let active=false;
 let firstResult=true;
 let awaitingVisibleResult=false;
 const exitTask=createFrameTask({requestFrame,cancelFrame,write:()=>{
  if(disposed||intersecting||!documentVisible)return;
  publish(false,'exit');
 }});
 let observer;
 function publish(next,reason){
  if(active===next)return;
  active=next;
  onChange({active,reason});
 }
 function observe(){
  observer?.disconnect();
  observer=createObserver(entries=>{
   if(disposed)return;
   const next=entries[0]?.isIntersecting===true;
   const reason=firstResult?'initial':awaitingVisibleResult?'visible':next?'enter':'exit';
   firstResult=false;
   awaitingVisibleResult=false;
   intersecting=next;
   if(!documentVisible){publish(false,'hidden');return;}
   if(next){exitTask.cancel();publish(true,reason);return;}
   exitTask.schedule(true);
  },{rootMargin,threshold});
  observer.observe(target);
  observed=true;
 }
 function onVisibilityChange(){
  documentVisible=!documentRef.hidden;
  if(!documentVisible){exitTask.cancel();publish(false,'hidden');return;}
  intersecting=false;
  awaitingVisibleResult=true;
  observe();
 }
 observe();
 documentRef.addEventListener('visibilitychange',onVisibilityChange);
 return {
  get active(){return active;},
  dispose(){
   if(disposed)return;
   disposed=true;
   exitTask.dispose();
   if(observed)observer?.disconnect();
   documentRef.removeEventListener('visibilitychange',onVisibilityChange);
  },
 };
}
