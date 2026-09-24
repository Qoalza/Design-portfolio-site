import {useEffect,useRef,useState} from 'react';
import {animate,motion,useMotionValue,useReducedMotion,useTransform} from 'motion/react';
import {
  DRAG_SPRING,
  getGestureVelocity,
  getInertiaOffset,
  getMagneticPreset,
  INERTIA_TRANSITION,
  MAGNETIC_TRANSITION,
  PRESET_TRANSITION,
} from './motion.mjs';
import {
  ADAPTIVE_PRESETS,
  geometryFromDrag,
  getAdaptiveRange,
  getExactAdaptivePreset,
  getProductHeight,
  getStageHeight,
  getStageWidth,
  MAX_LOGICAL_WIDTH,
  MIN_LOGICAL_WIDTH,
  RESPONSIVE_HERO_SCALE,
} from './width.mjs';
import styles from './ProjectResponsiveHero.module.css';

const ADAPTIVE_LAYOUTS = [
  { id: "min", label: "min-width", value: "360", segmentWidth: 256, iconFile: "adaptive-min.svg" },
  { id: "mobile", label: "Mobile", value: "360x599", segmentWidth: 141, iconFile: "adaptive-mobile.svg" },
  { id: "tablet", label: "Tablet", value: "600x1279", segmentWidth: 415, iconFile: "adaptive-tablet.svg" },
  { id: "desktop", label: "Desktop", value: "1280x1599", segmentWidth: 188, iconFile: "adaptive-desktop.svg" },
  { id: "max", label: "max-width", value: "1600+", segmentWidth: 200, iconFile: "adaptive-max.svg" },
] ;

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
  const iconStyle = { '--adaptive-icon': `url("${assetRoot}/${layout.iconFile}")` };

  return (
    <button
      className={styles.adaptiveLayout}
      style={{ width: `${layout.segmentWidth}px` }}
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className={styles.adaptiveMain}>
        <span className={styles.adaptiveCopy}>
          <span className={selected ? styles.adaptiveLabelActive : styles.adaptiveLabel}>{layout.label}</span>
          <span className={selected ? styles.adaptiveValueActive : styles.adaptiveValue}>{layout.value}</span>
        </span>
        <span className={`${styles.adaptiveIconBox} ${selected ? styles.adaptiveIconBoxActive : ""}`}>
          <span className={`${styles.adaptiveIcon} ${selected ? styles.adaptiveIconActive : ""}`} style={iconStyle} aria-hidden="true" />
        </span>
        {layout.id === "min" || layout.id === "max" ? (
          <ExactAsset
            className={`${styles.adaptiveMainBoundary} ${styles[`adaptiveMainBoundary_${layout.id}`]}`}
            src={`${assetRoot}/ruler-edge-tick.svg`}
            width={1}
            height={15}
          />
        ) : null}
      </span>
      <AdaptiveTrack assetRoot={assetRoot} id={layout.id} selected={endpointSelected} />
    </button>
  );
}

export function ProjectResponsiveHero({definition}) {
  const assetRoot = definition.chromeAssetRoot;
  const initialScene = definition.scenes.find(({ id }) => id === definition.initialSceneId) ?? definition.scenes[0];
  const initialPreset = ADAPTIVE_PRESETS.max;
  const [geometry, setGeometry] = useState({
    logicalWidth: initialPreset.logicalWidth,
    displayWidth: initialPreset.displayWidth,
  });
  const [selectionMode, setSelectionMode] = useState('preset');
  const [selectedPreset, setSelectedPreset] = useState('max');
  const prefersReducedMotion = useReducedMotion();
  const displayWidth = useMotionValue(initialPreset.displayWidth);
  const logicalWidth = useMotionValue(initialPreset.logicalWidth);
  const productHeight = useMotionValue(initialPreset.productHeight);
  const stageWidth = useTransform(displayWidth, getStageWidth);
  const stageHeight = useTransform(productHeight, getStageHeight);
  const logicalHeight = useTransform(productHeight, (height) => height / RESPONSIVE_HERO_SCALE);
  const rulerPosition = useTransform(displayWidth, (width) => width - 1);
  const resizeEdgePosition = useTransform(displayWidth, (width) => width - 16);
  const animationControls = useRef([]);
  const releaseTimer = useRef(null);
  const dragState = useRef(null);

  const selectedAdaptive = selectionMode === "preset"
    ? selectedPreset
    : getAdaptiveRange(geometry.logicalWidth);
  const exactAdaptivePreset = selectionMode === "preset"
    ? selectedPreset
    : getExactAdaptivePreset(geometry.displayWidth);
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
    const nextProductHeight = getProductHeight(getAdaptiveRange(next.logicalWidth));
    stopAnimations();
    setGeometry(next);

    if (prefersReducedMotion) {
      displayWidth.jump(next.displayWidth);
      logicalWidth.jump(next.logicalWidth);
      productHeight.jump(nextProductHeight);
      return;
    }

    animationControls.current = [
      animate(displayWidth, next.displayWidth, transition),
      animate(logicalWidth, next.logicalWidth, transition),
      animate(productHeight, nextProductHeight, transition),
    ];
  }

  function selectAdaptive(id, transition = PRESET_TRANSITION) {
    const preset = ADAPTIVE_PRESETS[id];
    setSelectionMode("preset");
    setSelectedPreset(id);
    moveGeometry({ logicalWidth: preset.logicalWidth, displayWidth: preset.displayWidth }, transition);
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
      logicalWidth: logicalWidth.get(),
      displayWidth: displayWidth.get(),
    };
    setGeometry(currentGeometry);
    setSelectionMode("free");
    dragState.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startLogicalWidth: currentGeometry.logicalWidth,
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
    const nextGeometry = geometryFromDrag({
      startLogicalWidth: drag.startLogicalWidth,
      startDisplayWidth: drag.startDisplayWidth,
      physicalDelta: event.clientX - drag.startClientX,
    });
    drag.latestGeometry = nextGeometry;
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
      const inertiaGeometry = geometryFromDrag({
        startLogicalWidth: drag.latestGeometry.logicalWidth,
        startDisplayWidth: drag.latestGeometry.displayWidth,
        physicalDelta: inertiaOffset,
      });
      moveGeometry(inertiaGeometry, INERTIA_TRANSITION);
      releaseTimer.current = setTimeout(() => {
        releaseTimer.current = null;
        const projectedPreset = getMagneticPreset(inertiaGeometry.displayWidth);
        if (projectedPreset) selectAdaptive(projectedPreset, MAGNETIC_TRANSITION);
      }, INERTIA_TRANSITION.duration * 1000);
      return;
    }

    const magneticPreset = getMagneticPreset(drag.latestGeometry.displayWidth);
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
    moveGeometry(geometryFromDrag({
      startLogicalWidth: logicalWidth.get(),
      startDisplayWidth: displayWidth.get(),
      physicalDelta,
    }), DRAG_SPRING);
  }

  return (
    <section className={styles.responsiveHero} aria-label="Адаптивный экран проекта">
      <header className={styles.heroTopbar}>
        <div className={styles.heroTopbarInner}>
          <span className={`${styles.topbarSide} ${styles.topbarSideLeft}`} aria-hidden="true">
            <ExactAsset src={`${assetRoot}/topbar-separation.svg`} width={1} height={68} />
          </span>
          <div className={styles.scenarioTabs} aria-label="Сценарии проекта">
            {definition.scenes.map((scene) => {
              const active = scene.id === definition.initialSceneId;
              return (
                <div
                  className={`${styles.scenarioTab} ${active ? styles.scenarioTabActive : ""}`}
                  key={scene.id}
                  style={{ width: `${scene.tabWidth}px` }}
                  aria-current={active ? "true" : undefined}
                >
                  <span className={styles.scenarioTabContent}>
                    <span
                      className={`${styles.scenarioIcon} ${active ? styles.scenarioIconActive : ""}`}
                      style={{'--scenario-icon': `url("${scene.iconSrc}")`}}
                      aria-hidden="true"
                    />
                    <span>{scene.label}</span>
                  </span>
                  {active ? <span className={styles.scenarioActiveLine} aria-hidden="true" /> : null}
                </div>
              );
            })}
          </div>
          <p className={styles.heroHint}>{hint}</p>
          <span className={`${styles.topbarSide} ${styles.topbarSideRight}`} aria-hidden="true">
            <ExactAsset src={`${assetRoot}/topbar-separation.svg`} width={1} height={68} />
          </span>
        </div>
      </header>

      <div className={styles.heroWorkspace}>
        <div className={styles.heroInner}>
          <div className={styles.workspaceContent}>
            <div className={styles.adaptiveRuler} aria-label="Диапазоны адаптивности">
              {ADAPTIVE_LAYOUTS.map((layout) => (
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
                <motion.div className={styles.productViewport} style={{ width: displayWidth, height: productHeight }}>
                  <motion.div className={styles.logicalProduct} style={{ width: logicalWidth, height: logicalHeight }}>
                    <iframe
                      className={styles.productFrame}
                      src={definition.sceneSrc}
                      title={`${initialScene?.label ?? "Project scene"} — проект`}
                      aria-hidden="true"
                      tabIndex={-1}
                    />
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
                    aria-valuemin={MIN_LOGICAL_WIDTH}
                    aria-valuemax={Math.round(MAX_LOGICAL_WIDTH)}
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
