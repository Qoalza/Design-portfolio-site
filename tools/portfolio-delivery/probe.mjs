import {canonicalJSON} from './contract.mjs';
import { PublicationError, ReadinessRejected } from './coordinator.mjs';
// The only configurable part is a loopback origin. Requests never accept a file
// path, credentials, redirects or arbitrary URLs, and carry no authoring cookie.
export function createLoopbackProbe(origin,{timeoutMs=6000,portfolioBuildId}={}) {
 const base=new URL(origin);
 if(base.protocol!=='http:'||base.hostname!=='127.0.0.1'||!base.port||base.pathname!=='/'||base.username||base.password||base.search||base.hash)throw new Error('Public probe requires a fixed IPv4 loopback origin.');
 return async request=>{
  const url=new URL(request.kind==='active'?'/__internal/health':'/__internal/candidate',base);
  if(request.kind==='candidate')url.searchParams.set('contentId',request.contentId);
  // Fetch errors/timeouts are uncertain. They do not prove a new active pointer
  // should be reverted; an explicit retry resolves identities before writing.
  const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(timeoutMs),headers:{Accept:'application/json'}});
  let value;try {value=await response.json();}catch {throw new Error('Public probe response is uncertain.');}
  const expectedRenderer=request.rendererId??(request.kind==='active'?request.descriptor.rendererId:undefined);
  if(!value||typeof value!=='object'||typeof value.rendererId!=='string')throw new Error('Public probe code identity is uncertain.');
  if((expectedRenderer&&value.rendererId!==expectedRenderer)||(portfolioBuildId&&canonicalJSON(value.portfolioBuildId)!==canonicalJSON(portfolioBuildId)))throw new PublicationError('code-conflict');
  if(!response.ok)throw request.kind==='active'?new ReadinessRejected():new PublicationError('candidate-rejected');
  if(request.kind==='active') {
   const expected=request.descriptor;
   if(!value||typeof value!=='object'||Object.keys(expected).some(key=>(key==='rendererId'?(value.contentRendererId??value.rendererId):value[key])!==expected[key]))throw new ReadinessRejected();
  } else if(!value||value.contentId!==request.contentId||value.rendererId!==request.rendererId)throw new PublicationError('candidate-rejected');
 };
}
