let currentSmoothScroll;
const subscribers=new Set();
let scrollActive=false;
const scrollActivitySubscribers=new Set();
let wheelActive=false;
const wheelActivitySubscribers=new Set();

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

export function publishWheelActivity(next){
  const active=Boolean(next);
  if(wheelActive===active)return;
  wheelActive=active;
  wheelActivitySubscribers.forEach(subscriber=>subscriber(active));
}

export function subscribeWheelActivity(subscriber){
  wheelActivitySubscribers.add(subscriber);
  subscriber(wheelActive);
  return()=>wheelActivitySubscribers.delete(subscriber);
}
