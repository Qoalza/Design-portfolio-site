import {open,constants,lstat} from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {readPortfolioRelease} from '../../portfolio-runtime/active-release.mjs';import {createGenerationReader} from '../../portfolio-delivery/reader.mjs';
import {verifyCMSArtifact,canonical} from './artifact.mjs';import {locations,acquire,appRoot} from './state.mjs';import {requireCurrentSchema,schemaContract} from './schema.mjs';import {launchWriter} from './writer-process.mjs';
export async function startCMSArtifact(){
 const state=locations();if(!state.server&&!state.fixture)throw new Error('Packaged CMS requires explicit server or disposable fixture mode');
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
 const manifest=await verifyCMSArtifact(root,{fixture:state.fixture});
 if((await schemaContract()).current!==manifest.schemaHash)throw new Error('CMS artifact schema manifest differs');
 for(const name of ['PORTFOLIO_CONTENT_ROOT','PORTFOLIO_ACTIVE_RELEASE'])if(!process.env[name]||!path.isAbsolute(process.env[name]))throw new Error('Explicit shared delivery paths required');
 const internal=new URL(process.env.PORTFOLIO_INTERNAL_ORIGIN??'');if(internal.protocol!=='http:'||internal.hostname!=='127.0.0.1'||internal.username||internal.password||internal.pathname!=='/'||internal.search||internal.hash)throw new Error('Explicit loopback Portfolio origin required');
 for(const name of ['PORTFOLIO_CONTENT_ROOT','PORTFOLIO_ACTIVE_RELEASE']){const file=path.resolve(process.env[name]);if(file===state.root||file.startsWith(state.root+path.sep))throw new Error('Shared public delivery cannot be private CMS state');}
 await requireCurrentSchema(state.root);
 const lock=await acquire(state);
 try{
  const activeCode=await readPortfolioRelease(process.env.PORTFOLIO_ACTIVE_RELEASE,{requireClean:state.server});
  if(!manifest.producer.contractVersions.includes(activeCode.renderer.contractVersion))throw new Error('CMS producer cannot serve active delivery contract');
  await createGenerationReader({root:process.env.PORTFOLIO_CONTENT_ROOT,renderer:{...activeCode.renderer,capabilities:manifest.producer.capabilities}}).readActive({allowLastGood:false});
  // Read schema again under exclusive ownership; no migration or bootstrap.
  await requireCurrentSchema(state.root);const secretFile=path.join(state.root,'secret');
  const rootInfo=await lstat(state.root);if(rootInfo.isSymbolicLink()||!rootInfo.isDirectory())throw new Error('Private CMS state must be a regular directory');
  const fd=await open(secretFile,constants.O_RDONLY|constants.O_NOFOLLOW);let secret;
  try{const stat=await fd.stat();if(!stat.isFile()||stat.size!==96||(stat.mode&0o077))throw new Error('Invalid private secret file');secret=await fd.readFile('utf8');}finally{await fd.close();}
  if(!/^[a-f0-9]{96}$/.test(secret))throw new Error('Invalid CMS secret');
  const env={NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',PAYLOAD_TELEMETRY_DISABLED:'1',HOSTNAME:'127.0.0.1',PORT:String(state.port),PAYLOAD_PORT:state.server?String(state.port):undefined,
   ...(state.fixture?{TMPDIR:path.dirname(state.root)}:{}),PAYLOAD_RUNTIME_MODE:state.mode,...(state.server?{PAYLOAD_DATA_ROOT:state.root,PAYLOAD_PUBLIC_URL:state.origin}:{PAYLOAD_LOCAL_ROOT:state.root}),PAYLOAD_SECRET:secret,
   PAYLOAD_CODE_BUILD_DIR:manifest.buildDir,PAYLOAD_CMS_BUILD_ID:canonical(manifest.cmsBuildId),PAYLOAD_CMS_SCHEMA_HASH:manifest.schemaHash,
   PORTFOLIO_CONTENT_ROOT:process.env.PORTFOLIO_CONTENT_ROOT,PORTFOLIO_ACTIVE_RELEASE:process.env.PORTFOLIO_ACTIVE_RELEASE,PORTFOLIO_INTERNAL_ORIGIN:internal.origin};
  const code=await launchWriter({lock,cwd:appRoot,entry:path.join(appRoot,'server.js'),env});if(code!==0)process.exitCode=code;
 }finally{await lock.release();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 const work=args.length===0?startCMSArtifact():args[0]==='verify'&&(args.length===1||(args.length===2&&args[1]==='--fixture'))?
  verifyCMSArtifact(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..'),{fixture:args.includes('--fixture')}).then(({cmsBuildId,runtime,schemaHash,producer})=>console.log(JSON.stringify({cmsBuildId,runtime,schemaHash,producer}))):Promise.reject(new Error('Use start with no arguments or verify [--fixture]'));
 work.catch(error=>{console.error(error.message);process.exitCode=1;});
}
