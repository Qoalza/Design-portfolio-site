import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {readFile} from 'node:fs/promises';
import {canonicalJSON,exactObject} from '../portfolio-delivery/contract.mjs';
const execute=promisify(execFile),equal=(a,b)=>canonicalJSON(a)===canonicalJSON(b);
export function validateServiceConfig(value,app){
 exactObject(value,['unit','fragment','node','launcher','user','environmentFile','origin'],'Service configuration');
 if(!['portfolio','cms'].includes(app)||value.unit!==`art-des-${app}.service`||value.fragment!==`/etc/systemd/system/${value.unit}`||value.node!=='/usr/bin/node'||typeof value.user!=='string'||!/^portfolio-(public|cms)$/.test(value.user)||value.user!==(app==='cms'?'portfolio-cms':'portfolio-public'))throw new Error('Unapproved service identity');
 for(const field of ['launcher','environmentFile'])if(typeof value[field]!=='string'||!/^\/[a-zA-Z0-9_.\/-]+$/.test(value[field])||value[field].slice(1).split('/').some(part=>part==='.'||part==='..'||part===''))throw new Error('Invalid service file path');
 // First path component is empty by definition; validate normalized absolute paths.
 const origin=new URL(value.origin);if(origin.protocol!=='http:'||origin.hostname!=='127.0.0.1'||!origin.port||origin.pathname!=='/'||origin.username||origin.password||origin.search||origin.hash)throw new Error('Fixed loopback service origin required');
 return structuredClone(value);
}
export function createServiceAdapter({app,config,run=async args=>(await execute('/usr/bin/systemctl',args,{timeout:45000,maxBuffer:65536,env:{PATH:'/usr/bin:/bin',LC_ALL:'C'}})).stdout,fetchHealth=fetch,readCgroup=file=>readFile(file,'utf8'),resolveUID=async user=>Number((await execute('/usr/bin/id',['-u',user],{timeout:2000,maxBuffer:4096,env:{PATH:'/usr/bin:/bin',LC_ALL:'C'}})).stdout.trim()),readUIDs=async pid=>{const status=await readFile('/proc/'+pid+'/status','utf8'),match=status.match(/^Uid:\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/m);if(!match)throw new Error('Managed process credentials unavailable');return match.slice(1).map(Number);},timeoutMs=45000}){
 const fixed=validateServiceConfig(config,app);let uid;
 const hooks=['ExecCondition','ExecStartPre','ExecStartPost','ExecReload','ExecStop','ExecStopPost','OnFailure','OnSuccess'];
 async function service(){
  const properties=['LoadState','ActiveState','SubState','MainPID','ControlPID','ExecMainStartTimestampMonotonic','ExecStart','FragmentPath','DropInPaths','User','KillMode','Type','Restart','EnvironmentFiles','ControlGroup','ExecStartEx','FailureAction','SuccessAction','Group','NoNewPrivileges','ProtectSystem','ProtectHome','PrivateTmp','CapabilityBoundingSet','AmbientCapabilities',...hooks];
  const output=await run(['show',fixed.unit,'--no-pager','--property='+properties.join(',')]);const value={};
  for(const line of output.trim().split('\n')){const i=line.indexOf('=');if(i<1||Object.hasOwn(value,line.slice(0,i)))throw new Error('Service identity is uncertain');value[line.slice(0,i)]=line.slice(i+1);}
  if(properties.some(name=>!Object.hasOwn(value,name)))throw new Error('Incomplete service identity');
  const extended=[...value.ExecStartEx.matchAll(/\{\s*path=([^;]+);\s*argv\[\]=([^;]+);\s*flags=([^;]*);/g)];
  const starts=[...value.ExecStart.matchAll(/argv\[\]=([^;]+);/g)],executables=[...value.ExecStart.matchAll(/\{\s*path=([^;]+);/g)];
  if(value.Group!==fixed.user||value.NoNewPrivileges!=='yes'||value.ProtectSystem!=='strict'||value.ProtectHome!=='yes'||value.PrivateTmp!=='yes'||value.CapabilityBoundingSet!==''||value.AmbientCapabilities!==''||hooks.some(name=>value[name]!=='')||value.FailureAction!=='none'||value.SuccessAction!=='none'||extended.length!==1||extended[0][1].trim()!==fixed.node||extended[0][2].trim().split(/\s+/).join(' ')!==fixed.node+' '+fixed.launcher||extended[0][3].trim()!==''||value.LoadState!=='loaded'||value.FragmentPath!==fixed.fragment||value.DropInPaths!==''||value.User!==fixed.user||value.KillMode!=='control-group'||!['exec','simple'].includes(value.Type)||value.Restart!=='no'||value.EnvironmentFiles!==fixed.environmentFile+' (ignore_errors=no)'||executables.length!==1||executables[0][1].trim()!==fixed.node||starts.length!==1||starts[0][1].trim().split(/\s+/).join(' ')!==fixed.node+' '+fixed.launcher||!/^\d+$/.test(value.MainPID)||!/^\d+$/.test(value.ControlPID)||!/^\d+$/.test(value.ExecMainStartTimestampMonotonic)||value.ControlPID!=='0')throw new Error('Managed service differs from approved configuration');
  uid??=await resolveUID(fixed.user);const pid=Number(value.MainPID);
  if(!Number.isSafeInteger(uid)||uid<1||!Number.isSafeInteger(pid)||pid<0||pid>2147483647)throw new Error('Unapproved managed credentials');
  if(pid>0){const actual=await readUIDs(pid);if(!Array.isArray(actual)||actual.length!==4||actual.some(id=>id!==uid))throw new Error('Managed process credentials differ');}
  return value;
 }
 async function read(){
  const before=await service(),pid=Number(before.MainPID);if(!Number.isSafeInteger(pid))throw new Error('Unknown managed process');
  if(pid===0&&['inactive','failed'].includes(before.ActiveState)){
   if(before.ControlGroup){if(before.ControlGroup!==`/system.slice/${fixed.unit}`)throw new Error('Unknown service group');if((await readCgroup('/sys/fs/cgroup'+before.ControlGroup+'/cgroup.procs')).trim())throw new Error('Managed writer has not exited');}
   try{const response=await fetchHealth(fixed.origin+(app==='cms'?'/api/internal/cms-health':'/__internal/health'),{redirect:'error',signal:AbortSignal.timeout(1000),headers:{Connection:'close'}});await response.body?.cancel();throw new Error('Stopped service port is occupied');}catch(error){if(error.message==='Stopped service port is occupied')throw error;if(error.cause?.code!=='ECONNREFUSED')throw new Error('Stopped service port is uncertain');}
   return {status:'stopped'};
  }
  if(pid<1||before.ActiveState!=='active')throw new Error('Service transition is uncertain');
  const response=await fetchHealth(fixed.origin+(app==='cms'?'/api/internal/cms-health':'/__internal/health'),{redirect:'error',signal:AbortSignal.timeout(2000),headers:{Accept:'application/json',Connection:'close'}});const identity=await response.json();const after=await service();
  if(after.MainPID!==before.MainPID||after.ExecMainStartTimestampMonotonic!==before.ExecMainStartTimestampMonotonic||after.ActiveState!=='active'||(app==='cms'?identity.supervisorPID:identity.processId)!==pid)throw new Error('Health does not belong to the managed process');
  if(!Number.isSafeInteger(identity.codeActivationSeq)||identity.codeActivationSeq<0)throw new Error('Managed code epoch unavailable');
  return {status:response.ok?'ready':'starting',identity};
 }
 async function reload({target}){
  const before=await service();if(Number(before.MainPID)>0&&before.ActiveState!=='active')throw new Error('Managed service busy');
  if(app==='cms'&&Number(before.MainPID)>0)await run(['kill','--kill-whom=main','--signal=SIGUSR2',fixed.unit]);
  else await run([Number(before.MainPID)>0?'restart':'start',fixed.unit]);
  const started=Date.now();let last;
  while(Date.now()-started<timeoutMs){
   try{const actual=await read();const expected=app==='cms'?target.release.cmsBuildId:target.release.portfolioBuildId;
    if(actual.status==='ready'&&actual.identity.codeActivationSeq===target.activationSeq&&equal(app==='cms'?actual.identity.cmsBuildId:actual.identity.portfolioBuildId,expected)){
     if(app==='cms'&&Number(before.MainPID)>0&&actual.identity.supervisorPID!==Number(before.MainPID))throw new Error('CMS lifetime owner changed during reload');return;
    }
   }catch(error){last=error;}
   await new Promise(resolve=>setTimeout(resolve,200));
  }
  throw new Error('Managed code readiness not confirmed',{cause:last});
 }
 return {read,reload};
}
