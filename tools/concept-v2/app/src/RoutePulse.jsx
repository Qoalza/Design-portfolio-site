import {useEffect,useRef,useState} from 'react';
import {glyph,nodes,position} from './network-data.mjs';
import {measurePulseRoutes,scalePulseRoutes,screenScale} from './pulse-routes.mjs';
import {schedulePulses} from './pulse.mjs';
import {createFrameTask} from './runtime/frame-task.mjs';
import {createViewActivity} from './runtime/view-activity.mjs';
import {subscribeScrollActivity} from './smooth-scroll-runtime.mjs';

export function RoutePulse(){
  const root=useRef(null);
  const [pulse,setPulse]=useState(null);
  const [arrival,setArrival]=useState(null);
  useEffect(()=>{
    const svg=root.current?.ownerSVGElement;
    if(!svg)return undefined;
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    let controller;
    let active=false;
    let scrollActive=false;
    let hasStarted=false;
    let lastScale;
    const measured=measurePulseRoutes(d=>{
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d',d);
      return path.getTotalLength();
    });
    const resumeTask=createFrameTask({write:()=>{
      if(scrollActive||!active||!controller)return;
      controller.resume({immediate:true});
    }});
    function clear(){
      resumeTask.cancel();
      controller?.stop();
      controller=undefined;
      setPulse(null);
      setArrival(null);
    }
    function readScale(){
      return screenScale(svg.getScreenCTM?.());
    }
    function sync({immediate=false}={}){
      if(!active||motion.matches||document.hidden){clear();return;}
      const scale=readScale();
      if(scale===null){clear();return;}
      if(controller&&lastScale===scale)return;
      clear();
      lastScale=scale;
      controller=schedulePulses({routes:scalePulseRoutes(measured,scale),emit:value=>{setPulse(value);if(value)setArrival(null);},arrive:setArrival,initialDelay:immediate?0:undefined});
      if(scrollActive)controller.pause({cancelActive:true});
      hasStarted=true;
    }
    const task=createFrameTask({write:sync});
    const activity=createViewActivity({target:svg,rootMargin:'8px 0px',onChange:change=>{
      active=change.active;
      if(!active)resumeTask.cancel();
      task.schedule({immediate:change.reason==='enter'&&hasStarted});
    }});
    const resizeObserver=new ResizeObserver(()=>task.schedule({}));
    resizeObserver.observe(svg);
    const unsubscribeScroll=subscribeScrollActivity(next=>{
      scrollActive=next;
      resumeTask.cancel();
      if(!controller||!active)return;
      if(next)controller.pause({cancelActive:true});
      else resumeTask.schedule({});
    });
    const onMotionChange=()=>task.schedule({});
    motion.addEventListener('change',onMotionChange);
    return ()=>{unsubscribeScroll();activity.dispose();task.dispose();resumeTask.dispose();clear();resizeObserver.disconnect();motion.removeEventListener('change',onMotionChange);};
  },[]);
  // Short contiguous dashes approximate an arc-length gradient, including bends.
  // A spatial SVG gradient would point the wrong way when the route turns.
  const terminal=arrival&&nodes.find(node=>node[2]===arrival.node);
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
  </g>}{terminal&&(()=>{const {x,y}=position(terminal);const shape=glyph(terminal[4],x,y,42*(terminal[4]==='diamond'?1.2:1));const Shape=shape.tag;return <Shape key={arrival.id} className="terminal-arrival" {...shape.props} vectorEffect="non-scaling-stroke"/>;})()}</g>;
}
