"use client";

import { useState } from "react";

type ProjectShareButtonProps = {
  className: string;
  title: string;
};

async function copyCurrentUrl(): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(window.location.href);
      return true;
    }
  } catch {
    // Continue with the document-based fallback when clipboard permission is unavailable.
  }

  const input = document.createElement("textarea");
  input.value = window.location.href;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  try {
    document.body.appendChild(input);
    input.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    input.remove();
  }
}

export function ProjectShareButton({ className, title }: ProjectShareButtonProps) {
  const [announcement, setAnnouncement] = useState("");

  async function handleShare(): Promise<void> {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: window.location.href });
        setAnnouncement("Ссылка отправлена");
        return;
      }

      const copied = await copyCurrentUrl();
      setAnnouncement(copied ? "Ссылка скопирована" : "Не удалось скопировать ссылку");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const copied = await copyCurrentUrl();
      setAnnouncement(copied ? "Ссылка скопирована" : "Не удалось скопировать ссылку");
    }
  }

  return (
    <>
      <button className={className} type="button" onClick={handleShare}>Поделиться</button>
      <span aria-live="polite" className="visually-hidden">{announcement}</span>
    </>
  );
}
