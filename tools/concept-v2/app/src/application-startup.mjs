// The HTML shell owns this lifecycle. React and its imports can fail independently.
export function abortable(promise,signal){
 return new Promise((resolve,reject)=>{
  if(signal.aborted){reject(signal.reason);return;}
  const cleanup=()=>signal.removeEventListener('abort',aborted);
  const aborted=()=>{cleanup();reject(signal.reason);};
  signal.addEventListener('abort',aborted,{once:true});
  promise.then(value=>{cleanup();resolve(value);},error=>{cleanup();reject(error);});
 });
}

export function createApplicationStartup({entry,load=url=>import(/* @vite-ignore */ url)}){
 let current=null,disposed=false;
 const clear=()=>{if(current){current.active=false;current.dispose?.();current=null;}};
 const ensure=async(signal,attemptId)=>{
  if(disposed)throw new DOMException('Disposed','AbortError');
  if(current?.running&&!current.error)return current;
  clear();
  let rejectFailure;
  const record={active:true,running:false,error:null,dispose:null,failure:new Promise((_resolve,reject)=>{rejectFailure=reject;})};
  record.failure.catch(()=>{});
  current=record;
  const fail=error=>{
   if(!record.active)return;
   record.error=error;rejectFailure(error);
  };
  const url=new URL(entry);
  if(attemptId>0)url.searchParams.set('preloader-attempt',String(attemptId));
  try{
   const application=await abortable(load(url.href),signal);
   if(!record.active||signal.aborted)throw signal.reason??new DOMException('Superseded','AbortError');
   record.dispose=application.mountApplication({onError:fail});
   record.running=true;
   if(record.error)throw record.error;
   return record;
  }catch(error){fail(error);throw error;}
 };
 return {ensure,dispose({keepApplication=false}={}){disposed=true;if(keepApplication&&current){current.active=false;current=null;}else clear();}};
}
