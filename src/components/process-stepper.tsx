"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  getProcessStepTarget,
  getProcessWheelDecision,
  type StepDirection,
} from "../lib/main-chapter-interactions";
import { ControlButton } from "./ui-controls";
import styles from "./process-stepper.module.css";

const stepCount = 3;
const gestureThreshold = 12;
const gestureQuietPeriod = 160;

export function ProcessStepper({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(0);
  const lockedRef = useRef(false);
  const deltaRef = useRef(0);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [step, setStep] = useState(0);

  const selectStep = (nextStep: number) => {
    stepRef.current = nextStep;
    setStep(nextStep);
  };

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const unlockAfterGesture = () => {
      if (unlockTimerRef.current) {
        clearTimeout(unlockTimerRef.current);
      }

      unlockTimerRef.current = setTimeout(() => {
        lockedRef.current = false;
        deltaRef.current = 0;
      }, gestureQuietPeriod);
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY === 0) {
        return;
      }

      const direction: StepDirection = event.deltaY > 0 ? 1 : -1;
      const decision = getProcessWheelDecision(
        stepRef.current,
        direction,
        stepCount,
        lockedRef.current,
      );

      if (!decision.consumed) {
        lockedRef.current = false;
        deltaRef.current = 0;
        return;
      }

      event.preventDefault();
      unlockAfterGesture();

      if (!decision.shouldAdvance) {
        return;
      }

      deltaRef.current += event.deltaY;

      if (Math.abs(deltaRef.current) < gestureThreshold) {
        return;
      }

      lockedRef.current = true;
      deltaRef.current = 0;
      selectStep(decision.index);
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      viewport.removeEventListener("wheel", handleWheel);
      if (unlockTimerRef.current) {
        clearTimeout(unlockTimerRef.current);
      }
    };
  }, []);

  const move = (direction: StepDirection) => {
    const target = getProcessStepTarget(stepRef.current, direction, stepCount);
    if (target.consumed) {
      selectStep(target.index);
    }
  };

  return (
    <div ref={viewportRef} className={styles.viewport} data-process-step={step + 1}>
      <div className={styles.track}>{children}</div>
      <div className={`${styles.fade} ${styles.fadeTop} ${step > 0 ? styles.visible : ""}`} aria-hidden="true" />
      <div className={`${styles.fade} ${styles.fadeBottom} ${step < stepCount - 1 ? styles.visible : ""}`} aria-hidden="true" />
      {step > 0 ? (
        <ControlButton className={`${styles.arrow} ${styles.arrowTop}`} variant="ghost" size="small" onClick={() => move(-1)} ariaLabel="Предыдущий этап" iconLeft="/assets/homepage/chevron-down.svg">{null}</ControlButton>
      ) : null}
      {step < stepCount - 1 ? (
        <ControlButton className={`${styles.arrow} ${styles.arrowBottom}`} variant="ghost" size="small" onClick={() => move(1)} ariaLabel="Следующий этап" iconLeft="/assets/homepage/chevron-down.svg">{null}</ControlButton>
      ) : null}
      <span className="visually-hidden" aria-live="polite">Этап {step + 1} из {stepCount}</span>
    </div>
  );
}
