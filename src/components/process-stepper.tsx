"use client";

import { useState, type ReactNode } from "react";
import {
  getProcessStepTarget,
  type StepDirection,
} from "../lib/main-chapter-interactions";
import { SquareButton } from "./ui-controls";
import styles from "./process-stepper.module.css";

const stepCount = 3;

export function ProcessStepper({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(0);

  const move = (direction: StepDirection) => {
    const target = getProcessStepTarget(step, direction, stepCount);
    if (target.consumed) {
      setStep(target.index);
    }
  };

  return (
    <div className={styles.viewport} data-process-step={step + 1}>
      <div className={styles.track}>{children}</div>
      <div className={`${styles.fade} ${styles.fadeTop} ${step > 0 ? styles.visible : ""}`} aria-hidden="true" />
      <div className={`${styles.fade} ${styles.fadeBottom} ${step < stepCount - 1 ? styles.visible : ""}`} aria-hidden="true" />
      {step > 0 ? (
        <SquareButton kind="button" className={`${styles.arrow} ${styles.arrowTop}`} variant="ghost" size="small" onClick={() => move(-1)} ariaLabel="Предыдущий этап" icon="/assets/homepage/chevron-down.svg" />
      ) : null}
      {step < stepCount - 1 ? (
        <SquareButton kind="button" className={`${styles.arrow} ${styles.arrowBottom}`} variant="ghost" size="small" onClick={() => move(1)} ariaLabel="Следующий этап" icon="/assets/homepage/chevron-down.svg" />
      ) : null}
      <span className="visually-hidden" aria-live="polite">Этап {step + 1} из {stepCount}</span>
    </div>
  );
}
