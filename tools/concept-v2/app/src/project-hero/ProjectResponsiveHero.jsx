import {useEffect,useRef,useState} from 'react';
import {animate,motion,useMotionValue,useReducedMotion,useTransform} from 'motion/react';
import {
  DRAG_SPRING,
  getGestureVelocity,
  getInertiaOffset,
  INERTIA_TRANSITION,
  MAGNETIC_TRANSITION,
  PRESET_TRANSITION,
} from './motion.mjs';
import {
  getIframeLogicalWidth,
  getIframeViewportHeight,
  getLogicalWidth,
  getStageHeight,
  getStageWidth,
  RESPONSIVE_HERO_SCALE,
} from './width.mjs';
import {AdaptiveSizeTab,ScenarioTab} from '../v2/HeroTabs.jsx';
import {GridPattern} from '../GridPattern.jsx';
import styles from './ProjectResponsiveHero.module.css';
import {createResponsiveRuntime} from './responsive-document-runtime.mjs';

const ADAPTIVE_LAYOUTS = [
  { id: "min", label: "min-width", value: "360", segmentWidth: 256, icon: "size-min" },
  { id: "mobile", label: "Mobile", value: "360x599", segmentWidth: 141, icon: "size-mobile" },
  { id: "tablet", label: "Tablet", value: "600x1279", segmentWidth: 415, icon: "size-tablet" },
  { id: "desktop", label: "Desktop", value: "1280x1599", segmentWidth: 188, icon: "size-desktop" },
  { id: "max", label: "max-width", value: "1600+", segmentWidth: 200, icon: "size-max" },
] ;
const SCENARIO_TAB_GAP = 24;

function ExactAsset({
  src,
  width,
  height,
  className,
  style,
}) {
  return (
    // These local SVGs are exact UI canvases; image processing would interfere
    // with the deliberately stretched Figma hatch assets.
    <img className={className} src={src} width={width} height={height} style={style} alt="" draggable={false} />
  );
}

function AdaptiveTrack({
  assetRoot,
  id,
  selected,
}) {
  return (
    <span className={styles.adaptiveTrack} aria-hidden="true">
      {id === "min" ? <ExactAsset className={styles.rulerStartHatch} src={`${assetRoot}/ruler-start-hatch.svg`} width={214} height={15} /> : null}
      {id === "max" ? <ExactAsset className={styles.rulerEndHatch} src={`${assetRoot}/ruler-end-hatch.svg`} width={39} height={15} /> : null}
      <ExactAsset
        className={`${styles.adaptiveTick} ${styles[`adaptiveTick_${id}`]}`}
        src={`${assetRoot}/${selected ? "ruler-end-tick" : "ruler-tick"}.svg`}
        width={1}
        height={15}
      />
      {id === "min" || id === "max" ? (
        <ExactAsset
          className={`${styles.rulerBoundary} ${styles[`rulerBoundary_${id}`]}`}
          src={`${assetRoot}/ruler-edge-tick.svg`}
          width={1}
          height={15}
        />
      ) : null}
    </span>
  );
}

function AdaptiveControl({
  layout,
  assetRoot,
  selected,
  endpointSelected,
  onSelect,
}) {
  return (
    <div
      className={styles.adaptiveLayout}
      style={{ width: `${layout.segmentWidth}px` }}
    >
      <span className={styles.adaptiveMain}>
        <AdaptiveSizeTab
          icon={layout.icon}
          caption={layout.label}
          value={layout.value}
          active={selected}
          disabled={layout.disabled}
          aria-label={`${layout.label} ${layout.value}`}
          onClick={onSelect}
        />
        {layout.id === "min" || layout.id === "max" ? (
          <ExactAsset
            className={`${styles.adaptiveMainBoundary} ${styles[`adaptiveMainBoundary_${layout.id}`]}`}
            src={`${assetRoot}/ruler-edge-tick.svg`}
            width={1}
            height={16}
          />
        ) : null}
      </span>
      <AdaptiveTrack assetRoot={assetRoot} id={layout.id} selected={endpointSelected} />
    </div>
  );
}

export function ProjectResponsiveHero({definition}) {
  const assetRoot = definition.chromeAssetRoot;
  const initialScene = definition.scenes.find(({ id }) => id === definition.initialSceneId) ?? definition.scenes[0];
  const [activeSceneId, setActiveSceneId] = useState(initialScene.id);
  const sceneRef = useRef(initialScene.id);
  const [runtime] = useState(() => createResponsiveRuntime(definition));
  const initialPreset = runtime.preset(initialScene.id, 'max');
  const [geometry, setGeometry] = useState({
    logicalWidth: initialPreset.logicalWidth,
    displayWidth: initialPreset.displayWidth,
  });
  const [selectionMode, setSelectionMode] = useState('preset');
  const [selectedPreset, setSelectedPreset] = useState('max');
  const prefersReducedMotion = useReducedMotion();
  const displayWidth = useMotionValue(initialPreset.displayWidth);
  const renderedDisplayWidth = useTransform(displayWidth, value => runtime.displayWidth(sceneRef.current, value));
  const iframeLogicalWidth = useTransform(renderedDisplayWidth, getIframeLogicalWidth);
  const productHeight = useMotionValue(initialPreset.productHeight);
  const stageWidth = useTransform(renderedDisplayWidth, getStageWidth);
  const stageHeight = useTransform(productHeight, getStageHeight);
  const logicalHeight = useTransform(renderedDisplayWidth, value => runtime.height(sceneRef.current, value) / RESPONSIVE_HERO_SCALE);
  const animatedLogicalHeight = useTransform(productHeight, getIframeViewportHeight);
  const rulerPosition = useTransform(renderedDisplayWidth, (width) => width - 1);
  const resizeEdgePosition = useTransform(renderedDisplayWidth, (width) => width - 16);
  const animationControls = useRef([]);
  const releaseTimer = useRef(null);
  const dragState = useRef(null);

  const selectedAdaptive = selectionMode === "preset"
    ? selectedPreset
    : runtime.range(activeSceneId, geometry.logicalWidth);
  const exactAdaptivePreset = selectionMode === "preset"
    ? selectedPreset
    : runtime.exact(activeSceneId, geometry.displayWidth);
  const activeScene = definition.scenes.find(({ id }) => id === activeSceneId) ?? initialScene;
  const activeSceneIndex = definition.scenes.findIndex(({ id }) => id === activeScene.id);
  const activeLineLeft = definition.scenes
    .slice(0, activeSceneIndex)
    .reduce((offset, scene) => offset + scene.tabWidth + SCENARIO_TAB_GAP, 0);
  const hint = "Выберите сценарий и настройте ширину просмотра";

  function stopAnimations() {
    if (releaseTimer.current !== null) {
      clearTimeout(releaseTimer.current);
      releaseTimer.current = null;
    }
    animationControls.current.forEach((control) => control.stop());
    animationControls.current = [];
  }

  function moveGeometry(next, transition) {
    const nextProductHeight = runtime.height(sceneRef.current, next.displayWidth);
    stopAnimations();
    setGeometry(next);

    if (prefersReducedMotion) {
      displayWidth.jump(next.displayWidth);
      productHeight.jump(nextProductHeight);
      return;
    }

    animationControls.current = [
      animate(displayWidth, next.displayWidth, transition),
      animate(productHeight, nextProductHeight, transition),
    ];
  }

  function settleGeometry(next) {
    stopAnimations();
    setGeometry(next);
    displayWidth.jump(next.displayWidth);
    productHeight.jump(runtime.height(sceneRef.current, next.displayWidth));
  }

  function selectAdaptive(id, transition = PRESET_TRANSITION) {
    const preset = runtime.preset(sceneRef.current, id);
    if (!preset) return;
    setSelectionMode("preset");
    setSelectedPreset(id);
    moveGeometry({ logicalWidth: preset.logicalWidth, displayWidth: preset.displayWidth }, transition);
  }

  function selectScene(id) {
    if (!definition.scenes.some(scene => scene.id === id) || id === sceneRef.current) return;
    const previousId = sceneRef.current;
    sceneRef.current = id;
    if (runtime.signature(previousId) !== runtime.signature(id)) {
      // A different source range cancels stale drag/release work, then retains a valid target.
      dragState.current = null;
      const nextWidth = runtime.displayWidth(id, geometry.displayWidth);
      const next = {logicalWidth: getLogicalWidth(nextWidth), displayWidth: nextWidth};
      const matchingPreset = runtime.preset(id, selectedPreset);
      if (selectionMode !== 'preset' || !matchingPreset || matchingPreset.displayWidth !== nextWidth) setSelectionMode('free');
      settleGeometry(next);
    }
    setActiveSceneId(id);
  }

  useEffect(() => () => {
    if (releaseTimer.current !== null) clearTimeout(releaseTimer.current);
    animationControls.current.forEach((control) => control.stop());
  }, []);

  function handleResizePointerDown(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    stopAnimations();
    const currentGeometry = {
      logicalWidth: getLogicalWidth(renderedDisplayWidth.get()),
      displayWidth: renderedDisplayWidth.get(),
    };
    setGeometry(currentGeometry);
    setSelectionMode("free");
    dragState.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startDisplayWidth: currentGeometry.displayWidth,
      latestGeometry: currentGeometry,
      samples: [{ position: event.clientX, time: event.timeStamp }],
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleResizePointerMove(event) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.samples.push({ position: event.clientX, time: event.timeStamp });
    if (drag.samples.length > 16) drag.samples.shift();
    const nextGeometry = runtime.drag(sceneRef.current, {
      startDisplayWidth: drag.startDisplayWidth,
      physicalDelta: event.clientX - drag.startClientX,
    });
    drag.latestGeometry = nextGeometry;
    const physicalDelta = event.clientX - drag.startClientX;
    if (runtime.outward(sceneRef.current, nextGeometry.displayWidth, physicalDelta)) {
      settleGeometry(nextGeometry);
      return;
    }
    moveGeometry(nextGeometry, DRAG_SPRING);
  }

  function finishResize(event) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragState.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const lastSample = drag.samples[drag.samples.length - 1];
    const sampleAge = event.timeStamp - lastSample.time;
    const velocity = getGestureVelocity(drag.samples, event.timeStamp);
    const inertiaOffset = event.type === "pointerup" && !prefersReducedMotion
      ? getInertiaOffset(velocity, sampleAge)
      : 0;

    if (inertiaOffset !== 0) {
      if (runtime.outward(sceneRef.current, drag.latestGeometry.displayWidth, inertiaOffset)) {
        settleGeometry(drag.latestGeometry);
        return;
      }
      const inertiaGeometry = runtime.drag(sceneRef.current, {
        startDisplayWidth: drag.latestGeometry.displayWidth,
        physicalDelta: inertiaOffset,
      });
      moveGeometry(inertiaGeometry, INERTIA_TRANSITION);
      releaseTimer.current = setTimeout(() => {
        releaseTimer.current = null;
        const projectedPreset = runtime.magnetic(sceneRef.current, inertiaGeometry.displayWidth);
        if (projectedPreset) selectAdaptive(projectedPreset, MAGNETIC_TRANSITION);
      }, INERTIA_TRANSITION.duration * 1000);
      return;
    }

    const magneticPreset = runtime.magnetic(sceneRef.current, drag.latestGeometry.displayWidth);
    if (magneticPreset) selectAdaptive(magneticPreset, MAGNETIC_TRANSITION);
  }

  function handleResizeKeyDown(event) {
    if (event.key === "Home") {
      event.preventDefault();
      selectAdaptive("min");
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      selectAdaptive("max");
      return;
    }
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const physicalDelta = (event.shiftKey ? 10 : 1) * (event.key === "ArrowLeft" ? -1 : 1);
    setSelectionMode("free");
    const nextGeometry = runtime.drag(sceneRef.current, {
      startDisplayWidth: renderedDisplayWidth.get(),
      physicalDelta,
    });
    if (runtime.outward(sceneRef.current, nextGeometry.displayWidth, physicalDelta)) {
      settleGeometry(nextGeometry);
      return;
    }
    moveGeometry(nextGeometry, DRAG_SPRING);
  }

  return (
    <section className={styles.responsiveHero} aria-label="Адаптивный экран проекта">
      <header className={styles.heroTopbar}>
        <div className={styles.heroTopbarInner}>
          <span className={`${styles.topbarSide} ${styles.topbarSideLeft}`} aria-hidden="true">
            <ExactAsset className={styles.topbarSeparation} src={`${assetRoot}/topbar-separation.svg`} width={1} height={52} />
          </span>
          <div
            className={styles.scenarioTabs}
            aria-label="Сценарии проекта"
            style={{gap: SCENARIO_TAB_GAP, '--v2-scenario-active-line-opacity': 0}}
          >
            {definition.scenes.map((scene) => {
              const active = scene.id === activeScene.id;
              return (
                <ScenarioTab
                  key={scene.id}
                  icon={scene.icon}
                  label={scene.label}
                  active={active}
                  onClick={() => selectScene(scene.id)}
                  style={{ width: `${scene.tabWidth}px` }}
                />
              );
            })}
            <motion.span
              className={styles.scenarioActiveLine}
              aria-hidden="true"
              initial={false}
              animate={{left: activeLineLeft, width: activeScene.tabWidth}}
              transition={prefersReducedMotion ? {duration: 0} : {type: 'tween', duration: .35, ease: [.65, 0, .35, 1]}}
            />
          </div>
          <p className={styles.heroHint}>{hint}</p>
          <span className={`${styles.topbarSide} ${styles.topbarSideRight}`} aria-hidden="true">
            <ExactAsset className={styles.topbarSeparation} src={`${assetRoot}/topbar-separation.svg`} width={1} height={52} />
          </span>
        </div>
      </header>

      <div className={styles.heroWorkspace}>
        <GridPattern/>
        <div className={styles.heroInner}>
          <div className={styles.workspaceContent}>
            <div className={styles.adaptiveRuler} aria-label="Диапазоны адаптивности">
              {runtime.controls(activeSceneId, ADAPTIVE_LAYOUTS).map((layout) => (
                <AdaptiveControl
                  key={layout.id}
                  layout={layout}
                  assetRoot={assetRoot}
                  selected={layout.id === selectedAdaptive}
                  endpointSelected={layout.id === exactAdaptivePreset}
                  onSelect={() => selectAdaptive(layout.id)}
                />
              ))}
              {exactAdaptivePreset === null ? (
                <motion.span
                  className={styles.rulerPosition}
                  style={{ left: rulerPosition }}
                  aria-hidden="true"
                />
              ) : null}
            </div>

            <motion.div className={styles.stage} style={{ width: stageWidth, height: stageHeight }}>
              <div className={styles.stageTop} aria-hidden="true">
                <motion.span
                  className={styles.stageGuide}
                  style={{ left: rulerPosition }}
                />
                <span className={`${styles.stageLock} ${styles.stageLockLeft}`} style={{'--lock-icon': `url("${assetRoot}/lock.svg")`}} />
                <span className={`${styles.stageLock} ${styles.stageLockRight}`} style={{'--lock-icon': `url("${assetRoot}/lock.svg")`}} />
              </div>
              <motion.div className={styles.stageSurface} style={{ height: productHeight }}>
                <motion.div className={`${styles.productViewport} ${activeScene.id === 'authorization' ? styles.productViewportDark : ''}`} style={{ width: renderedDisplayWidth, height: productHeight }}>
                  <motion.div className={styles.logicalProduct} style={{ width: iframeLogicalWidth, height: logicalHeight }}>
                    <motion.div className={styles.iframeCanvas} style={{ height: animatedLogicalHeight }}>
                      <iframe
                        className={styles.productFrame}
                        scrolling="no"
                        src={activeScene?.src}
                        sandbox={definition.geometry ? "allow-scripts" : undefined}
                        referrerPolicy={definition.geometry ? "no-referrer" : undefined}
                        title={`${activeScene?.label ?? "Project scene"} — проект`}
                        aria-hidden="true"
                        tabIndex={-1}
                      />
                    </motion.div>
                  </motion.div>
                </motion.div>

                <motion.div
                  className={styles.resizeEdge}
                  style={{ left: resizeEdgePosition, height: productHeight }}
                >
                  <span className={styles.resizeHatch} style={{ backgroundImage: `url("${assetRoot}/resize-hatch.svg")` }} />
                  <span className={styles.resizeSeparation} style={{ backgroundImage: `url("${assetRoot}/resize-separation.svg")` }} />
                  <button
                    type="button"
                    className={styles.resizeHandle}
                    role="slider"
                    tabIndex={0}
                    aria-label="Изменить ширину адаптивного экрана"
                    aria-valuemin={Math.round(runtime.preset(activeSceneId, 'min').logicalWidth)}
                    aria-valuemax={Math.round(runtime.preset(activeSceneId, 'max').logicalWidth)}
                    aria-valuenow={Math.round(geometry.logicalWidth)}
                    aria-orientation="horizontal"
                    onKeyDown={handleResizeKeyDown}
                    onLostPointerCapture={finishResize}
                    onPointerCancel={finishResize}
                    onPointerDown={handleResizePointerDown}
                    onPointerMove={handleResizePointerMove}
                    onPointerUp={finishResize}
                  >
                    <span className={styles.resizeChevron} style={{'--resize-icon': `url("${assetRoot}/resize-chevron.svg")`}} aria-hidden="true" />
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
