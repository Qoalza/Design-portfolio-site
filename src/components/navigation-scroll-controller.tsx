"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

const scrollRestorationScript = `
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
`;

function scrollToTopInstantly(): void {
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

  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;

  root.style.scrollBehavior = "auto";
  root.getClientRects();
  target.scrollIntoView();
  root.style.scrollBehavior = previousScrollBehavior;
}

export function NavigationScrollController() {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;

    function handlePopState(): void {
      const { hash } = window.location;

      if (!hash) {
        scrollToTopInstantly();
      }
    }

    window.history.scrollRestoration = "manual";
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
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

  return <script dangerouslySetInnerHTML={{ __html: scrollRestorationScript }} />;
}
