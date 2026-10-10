function abortable(promise,signal){
 return new Promise((resolve,reject)=>{
  if(signal.aborted){reject(signal.reason);return;}
  const aborted=()=>{cleanup();reject(signal.reason);};
  const cleanup=()=>signal.removeEventListener('abort',aborted);
  signal.addEventListener('abort',aborted,{once:true});
  promise.then(value=>{cleanup();resolve(value);},error=>{cleanup();reject(error);});
 });
}

// Retry failed resources in the existing document. Pending downloads remain usable.
export function createEarlyResources(){
 let app=null,moduleError=null,serial=0,disposed=false;
 const waiters=new Set(),failedModules=new Set(),links=[];
 const watchLink=link=>{
  const record={link,failed:false,cleanup:()=>{}};
  record.ready=new Promise((resolve,reject)=>{
   if(link.sheet){link.media='all';resolve();return;}
   const cleanup=()=>{link.removeEventListener('load',loaded);link.removeEventListener('error',failed);};
   const loaded=()=>{cleanup();link.media='all';resolve();};
   const failed=()=>{cleanup();record.failed=true;reject(new TypeError('Application stylesheet failed'));};
   record.cleanup=cleanup;
   link.addEventListener('load',loaded,{once:true});link.addEventListener('error',failed,{once:true});
  });
  record.ready.catch(()=>{});
  return record;
 };
 for(const link of document.querySelectorAll('link[data-app-style]'))links.push(watchLink(link));
 const failed=event=>{
  if(disposed||app||event.target?.tagName!=='SCRIPT'||event.target.type!=='module')return;
  failedModules.add(event.target);
  moduleError=new TypeError('Application module failed');
  for(const waiter of [...waiters])waiter.reject(moduleError);
 };
 window.addEventListener('error',failed,true);
 const retryFailed=()=>{
  serial++;
  for(let i=0;i<links.length;i++)if(links[i].failed){
   const previous=links[i],link=previous.link.cloneNode(false);
   const url=new URL(link.href,location.href);url.searchParams.set('preloader-retry',String(serial));link.href=url.href;
   links[i]=watchLink(link);previous.link.replaceWith(link);
  }
  moduleError=null;
  for(const previous of failedModules){
   // Script clones inherit HTML's already-started flag and would never run.
   const script=document.createElement('script');
   for(const name of previous.getAttributeNames())script.setAttribute(name,previous.getAttribute(name));
   if(previous.nonce)script.nonce=previous.nonce;
   if(previous.src){
    const url=new URL(previous.src,location.href);url.searchParams.set('preloader-retry',String(serial));script.src=url.href;
   }else script.textContent=previous.textContent;
   previous.replaceWith(script);
  }
  failedModules.clear();
 };
 const waitApp=signal=>{
  if(app)return Promise.resolve(app);
  if(moduleError)return Promise.reject(moduleError);
  return new Promise((resolve,reject)=>{
   if(signal.aborted){reject(signal.reason);return;}
   const cleanup=()=>{waiters.delete(waiter);signal.removeEventListener('abort',aborted);};
   const waiter={resolve:value=>{cleanup();resolve(value);},reject:error=>{cleanup();reject(error);}};
   const aborted=()=>waiter.reject(signal.reason);
   waiters.add(waiter);signal.addEventListener('abort',aborted,{once:true});
  });
 };
 const prepare=async(signal,retryNumber)=>{
  if(retryNumber>0)retryFailed();
  const [,attached]=await Promise.all([abortable(Promise.all(links.map(link=>link.ready)),signal),waitApp(signal)]);
  if(signal.aborted)throw signal.reason;
  // StrictMode can detach/reattach the readiness provider in the same commit.
  const current=app===attached?attached:await waitApp(signal);
  return current.prepare(signal,retryNumber);
 };
 const attach=prepare=>{
  const record={prepare};app=record;moduleError=null;
  for(const waiter of [...waiters])waiter.resolve(record);
  return()=>{if(app===record)app=null;};
 };
 return {prepare,attach,dispose(){disposed=true;window.removeEventListener('error',failed,true);for(const link of links)link.cleanup();for(const waiter of [...waiters])waiter.reject(new DOMException('Disposed','AbortError'));}};
}
