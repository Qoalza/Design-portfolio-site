import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
import {carouselDotItems} from './raster-carousel.mjs';
import styles from './ProjectRasterHero.module.css';
const SPRING={type:'spring',stiffness:260,damping:34,mass:1};

export function RasterDots({slides,contextId,step,activeIndex,onSelect,compact=false}){
 const reduceMotion=useReducedMotion(),spacing=compact?32:19,count=Math.min(slides.length,5);
 return <div data-raster-dots className={styles.dots} aria-label="Экраны" style={{width:compact?count*32:10+(count-1)*19}}>
  <AnimatePresence initial={false}>{carouselDotItems(slides,step).map(({key,index,slot,visible,compact:small})=>{
   const active=index===activeIndex;
   return <motion.button key={contextId+':'+key} type="button" className={styles.dot}
    style={{...(compact?{top:0,left:'calc(50% - 16px)',width:32,height:36}:{}),pointerEvents:visible?'auto':'none'}}
    initial={false} animate={{x:slot*spacing,opacity:visible?1:0}} exit={{opacity:0}}
    transition={reduceMotion?{duration:0}:{...SPRING,opacity:{duration:.18}}}
    aria-hidden={visible?undefined:true} tabIndex={visible?undefined:-1} aria-current={active&&visible?'true':undefined}
    aria-label={'Показать: '+slides[index].title} onClick={()=>onSelect(index)}>
    <motion.span className={styles.dotMark} initial={false}
     animate={{scale:active?1:small?.5:.75,backgroundColor:active?'#43a2ee':'#3d4347'}}
     transition={reduceMotion?{duration:0}:{duration:.22}}/>
   </motion.button>;
  })}</AnimatePresence>
 </div>;
}
