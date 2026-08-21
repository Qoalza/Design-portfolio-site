import styles from "./site-footer.module.css";

export function SiteFooter({ showReport = true }: { showReport?: boolean }) {
  return (
    <footer className={styles.footer}>
      <span className={styles.author}>
        <span className={`${styles.footerIcon} ${styles.authorIcon}`} aria-hidden="true" />
        Deveploment and design Artur Arustamyan
      </span>
      {showReport ? (
        <>
          <span className={styles.separator} aria-hidden="true" />
          <span className={styles.report}>
            <span className={styles.reportContent}>
              <span className={`${styles.footerIcon} ${styles.reportIcon}`} aria-hidden="true" />
              <span>Нашли ошибку?</span>
              <a className={styles.reportButton} href="https://t.me/Coco_soul" target="_blank" rel="noreferrer">
                Сообщите мне
              </a>
            </span>
          </span>
        </>
      ) : null}
      <span className={styles.year}>2026</span>
    </footer>
  );
}
