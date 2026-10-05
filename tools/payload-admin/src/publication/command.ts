import {spawn} from 'node:child_process'
import {setTimeout as delay} from 'node:timers/promises'

export class UnstoppedCommandError extends Error {}

// Each build command owns a process group. A stopped npm must not leave Next/Vite
// writing into the checkout after preparation starts cleaning it up.
export async function runCommand(command:string,args:string[],options:{cwd:string;env?:NodeJS.ProcessEnv;timeout:number;maxBuffer:number}){
 const child=spawn(command,args,{cwd:options.cwd,env:options.env,detached:true,stdio:['ignore','pipe','pipe']})
 let stdout='',size=0,failure:Error|undefined,stopping:Promise<void>|undefined
 const signal=(name:NodeJS.Signals)=>{if(!child.pid)return;try{process.kill(-child.pid,name)}catch(error){if((error as NodeJS.ErrnoException).code!=='ESRCH')throw error}}
 const alive=()=>{if(!child.pid)return false;try{process.kill(-child.pid,0);return true}catch(error){if((error as NodeJS.ErrnoException).code==='ESRCH')return false;throw error}}
 const stop=()=>stopping??= (async()=>{if(!alive())return;signal('SIGTERM');await delay(250);signal('SIGKILL');for(let i=0;i<200&&alive();i++)await delay(10);if(alive())throw new UnstoppedCommandError('Build process group is still active')})()
 let rejectTermination:(error:unknown)=>void=()=>{}
 const terminationFailure=new Promise<never>((_,reject)=>{rejectTermination=reject})
 const fail=(message:string)=>{failure??=new Error(message);void stop().catch(rejectTermination)}
 const timer=setTimeout(()=>fail('Build command deadline exceeded'),options.timeout)
 child.stdout.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>options.maxBuffer)fail('Build command output limit exceeded');else stdout+=chunk.toString('utf8')})
 child.stderr.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>options.maxBuffer)fail('Build command output limit exceeded')})
 try{
  const code=await Promise.race([new Promise<number|null>((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)}),terminationFailure])
  // Also stop a child that deliberately detached its pipes from a completed npm.
  await stop()
  if(failure)throw failure
  if(code!==0)throw new Error('Build command failed')
  return {stdout}
 }finally{clearTimeout(timer);if(stopping)await stopping}
}
