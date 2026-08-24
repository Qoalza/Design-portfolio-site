import styles from "./site-footer.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <span className={styles.author}>
        <span className={`${styles.footerIcon} ${styles.authorIcon}`} aria-hidden="true" />
        Deveploment and design Artur A.
      </span>
      <span className={styles.year}>2026</span>
    </footer>
  );
}
