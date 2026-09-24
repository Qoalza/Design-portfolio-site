export const QUICK_NAVIGATION_MS=200;
export const LOGO_REVOLUTION_MS=1800/1.26;
export const LONG_LOADING_MS=10000;
export const READY_CAPTION_MS=450;
export const REVEAL_MS=180;

const hidden={visible:false,mode:'normal',reason:null,retryNumber:0,showReadyMessage:false,leaving:false};

export function createPreloaderGate({onState,now=()=>performance.now(),setTimer=setTimeout,clearTimer=clearTimeout}){
  let active=null;
  const retries={slow:0,connection:0};
  const emit=attempt=>onState({
    visible:attempt.visible,
    mode:attempt.mode,
    reason:attempt.reason,
    retryNumber:attempt.retryNumber,
    showReadyMessage:attempt.showReadyMessage,
    leaving:attempt.leaving,
  });
  const clear=attempt=>{
    for(const timer of attempt.timers)clearTimer(timer);
    attempt.timers.clear();
  };
  const cancel=()=>{
    if(!active)return;
    clear(active);
    active.controller.abort();
    active=null;
  };
  const schedule=(attempt,delay,callback)=>{
    const timer=setTimer(()=>{
      attempt.timers.delete(timer);
      if(active===attempt)callback();
    },Math.max(0,delay));
    attempt.timers.add(timer);
  };
  const show=attempt=>{
    if(attempt.visible)return;
    attempt.visible=true;
    attempt.shownAt=now();
    emit(attempt);
  };
  const finish=attempt=>{
    if(active!==attempt)return;
    clear(attempt);
    active=null;
    onState(hidden);
  };
  const reveal=(attempt,value)=>{
    if(active!==attempt)return;
    attempt.config.commit?.(value);
    attempt.leaving=true;
    emit(attempt);
    schedule(attempt,REVEAL_MS,()=>finish(attempt));
  };
  const ready=(attempt,value)=>{
    if(active!==attempt)return;
    clear(attempt);
    if(!attempt.visible){
      Promise.resolve(attempt.config.softTransition?.(value)??attempt.config.commit?.(value))
        .then(()=>finish(attempt),error=>fail(attempt,error));
      return;
    }
    const elapsed=now()-attempt.shownAt;
    if(elapsed>=LOGO_REVOLUTION_MS){
      attempt.mode='normal';
      attempt.showReadyMessage=true;
      emit(attempt);
      schedule(attempt,READY_CAPTION_MS,()=>reveal(attempt,value));
    }else schedule(attempt,LOGO_REVOLUTION_MS-elapsed,()=>reveal(attempt,value));
  };
  const fail=(attempt,error)=>{
    if(active!==attempt||attempt.controller.signal.aborted)return;
    clear(attempt);
    if(error?.name==='AbortError')return;
    show(attempt);
    attempt.mode='connection';
    emit(attempt);
  };
  const start=(config,{immediate=false,reason=null,retryNumber=0}={})=>{
    cancel();
    const attempt={config,controller:new AbortController(),timers:new Set(),visible:false,shownAt:null,mode:'normal',reason,retryNumber,showReadyMessage:false,leaving:false};
    active=attempt;
    if(immediate)show(attempt);
    else schedule(attempt,QUICK_NAVIGATION_MS,()=>show(attempt));
    schedule(attempt,LONG_LOADING_MS,()=>{
      show(attempt);
      attempt.mode='slow';
      emit(attempt);
    });
    Promise.resolve().then(()=>config.prepare(attempt.controller.signal)).then(
      value=>ready(attempt,value),
      error=>fail(attempt,error),
    );
    return attempt.controller.signal;
  };
  const retry=()=>{
    if(!active||!['slow','connection'].includes(active.mode))return;
    const reason=active.mode;
    retries[reason]+=1;
    start(active.config,{immediate:true,reason,retryNumber:Math.min(retries[reason],2)});
  };
  return {start,retry,dispose:cancel};
}
