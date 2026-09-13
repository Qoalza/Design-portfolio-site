import {useEffect,useRef,useState} from 'react';
import {ControlButton,NavigationTab,Icon} from './Controls';
import {SvgLens} from './SvgLens';
import {MobileNavigation} from './MobileNavigation';
import {getHeroVariant} from './hero-layout.mjs';
import {Experience} from './Experience';
import {randomEdgePoint} from './process-fill.mjs';

const corvoFigma='https://www.figma.com/design/5vYeOVxLE28VNXEMOnopno/Corvo---Readme?node-id=0-1';
const cv='https://disk.yandex.ru/i/iZ1UWgbO1LAOPw';
const description='B2B SaaS-платформа для управления партнёрской программой и рекламным трафиком. Она объединяет работу аффилиатов, компаний и команды продукта: подключение к программе, условия сотрудничества, кампании, рекламные материалы и статистику';
const steps=[
 {title:'Погружаюсь в данные',description:'Разбираюсь в контексте, пользователях и бизнес-целях. Формулирую проблему/цель и нахожу главное.',image:'imgFrame26086399',dots:'imgFrame26086412',width:5},
 {title:'Собираю решение в систему',description:'Проектирую сценарии, интерфейсы и логику. Проектирую дизайн систему, описываю гайдлайны. Согласовываю с разработкой.',image:'imgFrame26086400',dots:'imgFrame26086413',width:16},
 {title:'Довожу до продакшена',description:'Согласовываю решения, передаю в разработку и остаюсь на связи до релиза и поддерживаю после него.',image:'imgFrame26086401',dots:'imgFrame26086414',width:27}
];
function Header(){
 return <header className="site-header" id="top"><div className="header-row">
  <a className="brand" href="#top" aria-label="Артур — на главную"><img src="/figma/imgSymbol.svg" width="44" height="44" alt=""/><span><strong>ARTUR</strong><small>Product Designer</small></span></a>
  <nav aria-label="Основная навигация"><NavigationTab icon="imgColor" active>Главная</NavigationTab><NavigationTab icon="imgColor1" disabled>Блог</NavigationTab><NavigationTab icon="imgColor1" disabled>Лаборатория</NavigationTab></nav>
  <div className="header-actions"><MobileNavigation/><span className="availability"><img src="/figma/imgIndicator.svg" width="6" height="8" alt=""/>Открыт к предложениям</span><ControlButton variant="accent" href="https://t.me/Coco_soul" external iconRight="imgColor2">Связаться</ControlButton></div>
 </div></header>;
}
function Hero(){
 const [layout,setLayout]=useState(()=>getHeroVariant(typeof window==='undefined'?0:window.innerHeight));
 useEffect(()=>{const update=()=>setLayout(getHeroVariant(window.innerHeight));update();window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update)},[]);
 return <section className="hero" data-layout={layout} aria-labelledby="hero-title">
  <span className="texture texture-bottom" aria-hidden="true"><img src="/figma/imgImage21.png" alt=""/></span>
  <div className="hero-main"><div className="hero-layout">
   <div className="hero-copy"><div className="hero-text"><div className="hero-title"><p className="name">Артур</p><h1 id="hero-title">Продуктовый дизайнер</h1></div><p className="intro">Разбираюсь в сложных бизнес-процессах, превращаю их в понятные интерфейсы и довожу решения до реализации.</p></div><div className="hero-actions"><ControlButton href="#projects" className="works-button">Мои работы</ControlButton><ControlButton variant="ghost" href={cv} external iconRight="imgColor3">CV</ControlButton></div></div>
   <div className="hero-graph"><SvgLens/></div>
  </div></div>
  <div className="hero-bottom"><div className="hero-bottom-inner"><div className="disciplines">{['Design systems','Data-heavy','Enterprise systems','B2B','SaaS'].map((s,i)=><span key={s}>{i>0&&<b aria-hidden="true">•</b>}{s}</span>)}</div><ControlButton className="legacy-works-link" variant="ghost" href="#projects" iconRight="imgColor5">К работам</ControlButton><dl className="hero-facts">{[['ВОЗРАСТ','29 лет'],['ГОРОД','Екатеринбург'],['УРОВЕНЬ','Senior'],['СТАЖ','7 лет']].map(([term,value])=><div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl></div></div>
 </section>;
}
function SectionTitle({eyebrow,title,children,className='',id}){
 return <div className={`section-title ${className}`}><p className="eyebrow">{eyebrow}</p><h2 id={id}>{title}</h2><div className="section-description">{children}</div></div>;
}
function ProjectCard(){
 return <article className="project">
  <div className="project-preview" aria-label="Интерфейс Corvo">
   <div className="project-divider"/><div className="project-glow"/>
   <div className="project-back-layer"><img className="project-back" src="/figma/imgDesktop3.png" alt="" loading="lazy"/></div>
   <div className="project-shade"/>
   <div className="project-front-layer"><img className="project-front" src="/figma/imgDesktop4.png" alt="Corvo — управление партнёрской программой, таблица компаний" loading="lazy"/></div>
  </div>
  <div className="project-main"><div className="project-info"><h3>Corvo<img src="/figma/imgProjectCorvo.svg" width="28" height="28" alt=""/></h3><p>{description}</p></div><div className="project-actions"><ControlButton href="https://art-des.ru/projects/corvo" external>Подробнее</ControlButton><ControlButton variant="ghost" href={corvoFigma} external iconRight="imgColor7">Figma</ControlButton></div></div>
 </article>;
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
  <div className="step-top"><span className="step-icon" aria-hidden="true" style={{'--fill-x':`${origin.x}px`,'--fill-y':`${origin.y}px`,'--icon-mask':`url('/figma/process-mask-${index+1}.svg')`,'--background-mask':`url('/figma/process-background-mask-${index+1}.svg')`}}><img className="step-icon-base" src={`/figma/${step.image}.svg`} width="64" height="64" alt=""/><i className="step-icon-background"/><i className="step-icon-fill"/></span>
   <div className="step-number"><span>0{index+1}</span><img src={`/figma/${step.dots}.svg`} width={step.width} height="5" alt=""/></div></div>
  <div className="step-text"><h3>{step.title}</h3><p>{step.description}</p></div>
 </article>;
}
function Process(){
 return <section className="process-section" aria-labelledby="process-title">
  <div className="process-heading"><SectionTitle id="process-title" eyebrow="ПРОЦЕСС" title="Как я работаю"><p>Сначала разбираюсь в продукте, бизнесе и самой задаче. Затем выбираю подходящие методы, собираю решение в систему и довожу его до продакшена.</p></SectionTitle><p className="tech-note">// от задачи, до работающего продукта</p></div>
  <div className="steps">{steps.map((step,index)=><ProcessStep key={step.title} step={step} index={index}/>)}</div>
 </section>;
}
function AISection(){
 return <section className="ai-section" aria-labelledby="ai-title"><div className="ai-side ai-side-left" aria-hidden="true"/><div className="ai-panel"><SectionTitle className="ai-title" id="ai-title" eyebrow="ИНСТРУМЕНТЫ" title="AI в рабочем процессе"><p>Использую AI, как рабочий инструмент, для ускорения исследований, прототипирования, проверки решений/гипотез и разработки.</p></SectionTitle><div className="ai-tools"><div className="tools-list">
   <div className="tool"><div className="tool-icon"><img src="/figma/imgIcon.svg" width="32" height="32" alt=""/></div><div><h3>ChatGPT</h3><p>Анализ, проверка идей, составление планов</p></div></div>
   <div className="tool"><div className="tool-icon"><img src="/figma/imgIcon1.svg" width="32" height="32" alt=""/></div><div><h3>Codex</h3><p>Прототипы и рабочие инструменты</p></div></div>
  </div><p className="tech-note">// итоговые решения всегда остаются за мной</p></div></div><div className="ai-side ai-side-right" aria-hidden="true"/></section>;
}
function AboutSection(){
 return <section className="about-section" aria-labelledby="about-title"><div className="about-inner"><SectionTitle className="about-title" id="about-title" eyebrow="ЛИЧНОЕ" title="Обо мне"/><div className="about-empty" aria-hidden="true"/></div></section>;
}
export default function App(){
 return <><a className="skip-link" href="#projects">Перейти к проектам</a><div className="hero-shell"><span className="texture texture-top" aria-hidden="true"><img src="/figma/imgImage21.png" alt=""/></span><Header/><Hero/></div><main><div className="body-sections"><div className="body-container"><section className="projects-section" id="projects" aria-labelledby="projects-title"><div className="projects-heading"><SectionTitle id="projects-title" eyebrow="ПРОЕКТЫ" title="Избранное"><p>Здесь собрал рабочие проекты, тестовые задания.<br/>Где можно увидеть мой подход к задаче и результат.</p></SectionTitle><ControlButton variant="light" href="https://art-des.ru/projects" external iconRight="imgColor6">Все работы</ControlButton></div><div className="projects-grid"><ProjectCard/><ProjectCard/></div></section><Process/></div></div><AISection/><Experience/><AboutSection/></main><footer className="site-footer"><div className="site-footer-inner"><span><Icon name="imgColor8"/>Разработка и Дизайн Артур А.</span><span>2026</span></div></footer></>;
}
