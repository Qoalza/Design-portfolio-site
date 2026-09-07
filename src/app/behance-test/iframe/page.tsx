import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: { absolute: "Iframe preview — Artur Designer" },
  robots: { index: false, follow: false },
};

export default function BehanceIframePreviewPage() {
  return (
    <main className={styles.page}>
      <div className={styles.heading}>
        <p>LOCAL IFRAME CHECK</p>
        <span>1400 × 520</span>
      </div>
      <div className={styles.frame}>
        <iframe
          height="520"
          scrolling="no"
          src="/behance-test"
          title="Behance interactive preview"
          width="1400"
        />
      </div>
    </main>
  );
}
