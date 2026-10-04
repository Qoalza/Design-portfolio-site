import {createContext, Fragment, useContext, useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import {StackedCarousel} from 'react-stacked-center-carousel';
import {ControlButton} from '../Controls.jsx';
import {GridPattern} from '../GridPattern.jsx';
import {Tooltip} from '../Tooltip.jsx';
import {ScenarioTab} from '../v2/HeroTabs.jsx';
import {carouselDotItems, nearestCarouselStep, wrapSlideIndex} from './raster-carousel.mjs';
import shellStyles from './ProjectResponsiveHero.module.css';
import styles from './ProjectRasterHero.module.css';

const SPRING = {type: 'spring', stiffness: 260, damping: 34, mass: 1};
const CARD_WIDTH = 940;
const CAROUSEL_WIDTH = 1280;
const CAROUSEL_HEIGHT = 928;
const CAROUSEL_DURATION = 450;
const SCALES_ONE = [1, .5];
const SCALES_THREE = [1, 640 / CARD_WIDTH, .5];
const SCALES_FIVE = [1, 640 / CARD_WIDTH, .55, .45];
const CAROUSEL_TRANSITION = `transform ${CAROUSEL_DURATION}ms ease, opacity ${CAROUSEL_DURATION}ms ease, z-index ${CAROUSEL_DURATION}ms linear`;
const CAROUSEL_STEP_INTERVAL = CAROUSEL_DURATION + 20;
const RasterNavigationContext = createContext(null);
const UNAVAILABLE_ADAPTIVE_DESCRIPTIONS = {
  tablet: 'Для этой работы не предусмотрена планшетная версия',
  mobile: 'Для этой работы не предусмотрена мобильная версия',
};

function RasterCard({data, dataIndex, slideIndex}) {
  const slide = data[dataIndex];
  const distance = Math.abs(slideIndex);
  const navigate = useContext(RasterNavigationContext);
  return (
    <div
      className={`${styles.card} ${distance === 1 ? styles.cardNear : ''} ${distance >= 2 ? styles.cardFar : ''}`}
      data-slot={slideIndex}
      data-slide-id={slide.id}
    >
      <img src={slide.src} width="4096" height="2958" alt={slideIndex === 0 ? slide.title : ''} draggable={false} decoding="async" />
      <span className={`${styles.cardShade} ${styles.cardShadeLeft} ${slideIndex < 0 ? styles.cardShadeVisible : ''}`} aria-hidden="true" />
      <span className={`${styles.cardShade} ${styles.cardShadeRight} ${slideIndex > 0 ? styles.cardShadeVisible : ''}`} aria-hidden="true" />
      {slideIndex !== 0 && distance <= 2 ? <button type="button" className={styles.sideHitArea} onClick={() => navigate(slideIndex)} aria-label={`Показать: ${slide.title}`} /> : null}
    </div>
  );
}

export function ProjectRasterHero({definition}) {
  const firstContext = definition.contexts.find(context => context.id === definition.initialContextId) ?? definition.contexts[0];
  const [contextId, setContextId] = useState(firstContext.id);
  const context = definition.contexts.find(item => item.id === contextId) ?? firstContext;
  const slides = context.slides;
  const initialStep = Math.max(0, slides.findIndex(slide => slide.id === context.initialSlideId));
  const [step, setStep] = useState(initialStep);
  const stepRef = useRef(initialStep);
  const carouselRef = useRef(null);
  const queuedStepTimerRef = useRef(null);
  const queuedDirectionRef = useRef(0);
  const queuedExpectedStepRef = useRef(null);
  const orderedSlides = [...slides.slice(initialStep), ...slides.slice(0, initialStep)];
  const visibleCount = Math.min(slides.length, 5);
  const activeIndex = wrapSlideIndex(step, slides.length);
  const activeSlide = slides[activeIndex];
  const dotItems = carouselDotItems(slides, step);
  const reduceMotion = useReducedMotion();

  useEffect(() => () => {
    clearTimeout(queuedStepTimerRef.current);
  }, []);

  function cancelQueuedSteps() {
    clearTimeout(queuedStepTimerRef.current);
    queuedStepTimerRef.current = null;
    queuedDirectionRef.current = 0;
    queuedExpectedStepRef.current = null;
  }

  function moveBy(steps) {
    if (!steps || slides.length < 2) return;
    cancelQueuedSteps();
    if (reduceMotion || Math.abs(steps) === 1) {
      carouselRef.current?.swipeTo(steps);
      return;
    }
    const direction = Math.sign(steps);
    let remaining = Math.abs(steps);
    queuedDirectionRef.current = direction;
    const advance = () => {
      queuedExpectedStepRef.current = stepRef.current + direction;
      carouselRef.current?.swipeTo(direction);
      remaining -= 1;
      if (remaining) queuedStepTimerRef.current = setTimeout(advance, CAROUSEL_STEP_INTERVAL);
      else queuedDirectionRef.current = 0;
    };
    advance();
  }

  function selectContext(nextContext) {
    if (!nextContext.slides.length || nextContext.id === contextId) return;
    cancelQueuedSteps();
    const nextStep = Math.max(0, nextContext.slides.findIndex(slide => slide.id === nextContext.initialSlideId));
    stepRef.current = nextStep;
    setContextId(nextContext.id);
    setStep(nextStep);
  }

  function centerChanged(orderedIndex) {
    const index = wrapSlideIndex(initialStep + orderedIndex, slides.length);
    const nextStep = nearestCarouselStep(stepRef.current, index, slides.length);
    if (nextStep === stepRef.current) return;
    if (queuedDirectionRef.current && nextStep !== queuedExpectedStepRef.current) cancelQueuedSteps();
    stepRef.current = nextStep;
    setStep(nextStep);
  }

  function selectSlide(index) {
    const target = nearestCarouselStep(stepRef.current, index, slides.length);
    moveBy(target - stepRef.current);
  }

  function move(direction) {
    moveBy(direction);
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

        <div className={`${styles.carousel} ${reduceMotion ? styles.reducedMotion : ''}`} aria-label="Экраны проекта">
          <RasterNavigationContext.Provider value={moveBy}>
            <StackedCarousel
            key={context.id}
            ref={carouselRef}
            data={orderedSlides}
            slideComponent={RasterCard}
            carouselWidth={CAROUSEL_WIDTH}
            slideWidth={CARD_WIDTH}
            height={CAROUSEL_HEIGHT}
            maxVisibleSlide={visibleCount}
            customScales={visibleCount === 1 ? SCALES_ONE : visibleCount === 3 ? SCALES_THREE : SCALES_FIVE}
            fadeDistance={0}
            transitionTime={reduceMotion ? 0 : CAROUSEL_DURATION}
            customTransition={reduceMotion ? undefined : CAROUSEL_TRANSITION}
            onActiveSlideChange={centerChanged}
            />
          </RasterNavigationContext.Provider>
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
