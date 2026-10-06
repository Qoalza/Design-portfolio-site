import {acquire} from './state.mjs';
// One lifetime owner across code reloads. Only the owned ChildProcess is stopped;
// the private root lock is released after the last writer has actually exited.
export async function superviseCMS({state,load,start}){
 const lock=await acquire(state);let stopped=false,reload=false,current;
 const stop=()=>{stopped=true;current?.abort();};
 const requestReload=()=>{if(!stopped){reload=true;current?.abort();}};
 process.on('SIGINT',stop);process.on('SIGTERM',stop);process.on('SIGUSR2',requestReload);
 try{
  while(!stopped){
   reload=false;const selected=await load();if(stopped)break;if(reload)continue;
   current=new AbortController();
   let code;
   try{code=await start(selected,{providedLock:lock,signal:current.signal});}
   catch(error){if(error.name!=='AbortError'||!current.signal.aborted||(!reload&&!stopped))throw error;}
   finally{current=undefined;}
   if(stopped)break;if(reload)continue;
   return code;
  }
  return 0;
 }finally{
  process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);process.removeListener('SIGUSR2',requestReload);
  await lock.release();
 }
}
