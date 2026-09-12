import {useEffect,useRef,useState} from 'react';
import {STROKE} from './network-data.mjs';
import {pulseRoutes,pulseTiming} from './pulse-routes.mjs';
import {schedulePulses} from './pulse.mjs';

export function RoutePulse(){
  const root=useRef(null);
  const [pulse,setPulse]=useState(null);
  useEffect(()=>{
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    let stop;
    function sync(){
      stop?.();
      setPulse(null);
      if(!motion.matches&&!document.hidden){
        const matrix=root.current.ownerSVGElement.getScreenCTM();
        const scale=Math.hypot(matrix.a,matrix.b);
        const measured=pulseRoutes.map(route=>{
          const path=document.createElementNS('http://www.w3.org/2000/svg','path');
          path.setAttribute('d',route.d);
          const length=path.getTotalLength();
          return {...route,length,strokeWidth:STROKE/scale,...pulseTiming(length,scale)};
        });
        stop=schedulePulses({routes:measured,emit:setPulse});
      }
    }
    sync();
    motion.addEventListener('change',sync);
    document.addEventListener('visibilitychange',sync);
    const observer=new ResizeObserver(sync);
    observer.observe(root.current.ownerSVGElement);
    return ()=>{stop?.();observer.disconnect();motion.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);};
  },[]);
  // Short contiguous dashes approximate an arc-length gradient, including bends.
  // A spatial SVG gradient would point the wrong way when the route turns.
  return <g ref={root}>{pulse&&<g key={pulse.id} className="route-pulse" fill="none" strokeWidth={pulse.strokeWidth}
    data-from={pulse.reverse?pulse.to:pulse.from} data-to={pulse.reverse?pulse.from:pulse.to}
    data-direction={pulse.reverse?'reverse':'forward'}>
    {Array.from({length:36},(_,index)=>{
      const tail=35-index;
      const step=pulse.tail/36;
      const offset=tail*step*(pulse.reverse?-1:1);
      return <path key={tail} className="pulse-segment" d={pulse.d}
        strokeDasharray={`${step*1.05} ${2*(pulse.length+pulse.tail)}`} strokeLinecap="butt"
        opacity={Math.pow(1-tail/36,1.8)}
        style={{animationDuration:`${pulse.duration}ms`,
          '--pulse-from':(pulse.reverse?-pulse.length:0)+offset,
          '--pulse-to':(pulse.reverse?pulse.tail:-pulse.length-pulse.tail)+offset}}/>;
    })}
  </g>}</g>;
}
