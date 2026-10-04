import {createPortal} from 'react-dom';
import {useCallback,useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import {getTooltipPlacement,isSameTooltipPlacement,reduceTooltipPhase} from './tooltip.mjs';
import './tooltip.css';

export function Tooltip({children,content,open,restartKey=0,triggerMode='automatic'}){
 const reactId=useId();
 const id=`tooltip-${reactId.replace(/:/g,'')}`;
 const triggerRef=useRef(null);
 const tooltipRef=useRef(null);
 const [phase,setPhase]=useState('closed');
 const [placement,setPlacement]=useState(null);
 const rendered=phase!=='closed';
 const requestOpen=useCallback(()=>setPhase(current=>reduceTooltipPhase(current,'open')),[]);
 const requestClose=useCallback(()=>setPhase(current=>reduceTooltipPhase(current,'close')),[]);

 useEffect(()=>{
  if(open===undefined) return;
  const frame=window.requestAnimationFrame(()=>open?setPhase('entering'):requestClose());
  return ()=>window.cancelAnimationFrame(frame);
 },[open,requestClose,restartKey]);

 useLayoutEffect(()=>{
  if(!rendered) return;
  const update=()=>{
   const trigger=triggerRef.current?.getBoundingClientRect();
   const tooltip=tooltipRef.current?.getBoundingClientRect();
   if(!trigger||!tooltip||tooltip.width<=0||tooltip.height<=0) return;
   const next=getTooltipPlacement(trigger,tooltip,{width:window.innerWidth,height:window.innerHeight});
   setPlacement(current=>isSameTooltipPlacement(current,next)?current:next);
  };
  update();
  const observer=new ResizeObserver(update);
  if(triggerRef.current) observer.observe(triggerRef.current);
  if(tooltipRef.current) observer.observe(tooltipRef.current);
  window.addEventListener('resize',update);
  window.addEventListener('scroll',update,true);
  return ()=>{
   observer.disconnect();
   window.removeEventListener('resize',update);
   window.removeEventListener('scroll',update,true);
  };
 },[rendered]);

 useEffect(()=>{
  if(phase!=='entering'||!placement) return;
  const frame=window.requestAnimationFrame(()=>setPhase(current=>reduceTooltipPhase(current,'entered')));
  return ()=>window.cancelAnimationFrame(frame);
 },[phase,placement]);

 useEffect(()=>{
  if(phase!=='exiting') return;
  const watchdog=window.setTimeout(()=>{
   setPhase(current=>reduceTooltipPhase(current,'exited'));
   setPlacement(null);
  },250);
  return ()=>window.clearTimeout(watchdog);
 },[phase]);

 useEffect(()=>{
  if(!rendered) return;
  const closeOutside=event=>{
   if(!triggerRef.current?.contains(event.target)) requestClose();
  };
  document.addEventListener('pointerdown',closeOutside);
  return ()=>document.removeEventListener('pointerdown',closeOutside);
 },[rendered,requestClose]);

 const triggerProps=triggerMode==='automatic'?{
  onBlur:event=>{if(!event.currentTarget.contains(event.relatedTarget)) requestClose();},
  onFocus:requestOpen,
  onMouseEnter:requestOpen,
  onMouseLeave:requestClose,
  onPointerDown:event=>{
   if(event.pointerType==='touch'){
    event.preventDefault();
    requestOpen();
   }
  },
  tabIndex:0,
 }:{};

 return <>
  <span aria-describedby={rendered?id:undefined} className="cv2-tooltip-trigger" ref={triggerRef} {...triggerProps}>{children}</span>
  {rendered&&typeof document!=='undefined'?createPortal(
   <div
    className="cv2-tooltip"
    data-open={phase==='open'?'true':'false'}
    id={id}
    onTransitionEnd={event=>{
     if(event.propertyName!=='opacity'||phase!=='exiting') return;
     setPhase(current=>reduceTooltipPhase(current,'exited'));
     setPlacement(null);
    }}
    ref={tooltipRef}
    role="tooltip"
    style={placement?{left:placement.left,top:placement.top}:undefined}
   >
    {content.icon?<span aria-hidden="true" className="cv2-tooltip-icon" style={{'--cv2-tooltip-icon':`url("${content.icon}")`}}/>:null}
    <span className="cv2-tooltip-copy">
     {content.title?<strong className="cv2-tooltip-title">{content.title}</strong>:null}
     {content.description?<span className="cv2-tooltip-description">{content.description}</span>:null}
    </span>
   </div>,document.body):null}
 </>;
}
