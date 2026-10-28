import {desktopRasterSlides} from './raster-desktop-presentation.mjs';
import {RasterDots} from './RasterDots';
import {useRasterSelection} from './use-raster-selection';
import {createContext, Fragment, useContext, useEffect, useRef, useState} from 'react';
import {useReducedMotion} from 'motion/react';
import {StackedCarousel} from 'react-stacked-center-carousel';
import {ControlButton} from '../Controls.jsx';
import {GridPattern} from '../GridPattern.jsx';
import {Tooltip} from '../Tooltip.jsx';
import {unavailableContextHint} from './unavailable-context.mjs';
import {ScenarioTab} from '../v2/HeroTabs.jsx';
import {nearestCarouselStep, wrapSlideIndex} from './raster-carousel.mjs';
import shellStyles from './ProjectResponsiveHero.module.css';
import styles from './ProjectRasterHero.module.css';

const CARD_WIDTH = 860;
const LEGACY_CARD_WIDTH = 940;
const CAROUSEL_WIDTH = 1280;
const CAROUSEL_HEIGHT = 928;
const CAROUSEL_DURATION = 450;
const SCALES_ONE = [1, .5];
const SCALES_THREE = [1, 600 / CARD_WIDTH, .5];
const SCALES_FIVE = [1, 600 / CARD_WIDTH, 382.5 / CARD_WIDTH, .45];
const CAROUSEL_TRANSITION = `transform ${CAROUSEL_DURATION}ms ease, opacity ${CAROUSEL_DURATION}ms ease, z-index ${CAROUSEL_DURATION}ms linear`;
const CAROUSEL_STEP_INTERVAL = CAROUSEL_DURATION + 20;
const RasterNavigationContext = createContext(null);


function RasterCard({data, dataIndex, slideIndex}) {
  const slide = data[dataIndex];
  const distance = Math.abs(slideIndex);
  const {moveBy:navigate,smallLayout,visibleCount} = useContext(RasterNavigationContext);
  const hidden = smallLayout && distance > (visibleCount - 1) / 2;
  return (
    <div
      className={`${styles.card} ${distance === 1 ? styles.cardNear : ''} ${distance >= 2 ? styles.cardFar : ''}`}
      aria-hidden={hidden ? true : undefined}
      inert={hidden ? true : undefined}
      data-slot={slideIndex}
      data-slide-id={slide.id}
    >
      <img src={slide.src} width="4096" height="2958" alt={slideIndex === 0 ? slide.title : ''} draggable={false} decoding="async" />
      <span data-raster-shade={smallLayout ? "left" : undefined} className={`${styles.cardShade} ${styles.cardShadeLeft} ${slideIndex < 0 ? styles.cardShadeVisible : ''}`} aria-hidden="true" />
      <span data-raster-shade={smallLayout ? "right" : undefined} className={`${styles.cardShade} ${styles.cardShadeRight} ${slideIndex > 0 ? styles.cardShadeVisible : ''}`} aria-hidden="true" />
      {slideIndex !== 0 && distance <= 2 ? <button type="button" className={styles.sideHitArea} onClick={() => navigate(slideIndex)} aria-label={`Показать: ${slide.title}`} /> : null}
    </div>
  );
}

export function ProjectRasterHero({definition,selection:provided,onSelectionChange}) {
  const {selection,context,index:activeIndex,update}=useRasterSelection(definition,provided,onSelectionChange);
  const contextId=selection.contextId;
  const [initialStep,setInitialStep]=useState(activeIndex);
  const slides = desktopRasterSlides(definition,context);
  const threeLayout = slides.length === 3;
  const smallLayout = threeLayout || slides.length >= 5;
  const [step, setStep] = useState(activeIndex);
  const stepRef = useRef(activeIndex);
  const carouselRef = useRef(null);
  const queuedStepTimerRef = useRef(null);
  const queuedDirectionRef = useRef(0);
  const queuedExpectedStepRef = useRef(null);
  const orderedSlides = [...slides.slice(initialStep), ...slides.slice(0, initialStep)];
  const visibleCount = Math.min(slides.length, 5);
  const activeSlide = slides[activeIndex];
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
    setInitialStep(nextStep);
    update({contextId:nextContext.id,slideId:nextContext.slides[nextStep].id});
    setStep(nextStep);
  }

  function centerChanged(orderedIndex) {
    const index = wrapSlideIndex(initialStep + orderedIndex, slides.length);
    const nextStep = nearestCarouselStep(stepRef.current, index, slides.length);
    if (nextStep === stepRef.current) return;
    if (queuedDirectionRef.current && nextStep !== queuedExpectedStepRef.current) cancelQueuedSteps();
    stepRef.current = nextStep;
    setStep(nextStep);
    update({contextId,slideId:slides[index].id});
  }

  function selectSlide(index) {
    const target = nearestCarouselStep(stepRef.current, index, slides.length);
    moveBy(target - stepRef.current);
  }

  function move(direction) {
    moveBy(direction);
  }

  const controls = slides.length > 1 ? <div className={styles.controls} aria-label="Переключить экран">
    <ControlButton variant="ghost" iconLeft="about-chevron-left" iconOnly className={styles.arrow} onClick={() => move(-1)} aria-label="Предыдущий экран" />
    <RasterDots slides={slides} contextId={context.id} step={step} activeIndex={activeIndex} onSelect={selectSlide}/>
    <ControlButton variant="ghost" iconRight="about-chevron-right" iconOnly className={styles.arrow} onClick={() => move(1)} aria-label="Следующий экран" />
  </div> : null;

  return (
    <section className={`${shellStyles.heroWorkspace} ${styles.hero} ${smallLayout ? styles.heroThree : ''} ${smallLayout && !threeLayout ? styles.heroFive : ''}`} aria-label={`${definition.projectName}: просмотр экранов`} data-figma-node={threeLayout ? "4501:939371" : smallLayout ? "4585:1234198" : "4276:794436"}>
      <GridPattern />
      <div className={`${shellStyles.heroInner} ${styles.inner}`}>
        <div className={styles.heading}>
          <div className={styles.contextTabs} aria-label="Устройство">
            {definition.contexts.map(item => {
              const unavailableHint = unavailableContextHint(item);
              const tab = <ScenarioTab icon={item.icon} label={item.label} active={item.id === contextId} disabled={!item.slides.length} className={unavailableHint ? styles.unavailableTab : ''} onClick={() => selectContext(item)} />;
              return <Fragment key={item.id}>
                {unavailableHint ? <Tooltip label={item.label} content={unavailableHint}>{tab}</Tooltip> : tab}
              </Fragment>;
            })}
          </div>
          {!smallLayout ? <p className={styles.slideTitle} aria-live="polite">{activeSlide?.title}</p> : null}
        </div>

        <div data-raster-artwork={smallLayout ? (threeLayout ? "three" : "five") : undefined} className={`${styles.carousel} ${reduceMotion ? styles.reducedMotion : ''}`} aria-label="Экраны проекта">
          <RasterNavigationContext.Provider value={{moveBy,smallLayout,visibleCount}}>
            <StackedCarousel
            key={context.id}
            ref={carouselRef}
            data={orderedSlides}
            slideComponent={RasterCard}
            carouselWidth={smallLayout ? (threeLayout ? 1140 : 1122) : CAROUSEL_WIDTH}
            slideWidth={smallLayout ? CARD_WIDTH : LEGACY_CARD_WIDTH}
            height={smallLayout ? 621 : CAROUSEL_HEIGHT}
            maxVisibleSlide={visibleCount}
            customScales={smallLayout ? (threeLayout ? SCALES_THREE : SCALES_FIVE) : (visibleCount === 1 ? SCALES_ONE : [1, 640 / LEGACY_CARD_WIDTH, .55, .45])}
            fadeDistance={0}
            transitionTime={reduceMotion ? 0 : CAROUSEL_DURATION}
            customTransition={reduceMotion ? undefined : CAROUSEL_TRANSITION}
            onActiveSlideChange={centerChanged}
            />
          </RasterNavigationContext.Provider>
        </div>

        {smallLayout ? <div className={styles.captionControls}>
          <div className={styles.caption} aria-live="polite" aria-atomic="true">
            <p className={styles.slideTitle}>{activeSlide?.title}</p>
            {activeSlide?.description ? <p className={styles.slideDescription}>{activeSlide.description}</p> : null}
          </div>
          {controls}
        </div> : controls}
      </div>
    </section>
  );
}
