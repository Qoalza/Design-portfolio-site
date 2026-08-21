"use client";

import Image from "next/image";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  ContextLink,
  type NavigationPage,
  useNavigationTrail,
} from "./contextual-navigation";
import { ControlButton, NavigationTab, TextButton } from "./ui-controls";
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
  onHomeNavigate: () => void;
};

function HeaderRow({ homeActive = false, fixed, onHomeNavigate }: Pick<HeaderStackProps, "homeActive" | "fixed" | "onHomeNavigate">) {
  return (
    <header className={styles.header}>
      <ContextLink className={styles.brand} href="/" resetBreadcrumbs aria-label="На главную" onClick={onHomeNavigate}>
        <Image src={`${assetRoot}/logo.svg`} alt="" width={129} height={80} priority={!fixed} />
      </ContextLink>

      <nav className={styles.nav} aria-label="Основная навигация">
        <NavigationTab active={homeActive} href="/" resetBreadcrumbs iconLeft="/assets/homepage/home.svg" onClick={onHomeNavigate}>Главная</NavigationTab>
        <NavigationTab disabled iconLeft="/assets/homepage/lock.svg">Блог</NavigationTab>
        <NavigationTab disabled iconLeft="/assets/homepage/lock.svg">Лаборатория</NavigationTab>
      </nav>

      <div className={styles.headerActions}>
        <span className={styles.availability}>
          <Image src={`${assetRoot}/status.svg`} alt="" width={6} height={8} />
          Открыт к предложениям
        </span>
        <ControlButton variant="accent" href="https://t.me/Coco_soul" external iconRight="/assets/homepage/telegram.svg">Связаться</ControlButton>
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
        <ControlButton
          className={styles.backButton}
          variant="ghost"
          size="small"
          href={previousItem.href}
          breadcrumbTrail={previousTrail}
          resetBreadcrumbs={previousTrail.length === 1}
          ariaLabel={`Вернуться: ${previousItem.label}`}
          iconLeft="/assets/projects/corvo/back.svg"
        >{null}</ControlButton>
        <div className={styles.breadcrumbTrail}>
          {trail.map((item, index) => (
            <Fragment key={`${item.href}-${index}`}>
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {index === trail.length - 1 ? (
                <span>{item.label}</span>
              ) : (
                <TextButton
                  href={item.href}
                  breadcrumbTrail={trail.slice(0, index + 1)}
                  resetBreadcrumbs={index === 0}
                >
                  {item.label}
                </TextButton>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeaderStack({ homeActive, breadcrumbTrail, fixed, onHomeNavigate }: HeaderStackProps) {
  return (
    <div className={`${styles.stack} ${fixed ? styles.fixedStack : ""}`}>
      <HeaderRow homeActive={homeActive} fixed={fixed} onHomeNavigate={onHomeNavigate} />
      {breadcrumbTrail ? <Breadcrumbs trail={breadcrumbTrail} /> : null}
    </div>
  );
}

export function SiteHeader({ homeActive = false, navigationPage, showBreadcrumbs = true }: SiteHeaderProps) {
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const [fixedVisible, setFixedVisible] = useState(false);
  const [hideBreadcrumbs, setHideBreadcrumbs] = useState(false);
  const navigationTrail = useNavigationTrail(navigationPage);
  const breadcrumbTrail = showBreadcrumbs && !hideBreadcrumbs ? navigationTrail : undefined;
  const handleHomeNavigate = () => setHideBreadcrumbs(true);

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
        <HeaderStack homeActive={homeActive} breadcrumbTrail={breadcrumbTrail} fixed={false} onHomeNavigate={handleHomeNavigate} />
        <span ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      </div>

      <div
        className={`${styles.fixedHeader} ${fixedVisible ? styles.fixedHeaderVisible : ""}`}
        aria-hidden={!fixedVisible || undefined}
        inert={!fixedVisible || undefined}
      >
        <HeaderStack homeActive={homeActive} breadcrumbTrail={breadcrumbTrail} fixed onHomeNavigate={handleHomeNavigate} />
      </div>
    </div>
  );
}
