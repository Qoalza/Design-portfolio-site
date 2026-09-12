export function schedulePulses({routes,emit,arrive=()=>{},random=Math.random,schedule=setTimeout,cancel=clearTimeout}){
  let stopped=false;
  let serial=0;
  let startTimer;
  let arrivalTimer;
  function idleDelay(){return 2000+random()*1000;}
  function next(delay=idleDelay()){
    startTimer=schedule(()=>{
      if(stopped)return;
      const route=Math.floor(random()*routes.length);
      const pulse={id:++serial,...routes[route],route,reverse:random()<0.5};
      emit(pulse);
      arrivalTimer=schedule(()=>{
        if(stopped)return;
        arrive({id:pulse.id,node:pulse.reverse?pulse.from:pulse.to});
        emit(null);
        next();
      },pulse.duration);
    },delay);
  }
  next();
  return ()=>{
    stopped=true;
    cancel(startTimer);
    cancel(arrivalTimer);
  };
}
