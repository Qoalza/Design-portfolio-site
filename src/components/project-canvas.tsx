import Image from "next/image";
import styles from "./project-canvas.module.css";

type ProjectCanvasProps =
  | { variant: "quotes" }
  | { variant: "process" }
  | { variant: "controls" };

export function ProjectCanvas(props: ProjectCanvasProps) {
  if (props.variant === "quotes") {
    return (
      <figure className={`${styles.canvas} ${styles.quotes}`}>
        <Image className={styles.quotesAsset} src="/assets/projects/corvo/canvas/corvo-quotes.png" alt="Отзывы участников команды о требованиях к продукту Corvo" width={1704} height={732} sizes="852px" unoptimized />
      </figure>
    );
  }

  if (props.variant === "process") {
    return (
      <figure className={`${styles.canvas} ${styles.process}`}>
        <Image className={styles.processAsset} src="/assets/projects/corvo/canvas/corvo-process.png" alt="Схема процесса от требований до реализации Corvo" width={1812} height={780} sizes="906px" unoptimized />
      </figure>
    );
  }

  return (
    <figure className={`${styles.canvas} ${styles.controls}`}>
      <Image className={styles.buttonsAsset} src="/assets/projects/corvo/canvas/corvo-buttons.png" alt="Пример структуры кнопок дизайн-системы Corvo" width={856} height={456} sizes="428px" unoptimized />
      <span className={styles.controlsDivider} aria-hidden="true" />
      <Image className={styles.inputsAsset} src="/assets/projects/corvo/canvas/corvo-inputs.png" alt="Пример структуры полей ввода дизайн-системы Corvo" width={1062} height={456} sizes="531px" unoptimized />
    </figure>
  );
}
