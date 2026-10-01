import {MorphIcon} from 'morphicons/react';
import './stroke-morph-icon.css';

export function StrokeMorphIcon({icon,size=16,spring='smooth',className=''}){
 return <span aria-hidden="true" className={`strokeMorphIcon ${className}`} style={{width:size,height:size}}>
  <MorphIcon
   icon={icon}
   size={size}
   strokeWidth={1.3}
   spring={spring}
   reducedMotion="user"
   strokeLinecap="butt"
   strokeLinejoin="round"
  />
 </span>;
}
