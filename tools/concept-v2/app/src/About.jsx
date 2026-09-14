import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ControlButton,Icon} from './Controls';
import {ABOUT_CARD_ANIMATION_MS,aboutCardFrame,aboutCardSlots,aboutNextCard,aboutRestFrame,wrapAboutCard} from './about-motion.mjs';

const cards=[
 {id:'artur',image:'/figma/about-artur.png',alt:'Иллюстрация Артура',caption:<>Это я :)<br/>Типа дизайнер.</>},
 {id:'road',image:'/figma/about-road.png',alt:'Машина на горной дороге',caption:<>Это я ездил с Урала на Юг.<br/>Проехал 2500км за 3 дня.</>},
 {id:'dogs',image:'/figma/about-dogs.png',alt:'Тима и Алиса',caption:<>Это мои сладкие дети, Тима и Алиса :3</>},
];

const frameStyle=frame=>({
 '--card-x':`${frame.x}px`,
 '--card-y':`${frame.y}px`,
 '--card-width':`${frame.width}px`,
 '--card-height':`${frame.height}px`,
 '--card-content-scale':frame.contentScale,
 '--card-frontness':frame.frontness,
 '--card-rear-strength':frame.rearStrength,
 zIndex:frame.zIndex,
});

function AboutCard({card,frame,onOpen}){
 return <article className="about-card-motion" data-slot={frame.frontness>.5?'front':'back'} style={frameStyle(frame)} aria-label={card.alt} onClick={frame.frontness>.5?onOpen:undefined}>
  <div className="about-card-depth" aria-hidden="true"/>
  <div className="about-card-halo" aria-hidden="true"><img src={card.image} alt=""/></div>
  <div className="about-card-frame">
   <div className="about-card-content">
    <img className="about-card-image" src={card.image} alt=""/>
    <span className="about-card-shade" aria-hidden="true"/>
    <p className="about-card-caption">{card.caption}</p>
   </div>
   <button type="button" className="about-card-open" onClick={event=>{event.stopPropagation();onOpen(event)}} aria-label={`Увеличить: ${card.alt}`}>
    <Icon name="about-search-scale"/><span>Увеличить</span>
   </button>
  </div>
 </article>;
}

function ImageViewer({index,onChange,onClose,restoreFocus}){
 const dialogRef=useRef();
 const [scale,setScale]=useState(()=>typeof window==='undefined'?1:Math.min(1,(window.innerWidth-64)/1440,(window.innerHeight-64)/960));
 useEffect(()=>{
  const update=()=>setScale(Math.min(1,(window.innerWidth-64)/1440,(window.innerHeight-64)/960));
  update();window.addEventListener('resize',update);
  return()=>window.removeEventListener('resize',update);
 },[]);
 useEffect(()=>{
  const previous=document.activeElement;
  const scrollY=window.scrollY;
  const body=document.body;
  const original={position:body.style.position,top:body.style.top,left:body.style.left,right:body.style.right,width:body.style.width,overflow:body.style.overflow};
  body.style.position='fixed';body.style.top=`-${scrollY}px`;body.style.left='0';body.style.right='0';body.style.width='100%';body.style.overflow='hidden';
  const focusables=()=>[...(dialogRef.current?.querySelectorAll('button:not(:disabled)')??[])];
  const onKeyDown=event=>{
   if(event.key==='Escape'){event.preventDefault();onClose();return;}
   if(event.key==='ArrowLeft'){event.preventDefault();onChange(-1);return;}
   if(event.key==='ArrowRight'){event.preventDefault();onChange(1);return;}
   if(event.key!=='Tab')return;
   const items=focusables();
   if(!items.length)return;
   const first=items[0],last=items.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  document.addEventListener('keydown',onKeyDown);
  requestAnimationFrame(()=>dialogRef.current?.querySelector('button')?.focus());
  return()=>{
   document.removeEventListener('keydown',onKeyDown);
   Object.assign(body.style,original);
   window.scrollTo(0,scrollY);
   (restoreFocus.current??previous)?.focus?.({preventScroll:true});
  };
 },[onChange,onClose,restoreFocus]);
 const card=cards[index];
 const slots=aboutCardSlots(index,cards.length);
 return <div className="about-viewer" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
  <section ref={dialogRef} className="about-viewer-dialog" style={{'--about-viewer-scale':scale}} role="dialog" aria-modal="true" aria-label={`Увеличенное изображение: ${card.alt}`} onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
   <ControlButton variant="ghost" className="about-viewer-close" iconRight="about-x" onClick={onClose}>Закрыть</ControlButton>
   <ControlButton variant="neutral" className="about-square about-viewer-prev" iconLeft="about-chevron-left" onClick={()=>onChange(-1)} aria-label="Предыдущее изображение"/>
   <div className="about-viewer-content">
    <div className="about-viewer-deck">
     <div className="about-viewer-depth" aria-hidden="true"/>
     {[slots.left,slots.right].map((cardIndex,position)=><div className={`about-viewer-rear about-viewer-rear-${position?'right':'left'}`} key={cards[cardIndex].id} aria-hidden="true"><img src={cards[cardIndex].image} alt=""/></div>)}
     <div className="about-viewer-halo" aria-hidden="true"><img src={card.image} alt=""/></div>
     <div className="about-viewer-image"><img src={card.image} alt={card.alt}/></div>
    </div>
    <p>{card.caption}</p>
   </div>
   <ControlButton variant="neutral" className="about-square about-viewer-next" iconRight="about-chevron-right" onClick={()=>onChange(1)} aria-label="Следующее изображение"/>
  </section>
 </div>;
}

export function About(){
 const [active,setActive]=useState(0);
 const [motion,setMotion]=useState(null);
 const [viewerIndex,setViewerIndex]=useState(null);
 const [layoutScale,setLayoutScale]=useState(()=>typeof window==='undefined'?1:Math.min(1,Math.max(.74,(window.innerWidth-64)/1440)));
 const rafRef=useRef();
 const openerRef=useRef();
 const activeRef=useRef(active);
 useEffect(()=>{activeRef.current=active},[active]);
 useEffect(()=>{
  cards.forEach(card=>{const image=new Image();image.src=card.image;image.decode?.().catch(()=>{});});
  return()=>cancelAnimationFrame(rafRef.current);
 },[]);
 useEffect(()=>{
  const update=()=>setLayoutScale(Math.min(1,Math.max(.74,(window.innerWidth-64)/1440)));
  update();window.addEventListener('resize',update);
  return()=>window.removeEventListener('resize',update);
 },[]);

 const frames=useMemo(()=>{
  if(!motion){
   const slots=aboutCardSlots(active,cards.length);
   return cards.map((_,index)=>aboutRestFrame(index===slots.front?'front':index===slots.left?'left':'right'));
  }
  const slots=aboutCardSlots(motion.active,cards.length);
  const incoming=motion.direction===1?slots.right:slots.left;
  const third=motion.direction===1?slots.left:slots.right;
  return cards.map((_,index)=>aboutCardFrame({role:index===slots.front?'outgoing':index===incoming?'incoming':'third',direction:motion.direction,progress:motion.progress}));
 },[active,motion]);

 function move(direction){
  if(!direction||motion||viewerIndex!==null)return;
  const start=activeRef.current;
  const target=aboutNextCard(start,direction,cards.length);
  setActive(target);
  activeRef.current=target;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced)return;
  const began=performance.now();
  const tick=now=>{
   const progress=Math.min((now-began)/ABOUT_CARD_ANIMATION_MS,1);
   setMotion({active:start,direction,target,progress});
   if(progress<1){rafRef.current=requestAnimationFrame(tick);return;}
   setMotion(null);
  };
  setMotion({active:start,direction,target,progress:0});
  rafRef.current=requestAnimationFrame(tick);
 }

 function open(index,event){
  if(motion)return;
  openerRef.current=event?.currentTarget;
  setViewerIndex(index);
 }

 function onKeyDown(event){
  if(event.key==='ArrowLeft'){event.preventDefault();move(-1)}
  if(event.key==='ArrowRight'){event.preventDefault();move(1)}
 }

 const setViewer=useCallback(direction=>setViewerIndex(current=>{
  const next=wrapAboutCard(current+direction,cards.length);
  setActive(next);activeRef.current=next;
  return next;
 }),[]);
 const closeViewer=useCallback(()=>setViewerIndex(null),[]);

 return <section className={`about-section ${motion?'is-moving':''}`} style={{'--about-layout-scale':layoutScale}} aria-labelledby="about-title" onKeyDown={onKeyDown}>
  <div className="about-heading-shell">
   <div className="about-hatch about-hatch-left" aria-hidden="true"/>
   <div className="about-heading"><div className="about-heading-copy"><p className="eyebrow">ЛИЧНОЕ</p><h2 id="about-title">Обо мне</h2><p>Немного о личном, увлечениях и карьере</p></div><p className="tech-note">// всегда нужно оставаться человеком</p></div>
   <div className="about-hatch about-hatch-right" aria-hidden="true"/>
  </div>
  <div className="about-content">
   <article className="about-copy about-dash-horizontal" data-figma-node="3214:124474">
    <p>Мой путь в дизайн начался с предметной 3D-графики: несколько лет я создавал высокополигональные модели для игр и не только. Всегда были интересны сложные механизмы. Позднее, так сложилось, что я попробовал «плоскую» графику – постепенно этот интерес и привёл меня в продуктовый дизайн.</p>
    <p>Любопытство никуда не исчезло и со временем стало частью моей работы. Мне нравится погружаться в незнакомые темы, раскладывать сложное на понятные части и осваивать новые инструменты.</p>
    <p>Наверное поэтому, я активно увлекаюсь техникой и сложными устройствами. Испытываю эмоциональное возбуждение, когда узнаю, как устроена та или иная технология. Хотя в то же время, мне интересны не только технологии, но и весь мир. Дотошный, что иногда плохо. Поэтому весь сайт сделан мной с 0, без всякого «слопа».</p>
    <p>В работе мне важны развитие и возможность реализовывать свои идеи, а в общении – открытость и прямота. Считаю себя достаточно самокритичным. Друзья считают меня душой компании, душнилой и любителем плохих шуток, обычно всё сразу.</p>
    <p>А еще, обожаю водить, дальние поездки и горы. И конечно же, люблю сибушек :3</p>
   </article>
   <div className="about-divider about-dash-vertical" aria-hidden="true"/>
   <div className="about-carousel" data-figma-node="3215:124481">
    <div className="about-pattern" aria-hidden="true"/>
    <p className="about-carousel-heading">Зачем вам нейрослопы? Ну все же требуют работу с AI, а как говорится – бойтесь своих желаний :)</p>
    <div className="about-deck" aria-live="polite">{cards.map((card,index)=><AboutCard key={card.id} card={card} frame={frames[index]} onOpen={event=>open(index,event)}/>)}</div>
    <div className="about-carousel-controls" aria-label="Переключить карточку">
     <ControlButton variant="light" className="about-square" iconLeft="about-chevron-left" onClick={()=>move(-1)} disabled={Boolean(motion)} aria-label="Предыдущая карточка"/>
     <div className="about-dots" role="tablist" aria-label="Карточки">{cards.map((card,index)=><button key={card.id} type="button" role="tab" aria-selected={index===active} aria-label={`Показать: ${card.alt}`} disabled={Boolean(motion)} className={index===active?'is-active':''} onClick={()=>{if(index!==active)move(wrapAboutCard(index-active,cards.length)===1?1:-1)}}/>)}</div>
     <ControlButton variant="light" className="about-square" iconRight="about-chevron-right" onClick={()=>move(1)} disabled={Boolean(motion)} aria-label="Следующая карточка"/>
    </div>
   </div>
  </div>
  {viewerIndex!==null&&<ImageViewer index={viewerIndex} onChange={setViewer} onClose={closeViewer} restoreFocus={openerRef}/>}
 </section>;
}
