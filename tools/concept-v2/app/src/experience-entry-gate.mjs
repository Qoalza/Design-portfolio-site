export const ENTRY_GESTURE_IDLE_MS=120;
export const ENTRY_GESTURE_MAX_HOLD_MS=600;

export function createExperienceEntryGate({
  schedule=setTimeout,
  cancel=clearTimeout,
  onStateChange=()=>{},
}={}){
  let state='idle';
  let idleTimer;
  let maximumTimer;
  let generation=0;
  let idleGeneration=0;
  const setState=next=>{
    state=next;
    onStateChange(state);
  };
  const scheduleArm=()=>{
    idleGeneration+=1;
    const scheduledIdleGeneration=idleGeneration;
    cancel(idleTimer);
    idleTimer=schedule(()=>{
      if(state==='holding'&&idleGeneration===scheduledIdleGeneration){
        cancel(maximumTimer);
        setState('armed');
      }
    },ENTRY_GESTURE_IDLE_MS);
  };
  return{
    get state(){return state;},
    capture(){
      setState('holding');
      generation+=1;
      const scheduledGeneration=generation;
      cancel(maximumTimer);
      maximumTimer=schedule(()=>{
        if(state==='holding'&&generation===scheduledGeneration){
          cancel(idleTimer);
          setState('armed');
        }
      },ENTRY_GESTURE_MAX_HOLD_MS);
      scheduleArm();
    },
    onVirtualScroll({deltaY=0}={}){
      if(state==='holding'){
        if(deltaY<0){
          cancel(idleTimer);
          cancel(maximumTimer);
          setState('idle');
          return true;
        }
        scheduleArm();
        return false;
      }
      if(state==='armed'){
        cancel(idleTimer);
        cancel(maximumTimer);
        setState('released');
        return true;
      }
      return false;
    },
    reset(){
      generation+=1;
      idleGeneration+=1;
      cancel(idleTimer);
      cancel(maximumTimer);
      setState('idle');
    },
    dispose(){
      generation+=1;
      idleGeneration+=1;
      cancel(idleTimer);
      cancel(maximumTimer);
    },
  };
}
