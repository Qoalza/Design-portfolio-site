"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./project-media-lightbox.module.css";

type ProjectMediaLightboxProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  fit?: "cover" | "contain";
  priority?: boolean;
  sizes?: string;
};

export function ProjectMediaLightbox({
  src,
  alt,
  width,
  height,
  fit = "cover",
  priority = false,
  sizes = "720px",
}: ProjectMediaLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;

    if (!dialog || !isOpen) return;

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
    dialog.showModal();

    return () => {
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
      if (dialog.open) dialog.close();
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
        data-image-fit={fit}
        onClick={() => setIsOpen(true)}
      >
        <Image src={src} alt={alt} width={width} height={height} sizes={sizes} unoptimized priority={priority} />
      </button>

      {isOpen ? createPortal(
        <dialog
          ref={dialogRef}
          className={styles.dialog}
          aria-label={`Увеличенное изображение: ${alt}`}
          onCancel={(event) => { event.preventDefault(); setIsOpen(false); }}
          onClick={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}
        >
          <div className={styles.dialogContent}>
            <button className={styles.closeButton} type="button" onClick={() => setIsOpen(false)}>Закрыть</button>
            <Image
              className={styles.expandedImage}
              src={src}
              alt={alt}
              width={width}
              height={height}
              sizes="calc(100vw - 96px)"
              unoptimized
              priority
            />
          </div>
        </dialog>,
        document.body,
      ) : null}
    </>
  );
}
