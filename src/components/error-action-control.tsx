"use client";

import { ControlButton } from "./ui-controls";

type ErrorActionControlProps = {
  action: "home" | "reload";
  children: string;
  className?: string;
};

export function ErrorActionControl({ action, children, className }: ErrorActionControlProps) {
  const activate = () => {
    if (action === "home") {
      window.location.assign("/");
      return;
    }

    window.location.reload();
  };

  return (
    <ControlButton
      className={className}
      dataAction={`error-${action}`}
      onClick={activate}
      size="large"
      variant="accent"
    >
      {children}
    </ControlButton>
  );
}
