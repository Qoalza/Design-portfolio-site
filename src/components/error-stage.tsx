"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { calculateErrorStageScale } from "../lib/error-layout";

export function ErrorStage({ className, children }: { className: string; children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const updateScale = () => {
      stage.style.setProperty("--stage-scale", String(calculateErrorStageScale(window.innerHeight)));
    };

    updateScale();
    window.addEventListener("resize", updateScale, { passive: true });
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return <div ref={stageRef} className={className} data-error-stage>{children}</div>;
}
