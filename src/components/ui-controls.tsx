"use client";

import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { ContextLink } from "./contextual-navigation";
import type { NavigationTrailItem } from "../lib/navigation-trail";
import styles from "./ui-controls.module.css";

type FilledButtonVariant = "accent" | "neutral" | "light" | "ghost";
type ControlSize = "medium" | "small";

type IconProps = {
  iconLeft?: string;
  iconRight?: string;
};

type ControlButtonProps = IconProps & {
  children: ReactNode;
  className?: string;
  variant?: FilledButtonVariant;
  size?: ControlSize;
  href?: string;
  external?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  buttonType?: "button" | "submit";
  breadcrumbLabel?: string;
  breadcrumbTrail?: readonly NavigationTrailItem[];
  resetBreadcrumbs?: boolean;
  ariaLabel?: string;
  dataAction?: string;
};

type ControlIconStyle = CSSProperties & {
  "--control-icon-url": string;
};

function ControlIcon({ source }: { source: string }) {
  return (
    <span
      aria-hidden="true"
      className={styles.icon}
      style={{ "--control-icon-url": `url("${source}")` } as ControlIconStyle}
    />
  );
}

function ControlContent({ children, iconLeft, iconRight }: Pick<ControlButtonProps, "children" | "iconLeft" | "iconRight">) {
  return (
    <>
      {iconLeft ? <ControlIcon source={iconLeft} /> : null}
      <span className={styles.label}>{children}</span>
      {iconRight ? <ControlIcon source={iconRight} /> : null}
    </>
  );
}

export function ControlButton({
  children,
  className = "",
  variant = "light",
  size = "medium",
  href,
  external = false,
  disabled = false,
  onClick,
  buttonType = "button",
  breadcrumbLabel,
  breadcrumbTrail,
  resetBreadcrumbs,
  ariaLabel,
  dataAction,
  iconLeft,
  iconRight,
}: ControlButtonProps) {
  const controlClassName = `${styles.control} ${styles[variant]} ${styles[size]} ${className}`;
  const content = <ControlContent iconLeft={iconLeft} iconRight={iconRight}>{children}</ControlContent>;

  if (disabled) {
    return <span className={controlClassName} aria-disabled="true" data-control-state="disabled">{content}</span>;
  }

  if (onClick) {
    return <button aria-label={ariaLabel} className={controlClassName} data-project-action={dataAction} onClick={onClick} type={buttonType}>{content}</button>;
  }

  if (href && external) {
    return <a aria-label={ariaLabel} className={controlClassName} data-project-action={dataAction} href={href} target="_blank" rel="noreferrer">{content}</a>;
  }

  if (href) {
    return (
      <ContextLink
        aria-label={ariaLabel}
        className={controlClassName}
        href={href}
        breadcrumbLabel={breadcrumbLabel}
        breadcrumbTrail={breadcrumbTrail}
        resetBreadcrumbs={resetBreadcrumbs}
      >
        {content}
      </ContextLink>
    );
  }

  return <span className={controlClassName}>{content}</span>;
}

type NavigationTabProps = IconProps & {
  children: ReactNode;
  className?: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  resetBreadcrumbs?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function NavigationTab({
  children,
  className = "",
  href,
  active = false,
  disabled = false,
  resetBreadcrumbs,
  onClick,
  iconLeft,
  iconRight,
}: NavigationTabProps) {
  const tabClassName = `${styles.tab} ${active ? styles.tabActive : ""} ${className}`;
  const content = <ControlContent iconLeft={iconLeft} iconRight={iconRight}>{children}</ControlContent>;

  if (disabled || !href) {
    return <span className={tabClassName} aria-disabled="true" data-control-state="disabled">{content}</span>;
  }

  return (
    <ContextLink
      className={tabClassName}
      href={href}
      resetBreadcrumbs={resetBreadcrumbs}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      {content}
    </ContextLink>
  );
}

type TextButtonProps = IconProps & {
  children: ReactNode;
  className?: string;
  href?: string;
  external?: boolean;
  disabled?: boolean;
  size?: "small" | "medium";
  breadcrumbTrail?: readonly NavigationTrailItem[];
  resetBreadcrumbs?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function TextButton({
  children,
  className = "",
  href,
  external = false,
  disabled = false,
  size = "medium",
  breadcrumbTrail,
  resetBreadcrumbs,
  onClick,
  iconLeft,
  iconRight,
}: TextButtonProps) {
  const textClassName = `${styles.textControl} ${styles[`text${size === "small" ? "Small" : "Medium"}`]} ${className}`;
  const content = <ControlContent iconLeft={iconLeft} iconRight={iconRight}>{children}</ControlContent>;

  if (disabled || !href) {
    return <span className={textClassName} aria-disabled="true" data-control-state="disabled">{content}</span>;
  }

  if (external) {
    return <a className={textClassName} href={href} target="_blank" rel="noreferrer">{content}</a>;
  }

  return (
    <ContextLink
      className={textClassName}
      href={href}
      breadcrumbTrail={breadcrumbTrail}
      resetBreadcrumbs={resetBreadcrumbs}
      onClick={onClick}
    >
      {content}
    </ContextLink>
  );
}
