"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useLayoutEffect, useRef } from "react";
import { getPrimaryScrollController } from "../lib/scroll-controller";

const scrollRestorationScript = `
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
`;

function scrollToTopInstantly(): void {
  const controller = getPrimaryScrollController();
  if (controller) {
    controller.cancel();
    controller.scrollTo(0, { immediate: true });
    return;
  }
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;

  root.style.scrollBehavior = "auto";
  root.getClientRects();
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  root.style.scrollBehavior = previousScrollBehavior;
}

function scrollToHashInstantly(hash: string): void {
  const targetId = decodeURIComponent(hash.slice(1));
  const target = document.getElementById(targetId) ?? document.getElementsByName(targetId)[0];

  if (!target) {
    return;
  }

  const controller = getPrimaryScrollController();
  if (controller) {
    controller.cancel();
    controller.scrollTo(target, { immediate: true });
    return;
  }

  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;

  root.style.scrollBehavior = "auto";
  root.getClientRects();
  target.scrollIntoView();
  root.style.scrollBehavior = previousScrollBehavior;
}

export function scrollToHash(hash: string): void {
  const targetId = decodeURIComponent(hash.slice(1));
  const target = document.getElementById(targetId) ?? document.getElementsByName(targetId)[0];

  if (!target) return;
  const controller = getPrimaryScrollController();
  if (controller) controller.scrollTo(target);
  else target.scrollIntoView();
}

export function NavigationScrollController() {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;

    function handlePopState(): void {
      const { hash } = window.location;

      if (hash) {
        scrollToHash(hash);
        return;
      }

      scrollToTopInstantly();
    }

    function handleHashChange(): void {
      const { hash } = window.location;

      if (hash) {
        scrollToHash(hash);
      }
    }

    window.history.scrollRestoration = "manual";
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handleHashChange);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    const previousPathname = previousPathnameRef.current;
    previousPathnameRef.current = pathname;
    const { hash } = window.location;

    if (hash && previousPathname !== pathname) {
      scrollToHashInstantly(hash);
      return;
    }

    if (!hash && (previousPathname === null || previousPathname !== pathname)) {
      scrollToTopInstantly();
    }
  }, [pathname]);

  return (
    <Script id="navigation-scroll-restoration" strategy="afterInteractive">
      {scrollRestorationScript}
    </Script>
  );
}
