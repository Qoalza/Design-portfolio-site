import Image from "next/image";
import styles from "./site-footer.module.css";

const assetRoot = "/assets/homepage";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <span className={styles.author}>
        <Image src={`${assetRoot}/footer-author.svg`} alt="" width={16} height={16} />
        Deveploment and design Artur Arustamyan
      </span>
      <span className={styles.separator} aria-hidden="true" />
      <span className={styles.report}>
        <span className={styles.reportContent}>
          <Image src={`${assetRoot}/footer-report.svg`} alt="" width={16} height={16} />
          <span>Нашли ошибку?</span>
          <button className={styles.reportButton} type="button" disabled>
            Сообщите мне
          </button>
        </span>
      </span>
      <span className={styles.year}>2026</span>
    </footer>
  );
}
