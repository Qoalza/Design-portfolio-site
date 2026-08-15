import Image from "next/image";
import type { ReactNode } from "react";
import { SiteFooter } from "./site-footer";
import styles from "./error-screen.module.css";

type ErrorScreenProps = {
  variant: "404" | "500";
  title: string;
  children: ReactNode;
  action: ReactNode;
};

export function ErrorScreen({ variant, title, children, action }: ErrorScreenProps) {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <main className={styles.main}>
          <div className={`${styles.stage} ${styles[`stage${variant}`]}`}>
            <div className={styles.artClip}>
              <Image className={styles.art} src={`/assets/errors/${variant}.png`} alt="" width={variant === "404" ? 3983 : 4096} height={variant === "404" ? 3581 : 2824} unoptimized priority />
            </div>
            <section className={styles.message} aria-labelledby={`error-${variant}-title`}>
              <div className={styles.messageBody}>
                <div className={styles.copy}><h1 id={`error-${variant}-title`}>{title}</h1><div>{children}</div></div>
                {action}
              </div>
              {variant === "404" ? <Image className={styles.tail} src="/assets/errors/speech-tail.svg" alt="" width={27} height={20} /> : null}
            </section>
          </div>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
