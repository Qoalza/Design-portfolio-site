export function schedulePulses({routes,emit,arrive=()=>{},initialDelay,random=Math.random,schedule=setTimeout,cancel=clearTimeout}){
  let stopped=false;
  let paused=false;
  let pulseActive=false;
  let serial=0;
  let startTimer;
  let arrivalTimer;
  function idleDelay(){return 2000+random()*1000;}
  function next(delay=idleDelay()){
    startTimer=schedule(()=>{
      startTimer=undefined;
      if(stopped||paused)return;
      const route=Math.floor(random()*routes.length);
      const pulse={id:++serial,...routes[route],route,reverse:random()<0.5};
      pulseActive=true;
      emit(pulse);
      arrivalTimer=schedule(()=>{
        arrivalTimer=undefined;
        if(stopped||!pulseActive)return;
        pulseActive=false;
        arrive({id:pulse.id,node:pulse.reverse?pulse.from:pulse.to});
        emit(null);
        if(!paused)next();
      },pulse.duration);
    },delay);
  }
  next(initialDelay);
  function stop(){
    stopped=true;
    if(startTimer!==undefined)cancel(startTimer);
    if(arrivalTimer!==undefined)cancel(arrivalTimer);
  }
  function pause({cancelActive=false}={}){
    if(stopped)return;
    paused=true;
    if(!pulseActive&&startTimer!==undefined){
      cancel(startTimer);
      startTimer=undefined;
    }
    if(cancelActive){
      if(arrivalTimer!==undefined){
        cancel(arrivalTimer);
        arrivalTimer=undefined;
      }
      if(pulseActive){
        pulseActive=false;
        emit(null);
      }
      arrive(null);
    }
  }
  function resume({immediate=false}={}){
    if(stopped||!paused)return;
    paused=false;
    if(!pulseActive&&startTimer===undefined)next(immediate?0:undefined);
  }
  // Keep the callable stop contract for existing consumers while exposing
  // finite pause/resume controls to scroll-sensitive animation owners.
  stop.stop=stop;
  stop.pause=pause;
  stop.resume=resume;
  return stop;
}
