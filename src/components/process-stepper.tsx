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
        <div className={`${styles.processControl} ${styles.processControlTop}`}>
          <span className={styles.processControlLabel} aria-hidden="true">
            {step === 1 ? "к аналитике" : "к проектированию"}
          </span>
          <SquareButton
            kind="button"
            className={styles.previousButton}
            variant="light"
            size="small"
            onClick={() => move(-1)}
            ariaLabel={step === 1 ? "Перейти к аналитике" : "Перейти к проектированию"}
            icon="/assets/homepage/chevron-down.svg"
          />
        </div>
      ) : null}
      {step < stepCount - 1 ? (
        <div className={`${styles.processControl} ${styles.processControlBottom}`}>
          <span className={styles.processControlLabel} aria-hidden="true">
            {step === 0 ? "к проектированию" : "к финалу"}
          </span>
          <SquareButton
            kind="button"
            variant="light"
            size="small"
            onClick={() => move(1)}
            ariaLabel={step === 0 ? "Перейти к проектированию" : "Перейти к финалу"}
            icon="/assets/homepage/chevron-down.svg"
          />
        </div>
      ) : null}
      <span className="visually-hidden" aria-live="polite">Этап {step + 1} из {stepCount}</span>
    </div>
  );
}
