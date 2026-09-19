const listeners=new Set();

export function notifyLayoutInvalidated(){
 for(const listener of listeners)listener();
}

export function subscribeLayoutInvalidation(listener){
 listeners.add(listener);
 return()=>listeners.delete(listener);
}
