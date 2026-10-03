import {useState} from 'react';
import {ControlButton} from '../Controls';
import {StrokeMorphIcon} from './StrokeMorphIcon';
import {arrowAngleTopRightIcon} from './icons.mjs';

export function HoverMorphAction({children,icon,variant='ghost',className='',...props}){
 const [hovered,setHovered]=useState(false);
 return <ControlButton
  {...props}
  variant={variant}
  className={className}
  iconRightNode={<StrokeMorphIcon icon={hovered?arrowAngleTopRightIcon:icon}/>}
  onPointerEnter={event=>{if(event.pointerType!=='touch')setHovered(true);props.onPointerEnter?.(event);}}
  onPointerLeave={event=>{setHovered(false);props.onPointerLeave?.(event);}}
 >{children}</ControlButton>;
}
