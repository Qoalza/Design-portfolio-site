import {Fragment, useRef, useState} from 'react';
import {AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform} from 'motion/react';
import {ControlButton} from '../Controls.jsx';
import {GridPattern} from '../GridPattern.jsx';
import {Tooltip} from '../Tooltip.jsx';
import {ScenarioTab} from '../v2/HeroTabs.jsx';
import {carouselCardLayer, carouselCards, carouselClipPath, carouselDotItems, carouselIncomingClip, carouselOutgoingClip, carouselShadeStops, carouselSlotVisual, nearestCarouselStep, nextCarouselStep, wrapSlideIndex} from './raster-carousel.mjs';
import shellStyles from './ProjectResponsiveHero.module.css';
import styles from './ProjectRasterHero.module.css';

const SPRING = {type: 'spring', stiffness: 260, damping: 34, mass: 1};
const UNAVAILABLE_ADAPTIVE_DESCRIPTIONS = {
  tablet: 'Для этой работы не предусмотрена планшетная версия',
  mobile: 'Для этой работы не предусмотрена мобильная версия',
};

function RasterCard({card, showFive, departing, reduceMotion, onSelect, onCenterSettled}) {
  const {slide, slot} = card;
  const x = useMotionValue(carouselSlotVisual(slot, showFive).x);
  const outgoingClip = useTransform(x, value => carouselClipPath(carouselOutgoingClip(value, showFive)));
  const incomingClip = useTransform(x, value => carouselClipPath(carouselIncomingClip(value, showFive)));
  const shadeDistance = showFive ? 260 : 320;
  const leftShade = useTransform(x, value => Math.pow(Math.max(0, Math.min(1, -value / shadeDistance)), 6));
  const rightShade = useTransform(x, value => Math.pow(Math.max(0, Math.min(1, value / shadeDistance)), 6));
  const shadeStart = useTransform(x, value => `${carouselShadeStops(value).start}px`);
  const shadeEnd = useTransform(x, value => `${carouselShadeStops(value).end}px`);
  const shadeStops = showFive ? {'--shade-start': shadeStart, '--shade-end': shadeEnd} : {};
  return (
    <motion.div
      className={`${styles.card} ${showFive ? styles.cardFive : ''}`}
      data-slot={slot}
      data-slide-id={slide.id}
      initial={{...carouselSlotVisual(slot, showFive), opacity: 0}}
      animate={carouselSlotVisual(slot, showFive)}
      exit={showFive && Math.abs(slot) === 2 ? carouselSlotVisual(Math.sign(slot) * 3, true) : {opacity: 0}}
      onAnimationComplete={slot === 0 ? onCenterSettled : undefined}
      transition={reduceMotion ? {duration: 0} : {...SPRING, opacity: {duration: .22}}}
      style={{x, zIndex: carouselCardLayer(slot, showFive, departing), clipPath: departing ? outgoingClip : slot === 0 ? incomingClip : undefined}}
    >
      <img src={slide.src} width="1880" height="1358" alt={slot === 0 ? slide.title : ''} draggable={false} decoding="async" />
      <motion.span className={`${styles.cardShade} ${styles.cardShadeLeft}`} aria-hidden="true" style={{opacity: leftShade, ...shadeStops}} />
      <motion.span className={`${styles.cardShade} ${styles.cardShadeRight}`} aria-hidden="true" style={{opacity: rightShade, ...shadeStops}} />
      {slot !== 0 && Math.abs(slot) <= (showFive ? 2 : 1) ? <button type="button" className={styles.sideHitArea} onClick={() => onSelect(slot)} aria-label={`Показать: ${slide.title}`} /> : null}
    </motion.div>
  );
}

export function ProjectRasterHero({definition}) {
  const firstContext = definition.contexts.find(context => context.id === definition.initialContextId) ?? definition.contexts[0];
  const [contextId, setContextId] = useState(firstContext.id);
  const context = definition.contexts.find(item => item.id === contextId) ?? firstContext;
  const slides = context.slides;
  const showFive = slides.length >= 5;
  const initialStep = Math.max(0, slides.findIndex(slide => slide.id === context.initialSlideId));
  const [step, setStep] = useState(initialStep);
  const stepRef = useRef(initialStep);
  const targetStepRef = useRef(initialStep);
  const movingRef = useRef(false);
  const departingKeyRef = useRef(null);
  const activeIndex = wrapSlideIndex(step, slides.length);
  const activeSlide = slides[activeIndex];
  const dotItems = carouselDotItems(slides, step);
  const reduceMotion = useReducedMotion();
  const swipeStart = useRef(null);
  const swipeConsumed = useRef(false);

  function selectContext(nextContext) {
    if (!nextContext.slides.length || nextContext.id === contextId) return;
    const nextStep = Math.max(0, nextContext.slides.findIndex(slide => slide.id === nextContext.initialSlideId));
    stepRef.current = nextStep;
    targetStepRef.current = nextStep;
    movingRef.current = false;
    departingKeyRef.current = null;
    setContextId(nextContext.id);
    setStep(nextStep);
  }

  function advance() {
    if (movingRef.current || stepRef.current === targetStepRef.current) return;
    movingRef.current = true;
    departingKeyRef.current = carouselCards(slides, stepRef.current).find(card => card.slot === 0)?.key;
    const next = nextCarouselStep(stepRef.current, targetStepRef.current);
    stepRef.current = next;
    setStep(next);
  }

  function navigateTo(target) {
    targetStepRef.current = target;
    if (reduceMotion) {
      movingRef.current = false;
      departingKeyRef.current = null;
      stepRef.current = target;
      setStep(target);
    } else advance();
  }

  function selectSlide(index) {
    navigateTo(nearestCarouselStep(targetStepRef.current, index, slides.length));
  }

  function move(direction) {
    if (slides.length > 1) navigateTo(targetStepRef.current + direction);
  }

  function centerSettled() {
    if (!movingRef.current) return;
    movingRef.current = false;
    advance();
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
            {definition.contexts.map(item => {
              const unavailableDescription = !item.slides.length && UNAVAILABLE_ADAPTIVE_DESCRIPTIONS[item.id];
              const tab = <ScenarioTab icon={item.icon} label={item.label} active={item.id === contextId} disabled={!item.slides.length} className={unavailableDescription ? styles.unavailableTab : ''} onClick={() => selectContext(item)} />;
              return <Fragment key={item.id}>
                {unavailableDescription ? <Tooltip content={{title: `${item.label} – недоступен`, description: unavailableDescription}}>{tab}</Tooltip> : tab}
              </Fragment>;
            })}
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
            {carouselCards(slides, step).map(card => <RasterCard key={`${context.id}:${card.key}`} card={card} showFive={showFive} departing={card.key === departingKeyRef.current} reduceMotion={reduceMotion} onSelect={selectSide} onCenterSettled={centerSettled} />)}
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
