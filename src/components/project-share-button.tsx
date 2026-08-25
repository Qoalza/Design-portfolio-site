"use client";

import { useEffect, useRef, useState } from "react";

type ProjectShareButtonProps = {
  className: string;
  onShare: () => Promise<void>;
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

export function useProjectShare() {
  const [announcement, setAnnouncement] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
  }, []);

  async function handleShare(): Promise<void> {
    const copied = await copyCurrentUrl();
    setAnnouncement(copied ? "Скопировано" : "Не удалось скопировать ссылку");
    setFeedbackOpen(copied);
    if (!copied) return;
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setFeedbackOpen(false), 1600);
  }

  return { announcement, feedbackOpen, handleShare };
}

export function ProjectShareButton({ className, onShare }: ProjectShareButtonProps) {
  return (
    <button className={className} type="button" data-project-action="share" onClick={onShare}>Поделиться</button>
  );
}
