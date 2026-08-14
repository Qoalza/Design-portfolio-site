"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./site-header.module.css";

const assetRoot = "/assets/homepage";

type SiteHeaderProps = {
  homeActive?: boolean;
  breadcrumbLabel?: string;
};

type HeaderStackProps = SiteHeaderProps & {
  fixed: boolean;
};

function MaskIcon({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`${styles.maskIcon} ${className}`} />;
}

function HeaderRow({ homeActive = false, fixed }: Pick<HeaderStackProps, "homeActive" | "fixed">) {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="На главную">
        <Image src={`${assetRoot}/logo.svg`} alt="" width={48} height={48} priority={!fixed} />
        <span><strong>ART</strong><small>Design</small></span>
      </Link>

      <nav className={styles.nav} aria-label="Основная навигация">
        <Link className={homeActive ? styles.navActive : styles.navHome} href="/" aria-current={homeActive ? "page" : undefined}>
          <MaskIcon className={styles.homeIcon} />
          Главная
        </Link>
        <span aria-disabled="true"><MaskIcon className={styles.lockIcon} />Блог</span>
        <span aria-disabled="true"><MaskIcon className={styles.lockIcon} />Лаборатория</span>
      </nav>

      <div className={styles.headerActions}>
        <span className={styles.availability}>
          <Image src={`${assetRoot}/status.svg`} alt="" width={6} height={8} />
          Открыт к предложениям
        </span>
        <span className={styles.primaryButton} aria-disabled="true">Связаться</span>
      </div>
    </header>
  );
}

function Breadcrumbs({ label }: { label: string }) {
  return (
    <div className={styles.breadcrumbRow}>
      <div className={styles.breadcrumbs}>
        <Link className={styles.backButton} href="/" aria-label="Вернуться на главную">
          <MaskIcon className={styles.backIcon} />
        </Link>
        <div className={styles.breadcrumbTrail}>
          <Link href="/">Главная</Link>
          <span aria-hidden="true">/</span>
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}

function HeaderStack({ homeActive, breadcrumbLabel, fixed }: HeaderStackProps) {
  return (
    <div className={`${styles.stack} ${fixed ? styles.fixedStack : ""}`}>
      <HeaderRow homeActive={homeActive} fixed={fixed} />
      {breadcrumbLabel ? <Breadcrumbs label={breadcrumbLabel} /> : null}
    </div>
  );
}

export function SiteHeader({ homeActive = false, breadcrumbLabel }: SiteHeaderProps) {
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const [fixedVisible, setFixedVisible] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setFixedVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    }, { threshold: 0 });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.controller} data-site-header-controller data-fixed-visible={fixedVisible ? "true" : "false"}>
      <div className={styles.flowHeader} aria-hidden={fixedVisible || undefined} inert={fixedVisible || undefined}>
        <HeaderStack homeActive={homeActive} breadcrumbLabel={breadcrumbLabel} fixed={false} />
        <span ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      </div>

      <div
        className={`${styles.fixedHeader} ${fixedVisible ? styles.fixedHeaderVisible : ""}`}
        aria-hidden={!fixedVisible || undefined}
        inert={!fixedVisible || undefined}
      >
        <HeaderStack homeActive={homeActive} breadcrumbLabel={breadcrumbLabel} fixed />
      </div>
    </div>
  );
}
