"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  appendNavigationTrail,
  HOME_TRAIL_ITEM,
  isNavigationTrail,
  navigationTrailsEqual,
  trailEndsAtPathname,
  type NavigationTrailItem,
} from "../lib/navigation-trail";
import { scrollToHash } from "./navigation-scroll-controller";

const historyStateKey = "__portfolioNavigationTrail";

export type NavigationPage = {
  item: NavigationTrailItem;
  canonicalTrail: NavigationTrailItem[];
};

type NavigationContextValue = {
  trail: NavigationTrailItem[];
  activatePage: (page: NavigationPage) => void;
  prepareNavigation: (
    item: NavigationTrailItem,
    explicitTrail?: readonly NavigationTrailItem[],
  ) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

function readStoredTrail(state: unknown): NavigationTrailItem[] | null {
  if (typeof state !== "object" || state === null || !(historyStateKey in state)) {
    return null;
  }

  const value = (state as Record<string, unknown>)[historyStateKey];
  return isNavigationTrail(value) ? value : null;
}

function storeTrail(trail: readonly NavigationTrailItem[]): void {
  const currentState = typeof window.history.state === "object" && window.history.state !== null
    ? window.history.state as Record<string, unknown>
    : {};

  window.history.replaceState({
    ...currentState,
    [historyStateKey]: trail,
  }, "");
}

export function NavigationTrailProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [trail, setTrail] = useState<NavigationTrailItem[]>([]);
  const trailRef = useRef<NavigationTrailItem[]>([]);
  const pendingTrailRef = useRef<NavigationTrailItem[] | null>(null);

  const updateTrail = useCallback((nextTrail: readonly NavigationTrailItem[]) => {
    const copiedTrail = [...nextTrail];
    trailRef.current = copiedTrail;
    setTrail((currentTrail) => (
      navigationTrailsEqual(currentTrail, copiedTrail) ? currentTrail : copiedTrail
    ));
  }, []);

  const activatePage = useCallback((page: NavigationPage) => {
    const currentPathname = window.location.pathname;
    const pendingTrail = pendingTrailRef.current;
    const storedTrail = readStoredTrail(window.history.state);
    const nextTrail = pendingTrail && trailEndsAtPathname(pendingTrail, currentPathname)
      ? pendingTrail
      : storedTrail && trailEndsAtPathname(storedTrail, currentPathname)
        ? storedTrail
        : page.canonicalTrail;

    pendingTrailRef.current = null;
    updateTrail(nextTrail);
    storeTrail(nextTrail);
  }, [updateTrail]);

  const prepareNavigation = useCallback((
    item: NavigationTrailItem,
    explicitTrail?: readonly NavigationTrailItem[],
  ) => {
    const currentTrail = trailRef.current.length > 0 ? trailRef.current : [HOME_TRAIL_ITEM];
    const nextTrail = explicitTrail
      ? [...explicitTrail]
      : appendNavigationTrail(currentTrail, item);

    pendingTrailRef.current = nextTrail;
    updateTrail(nextTrail);
  }, [updateTrail]);

  useLayoutEffect(() => {
    const pendingTrail = pendingTrailRef.current;
    const storedTrail = readStoredTrail(window.history.state);
    const nextTrail = pendingTrail && trailEndsAtPathname(pendingTrail, pathname)
      ? pendingTrail
      : storedTrail && trailEndsAtPathname(storedTrail, pathname)
        ? storedTrail
        : null;

    if (nextTrail) {
      pendingTrailRef.current = null;
      updateTrail(nextTrail);
      storeTrail(nextTrail);
    }
  }, [pathname, updateTrail]);

  useLayoutEffect(() => {
    function handlePopState(event: PopStateEvent): void {
      pendingTrailRef.current = null;
      const storedTrail = readStoredTrail(event.state);

      updateTrail(
        storedTrail && trailEndsAtPathname(storedTrail, window.location.pathname)
          ? storedTrail
          : [],
      );
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [updateTrail]);

  const contextValue = useMemo<NavigationContextValue>(() => ({
    trail,
    activatePage,
    prepareNavigation,
  }), [activatePage, prepareNavigation, trail]);

  return <NavigationContext.Provider value={contextValue}>{children}</NavigationContext.Provider>;
}

export function useNavigationTrail(page: NavigationPage): NavigationTrailItem[] {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error("useNavigationTrail must be used inside NavigationTrailProvider.");
  }

  const { activatePage } = context;

  useLayoutEffect(() => {
    activatePage(page);
  }, [activatePage, page]);

  return trailEndsAtPathname(context.trail, new URL(page.item.href, "https://portfolio.local").pathname)
    ? context.trail
    : page.canonicalTrail;
}

type ContextLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  breadcrumbLabel?: string;
  breadcrumbTrail?: readonly NavigationTrailItem[];
  resetBreadcrumbs?: boolean;
};

export function ContextLink({
  href,
  breadcrumbLabel,
  breadcrumbTrail,
  resetBreadcrumbs = false,
  onClick,
  ...props
}: ContextLinkProps) {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error("ContextLink must be used inside NavigationTrailProvider.");
  }

  const { prepareNavigation } = context;

  function prepareContext(): void {
    const explicitTrail = resetBreadcrumbs ? [HOME_TRAIL_ITEM] : breadcrumbTrail;
    const label = breadcrumbLabel ?? explicitTrail?.at(-1)?.label;

    if (label) {
      prepareNavigation({ href, label }, explicitTrail);
    }
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>): void {
    onClick?.(event);

    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) {
      return;
    }

    const destination = new URL(href, window.location.href);

    if (
      destination.origin === window.location.origin
      && destination.pathname === window.location.pathname
      && destination.search === window.location.search
      && destination.hash
    ) {
      event.preventDefault();

      if (destination.href !== window.location.href) {
        const currentState = typeof window.history.state === "object" && window.history.state !== null
          ? window.history.state as Record<string, unknown>
          : {};

        window.history.pushState({ ...currentState }, "", destination.href);
      }

      scrollToHash(destination.hash);
      return;
    }

    prepareContext();
  }

  return <Link {...props} href={href} onClick={handleClick} />;
}
