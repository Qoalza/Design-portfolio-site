import {useEffect, useRef, useState} from 'react';
import './lens.css';
import './svg-lens.css';
import {SvgNetwork} from './SvgNetwork';
import {nodes} from './network-data.mjs';

export function SvgLens(){
  const area=useRef(null);
  const [point,setPoint]=useState({x:49.5,y:47.2});
  const [active,setActive]=useState(false);
  const [coarse,setCoarse]=useState(false);
  const [touchExplore,setTouchExplore]=useState(false);
  useEffect(()=>{
    const query=window.matchMedia('(pointer: coarse)');
    const update=()=>{setCoarse(query.matches);setTouchExplore(false);setActive(false)};
    update();query.addEventListener('change',update);
    return ()=>query.removeEventListener('change',update);
  },[]);
  const closingUntil=useRef(0);
  function leave(event){
    if(event.pointerType==='touch')return;
    closingUntil.current=performance.now()+180;
    const rect=area.current.getBoundingClientRect();
    setPoint({x:(event.clientX-rect.left)/rect.width*100,y:(event.clientY-rect.top)/rect.height*100});
    setActive(false);
  }
  useEffect(()=>{
    function followOutside(event){
      if(event.pointerType==='touch' || performance.now()>closingUntil.current)return;
      const rect=area.current.getBoundingClientRect();
      setPoint({x:(event.clientX-rect.left)/rect.width*100,y:(event.clientY-rect.top)/rect.height*100});
    }
    window.addEventListener('pointermove',followOutside);
    return ()=>window.removeEventListener('pointermove',followOutside);
  },[]);
  const nearest=nodes.find(([x,y])=>Math.hypot(x-point.x,y-point.y)<8);
  function move(event){
    if(event.pointerType==='touch'&&!touchExplore)return;
    const rect=area.current.getBoundingClientRect();
    const inside=event.clientX>=rect.left && event.clientX<=rect.right && event.clientY>=rect.top && event.clientY<=rect.bottom;
    setActive(inside);
    if(!inside)return;
    closingUntil.current=0;
    setPoint({x:Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100)),y:Math.max(0,Math.min(100,(event.clientY-rect.top)/rect.height*100))});
  }
  function key(event){
    const steps={ArrowLeft:[-3,0],ArrowRight:[3,0],ArrowUp:[0,-3],ArrowDown:[0,3]};
    if(!steps[event.key])return;
    event.preventDefault();
    setActive(true);
    const [x,y]=steps[event.key];
    setPoint(p=>({x:Math.max(0,Math.min(100,p.x+x)),y:Math.max(0,Math.min(100,p.y+y))}));
  }
  return <div className="process-demo vector-mode">
    <div ref={area} className={`process-map ${active?'lens-active':''} ${touchExplore?'touch-exploring':''}`} tabIndex={0} role="group" aria-label="Исследуйте процесс. Перемещайте лупу указателем, пальцем или стрелками клавиатуры." onKeyDown={key} onFocus={()=>{if(!coarse||touchExplore)setActive(true)}} onBlur={()=>{if(!touchExplore)setActive(false)}} onPointerEnter={move} onPointerLeave={leave} onPointerCancel={()=>setActive(false)} onPointerMove={move} onPointerDown={e=>{if(e.pointerType==='touch'&&touchExplore)e.currentTarget.setPointerCapture(e.pointerId);move(e)}} style={{'--lx':`${point.x}%`,'--ly':`${point.y}%`}}>
      <SvgNetwork idle={!active}/>
      <div className="lens-window" aria-hidden="true">
        <div className="lens-backing"/>
        <div className="magnified-map">
          <SvgNetwork revealed/>
        </div>
      </div>
      <div className="lens-rim" aria-hidden="true"/>
    </div>
    <p className="process-caption" aria-live="polite">{active && nearest?nearest[3]:touchExplore?'Коснитесь схемы и перемещайте лупу':'Исследуйте процесс'}</p>
    <div className="touch-explore"><button type="button" aria-pressed={touchExplore} onClick={()=>{setTouchExplore(!touchExplore);setActive(!touchExplore)}}>{touchExplore?'Завершить просмотр':'Исследовать схему'}</button></div>
    <span className="sr-only">Изучение задачи, анализ данных, пользовательские сценарии, проектирование, передача в разработку, проверка, запуск и развитие.</span>
  </div>;
}
