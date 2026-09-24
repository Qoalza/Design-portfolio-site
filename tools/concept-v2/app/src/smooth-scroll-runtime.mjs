let currentSmoothScroll;
const subscribers=new Set();
let scrollActive=false;
const scrollActivitySubscribers=new Set();

export function publishSmoothScroll(instance){
  currentSmoothScroll=instance;
  subscribers.forEach(subscriber=>subscriber(instance));
}

export function subscribeSmoothScroll(subscriber){
  subscribers.add(subscriber);
  subscriber(currentSmoothScroll);
  return()=>subscribers.delete(subscriber);
}

// Consumers only receive state transitions, never the continuous Lenis stream.
// This lets visual work that is useful at rest yield immediately to scrolling.
export function publishScrollActivity(next){
  const active=Boolean(next);
  if(scrollActive===active)return;
  scrollActive=active;
  scrollActivitySubscribers.forEach(subscriber=>subscriber(active));
}

export function subscribeScrollActivity(subscriber){
  scrollActivitySubscribers.add(subscriber);
  subscriber(scrollActive);
  return()=>scrollActivitySubscribers.delete(subscriber);
}

export function bindScrollHoverGate(element,pointerTarget=window){
  let scrolling=false;
  let waitingForPointer=false;
  const block=()=>{element.dataset.scrollActive='true'};
  const release=()=>{delete element.dataset.scrollActive};
  const onPointerMove=()=>{
    pointerTarget.removeEventListener('pointermove',onPointerMove);
    if(scrolling)return;
    waitingForPointer=false;
    release();
  };
  const unsubscribe=subscribeScrollActivity(active=>{
    scrolling=active;
    pointerTarget.removeEventListener('pointermove',onPointerMove);
    if(active){
      waitingForPointer=true;
      block();
      return;
    }
    if(waitingForPointer){
      pointerTarget.addEventListener('pointermove',onPointerMove,{passive:true,once:true});
      return;
    }
    release();
  });
  return()=>{
    unsubscribe();
    pointerTarget.removeEventListener('pointermove',onPointerMove);
    release();
  };
}
