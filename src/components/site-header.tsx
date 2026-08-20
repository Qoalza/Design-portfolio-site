"use client";

import Image from "next/image";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  ContextLink,
  type NavigationPage,
  useNavigationTrail,
} from "./contextual-navigation";
import styles from "./site-header.module.css";

const assetRoot = "/assets/homepage";

type SiteHeaderProps = {
  homeActive?: boolean;
  navigationPage: NavigationPage;
  showBreadcrumbs?: boolean;
};

type HeaderStackProps = Pick<SiteHeaderProps, "homeActive"> & {
  breadcrumbTrail?: ReturnType<typeof useNavigationTrail>;
  fixed: boolean;
};

function MaskIcon({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`${styles.maskIcon} ${className}`} />;
}

function HeaderRow({ homeActive = false, fixed }: Pick<HeaderStackProps, "homeActive" | "fixed">) {
  return (
    <header className={styles.header}>
      <ContextLink className={styles.brand} href="/" resetBreadcrumbs aria-label="На главную">
        <Image src={`${assetRoot}/logo.svg`} alt="" width={129} height={80} priority={!fixed} />
      </ContextLink>

      <nav className={styles.nav} aria-label="Основная навигация">
        <ContextLink className={homeActive ? styles.navActive : styles.navHome} href="/" resetBreadcrumbs aria-current={homeActive ? "page" : undefined}>
          <MaskIcon className={styles.homeIcon} />
          Главная
        </ContextLink>
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

function Breadcrumbs({ trail }: { trail: ReturnType<typeof useNavigationTrail> }) {
  const previousTrail = trail.slice(0, -1);
  const previousItem = previousTrail.at(-1);

  if (!previousItem) {
    return null;
  }

  return (
    <div className={styles.breadcrumbRow}>
      <div className={styles.breadcrumbs}>
        <ContextLink
          className={styles.backButton}
          href={previousItem.href}
          breadcrumbTrail={previousTrail}
          resetBreadcrumbs={previousTrail.length === 1}
          aria-label={`Вернуться: ${previousItem.label}`}
        >
          <MaskIcon className={styles.backIcon} />
        </ContextLink>
        <div className={styles.breadcrumbTrail}>
          {trail.map((item, index) => (
            <Fragment key={`${item.href}-${index}`}>
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {index === trail.length - 1 ? (
                <span>{item.label}</span>
              ) : (
                <ContextLink
                  href={item.href}
                  breadcrumbTrail={trail.slice(0, index + 1)}
                  resetBreadcrumbs={index === 0}
                >
                  {item.label}
                </ContextLink>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeaderStack({ homeActive, breadcrumbTrail, fixed }: HeaderStackProps) {
  return (
    <div className={`${styles.stack} ${fixed ? styles.fixedStack : ""}`}>
      <HeaderRow homeActive={homeActive} fixed={fixed} />
      {breadcrumbTrail ? <Breadcrumbs trail={breadcrumbTrail} /> : null}
    </div>
  );
}

export function SiteHeader({ homeActive = false, navigationPage, showBreadcrumbs = true }: SiteHeaderProps) {
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const [fixedVisible, setFixedVisible] = useState(false);
  const navigationTrail = useNavigationTrail(navigationPage);
  const breadcrumbTrail = showBreadcrumbs ? navigationTrail : undefined;

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
        <HeaderStack homeActive={homeActive} breadcrumbTrail={breadcrumbTrail} fixed={false} />
        <span ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      </div>

      <div
        className={`${styles.fixedHeader} ${fixedVisible ? styles.fixedHeaderVisible : ""}`}
        aria-hidden={!fixedVisible || undefined}
        inert={!fixedVisible || undefined}
      >
        <HeaderStack homeActive={homeActive} breadcrumbTrail={breadcrumbTrail} fixed />
      </div>
    </div>
  );
}
