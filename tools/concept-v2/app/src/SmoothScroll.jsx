import {useEffect} from 'react';
import Lenis from '../vendor/lenis/lenis.mjs';
import {publishScrollActivity,publishSmoothScroll} from './smooth-scroll-runtime.mjs';
import {createWheelInputProfile,resolveWheelHandling} from './wheel-input-profile.mjs';
import '../vendor/lenis/lenis.css';
import './smooth-scroll.css';

// Exact wheel tuning/input eligibility from the original Portfolio provider.
// This standalone page has no gallery controllers; only one root RAF is needed.
export function SmoothScroll(){
  useEffect(()=>{
    const desktop=window.matchMedia('(min-width: 1280px) and (pointer: fine)');
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    let lenis;
    let frame;
    let wheelHandling='smooth';
    let experienceVisible=false;
    let experienceObserver;
    const wheelInput=createWheelInputProfile();
    let removeScrollActivity=()=>{};
    function destroy(){
      cancelAnimationFrame(frame);
      removeScrollActivity();
      removeScrollActivity=()=>{};
      experienceObserver?.disconnect();
      experienceObserver=undefined;
      experienceVisible=false;
      publishScrollActivity(false);
      publishSmoothScroll(undefined);
      lenis?.destroy();
      lenis=undefined;
      wheelInput.reset();
      wheelHandling='smooth';
      delete document.documentElement.dataset.lenisEnabled;
      delete document.documentElement.dataset.scrollInput;
      delete document.documentElement.dataset.scrollHandling;
    }
    function update(){
      destroy();
      if(!desktop.matches||reduced.matches)return;
      lenis=new Lenis({
        autoRaf:false,smoothWheel:true,syncTouch:false,
        lerp:.1,wheelMultiplier:1,stopInertiaOnNavigate:true,
        virtualScroll:({event})=>{
          if(!event.type.includes('wheel'))return;
          const input=wheelInput.observe(event);
          document.documentElement.dataset.scrollInput=input;
          const nextHandling=resolveWheelHandling({input,protectedRegionVisible:experienceVisible});
          document.documentElement.dataset.scrollHandling=nextHandling;
          if(nextHandling!==wheelHandling){
            lenis.reset();
            wheelHandling=nextHandling;
          }
          if(nextHandling==='native'){
            publishScrollActivity(true);
            return false;
          }
        },
      });
      const experience=document.querySelector('.experience');
      if(experience){
        experienceObserver=new IntersectionObserver(([entry])=>{experienceVisible=entry.isIntersecting});
        experienceObserver.observe(experience);
      }
      publishSmoothScroll(lenis);
      const removeVirtualScroll=lenis.on('virtual-scroll',()=>publishScrollActivity(true));
      const removeScroll=lenis.on('scroll',instance=>publishScrollActivity(instance.isScrolling));
      removeScrollActivity=()=>{removeVirtualScroll();removeScroll()};
      document.documentElement.dataset.lenisEnabled='true';
      function tick(time){
        lenis.raf(time);
        frame=requestAnimationFrame(tick);
      }
      frame=requestAnimationFrame(tick);
    }
    function anchor(event){
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
      const link=event.target.closest?.('a[href^="#"]');
      if(!link)return;
      const id=link.hash.slice(1),target=document.getElementById(id);
      if(!target)return;
      event.preventDefault();
      const offset=id==='top'?0:-24;
      const focusTarget=()=>{
        const previous=target.getAttribute('tabindex');
        if(previous===null)target.setAttribute('tabindex','-1');
        target.focus({preventScroll:true});
        if(previous===null)target.removeAttribute('tabindex');
      };
      if(lenis)lenis.scrollTo(target,{offset,force:true,onComplete:focusTarget});
      else{
        window.scrollTo({top:target.getBoundingClientRect().top+window.scrollY+offset,behavior:reduced.matches?'instant':'smooth'});
        focusTarget();
      }
    }
    update();
    desktop.addEventListener('change',update);
    reduced.addEventListener('change',update);
    document.addEventListener('click',anchor);
    return ()=>{
      destroy();
      desktop.removeEventListener('change',update);
      reduced.removeEventListener('change',update);
      document.removeEventListener('click',anchor);
    };
  },[]);
  return null;
}
