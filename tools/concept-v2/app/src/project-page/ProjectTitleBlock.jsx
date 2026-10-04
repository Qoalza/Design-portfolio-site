import {useEffect,useRef,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {ControlButton} from '../Controls';
import {HoverMorphAction} from '../morph-icon/HoverMorphAction';
import {StrokeMorphIcon} from '../morph-icon/StrokeMorphIcon';
import {checkMorphIcon,figmaIcon,link02Icon} from '../morph-icon/icons.mjs';
import {restartFeedbackTimer} from '../morph-icon/copy-feedback.mjs';
import styles from './ProjectTitleBlock.module.css';

const actionLayout={layout:{type:'spring',stiffness:420,damping:38,mass:.8}};

// Both exact Figma instances share this layout; only project content changes.
export function ProjectTitleBlock({name,logo,status,tags,description,figmaHref}){
 const [copied,setCopied]=useState(false);
 const timer=useRef(null);
 const reducedMotion=useReducedMotion();
 const transition=reducedMotion?{layout:{duration:0}}:actionLayout;
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 async function copyLink(){
  try{
   await navigator.clipboard.writeText(window.location.href);
   setCopied(true);
   timer.current=restartFeedbackTimer(timer.current,setTimeout,clearTimeout,()=>{
    timer.current=null;
    setCopied(false);
   });
  }catch{
   clearTimeout(timer.current);
   timer.current=null;
   setCopied(false);
  }
 }
 return <section className={styles.intro} data-first-view>
  <div className={styles.workArea}>
   <div className={styles.tags}>{tags.map((tag,index)=><span className={styles.tag} key={tag}>{index>0&&<i aria-hidden="true"/>}<span>{tag}</span></span>)}<b aria-hidden="true"/><span className={styles.year}>2026</span></div>
   <div className={styles.heading}>
    <div className={styles.identity}>
     <div className={styles.name}>{logo}<div className={styles.nameLabel}><h1>{name}</h1><span className={styles.status}>{status}</span></div></div>
     <p>{description}</p>
    </div>
    <motion.div layout layoutDependency={copied} transition={transition} className={styles.actions}>
     <ControlButton variant="ghost" className={`${styles.button} ${styles.copyButton}`} motionLayout layoutTransition={transition} onClick={copyLink} aria-live="polite" iconRightNode={<StrokeMorphIcon icon={copied?checkMorphIcon:link02Icon}/>}>{copied?'Скопировано':'Копировать ссылку'}</ControlButton>
     <HoverMorphAction variant="neutral" className={`${styles.button} ${styles.figmaButton}`} motionLayout="position" layoutTransition={transition} icon={figmaIcon} href={figmaHref} disabled={!figmaHref} external>Figma</HoverMorphAction>
    </motion.div>
   </div>
  </div>
 </section>;
}
