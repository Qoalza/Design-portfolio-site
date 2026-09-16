export const ENTRY_GESTURE_IDLE_MS=120;
export const ENTRY_GESTURE_GAP_MS=48;
export const ENTRY_GESTURE_RESTART_RATIO=1.5;
export const ENTRY_GESTURE_RESTART_STEP=2;

export function createExperienceEntryGate({
  schedule=setTimeout,
  cancel=clearTimeout,
  now=()=>performance.now(),
  onStateChange=()=>{},
}={}){
  let state='idle';
  let timer;
  let generation=0;
  let previousDeltaMagnitude=Infinity;
  let previousInputTime;
  let risingEvents=0;
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
      previousDeltaMagnitude=Infinity;
      risingEvents=0;
      setState('holding');
      scheduleArm();
    },
    onVirtualScroll({deltaY=0,event}={}){
      const eventTime=Number(event?.timeStamp);
      const inputTime=Number.isFinite(eventTime)?eventTime:now();
      const gap=previousInputTime===undefined?0:inputTime-previousInputTime;
      if(deltaY!==0)previousInputTime=inputTime;
      if(state==='idle')return false;
      if(state==='holding'){
        if(deltaY<0){
          cancel(timer);
          setState('idle');
          return true;
        }
        if(deltaY>0&&gap>=ENTRY_GESTURE_GAP_MS){
          cancel(timer);
          setState('released');
          return true;
        }
        const magnitude=Math.abs(deltaY);
        if(magnitude>0){
          const renewed=magnitude>=previousDeltaMagnitude*ENTRY_GESTURE_RESTART_RATIO&&magnitude-previousDeltaMagnitude>=ENTRY_GESTURE_RESTART_STEP;
          risingEvents=renewed?risingEvents+1:0;
          previousDeltaMagnitude=magnitude;
          if(risingEvents>=2){
            cancel(timer);
            setState('released');
            return true;
          }
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
      previousDeltaMagnitude=Infinity;
      previousInputTime=undefined;
      risingEvents=0;
      setState('idle');
    },
    dispose(){
      generation+=1;
      cancel(timer);
    },
  };
}
