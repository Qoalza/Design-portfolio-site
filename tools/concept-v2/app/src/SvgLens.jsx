import {useEffect, useRef, useState} from 'react';
import './lens.css';
import './svg-lens.css';
import {SvgNetwork} from './SvgNetwork';
import {HEIGHT,WIDTH} from './network-data.mjs';
import {captionForPoint,clientPointToSvg,svgPointToClient} from './hero-layout.mjs';

export function SvgLens(){
  const area=useRef(null);
  const [point,setPoint]=useState({x:WIDTH*.495,y:HEIGHT*.472});
  const [lensPosition,setLensPosition]=useState({x:0,y:0});
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
  function updatePoint(clientX,clientY){
    const rect=area.current.getBoundingClientRect();
    const svgPoint=clientPointToSvg({clientX,clientY,rect,viewWidth:WIDTH,viewHeight:HEIGHT});
    setPoint(svgPoint);
    setLensPosition(svgPointToClient({...svgPoint,rect,viewWidth:WIDTH,viewHeight:HEIGHT}));
  }
  function leave(event){
    if(event.pointerType==='touch')return;
    closingUntil.current=performance.now()+180;
    updatePoint(event.clientX,event.clientY);
    setActive(false);
  }
  useEffect(()=>{
    function followOutside(event){
      if(event.pointerType==='touch' || performance.now()>closingUntil.current)return;
      updatePoint(event.clientX,event.clientY);
    }
    window.addEventListener('pointermove',followOutside);
    return ()=>window.removeEventListener('pointermove',followOutside);
  },[]);
  const caption=captionForPoint(active?point:null);
  function move(event){
    if(event.pointerType==='touch'&&!touchExplore)return;
    const rect=area.current.getBoundingClientRect();
    const inside=event.clientX>=rect.left && event.clientX<=rect.right && event.clientY>=rect.top && event.clientY<=rect.bottom;
    setActive(inside);
    if(!inside)return;
    closingUntil.current=0;
    updatePoint(event.clientX,event.clientY);
  }
  function key(event){
    const steps={ArrowLeft:[-3,0],ArrowRight:[3,0],ArrowUp:[0,-3],ArrowDown:[0,3]};
    if(!steps[event.key])return;
    event.preventDefault();
    setActive(true);
    const [x,y]=steps[event.key];
    setPoint(p=>{
      const next={x:Math.max(0,Math.min(WIDTH,p.x+x*WIDTH/100)),y:Math.max(0,Math.min(HEIGHT,p.y+y*HEIGHT/100))};
      const rect=area.current.getBoundingClientRect();
      setLensPosition(svgPointToClient({...next,rect,viewWidth:WIDTH,viewHeight:HEIGHT}));
      return next;
    });
  }
  return <div className="process-demo vector-mode">
    <div ref={area} className={`process-map ${active?'lens-active':''} ${touchExplore?'touch-exploring':''}`} tabIndex={0} role="group" aria-label="Исследуйте процесс. Перемещайте лупу указателем, пальцем или стрелками клавиатуры." onKeyDown={key} onFocus={()=>{if(!coarse||touchExplore)setActive(true)}} onBlur={()=>{if(!touchExplore)setActive(false)}} onPointerEnter={move} onPointerLeave={leave} onPointerCancel={()=>setActive(false)} onPointerMove={move} onPointerDown={e=>{if(e.pointerType==='touch'&&touchExplore)e.currentTarget.setPointerCapture(e.pointerId);move(e)}} style={{'--lx':`${lensPosition.x}px`,'--ly':`${lensPosition.y}px`}}>
      <SvgNetwork idle={!active}/>
      <div className="lens-window" aria-hidden="true">
        <div className="lens-backing"/>
        <div className="magnified-map">
          <SvgNetwork revealed viewTransform={{...point,scale:1.55}}/>
        </div>
      </div>
      <div className="lens-rim" aria-hidden="true"/>
    </div>
    <p className="process-caption" aria-live="polite"><span key={`${caption.icon}:${caption.label}`} className={`process-caption-content ${caption.active?'is-active':''}`}><i className={`caption-icon caption-icon-${caption.icon}`} aria-hidden="true"/><span>{caption.label}</span></span></p>
    <div className="touch-explore"><button type="button" aria-pressed={touchExplore} onClick={()=>{setTouchExplore(!touchExplore);setActive(!touchExplore)}}>{touchExplore?'Завершить просмотр':'Исследовать схему'}</button></div>
    <span className="sr-only">Изучение задачи, анализ данных, пользовательские сценарии, проектирование, передача в разработку, проверка, запуск и развитие.</span>
  </div>;
}
