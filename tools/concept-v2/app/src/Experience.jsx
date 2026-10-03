import {useEffect,useRef} from 'react';
import {activeExperienceIndex,experienceCompletionTransition,experienceLayout,experienceReachedIndexes,experienceSegmentProgress,experienceShouldPaint,experienceTravel,horizontalSpeedBlur,scrollProgress} from './experience-layout.mjs';
import {createExperienceEntryGate} from './experience-entry-gate.mjs';
import {subscribeScrollActivity,subscribeSmoothScroll,subscribeWheelActivity} from './smooth-scroll-runtime.mjs';
import {createFrameTask} from './runtime/frame-task.mjs';
import {subscribeLayoutInvalidation} from './runtime/layout-invalidation.mjs';
import {ControlButton} from './Controls';
import {GridPattern} from './GridPattern';

const {horizontal:HORIZONTAL_TRAVEL,vertical:VERTICAL_TRAVEL}=experienceTravel();

const jobs=[
  {className:'current',from:'Май 2026',to:'Настоящее время',role:'',company:'Открыт к предложениям',description:'Готов к новым задачам — как в рамках отдельных проектов, так и на полной занятости.'},
  {className:'eyeconweb',from:'Август 2021',to:'Май 2026',role:'Product Designer',company:'Eyeconweb',description:'B2B/B2E, SaaS, сложная бизнес логика, дизайн-системы и взаимодействие с разработкой'},
  {className:'freelance',from:'Ноябрь 2019',to:'Декабрь 2023',role:'Product Designer',company:'Фриланс',description:'Веб и мобильные продукты, сценарии, прототипы'},
  {className:'vexel',from:'Декабрь 2020',to:'Июль 2021',role:'Product Designer',company:'Vexel',description:'Экосистема криптовалютного банка и внутренние системы'},
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

export function Experience({cv}){
  const root=useRef(null);
  const sticky=useRef(null);
  useEffect(()=>{
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    let progress=0;
    let completed=false;
    let previousX=0;
    let previousTime=performance.now();
    let previousScrollY=window.scrollY;
    let blurTimer;
    let allowRearm=false;
    let scrollActive=false;
    let wheelActive=false;
    let sectionTop=0;
    let sectionHeight=0;
    let layoutDirty=true;
    let positionDirty=true;
    let desktop=window.innerWidth>=1280;
    let lenis;
    let removeVirtualScroll=()=>{};
    const section=root.current;
    const jobs=[...section.querySelectorAll('.experience-job')];
    const paths=[...section.querySelectorAll('.experience-path-progress')];
    const styles=new Map();
    const stickyStyles=new Map();
    const layoutStates={height:'',compact:null};
    const states={progress:'',activeIndex:'',started:null,complete:null,reached:jobs.map(()=>null),segments:paths.map(()=>null)};
    const setStyle=(name,value)=>{if(styles.get(name)===value)return;styles.set(name,value);section.style.setProperty(name,value);};
    const setStickyStyle=(name,value)=>{if(stickyStyles.get(name)===value)return;stickyStyles.set(name,value);sticky.current.style.setProperty(name,value);};
    const setDataset=(name,value)=>{if(states[name]===value)return;states[name]=value;section.dataset[name]=value;};
    const entryGate=createExperienceEntryGate({onStateChange(state){
      root.current?.setAttribute('data-entry-gate',state);
    }});
    const unsubscribeSmoothScroll=subscribeSmoothScroll(instance=>{
      removeVirtualScroll();
      removeVirtualScroll=()=>{};
      if(lenis?.isStopped&&entryGate.state!=='idle')lenis.start();
      entryGate.reset();
      lenis=instance;
      if(lenis)removeVirtualScroll=lenis.on('virtual-scroll',event=>{
        if(entryGate.onVirtualScroll(event))lenis.start();
      });
    });
    function applyLayout(){
      const layout=experienceLayout(window.innerHeight);
      const height=desktop?`${window.innerHeight+(completed?0:VERTICAL_TRAVEL)}px`:'auto';
      if(layoutStates.height!==height){layoutStates.height=height;section.style.height=height;}
      setStickyStyle('--experience-top-outer',`${layout.topOuter}px`);
      setStickyStyle('--experience-center',`${layout.center}px`);
      setStickyStyle('--experience-free',`${layout.free}px`);
      setStickyStyle('--experience-heading-gap',`${layout.headingGap}px`);
      setStickyStyle('--experience-tape-top',`${layout.tapeTop}px`);
      setStickyStyle('--experience-progress-gap',`${layout.progressGap}px`);
      setStickyStyle('--experience-bottom',`${layout.bottom}px`);
      setStickyStyle('--experience-scale',String(layout.scale));
      setStickyStyle('--experience-compact-offset',`${layout.compactOffset}px`);
      if(layoutStates.compact!==layout.compact){layoutStates.compact=layout.compact;section.classList.toggle('is-compact',layout.compact);}
      layoutDirty=false;
      positionDirty=true;
    }
    function refreshPosition(){
      if(document.body.style.position==='fixed')return false;
      sectionTop=section.getBoundingClientRect().top+window.scrollY;
      sectionHeight=section.offsetHeight;
      positionDirty=false;
      return true;
    }
    function clearBlur(){
      clearTimeout(blurTimer);
      blurTimer=undefined;
      setStyle('--experience-blur','0px');
    }
    function clearRearm(){allowRearm=false;}
    function resetStatic(){
      if(lenis?.isStopped&&entryGate.state!=='idle')lenis.start();
      entryGate.reset();
      progress=0;
      completed=false;
      previousX=0;
      previousTime=performance.now();
      previousScrollY=window.scrollY;
      clearRearm();
      clearBlur();
      if(desktop===false){
        setStyle('--experience-progress','0');
        setStyle('--experience-shift','0px');
        setDataset('progress','0.0000');
        setDataset('activeIndex','0');
        if(states.started!==false){states.started=false;section.classList.remove('is-started');}
        if(states.complete!==false){states.complete=false;section.classList.remove('is-complete');}
        jobs.forEach((job,index)=>{if(states.reached[index]!==false){states.reached[index]=false;job.classList.remove('is-reached');}});
        paths.forEach((path,index)=>{if(states.segments[index]!==1){states.segments[index]=1;path.style.setProperty('stroke-dashoffset','1');}});
      }
    }
    function syncGate(currentScrollY){
      if(currentScrollY<sectionTop&&entryGate.state!=='idle'){
        if(lenis?.isStopped)lenis.start();
        entryGate.reset();
      }
    }
    function paint(){
      let currentScrollY=window.scrollY;
      if(!desktop){resetStatic();return;}
      const enteredFromAbove=previousScrollY<sectionTop&&currentScrollY>=sectionTop;
      const captureEntry=enteredFromAbove&&entryGate.state==='idle'&&lenis?.isScrolling==='smooth';
      if(captureEntry){
        entryGate.capture();
        lenis.scrollTo(sectionTop,{immediate:true,force:true});
        lenis.stop();
        currentScrollY=sectionTop;
      }
      const reenteringFromAbove=completed&&captureEntry;
      const rearmPending=completed&&currentScrollY+window.innerHeight<sectionTop;
      if(rearmPending)allowRearm=!wheelActive&&!scrollActive;
      else if(allowRearm)clearRearm();
      const transition=experienceCompletionTransition({completed,scrollY:currentScrollY,sectionTop,viewportHeight:window.innerHeight,allowRearm,reenteringFromAbove,verticalTravel:VERTICAL_TRAVEL});
      if(transition.completed!==completed){
        completed=transition.completed;
        clearRearm();
        const height=window.innerHeight+(completed?0:VERTICAL_TRAVEL);
        layoutStates.height=`${height}px`;
        section.style.height=layoutStates.height;
        sectionHeight=height;
        lenis?.resize();
        if(transition.scrollY!==undefined){
          currentScrollY=transition.scrollY;
          if(lenis)lenis.scrollTo(currentScrollY,{immediate:true,force:true});
          else window.scrollTo({top:currentScrollY,behavior:'instant'});
        }
      }
      syncGate(currentScrollY);
      if(!experienceShouldPaint({scrollY:currentScrollY,viewportHeight:window.innerHeight,sectionTop,sectionHeight})){
        clearBlur();
        previousX=scrollProgress({scrollY:currentScrollY,sectionTop,verticalTravel:VERTICAL_TRAVEL})*HORIZONTAL_TRAVEL;
        previousTime=performance.now();
        previousScrollY=currentScrollY;
        return;
      }
      progress=completed?1:scrollProgress({scrollY:currentScrollY,sectionTop,verticalTravel:VERTICAL_TRAVEL});
      const x=progress*HORIZONTAL_TRAVEL;
      const now=performance.now();
      const speed=Math.abs(x-previousX)/Math.max(1,now-previousTime)*1000;
      const blur=reduced.matches?0:horizontalSpeedBlur(speed);
      setStyle('--experience-progress',String(progress));
      setStyle('--experience-shift',`${-x}px`);
      setStyle('--experience-blur',`${blur}px`);
      setDataset('progress',progress.toFixed(4));
      const started=progress>0,complete=progress>=1;
      if(states.started!==started){states.started=started;section.classList.toggle('is-started',started);}
      if(states.complete!==complete){states.complete=complete;section.classList.toggle('is-complete',complete);}
      const activeIndex=activeExperienceIndex(progress);
      const reachedIndexes=new Set(experienceReachedIndexes(progress));
      setDataset('activeIndex',String(activeIndex));
      jobs.forEach((job,index)=>{const reached=index>0&&reachedIndexes.has(index);if(states.reached[index]!==reached){states.reached[index]=reached;job.classList.toggle('is-reached',reached);}});
      paths.forEach((path,index)=>{
        const segment=experienceSegmentProgress(progress,Number(path.dataset.segment));
        const offset=1-segment;
        if(states.segments[index]!==offset){states.segments[index]=offset;path.style.setProperty('stroke-dashoffset',String(offset));}
      });
      previousX=x;previousTime=now;previousScrollY=currentScrollY;
      clearTimeout(blurTimer);
      blurTimer=blur>0?setTimeout(()=>{blurTimer=undefined;setStyle('--experience-blur','0px');},80):undefined;
    }
    const paintTask=createFrameTask({
      read:payload=>{
        // The image viewer fixes body and temporarily reports scrollY=0.
        if(document.body.style.position==='fixed'){positionDirty=true;return {documentLocked:true};}
        const nextDesktop=window.innerWidth>=1280;
        const preserve=payload?.preserve===true&&desktop&&nextDesktop&&progress>0&&progress<1;
        desktop=nextDesktop;
        if(layoutDirty)applyLayout();
        const documentLocked=positionDirty&&!refreshPosition();
        return {preserve,documentLocked};
      },
      write:({preserve,documentLocked})=>{
        if(documentLocked){clearBlur();return;}
        if(preserve){
          window.scrollTo({top:sectionTop+progress*VERTICAL_TRAVEL,behavior:'instant'});
          positionDirty=true;
          paintTask.schedule({});
          return;
        }
        paint();
      },
    });
    function schedulePaint(payload){paintTask.schedule(payload);}
    function onScroll(){schedulePaint({});}
    function invalidatePosition(){positionDirty=true;schedulePaint({});}
    function onResize(){layoutDirty=true;positionDirty=true;schedulePaint({preserve:true});}
    function onVisibilityChange(){
      if(document.hidden){paintTask.cancel();clearBlur();previousX=scrollProgress({scrollY:window.scrollY,sectionTop,verticalTravel:VERTICAL_TRAVEL})*HORIZONTAL_TRAVEL;previousTime=performance.now();return;}
      positionDirty=true;
      schedulePaint({});
    }
    const resizeObserver=new ResizeObserver(invalidatePosition);
    resizeObserver.observe(section);
    ['.hero-shell','.body-sections','.ai-section'].map(selector=>document.querySelector(selector)).filter(Boolean).forEach(owner=>resizeObserver.observe(owner));
    let fontsDisposed=false;
    const onFonts=()=>invalidatePosition();
    document.fonts?.ready?.then(()=>{if(!fontsDisposed)invalidatePosition();});
    document.fonts?.addEventListener?.('loadingdone',onFonts);
    const unsubscribeLayoutInvalidation=subscribeLayoutInvalidation(invalidatePosition);
    const unsubscribeScrollActivity=subscribeScrollActivity(active=>{scrollActive=active;if(active)clearRearm();schedulePaint({});});
    const unsubscribeWheelActivity=subscribeWheelActivity(active=>{wheelActive=active;if(active)clearRearm();schedulePaint({});});
    const onMotionChange=()=>schedulePaint({});
    schedulePaint({});
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onResize);
    document.addEventListener('visibilitychange',onVisibilityChange);
    reduced.addEventListener('change',onMotionChange);
    return()=>{if(lenis?.isStopped&&entryGate.state!=='idle')lenis.start();entryGate.dispose();removeVirtualScroll();unsubscribeSmoothScroll();unsubscribeLayoutInvalidation();unsubscribeScrollActivity();unsubscribeWheelActivity();paintTask.dispose();clearRearm();clearBlur();resizeObserver.disconnect();fontsDisposed=true;document.fonts?.removeEventListener?.('loadingdone',onFonts);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onResize);document.removeEventListener('visibilitychange',onVisibilityChange);reduced.removeEventListener('change',onMotionChange);};
  },[]);

  return <section ref={root} className="experience" aria-labelledby="experience-title">
    <div ref={sticky} className="experience-sticky">
      <div className="experience-pattern pattern-top"><div className="experience-pattern-grid"/></div>
      <div className="experience-center"><GridPattern/><div className="experience-composition">
        <div className="experience-heading"><div><p className="eyebrow">ОПЫТ</p><h2 id="experience-title">Где я работал</h2><p>Большую часть опыта проработал продуктовым дизайнером</p></div><ControlButton className="experience-resume" variant="light" href={cv} external iconRight="file05">Резюме</ControlButton></div>
        <div className="experience-scroll"><div className="experience-window"><div className="experience-track">{paths.map((path,index)=><ExperiencePath key={path.className} path={path} index={index}/>)}{jobs.map(job=><ExperienceJob key={job.className} job={job}/>)}</div><div className="experience-fade experience-fade-left"/><div className="experience-fade experience-fade-right"/></div><div className="experience-progress"><span className="experience-progress-fill"/><span className="experience-progress-glow"/></div></div>
      </div></div>
    </div>
  </section>;
}
