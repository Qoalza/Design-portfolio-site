import {useEffect,useRef,useState} from 'react';
import {createBoffAnimationTimeline} from './boff-animation-timeline.mjs';

const ids=['side-panels','technical-panel-details','payout-history','api-setup'];
const root='/figma/project-boff/lottie';

export function BoffAnimations({children,className}){
 const element=useRef(null);
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  const container=element.current;
  const abort=new AbortController();
  const players=[];
  let disposed=false,timeline,observer,media,visibility,reduceChange;
  async function load(){
   // Dynamic player chunk is requested only when this B.Off component mounts.
   const [module,...data]=await Promise.all([
    import('lottie-web/build/player/lottie_canvas.min.js'),
    ...ids.map(async id=>{
     const response=await fetch(`${root}/${id}.json`,{signal:abort.signal});
     if(!response.ok)throw new Error(`B.Off illustration HTTP ${response.status}`);
     return response.json();
    }),
   ]);
   if(disposed)return;
   const lottie=module.default;
   const hosts=ids.map(id=>container.querySelector(`[data-boff-animation="${id}"]`));
   await Promise.all(data.map((animationData,index)=>new Promise((resolve,reject)=>{
    const player=lottie.loadAnimation({container:hosts[index],renderer:'canvas',loop:false,autoplay:false,animationData,rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});
    players.push(player);
    player.addEventListener('DOMLoaded',resolve);
    player.addEventListener('data_failed',()=>reject(new Error('B.Off illustration data failed')));
   })));
   if(disposed)return;
   // Keep ID/player association independent of asynchronous readiness order.
   timeline=createBoffAnimationTimeline({
    scenes:data.map((animation,index)=>({id:ids[index],group:index<2?'panels':ids[index],frames:animation.op-animation.ip,fps:animation.fr})),
    render:(id,frame)=>players[ids.indexOf(id)].goToAndStop(frame,true),
    now:()=>performance.now(),requestFrame:requestAnimationFrame,cancelFrame:cancelAnimationFrame,
   });
   media=matchMedia('(prefers-reduced-motion: reduce)');
   reduceChange=()=>timeline.setReducedMotion(media.matches);
   visibility=()=>timeline.setPageVisible(!document.hidden);
   reduceChange();visibility();
   media.addEventListener('change',reduceChange);
   document.addEventListener('visibilitychange',visibility);
   observer=new IntersectionObserver(entries=>{
    for(const entry of entries)timeline.setVisible(entry.target.dataset.boffAnimation,entry.isIntersecting);
   });
   hosts.forEach(host=>observer.observe(host));
  }
  load().catch(error=>{
   if(disposed||error.name==='AbortError')return;
   timeline?.destroy();players.forEach(player=>player.destroy());
   setFailed(true);console.error('B.Off illustrations could not load',error);
  });
  return ()=>{
   disposed=true;abort.abort();observer?.disconnect();timeline?.destroy();
   if(media&&reduceChange)media.removeEventListener('change',reduceChange);
   if(visibility)document.removeEventListener('visibilitychange',visibility);
   players.forEach(player=>player.destroy());
  };
 },[]);
 return <div className={className} ref={element} data-boff-animations={failed?'unavailable':'ready'}>{children}{failed&&<p role="status">Иллюстрации временно недоступны</p>}</div>;
}
