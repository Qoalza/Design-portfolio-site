import './controls.css';

export function V2Icon({name,size=16,className='',mode='default'}) {
  if(mode==='color')return <img aria-hidden="true" className={`v2-icon v2-icon-color ${className}`} src={`/figma/${name}.svg`} width={size} height={size} alt=""/>;
  return <span aria-hidden="true" className={`v2-icon ${className}`} style={{width:size,height:size,maskImage:`url("/figma/${name}.svg")`}}/>;
}

export function V2Button({children,variant='neutral',iconLeft,iconRight,iconLeftMode='default',iconRightMode='default',iconOnly=false,href,onClick,disabled=false,external=false,className='',...props}){
  const content=<>{iconLeft&&<V2Icon name={iconLeft} mode={iconLeftMode}/>}{iconOnly?null:<span className="v2-control-label">{children}</span>}{iconRight&&<V2Icon name={iconRight} mode={iconRightMode}/>}</>;
  const cls=`v2-control v2-control-${variant} ${className}`;
  if(href&&!disabled)return <a className={cls} href={href} onClick={onClick} {...(external?{target:'_blank',rel:'noopener noreferrer'}:{})} {...props}>{content}</a>;
  return <button type="button" className={cls} disabled={disabled} onClick={onClick} {...props}>{content}</button>;
}

export function V2NavigationTab({children,icon,active=false,disabled=false}){
  const content=<><V2Icon name={icon}/><span className="v2-control-label">{children}</span></>;
  return disabled?<button className="v2-nav-tab" disabled>{content}</button>:<a href="#top" aria-current={active?'page':undefined} className={`v2-nav-tab ${active?'is-active':''}`}>{content}</a>;
}
