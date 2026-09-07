"use client";

import { useRef } from "react";
import { ControlButton, TextButton } from "./ui-controls";
import styles from "./behance-test-widget.module.css";

const CORVO_URL = "https://art-des.ru/projects/corvo";
const PORTFOLIO_URL = "https://art-des.ru";

export function BehanceTestWidget() {
  const widgetRef = useRef<HTMLElement>(null);

  function resetPointer() {
    const widget = widgetRef.current;
    if (!widget) return;

    widget.style.setProperty("--pointer-x", "50%");
    widget.style.setProperty("--pointer-y", "50%");
    widget.style.setProperty("--shift-x", "0px");
    widget.style.setProperty("--shift-y", "0px");
  }

  function movePointer(event: React.PointerEvent<HTMLElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const widget = widgetRef.current;
    if (!widget) return;

    const bounds = widget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));

    widget.style.setProperty("--pointer-x", `${x * 100}%`);
    widget.style.setProperty("--pointer-y", `${y * 100}%`);
    widget.style.setProperty("--shift-x", `${(x - 0.5) * 28}px`);
    widget.style.setProperty("--shift-y", `${(y - 0.5) * 20}px`);
  }

  return (
    <main
      ref={widgetRef}
      aria-describedby="behance-test-hint"
      className={styles.widget}
      onPointerLeave={resetPointer}
      onPointerMove={movePointer}
    >
      <header className={styles.header}>
        <p className={styles.eyebrow}>CORVO · INTERACTIVE PREVIEW</p>
        <span className={styles.version}>TEST 01</span>
      </header>

      <section className={styles.stage} aria-label="Интерактивная композиция Corvo">
        <div className={`${styles.layer} ${styles.layerBack}`} aria-hidden="true" />
        <div className={`${styles.layer} ${styles.layerMiddle}`} aria-hidden="true" />
        <div className={`${styles.layer} ${styles.layerFront}`} aria-hidden="true">
          <span className={styles.windowHeader} />
          <span className={styles.windowLine} />
          <span className={styles.windowLine} />
          <span className={styles.windowLineShort} />
        </div>
        <p className={styles.stageLabel}>Двигайте курсор</p>
      </section>

      <footer className={styles.footer}>
        <p className={styles.hint} id="behance-test-hint">
          Наведите курсор: слои откликаются на движение.
        </p>
        <div className={styles.actions}>
          <ControlButton external href={CORVO_URL} size="large" variant="accent">
            Открыть кейс Corvo
          </ControlButton>
          <TextButton external href={PORTFOLIO_URL} size="large" variant="neutralAccent">
            Перейти на art-des.ru
          </TextButton>
        </div>
      </footer>
    </main>
  );
}
