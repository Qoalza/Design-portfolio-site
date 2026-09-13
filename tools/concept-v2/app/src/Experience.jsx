import {useEffect,useRef} from 'react';
import {activeExperienceIndex,experienceLayout,experienceReachedIndexes,experienceTravel,horizontalSpeedBlur,scrollProgress} from './experience-layout.mjs';

const {horizontal:HORIZONTAL_TRAVEL,vertical:VERTICAL_TRAVEL}=experienceTravel();

const jobs=[
  {className:'current',from:'Май 2026',to:'Настоящее время',role:'',company:'Открыт к предложениям',description:'Готов к новым задачам — как в рамках отдельных проектов, так и на полной занятости.'},
  {className:'eyeconweb',from:'Август 2021',to:'Май 2026',role:'PRODUCT DESIGNER',company:'Eyeconweb',description:'B2B/B2E, SaaS, сложная бизнес логика, дизайн-системы и взаимодействие с разработкой'},
  {className:'freelance',from:'Ноябрь 2019',to:'Декабрь 2023',role:'PRODUCT DESIGNER',company:'Фриланс',description:'Веб и мобильные продукты, сценарии, прототипы'},
  {className:'vexel',from:'Декабрь 2020',to:'Июль 2021',role:'PRODUCT DESIGNER',company:'Vexel',description:'Экосистема криптовалютного банка и внутренние системы'},
  {className:'agima',from:'Август 2020',to:'Октябрь 2020',role:'UX Designer',company:'Agima',description:'Экосистема криптовалютного банка и внутренние системы'},
  {className:'beginning',from:'Октябрь 2020',to:'Июнь 2018',role:'UX/UI Designer',company:'Начало карьеры',description:'Самостоятельные проекты, учебные кейсы и курсы. А так же переход из 3D графики в проектирование.'},
];

const paths=[
  {className:'line-128',viewBox:'0 0 318 179',d:'M0 0.5H262.5C269.127 0.5 274.5 5.87258 274.5 12.5V166.5C274.5 173.127 279.873 178.5 286.5 178.5H318'},
  {className:'line-129',viewBox:'0 0 329 259',d:'M0 258.5H255.5C262.127 258.5 267.5 253.127 267.5 246.5V12.5C267.5 5.87259 272.873 0.5 279.5 0.5H329'},
  {className:'line-130',viewBox:'0 0 343.5 180',d:'M0 0.5H248.5C255.127 0.5 260.5 5.87258 260.5 12.5V167.5C260.5 174.127 265.873 179.5 272.5 179.5H343.5'},
  {className:'line-131',viewBox:'0 0 363 144',d:'M0 0.5H268.5C275.127 0.5 280.5 5.87258 280.5 12.5V131.5C280.5 138.127 285.873 143.5 292.5 143.5H363',transform:'translate(0 144) scale(1 -1)'},
  {className:'line-132',viewBox:'0 0 410 148',d:'M0 0.5H280.402C287.03 0.5 292.402 5.87258 292.402 12.5V135.499C292.402 142.127 297.775 147.499 304.402 147.499H410'},
];

function ExperiencePath({path,index}){
  return <svg className={`experience-path ${path.className}`} viewBox={path.viewBox} preserveAspectRatio="none" aria-hidden="true"><g transform={path.transform}><path className="experience-path-base" d={path.d}/><path className="experience-path-progress" data-segment={index} pathLength="1" style={{strokeDasharray:1,strokeDashoffset:1}} d={path.d}/></g></svg>;
}

function DateRail({current}){
  const variant=current?'current':'neutral';
  return <span className="date-rail" aria-hidden="true">
    <span className="date-marker date-marker-start"><img src={`/figma/experience-date-${variant}-start.svg`} alt=""/></span>
    <span className="date-marker-line"><img src={`/figma/experience-date-${variant}-line.svg`} alt=""/></span>
    <span className="date-marker date-marker-end">
      <img className="date-marker-neutral" src={`/figma/experience-date-${variant}-end.svg`} alt=""/>
      {!current&&<img className="date-marker-reached" src="/figma/experience-date-reached-end.svg" alt=""/>}
    </span>
  </span>;
}

function ExperienceJob({job}){
  return <article className={`experience-job ${job.className}`}>
    <div className="experience-dates"><DateRail current={job.className==='current'}/><span><b>{job.from}</b><b>{job.to}</b></span></div>
    <span className="experience-node" aria-hidden="true"><i/></span>
    <div className="experience-job-copy">{job.role&&<p className="experience-role">{job.role}</p>}<div><h3>{job.company}</h3><p>{job.description}</p></div></div>
  </article>;
}

export function Experience(){
  const root=useRef(null);
  const sticky=useRef(null);
  useEffect(()=>{
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    let progress=0;
    let previousX=0;
    let previousTime=performance.now();
    let blurTimer;
    function paint(){
      const section=root.current;
      if(window.innerWidth<1280){
        section.style.height='auto';
        section.classList.remove('is-complete');
        section.style.setProperty('--experience-progress','0');
        section.style.setProperty('--experience-shift','0px');
        section.style.setProperty('--experience-blur','0px');
        section.dataset.progress='0.0000';
        section.dataset.activeIndex='0';
        section.querySelectorAll('.experience-job').forEach(job=>job.classList.remove('is-reached'));
        section.querySelectorAll('.experience-path-progress').forEach(path=>path.style.setProperty('stroke-dashoffset','1'));
        return;
      }
      const top=section.getBoundingClientRect().top+window.scrollY;
      progress=scrollProgress({scrollY:window.scrollY,sectionTop:top,verticalTravel:VERTICAL_TRAVEL});
      const x=progress*HORIZONTAL_TRAVEL;
      const now=performance.now();
      const speed=Math.abs(x-previousX)/Math.max(1,now-previousTime)*1000;
      const blur=reduced.matches?0:horizontalSpeedBlur(speed);
      section.style.setProperty('--experience-progress',String(progress));
      section.style.setProperty('--experience-shift',`${-x}px`);
      section.style.setProperty('--experience-blur',`${blur}px`);
      section.dataset.progress=progress.toFixed(4);
      section.classList.toggle('is-complete',progress>=1);
      const activeIndex=activeExperienceIndex(progress);
      const reachedIndexes=new Set(experienceReachedIndexes(progress));
      section.dataset.activeIndex=String(activeIndex);
      section.querySelectorAll('.experience-job').forEach((job,index)=>job.classList.toggle('is-reached',index>0&&reachedIndexes.has(index)));
      section.querySelectorAll('.experience-path-progress').forEach(path=>{
        const segment=Math.max(0,Math.min(1,progress*5-Number(path.dataset.segment)));
        path.style.setProperty('stroke-dashoffset',String(1-segment));
      });
      previousX=x;previousTime=now;
      clearTimeout(blurTimer);
      blurTimer=setTimeout(()=>section.style.setProperty('--experience-blur','0px'),80);
    }
    function size({preserve=false}={}){
      const active=preserve&&progress>0&&progress<1&&window.innerWidth>=1280;
      const layout=experienceLayout(window.innerHeight);
      const section=root.current;
      section.style.height=window.innerWidth>=1280?`${window.innerHeight+VERTICAL_TRAVEL}px`:'auto';
      sticky.current.style.setProperty('--experience-outer',`${layout.outer}px`);
      sticky.current.style.setProperty('--experience-center',`${layout.center}px`);
      sticky.current.style.setProperty('--experience-free',`${layout.free}px`);
      sticky.current.style.setProperty('--experience-heading-gap',`${layout.headingGap}px`);
      sticky.current.style.setProperty('--experience-tape-top',`${layout.tapeTop}px`);
      sticky.current.style.setProperty('--experience-progress-gap',`${layout.progressGap}px`);
      sticky.current.style.setProperty('--experience-bottom',`${layout.bottom}px`);
      sticky.current.style.setProperty('--experience-scale',String(layout.scale));
      if(active){
        const top=section.getBoundingClientRect().top+window.scrollY;
        window.scrollTo({top:top+progress*VERTICAL_TRAVEL,behavior:'instant'});
      }
      paint();
    }
    const onResize=()=>size({preserve:true});
    size();
    window.addEventListener('scroll',paint,{passive:true});
    window.addEventListener('resize',onResize);
    reduced.addEventListener('change',paint);
    return()=>{clearTimeout(blurTimer);window.removeEventListener('scroll',paint);window.removeEventListener('resize',onResize);reduced.removeEventListener('change',paint);};
  },[]);

  return <section ref={root} className="experience" aria-labelledby="experience-title">
    <div ref={sticky} className="experience-sticky">
      <div className="experience-pattern pattern-top"/>
      <div className="experience-center"><div className="experience-composition">
        <div className="experience-heading"><div><p className="eyebrow">ОПЫТ</p><h2 id="experience-title">Где я работал</h2><p>Большую часть опыта проработал продуктовым дизайнером</p></div><p className="tech-note">// все сложное – просто</p></div>
        <div className="experience-scroll"><div className="experience-window"><div className="experience-track">{paths.map((path,index)=><ExperiencePath key={path.className} path={path} index={index}/>)}{jobs.map(job=><ExperienceJob key={job.className} job={job}/>)}</div><div className="experience-fade experience-fade-left"/><div className="experience-fade experience-fade-right"/></div><div className="experience-progress"><span className="experience-progress-fill"/><span className="experience-progress-glow"/></div></div>
      </div></div>
      <div className="experience-pattern pattern-bottom"/>
    </div>
  </section>;
}
