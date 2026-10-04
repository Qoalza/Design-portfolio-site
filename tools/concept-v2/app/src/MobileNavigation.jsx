import {NavigationTooltip} from './NavigationTooltip';
import {useEffect,useRef,useState} from 'react';
import {NavigationTab} from './Controls';

export function MobileNavigation(){
 const [open,setOpen]=useState(false);
 const root=useRef(null);
 const trigger=useRef(null);
 useEffect(()=>{
  if(!open)return;
  const closeOutside=event=>{if(!root.current.contains(event.target))setOpen(false)};
  const key=event=>{if(event.key==='Escape'){setOpen(false);trigger.current.focus()}};
  document.addEventListener('pointerdown',closeOutside);
  document.addEventListener('keydown',key);
  return ()=>{document.removeEventListener('pointerdown',closeOutside);document.removeEventListener('keydown',key)};
 },[open]);
 return <div ref={root} className="mobile-navigation">
  <button ref={trigger} className="mobile-menu-trigger" type="button" aria-expanded={open} aria-controls="mobile-nav-panel" onClick={()=>setOpen(!open)}>Меню</button>
  {open&&<div id="mobile-nav-panel" className="mobile-nav-panel">
   <nav aria-label="Мобильная навигация" onClick={event=>{if(event.target.closest('a'))setOpen(false)}}>
    <NavigationTab icon="imgColor" active>Главная</NavigationTab>
    <NavigationTooltip section="blog"><NavigationTab icon="imgColor1" disabled>Блог</NavigationTab></NavigationTooltip>
    <NavigationTooltip section="lab"><NavigationTab icon="imgColor1" disabled>Лаборатория</NavigationTab></NavigationTooltip>
   </nav>
   <span className="mobile-status">Открыт к предложениям</span>
  </div>}
 </div>;
}
