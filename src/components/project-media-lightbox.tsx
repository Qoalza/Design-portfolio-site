"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./project-media-lightbox.module.css";

type ProjectMediaLightboxProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export function ProjectMediaLightbox({
  src,
  alt,
  width,
  height,
}: ProjectMediaLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;

    if (!dialog || !isOpen) {
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - root.clientWidth;

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    dialog.focus({ preventScroll: true });

    return () => {
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
      trigger?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-label={`Увеличить изображение: ${alt}`}
        onClick={() => setIsOpen(true)}
      >
        <Image src={src} alt={alt} width={width} height={height} sizes="720px" />
      </button>

      {isOpen ? (
        <div
          ref={dialogRef}
          className={styles.dialog}
          role="dialog"
          aria-modal="true"
          aria-label={`Увеличенное изображение: ${alt}`}
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
            }

            if (event.key === "Tab") {
              event.preventDefault();
              dialogRef.current?.focus({ preventScroll: true });
            }
          }}
          onClick={() => setIsOpen(false)}
        >
          <Image
            className={styles.expandedImage}
            src={src}
            alt={alt}
            width={width}
            height={height}
            sizes="calc(100vw - 96px)"
            unoptimized
            priority
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
