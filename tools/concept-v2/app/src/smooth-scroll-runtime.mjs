let currentSmoothScroll;
const subscribers=new Set();

export function publishSmoothScroll(instance){
  currentSmoothScroll=instance;
  subscribers.forEach(subscriber=>subscriber(instance));
}

export function subscribeSmoothScroll(subscriber){
  subscribers.add(subscriber);
  subscriber(currentSmoothScroll);
  return()=>subscribers.delete(subscriber);
}
