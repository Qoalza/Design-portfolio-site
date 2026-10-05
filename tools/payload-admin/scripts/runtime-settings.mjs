import path from 'node:path';import os from 'node:os';
/** @param {{env?: NodeJS.ProcessEnv, appRoot?: string}} options */
export function runtimeSettings({env=process.env,appRoot=process.cwd()}={}){
 appRoot=path.resolve(appRoot);
 const local=path.join(appRoot,'.local');
 const requested=env.PAYLOAD_RUNTIME_MODE;
 if(requested&&!['development','fixture','server'].includes(requested))throw new Error('Unknown Payload runtime mode');
 if(requested==='server'){
  if(env.PAYLOAD_LOCAL_ROOT)throw new Error('Server mode cannot use local sandbox data');
  const raw=env.PAYLOAD_DATA_ROOT;
  if(!raw||!path.isAbsolute(raw)||!/^[a-zA-Z0-9._/-]+$/.test(raw))throw new Error('Server mode requires an absolute permanent PAYLOAD_DATA_ROOT');
  const root=path.resolve(raw),repoRoot=path.resolve(appRoot,'../..');
  if(root==='/'||root===repoRoot||root.startsWith(repoRoot+path.sep)||root==='/var/www'||root.startsWith('/var/www/'))throw new Error('Permanent Payload data must stay outside code and public directories');
  if(env.PAYLOAD_PUBLIC_URL!=='https://art-des.ru')throw new Error('Server mode requires the approved HTTPS origin https://art-des.ru');
  const rawPort=env.PAYLOAD_PORT||'3000',port=Number(rawPort);
  if(!/^\d+$/.test(rawPort)||!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid private Payload port');
  return {mode:'server',server:true,fixture:false,root,port,origin:env.PAYLOAD_PUBLIC_URL};
 }
 if(env.PAYLOAD_DATA_ROOT||env.PAYLOAD_PUBLIC_URL||env.PAYLOAD_PORT)throw new Error('Server settings require explicit server mode');
 const root=path.resolve(env.PAYLOAD_LOCAL_ROOT||local);
 const fixture=path.dirname(root)===path.resolve(os.tmpdir())&&path.basename(root).startsWith('des-art-payload-test-');
 if(root!==local&&!fixture)throw new Error('Use only the local CMS directory or an explicit disposable fixture');
 if(requested==='fixture'&&!fixture)throw new Error('Fixture mode requires a disposable test directory');
 if(requested==='development'&&fixture)throw new Error('Development mode cannot use fixture storage');
 const port=fixture?41741:41740;
 return {mode:fixture?'fixture':'development',server:false,fixture,root,port,origin:`http://127.0.0.1:${port}`};
}
