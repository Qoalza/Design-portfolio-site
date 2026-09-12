import {useId} from 'react';
import {RoutePulse} from './RoutePulse';
import {nodes,WIDTH,HEIGHT,STROKE,position,glyph,routes} from './network-data.mjs';

export function SvgNetwork({revealed=false,idle=false,viewTransform=null}){
  const id=useId();
  const edge=`${id}-edge`;
  const transform=viewTransform?`translate(${viewTransform.x} ${viewTransform.y}) scale(${viewTransform.scale}) translate(${-viewTransform.x} ${-viewTransform.y})`:undefined;
  return <svg className={`network vector-network ${revealed?'is-revealed':''}`} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs><radialGradient id={edge} cx="50%" cy="48%" r="64%"><stop offset="48%" stopColor="white"/><stop offset="100%" stopColor="black"/></radialGradient><mask id={`${id}-grid`}><rect width={WIDTH} height={HEIGHT} fill={`url(#${edge})`}/></mask></defs>
    <g transform={transform}><g className="construction" mask={`url(#${id}-grid)`} fill="none" strokeWidth=".7" strokeDasharray="5 5">
      {Array.from({length:14},(_,i)=>{const x=48+i*69;return <path key={`v${i}`} d={`M${x} ${[16,43,7,64,26][i%5]} V${HEIGHT-[37,9,62,18][i%4]}`}/>;})}
      {Array.from({length:10},(_,i)=>{const y=43+i*61;return <path key={`h${i}`} d={`M${[13,47,2,72][i%4]} ${y} H${WIDTH-[28,8,61,39,18][i%5]}`}/>;})}
      <circle cx="495" cy="314.667" r="76"/><circle cx="495" cy="314.667" r="153"/>
      <path d="M348 163 L646 465 M349 465 L646 162"/>
    </g>
    <g className="routes" fill="none" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      {routes.map((d,i)=><path key={i} d={d} vectorEffect="non-scaling-stroke"/>)}
    </g>
    {!revealed&&idle&&<RoutePulse/>}
    <g className="network-nodes" strokeWidth={STROKE} strokeLinejoin="round">
      {nodes.map(n=>{const {x,y}=position(n);const nodeSize=(revealed?60:28)*(n[4]==='diamond'?1.2:1);const shape=glyph(n[4],x,y,nodeSize);const Shape=shape.tag;const iconSize=n[2]==='launch'||n[2]==='tools'?30:34;const iconAsset=n[2]==='tools'?'code':n[2];return <g key={n[2]} data-node={n[2]} data-shape={n[4]}>
        <Shape {...shape.props} vectorEffect="non-scaling-stroke"/>
        {revealed&&<image className="node-icon" href={`/assets/${iconAsset}.svg`} x={x-iconSize/2} y={y-iconSize/2} width={iconSize} height={iconSize}/>}
      </g>;})}
    </g></g>
  </svg>;
}
