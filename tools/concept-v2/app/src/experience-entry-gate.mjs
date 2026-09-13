export const ENTRY_GESTURE_IDLE_MS=120;

export function createExperienceEntryGate({
  schedule=setTimeout,
  cancel=clearTimeout,
  onStateChange=()=>{},
}={}){
  let state='idle';
  let timer;
  let generation=0;
  const setState=next=>{
    state=next;
    onStateChange(state);
  };
  const scheduleArm=()=>{
    generation+=1;
    const scheduledGeneration=generation;
    cancel(timer);
    timer=schedule(()=>{
      if(state==='holding'&&generation===scheduledGeneration)setState('armed');
    },ENTRY_GESTURE_IDLE_MS);
  };
  return{
    get state(){return state;},
    capture(){
      setState('holding');
      scheduleArm();
    },
    onVirtualScroll({deltaY=0}={}){
      if(state==='holding'){
        if(deltaY<0){
          cancel(timer);
          setState('idle');
          return true;
        }
        scheduleArm();
        return false;
      }
      if(state==='armed'){
        cancel(timer);
        setState('released');
        return true;
      }
      return false;
    },
    reset(){
      generation+=1;
      cancel(timer);
      setState('idle');
    },
    dispose(){
      generation+=1;
      cancel(timer);
    },
  };
}
