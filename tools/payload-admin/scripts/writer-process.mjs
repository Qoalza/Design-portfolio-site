import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const barrier=fileURLToPath(new URL('./writer-child.mjs',import.meta.url));
export async function launchWriter({lock,cwd,env,entry,args=[],execArgv=[],stdio=['inherit','inherit','inherit'],input,onStop=()=>{},signal}) {
 if(signal?.aborted)throw new DOMException('Writer launch aborted','AbortError');
 const child=spawn(process.execPath,[...execArgv,barrier,entry,...args],{cwd,env:{...env,PAYLOAD_WRITER_TOKEN:lock.token,PAYLOAD_LOCK_FILE:lock.ownerFile},stdio:[...stdio,'ipc']});
 const completion=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>resolve(code??1));});
 // Observe spawn errors even if registration itself fails first.
 completion.catch(()=>{});
 const terminate=()=>{child.kill('SIGTERM');};
 const stop=()=>{onStop();terminate();};
 signal?.addEventListener('abort',terminate,{once:true});process.once('SIGINT',stop);process.once('SIGTERM',stop);
 try {
  await lock.child(child.pid);
  if(signal?.aborted)throw new DOMException('Writer launch aborted','AbortError');
  await new Promise((resolve,reject)=>child.send('start',error=>error?reject(error):resolve()));
  if(input!==undefined)child.stdin.end(input);
  return await completion;
 }finally {
  if(child.exitCode===null&&child.signalCode===null){stop();await completion.catch(()=>{});}
  signal?.removeEventListener('abort',terminate);
  process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);
  await lock.child(null);
 }
}
