// Same control anatomy as portfolio ui-controls: icon / inset label / icon.
// Geometry and dark state colors refreshed from Library V.2 (62:4149, 22:479).
export function Icon({name,size=16,className=''}) {
  return <span aria-hidden="true" className={`icon ${className}`} style={{width:size,height:size,maskImage:`url("/figma/${name}.svg")`}}/>;
}
export function ControlButton({children,variant='neutral',iconLeft,iconRight,href,onClick,disabled=false,external=false,className='',...props}){
  const content=<>{iconLeft&&<Icon name={iconLeft}/>}<span className="control-label">{children}</span>{iconRight&&<Icon name={iconRight}/>}</>;
  const cls=`control ${variant} ${className}`;
  if(href&&!disabled)return <a className={cls} href={href} onClick={onClick} {...(external?{target:'_blank',rel:'noopener noreferrer'}:{})} {...props}>{content}</a>;
  return <button type="button" className={cls} disabled={disabled} onClick={onClick} {...props}>{content}</button>;
}
export function NavigationTab({children,icon,active=false,disabled=false}){
  const content=<><Icon name={icon}/><span className="control-label">{children}</span></>;
  return disabled?<button className="nav-tab" disabled>{content}</button>:<a href="#top" aria-current={active?'page':undefined} className={`nav-tab ${active?'selected':''}`}>{content}</a>;
}
