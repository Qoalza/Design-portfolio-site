import {motion} from 'motion/react';
import {inlineIconSvg} from './icon-vectors';

const MotionAnchor=motion.a;
const MotionButton=motion.button;

// The frame owns layout; the exported Figma SVG remains a real vector child.
export function Icon({name,size=16,className=''}) {
  const svg=inlineIconSvg(name);
  return <span aria-hidden="true" className={`icon ${className}`} data-icon={name} style={{width:size,height:size}} {...(svg?{dangerouslySetInnerHTML:svg}:{})}/>;
}
export function ControlButton({children,variant='neutral',iconLeft,iconRight,iconLeftNode,iconRightNode,iconOnly=false,href,onClick,disabled=false,external=false,motionLayout=false,layoutTransition,className='',...props}){
  const content=<>{iconLeftNode??(iconLeft&&<Icon name={iconLeft}/>)} {!iconOnly&&<span className="control-label">{children}</span>} {iconRightNode??(iconRight&&<Icon name={iconRight}/>)}</>;
  const cls=`control ${variant} ${className}`;
  const layoutProps=motionLayout?{layout:motionLayout,transition:layoutTransition}:{};
  if(href&&!disabled){
    const Anchor=motionLayout?MotionAnchor:'a';
    return <Anchor className={cls} href={href} onClick={onClick} {...layoutProps} {...(external?{target:'_blank',rel:'noopener noreferrer'}:{})} {...props}>{content}</Anchor>;
  }
  const Button=motionLayout?MotionButton:'button';
  return <Button type="button" className={cls} disabled={disabled} onClick={onClick} {...layoutProps} {...props}>{content}</Button>;
}
export function NavigationTab({children,icon,active=false,disabled=false}){
  const content=<><Icon name={icon}/><span className="control-label">{children}</span></>;
  return disabled?<button className="nav-tab" disabled>{content}</button>:<a href="#top" aria-current={active?'page':undefined} className={`nav-tab ${active?'selected':''}`}>{content}</a>;
}
