import {useEffect,useRef,useState} from 'react';
import {ControlButton} from './Controls';
import {createFrameTask} from './runtime/frame-task.mjs';
import {carouselStops,stepTarget,carouselEdges} from './projects-carousel.mjs';
import './projects-carousel.css';

export function ProjectsCarousel({heading,children}){
 const viewport=useRef(null),controller=useRef(null);
 const [edges,setEdges]=useState({previous:false,next:false});
 useEffect(()=>{
  const node=viewport.current;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let pending=null;
  function geometry(){
   const inset=parseFloat(getComputedStyle(node).paddingLeft);
   const max=Math.max(0,node.scrollWidth-node.clientWidth);
   const offsets=[...node.children].map(card=>card.offsetLeft);
   return {max,stops:carouselStops(offsets,inset,max)};
  }
  function readEdges(){
   const {max}=geometry();
   return {next:carouselEdges(node.scrollLeft,max),position:node.scrollLeft};
  }
  function update({next,position}){
   setEdges(old=>old.previous===next.previous&&old.next===next.next?old:next);
   if(pending!==null&&Math.abs(position-pending)<1)pending=null;
  }
  const frame=createFrameTask({read:readEdges,write:update});
  const scroll=()=>frame.schedule();
  function move(left){
   pending=left;
   node.scrollTo({left,behavior:reduced.matches?'instant':'smooth'});
  }
  controller.current=direction=>{
   const {stops}=geometry();
   move(stepTarget(stops,pending??node.scrollLeft,direction));
  };
  const interrupt=()=>{pending=null};
  const settled=()=>{pending=null;frame.schedule()};
  const resize=new ResizeObserver(()=>{
   pending=null;
   const {stops}=geometry();
   const nearest=stops.reduce((best,stop)=>Math.abs(stop-node.scrollLeft)<Math.abs(best-node.scrollLeft)?stop:best,0);
   node.scrollTo({left:nearest,behavior:'instant'});
   frame.schedule();
  });
  resize.observe(node);
  for(const card of node.children)resize.observe(card);
  function focus(event){
   const card=event.target.closest('.project');
   if(!card)return;
   const {max}=geometry();
   const inset=parseFloat(getComputedStyle(node).paddingLeft);
   const start=card.offsetLeft-inset;
   const end=card.offsetLeft+card.offsetWidth;
   if(start<node.scrollLeft||end>node.scrollLeft+node.clientWidth)move(Math.min(max,Math.max(0,start)));
  }
  node.addEventListener('scroll',scroll,{passive:true});
  node.addEventListener('scrollend',settled);
  node.addEventListener('wheel',interrupt,{passive:true});
  node.addEventListener('pointerdown',interrupt,{passive:true});
  node.addEventListener('focusin',focus);
  update(readEdges());
  return()=>{
   controller.current=null;resize.disconnect();frame.dispose();
   node.removeEventListener('scroll',scroll);node.removeEventListener('scrollend',settled);
   node.removeEventListener('wheel',interrupt);node.removeEventListener('pointerdown',interrupt);node.removeEventListener('focusin',focus);
  };
 },[children]);
 return <>
  <div className="projects-heading">{heading}<div className="projects-controls" aria-label="Переключение проектов">
   <ControlButton variant="light" iconOnly iconLeft="about-chevron-left" aria-label="Предыдущий проект" aria-controls="featured-projects" disabled={!edges.previous} onClick={()=>controller.current?.(-1)}/>
   <ControlButton variant="light" iconOnly iconLeft="about-chevron-right" aria-label="Следующий проект" aria-controls="featured-projects" disabled={!edges.next} onClick={()=>controller.current?.(1)}/>
  </div></div>
  <div className="projects-carousel-shell" data-has-previous={edges.previous} data-has-next={edges.next}>
   <div ref={viewport} id="featured-projects" className="projects-grid projects-carousel" data-project-carousel="" role="region" aria-label="Избранные проекты" aria-roledescription="карусель">{children}</div>
  </div>
 </>;
}
