import {useEffect, useRef, useState} from 'react';
import './lens.css';
import './svg-lens.css';
import {SvgNetwork} from './SvgNetwork';
import {HEIGHT,WIDTH} from './network-data.mjs';
import {clientPointToSvg,svgPointToClient} from './hero-layout.mjs';
import {createCaptionController,DEFAULT_CAPTION} from './hero-caption.mjs';
import {Icon} from './Controls';
import {createFrameTask} from './runtime/frame-task.mjs';

export function SvgLens(){
  const area=useRef(null);
  const [point,setPoint]=useState({x:WIDTH*.495,y:HEIGHT*.472});
  const [lensPosition,setLensPosition]=useState({x:0,y:0});
  const [active,setActive]=useState(false);
  const [touchExplore,setTouchExplore]=useState(false);
  const [captionFrame,setCaptionFrame]=useState({current:DEFAULT_CAPTION,outgoing:null,revision:0});
  const captionCurrent=useRef(DEFAULT_CAPTION);
  const captionController=useRef(null);
  const captionTransitionTimer=useRef(null);
  const pointRef=useRef({x:WIDTH*.495,y:HEIGHT*.472});
  const activeRef=useRef(false);
  const coarseRef=useRef(false);
  const touchExploreRef=useRef(false);
  const pointerTaskRef=useRef(null);
  useEffect(()=>{
    captionController.current=createCaptionController({onChange:next=>{
      const previous=captionCurrent.current;
      if(previous.key===next.key)return;
      captionCurrent.current=next;
      clearTimeout(captionTransitionTimer.current);
      setCaptionFrame(frame=>({current:next,outgoing:previous,revision:frame.revision+1}));
      captionTransitionTimer.current=setTimeout(()=>setCaptionFrame(frame=>({...frame,outgoing:null})),300);
    }});
    return ()=>{captionController.current?.destroy();clearTimeout(captionTransitionTimer.current)};
  },[]);
  useEffect(()=>captionController.current?.update(active?point:null),[active,point.x,point.y]);
  const closingUntil=useRef(0);
  const setLensActive=next=>{activeRef.current=next;setActive(current=>current===next?current:next);};
  const setMapPoint=(svgPoint,rect)=>{pointRef.current=svgPoint;setPoint(svgPoint);setLensPosition(svgPointToClient({...svgPoint,rect,viewWidth:WIDTH,viewHeight:HEIGHT}));};
  useEffect(()=>{
    const task=createFrameTask({
      read:payload=>{
        const rect=area.current?.getBoundingClientRect();
        if(!rect)return null;
        const inside=payload.clientX>=rect.left&&payload.clientX<=rect.right&&payload.clientY>=rect.top&&payload.clientY<=rect.bottom;
        if(payload.kind==='move'&&!inside)return {kind:payload.kind,inside:false};
        const svgPoint=clientPointToSvg({clientX:payload.clientX,clientY:payload.clientY,rect,viewWidth:WIDTH,viewHeight:HEIGHT});
        return {kind:payload.kind,inside,svgPoint,rect};
      },
      write:result=>{
        if(!result)return;
        if(result.kind==='move'){
          if(!result.inside){setLensActive(false);return;}
          closingUntil.current=0;
          setLensActive(true);
        }else if(performance.now()>closingUntil.current)return;
        setMapPoint(result.svgPoint,result.rect);
      },
    });
    pointerTaskRef.current=task;
    return()=>{task.dispose();pointerTaskRef.current=null;};
  },[]);
  useEffect(()=>{
    const query=window.matchMedia('(pointer: coarse)');
    const update=()=>{coarseRef.current=query.matches;touchExploreRef.current=false;pointerTaskRef.current?.cancel();setTouchExplore(false);setLensActive(false);};
    update();query.addEventListener('change',update);
    return ()=>query.removeEventListener('change',update);
  },[]);
  function leave(event){
    if(event.pointerType==='touch')return;
    closingUntil.current=performance.now()+180;
    pointerTaskRef.current?.cancel();
    setLensActive(false);
    pointerTaskRef.current?.schedule({kind:'follow',clientX:event.clientX,clientY:event.clientY});
  }
  useEffect(()=>{
    function followOutside(event){
      if(event.pointerType==='touch' || performance.now()>closingUntil.current)return;
      pointerTaskRef.current?.schedule({kind:'follow',clientX:event.clientX,clientY:event.clientY});
    }
    window.addEventListener('pointermove',followOutside);
    return ()=>window.removeEventListener('pointermove',followOutside);
  },[]);
  function move(event){
    if(event.pointerType==='touch'&&!touchExploreRef.current)return;
    pointerTaskRef.current?.schedule({kind:'move',clientX:event.clientX,clientY:event.clientY});
  }
  function key(event){
    const steps={ArrowLeft:[-3,0],ArrowRight:[3,0],ArrowUp:[0,-3],ArrowDown:[0,3]};
    if(!steps[event.key])return;
    event.preventDefault();
    setLensActive(true);
    const [x,y]=steps[event.key];
    const previous=pointRef.current;
    const next={x:Math.max(0,Math.min(WIDTH,previous.x+x*WIDTH/100)),y:Math.max(0,Math.min(HEIGHT,previous.y+y*HEIGHT/100))};
    const rect=area.current.getBoundingClientRect();
    setMapPoint(next,rect);
  }
  return <div className="process-demo vector-mode">
    <div ref={area} className={`process-map ${active?'lens-active':''} ${touchExplore?'touch-exploring':''}`} tabIndex={0} role="group" aria-label="Исследуйте процесс. Перемещайте лупу указателем, пальцем или стрелками клавиатуры." onKeyDown={key} onFocus={()=>{if(!coarseRef.current||touchExploreRef.current)setLensActive(true)}} onBlur={()=>{if(!touchExploreRef.current){pointerTaskRef.current?.cancel();setLensActive(false)}}} onPointerEnter={move} onPointerLeave={leave} onPointerCancel={()=>{closingUntil.current=0;pointerTaskRef.current?.cancel();setLensActive(false)}} onPointerMove={move} onPointerDown={e=>{if(e.pointerType==='touch'&&touchExploreRef.current)e.currentTarget.setPointerCapture(e.pointerId);move(e)}} style={{'--lx':`${lensPosition.x}px`,'--ly':`${lensPosition.y}px`}}>
      <SvgNetwork idle={!active}/>
      <div className="lens-window" aria-hidden="true">
        <div className="lens-backing"/>
        <div className="magnified-map">
          <SvgNetwork revealed viewTransform={{...point,scale:1.55}}/>
        </div>
      </div>
      <div className="lens-rim" aria-hidden="true"/>
    </div>
    <p className="process-caption"><span className="process-caption-shell" aria-hidden="true">
      {captionFrame.outgoing&&<span key={`out:${captionFrame.revision}`} className={`process-caption-content is-outgoing ${captionFrame.outgoing.active?'is-active':''}`}><Icon name={`hero-${captionFrame.outgoing.icon}`} className="caption-icon"/><span>{captionFrame.outgoing.label}</span></span>}
      <span key={`in:${captionFrame.revision}`} className={`process-caption-content is-incoming ${captionFrame.current.active?'is-active':''}`}><Icon name={`hero-${captionFrame.current.icon}`} className="caption-icon"/><span>{captionFrame.current.label}</span></span>
    </span><span className="sr-only" aria-live="polite">{captionFrame.current.label}</span></p>
    <div className="touch-explore"><button type="button" aria-pressed={touchExplore} onClick={()=>{const next=!touchExploreRef.current;touchExploreRef.current=next;if(!next)pointerTaskRef.current?.cancel();setTouchExplore(next);setLensActive(next)}}>{touchExplore?'Завершить просмотр':'Исследовать схему'}</button></div>
    <span className="sr-only">Изучение задачи, анализ данных, пользовательские сценарии, проектирование, передача в разработку, проверка, запуск и развитие.</span>
  </div>;
}
