"use client";

import { useEffect, useRef, useState } from "react";
import { getCanonicalProjectUrl } from "../lib/project-share";

type ProjectShareButtonProps = {
  className: string;
  onShare: () => Promise<void>;
};

async function copyCurrentUrl(): Promise<boolean> {
  const payload = getCanonicalProjectUrl(window.location);
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(payload);
    return true;
  } catch {
    return false;
  }
}

export function useProjectShare() {
  const [announcement, setAnnouncement] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackRevision, setFeedbackRevision] = useState(0);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
  }, []);

  async function handleShare(): Promise<void> {
    const copied = await copyCurrentUrl();
    setAnnouncement(copied ? "Скопировано" : "Не удалось скопировать ссылку");
    setFeedbackOpen(copied);
    if (!copied) return;
    setFeedbackRevision((revision) => revision + 1);
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setFeedbackOpen(false), 1600);
  }

  return { announcement, feedbackOpen, feedbackRevision, handleShare };
}

export function ProjectShareButton({ className, onShare }: ProjectShareButtonProps) {
  return (
    <button className={className} type="button" data-project-action="share" onClick={onShare}>Поделиться</button>
  );
}
