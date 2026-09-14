import {useCallback,useEffect,useRef,useState} from 'react';
import {ControlButton,Icon} from './Controls';
import {ABOUT_CARD_ANIMATION_MS,aboutDeckFrames,aboutNextCard,aboutTransitionFrames,interpolateDeckFrames,wrapAboutCard} from './about-motion.mjs';

const cards=[
 {id:'artur',image:'/figma/about-artur.png',alt:'Иллюстрация Артура',caption:<>Это я :)<br/>Типа дизайнер.</>},
 {id:'road',image:'/figma/about-road.png',alt:'Машина на дороге',caption:<>Это я ездил с Урала на Юг.<br/>Проехал 2500км за 3 дня.</>},
 {id:'dogs',image:'/figma/about-dogs.png',alt:'Тима и Алиса',caption:<>Это мои сладкие дети,<br/>Тима и Алиса :3</>},
];

const frameStyle=frame=>({
 '--card-x':`${frame.x}px`,'--card-y':`${frame.y}px`,'--card-width':`${frame.width}px`,'--card-height':`${frame.height}px`,
 '--card-content-scale':frame.contentScale,'--card-frontness':frame.frontness,'--card-rear-strength':frame.rearStrength,zIndex:frame.zIndex,
});
const cardDirection=(from,to)=>wrapAboutCard(to-from,cards.length)===1?1:-1;

function useDeckController(initialIndex){
 const [active,setActive]=useState(initialIndex);
 const [frames,setFrames]=useState(()=>aboutDeckFrames(initialIndex,cards.length));
 const [isMoving,setIsMoving]=useState(false);
 const framesRef=useRef(frames),activeRef=useRef(initialIndex),targetRef=useRef(initialIndex),rafRef=useRef(),movingRef=useRef(false);
 const velocityRef=useRef(frames.map(()=>({x:0,y:0,width:0,height:0,frontness:0,contentScale:0})));
 const sampleRef=useRef({time:performance.now(),frames});
 useEffect(()=>{framesRef.current=frames},[frames]);
 useEffect(()=>()=>cancelAnimationFrame(rafRef.current),[]);
 const go=useCallback((nextIndex)=>{
  const target=wrapAboutCard(nextIndex,cards.length);
  if(target===targetRef.current)return;
  const sourceTarget=targetRef.current;
  const direction=cardDirection(sourceTarget,target);
  const initialFrames=framesRef.current;
  const initialVelocity=velocityRef.current;
  const canonical=!movingRef.current;
  const sourceActive=activeRef.current;
  const finishFrames=aboutDeckFrames(target,cards.length);
  targetRef.current=target;activeRef.current=target;setActive(target);
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   framesRef.current=finishFrames;setFrames(finishFrames);movingRef.current=false;setIsMoving(false);return;
  }
  cancelAnimationFrame(rafRef.current);movingRef.current=true;setIsMoving(true);
  const began=performance.now();
  sampleRef.current={time:began,frames:initialFrames};
  const tick=now=>{
   const progress=Math.min((now-began)/ABOUT_CARD_ANIMATION_MS,1);
   const nextFrames=canonical
    ?aboutTransitionFrames({active:sourceActive,direction,progress,count:cards.length})
    :interpolateDeckFrames(initialFrames,finishFrames,progress,initialVelocity);
   const previous=sampleRef.current;
   const elapsed=Math.max(now-previous.time,1);
   velocityRef.current=nextFrames.map((frame,index)=>{
    const prior=previous.frames[index];
    return {x:(frame.x-prior.x)/elapsed,y:(frame.y-prior.y)/elapsed,width:(frame.width-prior.width)/elapsed,height:(frame.height-prior.height)/elapsed,frontness:(frame.frontness-prior.frontness)/elapsed,contentScale:(frame.contentScale-prior.contentScale)/elapsed};
   });
   sampleRef.current={time:now,frames:nextFrames};
   framesRef.current=nextFrames;setFrames(nextFrames);
   if(progress<1){rafRef.current=requestAnimationFrame(tick);return;}
   framesRef.current=finishFrames;setFrames(finishFrames);velocityRef.current=finishFrames.map(()=>({x:0,y:0,width:0,height:0,frontness:0,contentScale:0}));movingRef.current=false;setIsMoving(false);
  };
  rafRef.current=requestAnimationFrame(tick);
 },[]);
 const move=useCallback(direction=>go(aboutNextCard(targetRef.current,direction,cards.length)),[go]);
 return {active,frames,isMoving,go,move};
}

function AboutCard({card,frame,onOpen,moving,interactive=true,hovered=false,cardTargetRef}){
 const front=frame.frontness>.5;
 const enabled=interactive&&front&&!moving;
 return <article className="about-card-motion" data-slot={front?'front':'back'} data-hovered={enabled&&hovered||undefined} style={frameStyle(frame)} aria-label={card.alt}>
  <div className="about-card-depth" aria-hidden="true"/>
  <div className="about-card-halo" aria-hidden="true"><img src={card.image} alt=""/></div>
  <div ref={enabled?cardTargetRef:null} className="about-card-frame" role={enabled?'button':undefined} tabIndex={enabled?0:undefined} onClick={enabled?onOpen:undefined} onKeyDown={event=>{if(enabled&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onOpen(event)}}}>
  <div className="about-card-content"><img className="about-card-image" src={card.image} alt=""/><span className="about-card-shade" aria-hidden="true"/><p className="about-card-caption">{card.caption}</p></div>
   <span className="about-card-hover" aria-hidden="true"/>
   {interactive&&<span className="about-card-open" aria-hidden="true"><Icon name="about-search-scale"/><span className="about-card-open-label">Увеличить</span></span>}
  </div>
 </article>;
}

function Deck({controller,onOpen,viewer=false,hovered=false,cardTargetRef}){
 return <div className={viewer?'about-viewer-deck':'about-deck'} aria-live="polite">
  {controller.frames.map((frame,index)=><AboutCard key={cards[index].id} card={cards[index]} frame={frame} moving={controller.isMoving} interactive={!viewer} hovered={hovered} cardTargetRef={cardTargetRef} onOpen={event=>onOpen(index,event)}/>)}</div>;
}

function ImageViewer({initialIndex,onClose,restoreFocus}){
 const controller=useDeckController(initialIndex);
 const viewerMove=controller.move;
 const dialogRef=useRef();
 const closeFromEmptyViewerSpace=event=>{
  if(event.target.closest('.about-viewer-content,.about-viewer-close,.about-viewer-prev,.about-viewer-next'))return;
  onClose();
 };
 const [scale,setScale]=useState(()=>Math.min(1,window.innerWidth/1440,window.innerHeight/960));
 useEffect(()=>{const update=()=>setScale(Math.min(1,window.innerWidth/1440,window.innerHeight/960));update();window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update)},[]);
 useEffect(()=>{
  const previous=document.activeElement,scrollY=window.scrollY,body=document.body;
  const original={position:body.style.position,top:body.style.top,left:body.style.left,right:body.style.right,width:body.style.width,overflow:body.style.overflow};
  body.style.position='fixed';body.style.top=`-${scrollY}px`;body.style.left='0';body.style.right='0';body.style.width='100%';body.style.overflow='hidden';
  const onKeyDown=event=>{
   if(event.key==='Escape'){event.preventDefault();onClose();return;}
   if(event.key==='ArrowLeft'){event.preventDefault();viewerMove(-1);return;}
   if(event.key==='ArrowRight'){event.preventDefault();viewerMove(1);return;}
   if(event.key!=='Tab')return;
   const items=[...(dialogRef.current?.querySelectorAll('button:not(:disabled)')??[])];if(!items.length)return;
   const first=items[0],last=items.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  document.addEventListener('keydown',onKeyDown);requestAnimationFrame(()=>dialogRef.current?.querySelector('button')?.focus());
  return()=>{document.removeEventListener('keydown',onKeyDown);Object.assign(body.style,original);window.scrollTo(0,scrollY);(restoreFocus.current??previous)?.focus?.({preventScroll:true});};
 },[onClose,restoreFocus,viewerMove]);
 const visibleCard=cards[controller.frames.reduce((frontIndex,frame,index)=>frame.frontness>controller.frames[frontIndex].frontness?index:frontIndex,0)];
 return <div className="about-viewer" role="presentation" onClick={closeFromEmptyViewerSpace}>
  <section ref={dialogRef} className="about-viewer-dialog" style={{'--about-viewer-scale':scale}} role="dialog" aria-modal="true" aria-label={`Увеличенное изображение: ${visibleCard.alt}`}>
   <ControlButton variant="ghost" className="about-viewer-close" iconRight="about-x" onClick={onClose}>Закрыть</ControlButton>
   <ControlButton variant="light" className="about-square about-viewer-prev" iconLeft="about-chevron-left" onClick={()=>controller.move(-1)} aria-label="Предыдущее изображение"/>
   <div className="about-viewer-content"><div className="about-viewer-deck-stage"><div className="about-viewer-deck-scale"><Deck controller={controller} onOpen={()=>{}} viewer/></div></div><p>{visibleCard.caption}</p></div>
   <ControlButton variant="light" className="about-square about-viewer-next" iconRight="about-chevron-right" onClick={()=>controller.move(1)} aria-label="Следующее изображение"/>
  </section>
 </div>;
}

export function About(){
 const controller=useDeckController(0);
 const [viewerInitial,setViewerInitial]=useState(null);
 const [hovered,setHovered]=useState(false);
 const [layoutScale,setLayoutScale]=useState(1);
 const openerRef=useRef();
 const carouselRef=useRef();
 const activeCardRef=useRef();
 useEffect(()=>{cards.forEach(card=>{const image=new Image();image.src=card.image;image.decode?.().catch(()=>{})})},[]);
 useEffect(()=>{
  const update=()=>{const width=carouselRef.current?.clientWidth??480;setLayoutScale(Math.min(1,Math.max(.74,width/480)));};
  update();const observer=new ResizeObserver(update);if(carouselRef.current)observer.observe(carouselRef.current);
  return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  let current=false;
  const updateHover=event=>{
   const target=activeCardRef.current;
   const rect=target?.getBoundingClientRect();
   const next=Boolean(rect&&!controller.isMoving&&viewerInitial===null&&event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom);
   if(next!==current){current=next;setHovered(next);}
  };
  document.addEventListener('pointermove',updateHover,{passive:true});
  return()=>document.removeEventListener('pointermove',updateHover);
 },[controller.isMoving,viewerInitial]);
 const open=useCallback((index,event)=>{if(controller.isMoving)return;setHovered(false);openerRef.current=event?.currentTarget;setViewerInitial(index)},[controller.isMoving]);
 const select=useCallback(index=>controller.go(index),[controller]);
 const closeViewer=useCallback(()=>{setViewerInitial(null);setHovered(false)},[]);
 return <>
  <section className={`about-section ${controller.isMoving?'is-moving':''}`} style={{'--about-layout-scale':layoutScale}} aria-labelledby="about-title">
   <div className="about-heading-shell"><div className="about-hatch about-hatch-left" aria-hidden="true"/><div className="about-heading"><div className="about-heading-copy"><p className="eyebrow">ЛИЧНОЕ</p><h2 id="about-title">Обо мне</h2><p>Немного о личном, увлечениях и карьере</p></div><p className="tech-note">// всегда нужно оставаться человеком</p></div><div className="about-hatch about-hatch-right" aria-hidden="true"/></div>
   <div className="about-content"><article className="about-copy about-dash-horizontal" data-figma-node="3214:124474"><p>Мой путь в дизайн начался с предметной 3D-графики: несколько лет я создавал высокополигональные модели для игр и не только. Всегда были интересны сложные механизмы. Позднее, так сложилось, что я попробовал «плоскую» графику – постепенно этот интерес и привёл меня в продуктовый дизайн.</p><p>Любопытство никуда не исчезло и со временем стало частью моей работы. Мне нравится погружаться в незнакомые темы, раскладывать сложное на понятные части и осваивать новые инструменты.</p><p>Наверное поэтому, я активно увлекаюсь техникой и сложными устройствами. Испытываю эмоциональное возбуждение, когда узнаю, как устроена та или иная технология. Хотя в то же время, мне интересны не только технологии, но и весь мир. Дотошный, что иногда плохо. Поэтому весь сайт сделан мной с 0, без всякого «слопа».</p><p>В работе мне важны развитие и возможность реализовывать свои идеи, а в общении – открытость и прямота. Считаю себя достаточно самокритичным. Друзья считают меня душой компании, душнилой и любителем плохих шуток, обычно всё сразу.</p><p>А еще, обожаю водить, дальние поездки и горы. И конечно же, люблю сибушек :3</p></article><div className="about-divider about-dash-vertical" aria-hidden="true"/><div ref={carouselRef} className="about-carousel" data-figma-node="3215:124481"><div className="about-pattern" aria-hidden="true"/><p className="about-carousel-heading">Зачем вам нейрослопы? Ну все же требуют работу с AI, а как говорится – бойтесь своих желаний :)</p><Deck controller={controller} onOpen={open} hovered={hovered} cardTargetRef={activeCardRef}/><div className="about-carousel-controls" aria-label="Переключить карточку"><ControlButton variant="ghost" className="about-square" iconLeft="about-chevron-left" onClick={()=>controller.move(-1)} aria-label="Предыдущая карточка"/><div className="about-dots" role="tablist" aria-label="Карточки">{cards.map((card,index)=><button key={card.id} type="button" role="tab" aria-selected={index===controller.active} aria-label={`Показать: ${card.alt}`} className={index===controller.active?'is-active':''} onClick={()=>select(index)}/>)}</div><ControlButton variant="ghost" className="about-square" iconRight="about-chevron-right" onClick={()=>controller.move(1)} aria-label="Следующая карточка"/></div></div></div>
  </section>
  {viewerInitial!==null&&<ImageViewer initialIndex={viewerInitial} onClose={closeViewer} restoreFocus={openerRef}/>}
 </>;
}
