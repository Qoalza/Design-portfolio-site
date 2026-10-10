import {drawPreloaderMorph} from './preloader-morph-draw.mjs';
import {mountPreloaderLogo} from './preloader-motion.mjs';
import {INITIAL_MESSAGES,RETRY_MESSAGES} from './preloader-copy.mjs';

export function createEarlyPresenter(element){
 const speed={current:1},svg=element.querySelector('.preloader-symbol'),morph=element.querySelector('.preloader-morph');
 let motion=mountPreloaderLogo(svg,speed),pausedPhase=null;
 const caption=element.querySelector('.preloader-caption');
 let status=element.querySelector('.preloader-status');
 const heading=status.querySelector('h1'),copy=status.querySelector('p'),button=status.querySelector('button');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let state=null,disposed=false,morphProgress=0,morphFrame=0,captionIndex=0,captionTimer=0,stopTimer=0,statusTimer=0;
 const timers=new Set();
 const later=(fn,delay)=>{const id=setTimeout(()=>{timers.delete(id);if(!disposed)fn();},delay);timers.add(id);return id;};
 const clear=id=>{clearTimeout(id);timers.delete(id);};
 const messages=()=>state.reason?RETRY_MESSAGES[state.reason][Math.min(state.retryNumber,2)-1]:INITIAL_MESSAGES;
 const showCaption=(text,outgoing=false)=>{
  const previous=caption.querySelector('.is-incoming');
  for(const old of caption.querySelectorAll('.preloader-caption-content'))if(old!==previous)old.remove();
  if(previous&&outgoing&&!reduced.matches){previous.className='preloader-caption-content is-outgoing';previous.setAttribute('aria-hidden','true');later(()=>previous.remove(),300);}
  else previous?.remove();
  const incoming=document.createElement('span');incoming.className='preloader-caption-content is-incoming';incoming.textContent=text;
  caption.appendChild(incoming);
 };
 const syncCaption=()=>{
  clearInterval(captionTimer);
  if(disposed||state?.mode!=='normal'||state.showReadyMessage||document.hidden||reduced.matches)return;
  captionTimer=setInterval(()=>showCaption(messages()[++captionIndex%messages().length],true),2000);
 };
 reduced.addEventListener('change',syncCaption);document.addEventListener('visibilitychange',syncCaption);
 const transitionMorph=connection=>{
  cancelAnimationFrame(morphFrame);clear(stopTimer);
  const from=morphProgress,to=connection?1:0,start=performance.now();
  if(connection){
   morph.classList.add('is-active');
   stopTimer=later(()=>{pausedPhase=motion.phase();motion();},90);
  }
  const tick=now=>{
   if(disposed)return;
   const fraction=reduced.matches?1:Math.min(1,(now-start)/370);
   morphProgress=from+(to-from)*fraction;drawPreloaderMorph(morph,morphProgress);
   if(fraction<1)morphFrame=requestAnimationFrame(tick);
   else if(!connection){
    if(pausedPhase){motion=mountPreloaderLogo(svg,speed,{...pausedPhase,sampledAt:performance.now()});pausedPhase=null;}
    morph.classList.remove('is-active');
   }
  };
  morphFrame=requestAnimationFrame(tick);
 };
 const paint=next=>{
  if(disposed)return;
  const previous=state;state=next;
  element.dataset.state=next.mode;element.classList.toggle('is-leaving',next.leaving);
  speed.current=next.mode==='slow'?.5:1;
  if((previous?.mode==='connection')!==(next.mode==='connection'))transitionMorph(next.mode==='connection');
  const normal=next.mode==='normal';
  caption.classList.toggle('is-hidden',!normal);caption.setAttribute('aria-hidden',String(!normal));
  if(previous?.mode!==next.mode){
   clear(statusTimer);button.disabled=normal;
   if(normal&&previous){
    status.classList.add('is-exiting');status.setAttribute('aria-hidden','true');status.removeAttribute('role');
    statusTimer=later(()=>{status.hidden=true;},370);
   }else if(!normal){
    // React keys the status by mode. Recreate its frame when switching visible
    // states so the approved CSS entrance restarts; keep button/listener nodes.
    if(previous&&previous.mode!=='normal'){
     const replacement=status.cloneNode(false);
     while(status.firstChild)replacement.appendChild(status.firstChild);
     status.replaceWith(replacement);status=replacement;
    }
    status.hidden=false;status.className=`preloader-status ${next.mode}`;status.setAttribute('aria-hidden','false');
    status.setAttribute('role',next.mode==='connection'?'alert':'status');
    heading.textContent=next.mode==='slow'?'Долгая загрузка':'Проблема с соединением';
    copy.innerHTML=next.mode==='slow'?'Страница открывается дольше обычного.<br/>Подождите или повторите попытку.':'Не удалось открыть страницу.<br/>Проверьте соединение и попробуйте ещё раз.';
   }
  }
  if(!previous||previous.reason!==next.reason||previous.retryNumber!==next.retryNumber||(previous.mode!=='normal'&&normal)){captionIndex=0;showCaption(messages()[0]);}
  if(next.showReadyMessage&&!previous?.showReadyMessage)showCaption('Всё, перехожу');
  if(!previous||previous.mode!==next.mode||previous.reason!==next.reason||previous.retryNumber!==next.retryNumber||previous.showReadyMessage!==next.showReadyMessage)syncCaption();
 };
 return {paint,phase:()=>pausedPhase??motion.phase(),dispose(){disposed=true;motion();cancelAnimationFrame(morphFrame);clearInterval(captionTimer);for(const id of timers)clearTimeout(id);reduced.removeEventListener('change',syncCaption);document.removeEventListener('visibilitychange',syncCaption);}};
}
