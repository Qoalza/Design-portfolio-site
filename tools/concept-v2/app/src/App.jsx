import {useCallback,useEffect,useRef,useState} from 'react';
import {ControlButton,NavigationTab,Icon} from './Controls';
import {SvgLens} from './SvgLens';
import {MobileNavigation} from './MobileNavigation';
import {getHeroVariant} from './hero-layout.mjs';
import {paintDotField} from './hero-dot-field.mjs';
import {Experience} from './Experience';
import {About} from './About';
import {randomEdgePoint} from './process-fill.mjs';
import {createFrameTask} from './runtime/frame-task.mjs';
import {ResponsivePicture} from './media/ResponsivePicture';
import {projectBackImage,projectFrontImage,sarafanBackImage,sarafanFrontImage} from './media/image-sources.mjs';
import {createImagePreparer} from './media/image-preparation.mjs';
import {projectLinks} from './project-links.mjs';
import {HoverMorphAction} from './morph-icon/HoverMorphAction';
import {figmaIcon} from './morph-icon/icons.mjs';

const cv=projectLinks.cv;
const corvoDescription='B2B SaaS-платформа для управления партнёрской программой и рекламным трафиком. Она объединяет работу аффилиатов, компаний и команды продукта: подключение к программе, условия сотрудничества, кампании, рекламные материалы и статистику.';
const sarafanDescription='Сарафан.Радио — B2B2C-платформа для организации мероприятий. Она соединяет пользователей, которые готовят событие, со специалистами и поставщиками товаров и услуг.';
const radioLogoLayers=['a','b','c','d'];
const projectCards=[
 {id:'corvo',title:'Corvo',categories:['B2B','SAAS','PARTNER PLATFORM'],description:corvoDescription,logo:'corvo',preview:{back:projectBackImage,front:projectFrontImage,ariaLabel:'Интерфейс Corvo',frontAlt:'Corvo — управление партнёрской программой, таблица компаний'},actions:{details:{href:`${import.meta.env.BASE_URL}projects/corvo`},figma:{href:projectLinks.corvoFigma}}},
 {id:'sarafan-radio',title:'Сараффан.Радио',categories:['B2B2С','EVENT'],description:sarafanDescription,logo:'radio',tag:'Тестовое задание',preview:{back:sarafanBackImage,front:sarafanFrontImage,ariaLabel:'Интерфейс Сараффан.Радио',frontAlt:'Сараффан.Радио — оформление заказа для мероприятия'},actions:{details:{href:`${import.meta.env.BASE_URL}projects/sarafan-radio`},figma:{href:projectLinks.sarafanFigma}}}
];
const steps=[
 {title:'Погружаюсь в данные',description:'Разбираюсь в контексте, пользователях и бизнес-целях. Формулирую проблему/цель и нахожу главное.',image:'imgFrame26086399',dots:'imgFrame26086412',width:5},
 {title:'Собираю решение в систему',description:'Проектирую сценарии, интерфейсы и логику. Проектирую дизайн систему, описываю гайдлайны. Согласовываю с разработкой.',image:'imgFrame26086400',dots:'imgFrame26086413',width:16},
 {title:'Довожу до продакшена',description:'Согласовываю решения, передаю в разработку и остаюсь на связи до релиза и поддерживаю после него.',image:'imgFrame26086401',dots:'imgFrame26086414',width:27}
];
export function CustomCursor(){
 const cursor=useRef(null),mode=useRef('pointer'),visible=useRef(false);
 useEffect(()=>{
  const desktop=window.matchMedia('(pointer:fine)');
  const task=createFrameTask({write:({x,y,nextMode})=>{
   if(!desktop.matches)return;
   if(nextMode!==mode.current){mode.current=nextMode;cursor.current?.setAttribute('data-mode',nextMode);}
   if(!visible.current){visible.current=true;document.documentElement.dataset.customCursor='on';}
   if(cursor.current)cursor.current.style.transform=`translate3d(${x}px,${y}px,0)`;
  }});
  const disable=()=>{task.cancel();visible.current=false;document.documentElement.dataset.customCursor='off'};
  const move=event=>{
   if(!desktop.matches)return disable();
   const next=event.target instanceof Element&&event.target.closest('a[href],button:not(:disabled),[role="button"],[data-cursor="hand"]')?'hand':'pointer';
   task.schedule({x:event.clientX,y:event.clientY,nextMode:next});
  };
  const leave=event=>{if(!event.relatedTarget)disable()};
  const change=()=>{if(!desktop.matches)disable()};
  const visibility=()=>{if(document.hidden)disable()};
  window.addEventListener('pointermove',move,{passive:true});
  window.addEventListener('pointerout',leave,{passive:true});
  desktop.addEventListener('change',change);
  document.addEventListener('visibilitychange',visibility);
  return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerout',leave);desktop.removeEventListener('change',change);document.removeEventListener('visibilitychange',visibility);task.dispose();disable()};
 },[]);
 return <span ref={cursor} className="custom-cursor" data-mode="pointer" aria-hidden="true"><img className="custom-cursor-pointer" src="/cursors/bibata-original-classic-pointer.svg" alt=""/><img className="custom-cursor-hand" src="/cursors/bibata-original-classic-hand.svg" alt=""/></span>;
}
function Header(){
 const shell=useRef(null),pinnedRef=useRef(false),leavingRef=useRef(false),[pinned,setPinned]=useState(false),[leaving,setLeaving]=useState(false);
 useEffect(()=>{
  let threshold=80,exitTimer=0;
  const paint=next=>{
   if(next){
    clearTimeout(exitTimer);
    leavingRef.current=false;
    setLeaving(false);
    if(!pinnedRef.current){pinnedRef.current=true;setPinned(true)}
    return;
   }
   if(!pinnedRef.current||leavingRef.current)return;
   leavingRef.current=true;
   setLeaving(true);
   exitTimer=setTimeout(()=>{pinnedRef.current=false;leavingRef.current=false;setPinned(false);setLeaving(false)},150);
  };
  const paintTask=createFrameTask({read:()=>window.scrollY>threshold,write:paint});
  const thresholdTask=createFrameTask({read:()=>shell.current?.offsetHeight??80,write:next=>{threshold=next;paintTask.schedule();}});
  const schedule=()=>paintTask.schedule();
  const invalidateThreshold=()=>thresholdTask.schedule();
  const observer=new ResizeObserver(invalidateThreshold);
  if(shell.current)observer.observe(shell.current);
  invalidateThreshold();
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',invalidateThreshold);
  return()=>{paintTask.dispose();thresholdTask.dispose();observer.disconnect();clearTimeout(exitTimer);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',invalidateThreshold)};
 },[]);
 return <div id="top" ref={shell} className={`site-header-shell${pinned?' is-pinned':''}`}><header className={`site-header${pinned?' is-pinned':''}${leaving?' is-unpinning':''}`}><div className="header-row">
  <a className="brand" href="#top" aria-label="Артур — на главную"><img src="/figma/imgSymbol.svg" width="44" height="44" alt=""/><span><strong>ARTUR</strong><small>Product Designer</small></span></a>
  <nav aria-label="Основная навигация"><NavigationTab icon="imgColor" active>Главная</NavigationTab><NavigationTab icon="imgColor1" disabled>Блог</NavigationTab><NavigationTab icon="imgColor1" disabled>Лаборатория</NavigationTab></nav>
  <div className="header-actions"><MobileNavigation/><span className="availability"><img src="/figma/imgIndicator.svg" width="6" height="8" alt=""/>Открыт к предложениям</span><ControlButton contactMotion variant="accent" href="https://t.me/Coco_soul" external iconRight="imgColor2">Связаться</ControlButton></div>
 </div></header></div>;
}
function HeroDotField({layout}){
 const canvasRef=useRef(null),[ready,setReady]=useState(false),[desktop,setDesktop]=useState(()=>window.matchMedia('(min-width:1280px)').matches);
 useEffect(()=>{
  const query=window.matchMedia('(min-width:1280px)');
  const change=()=>setDesktop(query.matches);
  query.addEventListener('change',change);
  return()=>query.removeEventListener('change',change);
 },[]);
 useEffect(()=>{
  setReady(false);
  const canvas=canvasRef.current;
  if(layout!=='small'||!desktop||!canvas){if(canvas){canvas.width=0;canvas.height=0;}return undefined;}
  const host=canvas.parentElement;
  const context=canvas.getContext('2d');
  if(!host||!context)return undefined;
  const mask=new Image();
  let disposed=false,frame=0,loaded=false;
  const draw=()=>{
   frame=0;
   if(disposed||!loaded)return;
   const {width,height}=host.getBoundingClientRect();
   if(width<=0||height<=0)return;
   const dpr=window.devicePixelRatio||1;
   const pixelWidth=Math.round(width*dpr),pixelHeight=Math.round(height*dpr);
   if(canvas.width!==pixelWidth)canvas.width=pixelWidth;
   if(canvas.height!==pixelHeight)canvas.height=pixelHeight;
   const background=getComputedStyle(canvas).getPropertyValue('--cv2-container-neutral-bg-main').trim()||'#181a1c';
   paintDotField(context,{width,height,dpr,mask,background});
   setReady(true);
  };
  const schedule=()=>{if(frame===0)frame=requestAnimationFrame(draw);};
  const load=()=>{if(loaded)return;loaded=true;schedule();};
  const observer=new ResizeObserver(schedule);
  observer.observe(host);
  window.addEventListener('resize',schedule);
  mask.decoding='async';
  mask.onload=load;
  mask.src='/figma/hero-bottom-wave-mask-2x.png';
  if(mask.complete&&mask.naturalWidth>0)load();
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',schedule);mask.onload=null;};
 },[desktop,layout]);
 return <><span className="hero-bottom-dots" data-rasterized={ready?'true':undefined} aria-hidden="true"/><canvas ref={canvasRef} className={`hero-bottom-dots-bitmap${ready?' is-ready':''}`} aria-hidden="true"/></>;
}
function Hero(){
 const [layout,setLayout]=useState(()=>getHeroVariant(typeof window==='undefined'?{}:{width:window.innerWidth,height:window.innerHeight}));
 useEffect(()=>{const update=()=>setLayout(getHeroVariant({width:window.innerWidth,height:window.innerHeight}));update();window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update)},[]);
 return <section className="hero" data-layout={layout} aria-labelledby="hero-title">
  <div className="hero-main"><div className="hero-layout">
   <div className="hero-copy"><div className="hero-text"><div className="hero-title"><p className="name">Артур</p><h1 id="hero-title">Продуктовый дизайнер</h1></div><p className="intro">Разбираюсь в сложных бизнес-процессах, превращаю их в понятные интерфейсы и довожу решения до реализации.</p></div><div className="hero-actions"><ControlButton href="#projects" className="works-button">Мои работы</ControlButton><ControlButton variant="ghost" href={cv} external iconRight="file05">CV</ControlButton></div></div>
   <div className="hero-graph"><SvgLens/></div>
  </div></div>
  <div className="hero-bottom"><HeroDotField layout={layout}/><div className="hero-bottom-inner"><p className="hero-fact-chip"><span>29 лет</span><i aria-hidden="true"/><span>Екатеринбург</span><i aria-hidden="true"/><span className="hero-fact-chip-desktop">Middle+ / Senior</span><span className="hero-fact-chip-mobile">Senior</span></p></div></div>
 </section>;
}
function SectionTitle({eyebrow,title,children,className='',id}){
 return <div className={`section-title ${className}`}><p className="eyebrow">{eyebrow}</p><h2 id={id}>{title}</h2><div className="section-description">{children}</div></div>;
}
function RadioSymbol(){
 return <span className="radio-symbol" aria-hidden="true">{radioLogoLayers.map(layer=><span key={layer} className={`radio-logo-${layer}`}><img src={`/figma/radio-logo-vector-${layer}.svg`} alt=""/>{layer!=='d'&&<img src={`/figma/radio-logo-mask-${layer}.svg`} alt=""/>}</span>)}</span>;
}
function ProjectActions({project}){
 return <div className="project-actions"><ControlButton href={project.actions.details.href}>Подробнее</ControlButton><HoverMorphAction variant="ghost" href={project.actions.figma.href} external icon={figmaIcon}>Figma</HoverMorphAction></div>;
}
function ProjectCard({project,imageRef,onImageLoad}){
 return <article className={`project project-${project.id}`}>
  <div className="project-preview" aria-label={project.preview.ariaLabel}>
   <div className="project-divider"/><div className="project-glow"/>
   <div className="project-back-layer"><ResponsivePicture source={project.preview.back} ref={imageRef} className="project-back" alt="" sizes="520px" loading="lazy" decoding="async" onLoad={onImageLoad}/></div>
   <div className="project-shade"/>
   <div className="project-front-layer"><ResponsivePicture source={project.preview.front} ref={imageRef} className="project-front" alt={project.preview.frontAlt} sizes="520px" loading="lazy" decoding="async" onLoad={onImageLoad}/></div>
   {project.tag&&<div className="project-tag"><Icon name="sarafan-flag"/><span>{project.tag}</span></div>}
  </div>
  <div className="project-main"><div className="project-categories">{project.categories.map((category,index)=><span className="project-category" key={category}><span>{category}</span>{index<project.categories.length-1&&<img src="/figma/sarafan-project-dot.svg" width="4" height="4" alt=""/>}</span>)}</div><div className="project-content"><div className="project-info"><h3>{project.logo==='corvo'?<img src="/figma/imgProjectCorvo.svg" width="28" height="28" alt=""/>:<RadioSymbol/>}{project.title}</h3><p>{project.description}</p></div><ProjectActions project={project}/></div></div>
 </article>;
}
function Projects(){
 const sectionRef=useRef(null),imageNodes=useRef(new Set()),imagePreparer=useRef(null);
 const collectImage=useCallback(image=>{if(image)imageNodes.current.add(image)},[]);
 const prepareLoadedImage=useCallback(event=>imagePreparer.current?.prepare(event.currentTarget,'high'),[]);
 useEffect(()=>{
  const preparer=createImagePreparer();
  imagePreparer.current=preparer;
  const observer=new IntersectionObserver(entries=>{
   if(!entries.some(entry=>entry.isIntersecting))return;
   observer.disconnect();
   preparer.prepareAll(imageNodes.current,'high');
  },{rootMargin:'150% 0px',threshold:0});
  if(sectionRef.current)observer.observe(sectionRef.current);
  return()=>{observer.disconnect();preparer.dispose();if(imagePreparer.current===preparer)imagePreparer.current=null};
 },[]);
 return <section ref={sectionRef} className="projects-section" id="projects" aria-labelledby="projects-title"><div className="projects-heading"><SectionTitle id="projects-title" eyebrow="ПРОЕКТЫ" title="Избранное"><p>Здесь собрал рабочие проекты, тестовые задания.<br/>Где можно увидеть мой подход к задаче и результат.</p></SectionTitle><p className="projects-status">// остальные проекты в процессе публикации</p></div><div className="projects-grid">{projectCards.map(project=><ProjectCard key={project.id} project={project} imageRef={collectImage} onImageLoad={prepareLoadedImage}/>)}</div></section>;
}
function ProcessStep({step,index}){
 const [active,setActive]=useState(false);
 const [origin,setOrigin]=useState({x:0,y:0});
 const pointer=useRef(false),focus=useRef(false),settledOutside=useRef(true),exitTimer=useRef();
 useEffect(()=>()=>clearTimeout(exitTimer.current),[]);
 function begin(source){
  if(source==='pointer')pointer.current=true;else focus.current=true;
  clearTimeout(exitTimer.current);
  if(settledOutside.current){setOrigin(randomEdgePoint());settledOutside.current=false;}
  setActive(true);
 }
 function end(source){
  if(source==='pointer')pointer.current=false;else focus.current=false;
  if(pointer.current||focus.current)return;
  setActive(false);
  clearTimeout(exitTimer.current);
  exitTimer.current=setTimeout(()=>{settledOutside.current=true},200);
 }
 return <article className={`step step-${index+1} ${active?'is-fill-active':''}`} tabIndex={0} aria-label={step.title} onPointerEnter={()=>begin('pointer')} onPointerLeave={()=>end('pointer')} onFocus={()=>begin('focus')} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))end('focus')}}>
  <div className="step-grid" aria-hidden="true"/>
  <div className="step-divider" aria-hidden="true"/>
  <div className="step-body"><div className="step-top"><span className="step-icon" aria-hidden="true" style={{'--fill-x':`${origin.x}px`,'--fill-y':`${origin.y}px`,'--icon-mask':`url('/figma/process-mask-${index+1}.svg')`,'--background-mask':`url('/figma/process-background-mask-${index+1}.svg')`}}><img className="step-icon-base" src={`/figma/${step.image}.svg`} width="64" height="64" alt=""/><i className="step-icon-background"/><i className="step-icon-fill"/><img className="step-icon-desktop-base" src={`/figma/${step.image}-desktop.svg`} width="64" height="64" alt=""/><img className="step-icon-hover" src={`/figma/${step.image}-hover.svg`} width="64" height="64" alt=""/></span>
   <div className="step-number"><span>0{index+1}</span><i className="step-dots" aria-hidden="true" style={{width:step.width,'--dots-mask':`url('/figma/${step.dots}.svg')`}}/></div></div>
  <div className="step-text"><h3>{step.title}</h3><p>{step.description}</p></div></div>
 </article>;
}
function Process(){
 return <section className="process-section" aria-labelledby="process-title">
  <div className="process-heading"><SectionTitle id="process-title" eyebrow="ПРОЦЕСС" title="Как я работаю"><p>Сначала разбираюсь в продукте, бизнесе и самой задаче. Затем выбираю подходящие методы, собираю решение в систему и довожу его до продакшена.</p></SectionTitle><p className="tech-note">// от задачи, до работающего продукта</p></div>
  <div className="steps">{steps.map((step,index)=><ProcessStep key={step.title} step={step} index={index}/>)}</div>
 </section>;
}
function AICopy({desktop=false}){
 const mainClass=desktop?'ai-desktop-copy':'ai-mobile-main',contentClass=desktop?'ai-copy-content':'ai-main';
 const bannerClass=desktop?'ai-copy-banner':'ai-banner';
 return <div className={mainClass}><div className={contentClass}><SectionTitle className="ai-title" id={desktop?'ai-title':undefined} eyebrow="ИНСТРУМЕНТЫ" title="AI в рабочем процессе"><p>Использую AI, как рабочий инструмент, для ускорения исследований, прототипирования, проверки решений/гипотез и разработки.</p></SectionTitle>{!desktop&&<p className="tech-note">// итоговые решения всегда остаются за мной</p>}</div><div className={bannerClass}><img src={desktop?'/figma/ai-gear.svg':'/figma/ai-codex-icon.svg'} width={desktop?24:28} height={desktop?24:28} alt=""/><p>{desktop?<><span>Данный сайт был разработан с 0 в codex, а дизайн в Figma.</span><span>Без шаблонов.</span></>:'Данный сайт был разработан с 0 в codex, а дизайн в Figma. Без шаблонов.'}</p></div></div>;
}
function StaticCode(){
 return <div className="ai-code-panel" aria-label="Статичный пример кода"><div className="ai-code-header"><img className="ai-code-symbol" src="/assets/code.svg" alt=""/><p>HTML + JavaScript</p></div><div className="ai-code-body"><code className="ai-static-code"><span>&lt;</span><span className="code-tag">div</span><span> </span><span className="code-attribute">class</span><span>=</span><span className="code-string">&quot;availability&quot;</span><span>&gt;</span>{'\n'}<span>  &lt;</span><span className="code-tag">span</span><span> </span><span className="code-attribute">class</span><span>=</span><span className="code-string">&quot;dot&quot;</span><span>&gt;&lt;/</span><span className="code-tag">span</span><span>&gt;</span>{'\n'}<span>  &lt;</span><span className="code-tag">span</span><span>&gt;Открыт к предложениям&lt;/</span><span className="code-tag">span</span><span>&gt;</span>{'\n'}<span>&lt;/</span><span className="code-tag">div</span><span>&gt;</span>{'\n\n'}<span>&lt;</span><span className="code-tag">script</span><span>&gt;</span>{'\n'}<span>  </span><span className="code-keyword">const</span><span> availability = </span><span className="code-api">document.querySelector</span><span>(</span><span className="code-string">&quot;.availability&quot;</span><span>)</span><span className="code-punctuation">;</span>{'\n\n'}<span>  </span><span className="code-keyword">function</span><span>{' showAvailability() {'}</span>{'\n'}<span>    availability.classList.add(</span><span className="code-string">&quot;is-visible&quot;</span><span>)</span><span className="code-punctuation">;</span>{'\n'}<span>{'  }'}</span>{'\n'}<span>&lt;/</span><span className="code-tag">script</span><span>&gt;</span></code></div></div>;
}
function AISection(){
 return <section className="ai-section" aria-label="AI в рабочем процессе"><div className="ai-desktop-side" aria-hidden="true"/><div className="ai-desktop-panel"><AICopy desktop/><StaticCode/></div><div className="ai-desktop-side" aria-hidden="true"/><div className="ai-mobile-panel"><AICopy/></div></section>;
}
export default function App(){
 return <><CustomCursor/><a className="skip-link" href="#projects">Перейти к проектам</a><div className="hero-shell"><Header/><Hero/></div><main><div className="body-sections"><div className="body-container"><Projects/><Process/></div></div><AISection/><Experience cv={cv}/><About/></main><footer className="site-footer"><div className="site-footer-inner"><span><Icon name="imgColor8"/>Разработка и Дизайн Артур А.</span><span>2026</span></div></footer></>;
}
