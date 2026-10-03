import {useRef, useState} from 'react';
import {AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform} from 'motion/react';
import {ControlButton} from '../Controls.jsx';
import {GridPattern} from '../GridPattern.jsx';
import {ScenarioTab} from '../v2/HeroTabs.jsx';
import {carouselCards, carouselDotItems, nearestCarouselStep, wrapSlideIndex} from './raster-carousel.mjs';
import shellStyles from './ProjectResponsiveHero.module.css';
import styles from './ProjectRasterHero.module.css';

const SIDE_SCALE = 640 / 940;
const SPRING = {type: 'spring', stiffness: 260, damping: 34, mass: 1};

function slotVisual(slot) {
  const distance = Math.abs(slot);
  return {
    x: slot === 0 ? 0 : Math.sign(slot) * (distance === 1 ? 320 : 650),
    y: slot === 0 ? 0 : -20,
    scale: distance === 0 ? 1 : distance === 1 ? SIDE_SCALE : .5,
    opacity: distance <= 1 ? 1 : 0,
  };
}

function RasterCard({card, reduceMotion, onSelect}) {
  const {slide, slot} = card;
  const x = useMotionValue(slotVisual(slot).x);
  const layer = useTransform(x, value => Math.abs(value) < 160 ? 3 : Math.abs(value) < 480 ? 1 : 0);
  const leftShade = useTransform(x, value => Math.max(0, Math.min(1, -value / 320)));
  const rightShade = useTransform(x, value => Math.max(0, Math.min(1, value / 320)));
  return (
    <motion.div
      className={styles.card}
      data-slot={slot}
      data-slide-id={slide.id}
      initial={{...slotVisual(slot), opacity: 0}}
      animate={slotVisual(slot)}
      exit={{opacity: 0}}
      transition={reduceMotion ? {duration: 0} : {...SPRING, opacity: {duration: .22}}}
      style={{x, zIndex: layer}}
    >
      <img src={slide.src} width="1880" height="1358" alt={slot === 0 ? slide.title : ''} draggable={false} decoding="async" />
      <motion.span className={`${styles.cardShade} ${styles.cardShadeLeft}`} aria-hidden="true" style={{opacity: leftShade}} />
      <motion.span className={`${styles.cardShade} ${styles.cardShadeRight}`} aria-hidden="true" style={{opacity: rightShade}} />
      {Math.abs(slot) === 1 ? <button type="button" className={styles.sideHitArea} onClick={() => onSelect(slot)} aria-label={`Показать: ${slide.title}`} /> : null}
    </motion.div>
  );
}

export function ProjectRasterHero({definition}) {
  const firstContext = definition.contexts.find(context => context.id === definition.initialContextId) ?? definition.contexts[0];
  const [contextId, setContextId] = useState(firstContext.id);
  const context = definition.contexts.find(item => item.id === contextId) ?? firstContext;
  const slides = context.slides;
  const initialStep = Math.max(0, slides.findIndex(slide => slide.id === context.initialSlideId));
  const [step, setStep] = useState(initialStep);
  const activeIndex = wrapSlideIndex(step, slides.length);
  const activeSlide = slides[activeIndex];
  const dotItems = carouselDotItems(slides, step);
  const reduceMotion = useReducedMotion();
  const swipeStart = useRef(null);
  const swipeConsumed = useRef(false);

  function selectContext(nextContext) {
    if (!nextContext.slides.length || nextContext.id === contextId) return;
    setContextId(nextContext.id);
    setStep(Math.max(0, nextContext.slides.findIndex(slide => slide.id === nextContext.initialSlideId)));
  }

  function selectSlide(index) {
    setStep(current => nearestCarouselStep(current, index, slides.length));
  }

  function move(direction) {
    if (slides.length > 1) setStep(current => current + direction);
  }

  function finishSwipe(event) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || start.pointerId !== event.pointerId) return;
    const distance = event.clientX - start.x;
    if (Math.abs(distance) >= 60) {
      swipeConsumed.current = true;
      move(distance < 0 ? 1 : -1);
      window.setTimeout(() => {swipeConsumed.current = false;}, 0);
    }
  }

  function selectSide(direction) {
    if (!swipeConsumed.current) move(direction);
  }

  return (
    <section className={`${shellStyles.heroWorkspace} ${styles.hero}`} aria-label={`${definition.projectName}: просмотр экранов`} data-figma-node="4276:794436">
      <GridPattern />
      <div className={`${shellStyles.heroInner} ${styles.inner}`}>
        <div className={styles.heading}>
          <div className={styles.contextTabs} aria-label="Устройство">
            {definition.contexts.map(item => <ScenarioTab key={item.id} icon={item.icon} label={item.label} active={item.id === contextId} disabled={!item.slides.length} onClick={() => selectContext(item)} />)}
          </div>
          <p className={styles.slideTitle} aria-live="polite">{activeSlide?.title}</p>
        </div>

        <div
          className={styles.carousel}
          aria-label="Экраны проекта"
          onPointerDown={event => {if (event.button === 0) swipeStart.current = {pointerId: event.pointerId, x: event.clientX};}}
          onPointerUp={finishSwipe}
          onPointerCancel={() => {swipeStart.current = null;}}
        >
          <AnimatePresence initial={false}>
            {carouselCards(slides, step).map(card => <RasterCard key={`${context.id}:${card.key}`} card={card} reduceMotion={reduceMotion} onSelect={selectSide} />)}
          </AnimatePresence>
        </div>

        {slides.length > 1 ? <div className={styles.controls} aria-label="Переключить экран">
          <ControlButton variant="ghost" iconLeft="about-chevron-left" iconOnly className={styles.arrow} onClick={() => move(-1)} aria-label="Предыдущий экран" />
          <div className={styles.dots} aria-label="Экраны" style={{width: `${10 + (Math.min(slides.length, 5) - 1) * 19}px`}}>
            <AnimatePresence initial={false}>
              {dotItems.map(({key, index, slot, visible, compact}) => {
                const slide = slides[index];
                const active = index === activeIndex;
                return <motion.button
                  key={`${context.id}:${key}`}
                  type="button"
                  className={styles.dot}
                  initial={false}
                  animate={{x: slot * 19, opacity: visible ? 1 : 0}}
                  exit={{opacity: 0}}
                  transition={reduceMotion ? {duration: 0} : {...SPRING, opacity: {duration: .18}}}
                  aria-hidden={visible ? undefined : true}
                  tabIndex={visible ? undefined : -1}
                  aria-current={active && visible ? 'true' : undefined}
                  aria-label={`Показать: ${slide.title}`}
                  onClick={() => selectSlide(index)}
                >
                  <motion.span
                    className={styles.dotMark}
                    initial={false}
                    animate={{scale: active ? 1 : compact ? .5 : .75, backgroundColor: active ? '#43a2ee' : '#3d4347'}}
                    transition={reduceMotion ? {duration: 0} : {duration: .22}}
                  />
                </motion.button>;
              })}
            </AnimatePresence>
          </div>
          <ControlButton variant="ghost" iconRight="about-chevron-right" iconOnly className={styles.arrow} onClick={() => move(1)} aria-label="Следующий экран" />
        </div> : null}
      </div>
    </section>
  );
}
