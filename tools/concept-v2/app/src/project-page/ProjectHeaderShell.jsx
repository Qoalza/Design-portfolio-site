import {useEffect,useRef,useState} from 'react';
import {createFrameTask} from '../runtime/frame-task.mjs';
import styles from './ProjectHeaderShell.module.css';

// Header and breadcrumbs share one measured slot and one floating surface.
export function ProjectHeaderShell({children}){
 const shell=useRef(null),pinnedRef=useRef(false),leavingRef=useRef(false);
 const [pinned,setPinned]=useState(false),[leaving,setLeaving]=useState(false);
 useEffect(()=>{
  let threshold=145,exitTimer=0;
  const paint=next=>{
   if(next){clearTimeout(exitTimer);leavingRef.current=false;setLeaving(false);if(!pinnedRef.current){pinnedRef.current=true;setPinned(true)}return;}
   if(!pinnedRef.current||leavingRef.current)return;
   leavingRef.current=true;setLeaving(true);
   exitTimer=setTimeout(()=>{pinnedRef.current=false;leavingRef.current=false;setPinned(false);setLeaving(false)},150);
  };
  const paintTask=createFrameTask({read:()=>window.scrollY>threshold,write:paint});
  const thresholdTask=createFrameTask({read:()=>shell.current?.offsetHeight??145,write:next=>{threshold=next;paintTask.schedule();}});
  const schedule=()=>paintTask.schedule();
  const invalidate=()=>thresholdTask.schedule();
  const observer=new ResizeObserver(invalidate);
  if(shell.current)observer.observe(shell.current);
  invalidate();
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',invalidate);
  return()=>{paintTask.dispose();thresholdTask.dispose();observer.disconnect();clearTimeout(exitTimer);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',invalidate)};
 },[]);
 return <div ref={shell} className={`${styles.shell}${pinned?` ${styles.pinned}`:''}`}><div className={`${styles.surface}${pinned?` ${styles.floating}`:''}${leaving?` ${styles.leaving}`:''}`}>{children}</div></div>;
}
