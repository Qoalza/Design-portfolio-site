import styles from "./site-footer.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <span className={styles.author}>
        <span className={`${styles.footerIcon} ${styles.authorIcon}`} aria-hidden="true" />
        Deveploment and design Artur Arustamyan
      </span>
      <span className={styles.separator} aria-hidden="true" />
      <span className={styles.report}>
        <span className={styles.reportContent}>
          <span className={`${styles.footerIcon} ${styles.reportIcon}`} aria-hidden="true" />
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
