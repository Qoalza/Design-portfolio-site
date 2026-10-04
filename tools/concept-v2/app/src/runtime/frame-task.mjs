export function createFrameTask({read=value=>value,write=()=>{},requestFrame=requestAnimationFrame,cancelFrame=cancelAnimationFrame}){
 let frame=null;
  let payload;
 let hasPayload=false;
 let disposed=false;
 function flush(){
  frame=null;
  if(disposed||!hasPayload)return;
  const next=payload;
  payload=undefined;
  hasPayload=false;
  write(read(next));
 }
 function schedule(value){
   if(disposed)return;
   payload=value;
   hasPayload=true;
   if(frame===null)frame=requestFrame(flush);
 }
 function cancel(){
   if(frame!==null)cancelFrame(frame);
   frame=null;
   payload=undefined;
   hasPayload=false;
 }
 function dispose(){
   cancel();
   disposed=true;
 }
 return {schedule,cancel,dispose};
}
