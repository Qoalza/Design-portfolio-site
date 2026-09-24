import {useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {ControlButton} from './Controls';
import connectorSvg from './figma/routing404-connector-full.svg?raw';
import branchSvg from './figma/routing404-git-branch-full.svg?raw';
import {routeLayers, routingAsset} from './routing-404-design.mjs';
import {pulseDuration,pulsePaths,pulseSpeed,pulseTracks} from './routing-404-pulse.mjs';
import {chooseRoutes,dropResult,fixedNodeVisual,packets,routeProgress,status} from './routing-404.mjs';
import './routing-404.css';

const slots = {
  research:{x:231,y:175.5,width:84,number:'02',label:'ИССЛЕДОВАНИЕ'},
  concept:{x:638,y:175.5,width:49,number:'04',label:'КОНЦЕПТ'},
  delivery:{x:1083,y:149,width:84,number:'06',label:'В РАЗРАБОТКУ'},
  gitBranch:{x:301,y:386.5,width:77,icon:'gitBranch',label:'ПОДКЛЮЧЕНО'},
  connector:{x:904,y:456,width:77,icon:'connector',label:'ПОДКЛЮЧЕНО'},
};
const snapSlots = Object.fromEntries(Object.entries(slots).map(([id,s])=>[id,{x:s.x+s.width/2,y:s.y+16}]));
// The initial Figma map starts 28px above the fixed final-position grid.
// Free packets keep their original screen positions while nodes and routes stay fixed.
const initialPositions = {research:{x:503,y:295.5},concept:{x:126,y:55.5},delivery:{x:1174,y:34},connector:{x:207,y:484},gitBranch:{x:1195,y:375}};
const nodes = [
  {x:30,y:175.5,width:106,id:'01',label:'ЦЕЛЬ/ПРОБЛЕМА',final:'other'},
  {x:442,y:119.5,width:79,id:'03',label:'ВАРФРЕЙМЫ',final:'active'},
  {x:901,y:175.5,width:58,id:'05.1',label:'ДИЗАЙН',final:'active'},
  {x:901,y:303.5,width:113,id:'05.2',label:'ДИЗАЙН СИСТЕМА',final:'active'},
  {x:128,y:347.5,width:100,id:'А2',label:'ПАРТНЕРЫ',final:'other'},
  {x:528,y:436.5,width:100,id:'C1',label:'БИЗНЕС',final:'active'},
  {x:1149,y:302.5,width:100,id:'Б8',label:'ПОЛЬЗОВАТЕЛИ',final:'other'},
];
const fullIcons = {connector:connectorSvg,gitBranch:branchSvg};
const iconMarkup = svg => svg.replaceAll('#E2E2EC','currentColor').replaceAll('<path ','<path vector-effect="non-scaling-stroke" ');

function Icon({type}) {return <span className="routing404-icon-frame" aria-hidden="true" dangerouslySetInnerHTML={{__html:iconMarkup(fullIcons[type])}}/>;}
function Packet({packet,free=false,wrong=false,dragging=false,onPointerDown,onKeyDown}) {
  const icon = packet.id==='connector'||packet.id==='gitBranch';
  return <button type="button" aria-label={`Пакет ${packet.label||packet.id}`} onPointerDown={onPointerDown} onKeyDown={onKeyDown}
    className={`routing404-packet ${free?'is-free':'is-placed'} ${icon?'has-icon':'has-number'} ${wrong?'is-wrong':''} ${dragging?'is-dragging':''}`}>
    <span className="routing404-packet-inner">{icon?<Icon type={packet.id}/>:<span>{packet.label}</span>}</span>
  </button>;
}
function Node({node,visual}) {
  return <div className={`routing404-node is-${visual}`} style={{left:node.x,top:node.y,width:node.width}}>
    <span className="routing404-node-marker"/>
    <span className="routing404-node-label"><strong>{node.id}</strong><span>{node.label}</span></span>
  </div>;
}
function Vector({state,layer}) {
  return <img className="routing404-route-vector" data-figma-node={layer.nodeId} src={routingAsset(state,layer.file)} alt="" draggable="false"
    style={{left:layer.x+80-(layer.assetWidth-layer.width)/2,top:layer.y-(layer.assetHeight-layer.height)/2}}/>;
}
function CompletionPulse() {
  return pulseTracks.flatMap((track,trackIndex)=>{
    let elapsed=track.start;
    return track.segments.map(([index,length,reverse])=>{
      const layer=routeLayers.final[index],duration=length/pulseSpeed*1000,delay=elapsed;
      elapsed+=duration;
      return <svg key={`${trackIndex}-${index}`} className="routing404-pulse-vector" aria-hidden="true"
        viewBox={`0 0 ${layer.assetWidth} ${layer.assetHeight}`}
        style={{left:layer.x+80-(layer.assetWidth-layer.width)/2,top:layer.y-(layer.assetHeight-layer.height)/2,
          width:layer.assetWidth,height:layer.assetHeight,
          '--pulse-delay':`${delay}ms`,'--pulse-duration':`${duration}ms`,
          '--pulse-from':reverse?-12:112,'--pulse-to':reverse?112:-12}}>
        <path d={pulsePaths[index]} pathLength="100"/>
      </svg>;
    });
  });
}
export function Routing404() {
  const mapRef=useRef(null),stageRef=useRef(null),dragRef=useRef(null),placedRef=useRef({});
  const [placed,setPlaced]=useState({}),[freePositions,setFreePositions]=useState(initialPositions);
  const [dragging,setDragging]=useState(null),[proximity,setProximity]=useState(null),[phase,setPhase]=useState('idle');
  const [hintDismissed,setHintDismissed]=useState(false);
  const progress=status(placed),launched=phase==='launched'&&progress.correct===progress.total;
  const signal=routeProgress(placed);
  const occupied=useMemo(()=>Object.fromEntries(Object.entries(placed).map(([slot,id])=>[id,slot])),[placed]);
  const vectors=chooseRoutes(placed,launched,signal);
  const hasActivity=Object.keys(placed).length>0;

  useEffect(()=>{
    if(progress.correct!==progress.total){setPhase('idle');return undefined;}
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setPhase('launched');return undefined;}
    setPhase('checking');
    const timer=window.setTimeout(()=>setPhase('launched'),pulseDuration);
    return ()=>window.clearTimeout(timer);
  },[progress.correct,progress.total]);

  const dragPosition=(event,active)=>({x:event.clientX-active.offsetX,y:event.clientY-active.offsetY,space:'viewport'});
  const nearby=position=>{const map=mapRef.current.getBoundingClientRect();return Object.entries(snapSlots)
    .map(([id,center])=>({id,distance:Math.hypot(position.x+20-map.left-center.x,position.y+20-map.top-center.y)}))
    .filter(item=>item.distance<=56).sort((a,b)=>a.distance-b.distance)[0]?.id||null;
  };
  const commitPlaced=next=>{placedRef.current=next;setPlaced(next);};
  const displacedPosition=(slot,map)=>({x:map.left+snapSlots[slot].x+28,y:map.top+snapSlots[slot].y-20,space:'viewport'});
  const start=(event,packet)=>{
    if(event.pointerType==='mouse'&&event.button!==0)return;
    const oldSlot=occupied[packet.id],button=event.currentTarget.getBoundingClientRect();
    const origin={x:button.left-(oldSlot?4:0),y:button.top-(oldSlot?4:0),space:'viewport'};
    dragRef.current={id:packet.id,pointerId:event.pointerId,offsetX:event.clientX-origin.x,offsetY:event.clientY-origin.y};
    stageRef.current.setPointerCapture(event.pointerId);
    setFreePositions(value=>({...value,[packet.id]:origin}));
    if(oldSlot){const next={...placedRef.current};delete next[oldSlot];commitPlaced(next);}
    setDragging(packet.id);
    event.preventDefault();
  };
  const move=event=>{
    const active=dragRef.current;if(!active||active.pointerId!==event.pointerId)return;
    const position=dragPosition(event,active);
    setHintDismissed(true);
    setFreePositions(value=>({...value,[active.id]:position}));
    setProximity(nearby(position));
  };
  const finish=event=>{
    const active=dragRef.current;if(!active||active.pointerId!==event.pointerId)return;
    const position=dragPosition(event,active);
    const map=mapRef.current.getBoundingClientRect();
    const result=dropResult(placedRef.current,active.id,{x:position.x+20-map.left,y:position.y+20-map.top,slots:snapSlots},56);
    commitPlaced(result.state);
    setFreePositions(value=>({...value,[active.id]:position,...(result.displaced?{[result.displaced]:displacedPosition(result.slot,map)}:{})}));
    setProximity(null);setDragging(null);dragRef.current=null;
    if(stageRef.current.hasPointerCapture(event.pointerId))stageRef.current.releasePointerCapture(event.pointerId);
  };
  const keyboard=(event,packet)=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    event.preventDefault();
    const map=mapRef.current.getBoundingClientRect();
    const center=snapSlots[packet.target];
    const result=dropResult(placedRef.current,packet.id,{...center,slots:snapSlots},0);
    commitPlaced(result.state);
    if(result.displaced)setFreePositions(value=>({...value,[result.displaced]:displacedPosition(result.slot,map)}));
  };
  const events=packet=>({onPointerDown:event=>start(event,packet),onKeyDown:event=>keyboard(event,packet)});
  const corner=launched?'final':'initial',first=launched?'imgFrame26092571':'imgFrame26086431',second=launched?'imgFrame26092572':'imgFrame26086432',third=launched?'imgFrame26092573':'imgFrame26086433';

  return <main className="routing404">
    <img className="routing404-corner corner-tl" src={routingAsset(corner,first)} alt=""/>
    <img className="routing404-corner corner-tr" src={routingAsset(corner,second)} alt=""/>
    <img className="routing404-corner corner-bl" src={routingAsset(corner,third)} alt=""/>
    <img className="routing404-corner corner-br" src={routingAsset(corner,second)} alt=""/>
    <section ref={stageRef} className={`routing404-stage ${launched?'is-launched':''} ${phase==='checking'?'is-checking':''}`} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}>
    <header className="routing404-header"><h1>{launched?'Маршрут выстроен':'Похоже, маршрут нарушен'}</h1>
      <p>{launched?<>Путь полностью собран. Это очень мне поможет, спасибо!<br/>Я обязательно разберусь, почему так произошло.</>:'Помогите мне собрать путь заново или вернитесь на главную'}</p>
      <ControlButton variant={launched?'accent':'light'} href={import.meta.env.BASE_URL} className="routing404-home">На главную</ControlButton></header>
    <div ref={mapRef} className="routing404-map" aria-label="Маршрут 404">
      <div className="routing404-number-art" aria-hidden="true">
        <span className="routing404-number-initial"><img src={routingAsset('initial','imgSubtract')} alt=""/><img src={routingAsset('initial','imgRectangle26')} alt=""/></span>
        <span className="routing404-number-final"><img src={routingAsset('final','imgSubtract')} alt=""/><img src={routingAsset('final','imgRectangle26')} alt=""/></span>
      </div>
      <div className="routing404-routes" aria-hidden="true">
        {vectors.map(({state,layer})=><Vector key={`${layer.nodeId}-${state}`} state={state} layer={layer}/>)}
        {phase==='checking'&&<CompletionPulse/>}
      </div>
      {nodes.map(node=><Node key={node.id} node={node} visual={launched?node.final:fixedNodeVisual(node,signal,vectors)}/>)}
      {Object.entries(slots).map(([slotId,slot])=>{
        const packet=packets.find(item=>item.id===placed[slotId]),wrong=Boolean(packet&&packet.target!==slotId);
        return <div key={slotId} className={`routing404-slot ${slot.icon?'has-icon':'has-number'} ${packet?'is-occupied':'is-empty'} ${wrong?'is-wrong':''} ${proximity===slotId?'is-proximity':''}`} style={{left:slot.x,top:slot.y,width:slot.width}}>
          {wrong&&<span className="routing404-error-lead">СМЕНИТЕ ЯЧЕЙКУ</span>}
          {packet?<Packet packet={packet} wrong={wrong} {...events(packet)}/>:<span className="routing404-empty-packet">
            {slot.icon?<><svg className="routing404-empty-outline" viewBox="0 0 33 33" aria-hidden="true"><path d="M0.5 8.5C0.5 4.08172 4.08172 0.5 8.5 0.5H24.5C28.9183 0.5 32.5 4.08172 32.5 8.5V24.5C32.5 28.9183 28.9183 32.5 24.5 32.5H8.5C4.08172 32.5 0.5 28.9183 0.5 24.5V8.5Z"/></svg><Icon type={slot.icon}/></>:<span>{slot.number}</span>}
          </span>}
          <span className="routing404-slot-label">{wrong?<>НЕПОДХОДЯЩИЙ<br/>ПАКЕТ</>:packet?slot.label:slot.icon?<>НЕТ<br/>ПОДКЛЮЧЕНИЯ</>:'НЕТ СВЯЗИ'}</span>
        </div>;
      })}
      {!hasActivity&&!hintDismissed&&<><p className="routing404-hint">Перетащите пакет<br/>в свободный узел</p><img className="routing404-arrow" src={routingAsset('initial','imgVector50')} alt=""/></>}
      {packets.filter(packet=>!occupied[packet.id]&&!freePositions[packet.id].space).map(packet=><div key={packet.id} className="routing404-free-packet" style={{left:freePositions[packet.id].x,top:freePositions[packet.id].y}}><Packet packet={packet} free dragging={dragging===packet.id} {...events(packet)}/></div>)}
    </div>
    <div className="routing404-live" aria-live="polite">{launched?'Маршрут выстроен':`Собрано ${progress.correct} из ${progress.total}`}</div>
    </section>
    {packets.filter(packet=>!occupied[packet.id]&&freePositions[packet.id].space==='viewport').map(packet=>createPortal(<div key={packet.id} className="routing404-viewport-packet" style={{left:freePositions[packet.id].x,top:freePositions[packet.id].y}}><Packet packet={packet} free dragging={dragging===packet.id} {...events(packet)}/></div>,document.body))}
  </main>;
}
