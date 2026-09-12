export function schedulePulses({routes,emit,random=Math.random,schedule=setTimeout,cancel=clearTimeout}){
  let stopped=false;
  let serial=0;
  let timer;
  function next(delay){
    timer=schedule(()=>{
      if(stopped)return;
      const route=Math.floor(random()*routes.length);
      const pulse={id:++serial,...routes[route],route,reverse:random()<0.5};
      emit(pulse);
      next(pulse.duration+2000+random()*3000);
    },delay);
  }
  next(2000);
  return ()=>{stopped=true;cancel(timer);};
}
