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
  navigationTrailsEqual,
  readNavigationTrailFromHistoryState,
  resolveNavigationTrailForRoute,
  trailEndsAtPathname,
  type NavigationTrailItem,
  writeNavigationTrailToHistoryState,
} from "../lib/navigation-trail";
import { scrollToHash } from "./navigation-scroll-controller";

export type NavigationPage = {
  item: NavigationTrailItem;
  canonicalTrail: NavigationTrailItem[];
};

type NavigationContextValue = {
  trail: NavigationTrailItem[];
  pendingTrail: NavigationTrailItem[] | null;
  activatePage: (page: NavigationPage) => void;
  prepareNavigation: (
    item: NavigationTrailItem,
    explicitTrail?: readonly NavigationTrailItem[],
  ) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);
const reloadTrailStorageKey = "portfolioNavigationTrailForReload";

function readReloadTrail(): NavigationTrailItem[] | null {
  const navigationEntry = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;

  if (navigationEntry?.type !== "reload") {
    return null;
  }

  try {
    const value: unknown = JSON.parse(window.sessionStorage.getItem(reloadTrailStorageKey) ?? "null");
    return Array.isArray(value) ? readNavigationTrailFromHistoryState({ __portfolioNavigationTrail: value }) : null;
  } catch {
    return null;
  }
}

function storeTrail(trail: readonly NavigationTrailItem[]): void {
  window.history.replaceState(
    writeNavigationTrailToHistoryState(window.history.state, trail),
    "",
  );

  try {
    window.sessionStorage.setItem(reloadTrailStorageKey, JSON.stringify(trail));
  } catch {
    // History state remains the primary source when session storage is unavailable.
  }
}

export function NavigationTrailProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [trail, setTrail] = useState<NavigationTrailItem[]>([]);
  const [pendingTrail, setPendingTrail] = useState<NavigationTrailItem[] | null>(null);
  const trailRef = useRef<NavigationTrailItem[]>([]);
  const pendingTrailRef = useRef<NavigationTrailItem[] | null>(null);

  useLayoutEffect(() => {
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    function trailForDestination(url?: string | URL | null): NavigationTrailItem[] | null {
      const destinationPathname = new URL(url ?? window.location.href, window.location.href).pathname;
      const pending = pendingTrailRef.current;

      if (pending && trailEndsAtPathname(pending, destinationPathname)) {
        return pending;
      }

      const stored = readNavigationTrailFromHistoryState(window.history.state);
      return stored && trailEndsAtPathname(stored, destinationPathname) ? stored : null;
    }

    const pushState: History["pushState"] = (data, unused, url) => {
      const destinationTrail = trailForDestination(url);
      originalPushState(
        destinationTrail ? writeNavigationTrailToHistoryState(data, destinationTrail) : data,
        unused,
        url,
      );
    };
    const replaceState: History["replaceState"] = (data, unused, url) => {
      const destinationTrail = trailForDestination(url);
      originalReplaceState(
        destinationTrail ? writeNavigationTrailToHistoryState(data, destinationTrail) : data,
        unused,
        url,
      );
    };

    window.history.pushState = pushState;
    window.history.replaceState = replaceState;

    return () => {
      if (window.history.pushState === pushState) {
        window.history.pushState = originalPushState;
      }
      if (window.history.replaceState === replaceState) {
        window.history.replaceState = originalReplaceState;
      }
    };
  }, []);

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
    const storedTrail = readNavigationTrailFromHistoryState(window.history.state) ?? readReloadTrail();
    const nextTrail = resolveNavigationTrailForRoute({
      pathname: currentPathname,
      pendingTrail,
      storedTrail,
      canonicalTrail: page.canonicalTrail,
    });

    pendingTrailRef.current = null;
    setPendingTrail(null);
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
    setPendingTrail(nextTrail);
  }, []);

  useLayoutEffect(() => {
    const pendingTrail = pendingTrailRef.current;
    const storedTrail = readNavigationTrailFromHistoryState(window.history.state);

    if (!pendingTrail && !storedTrail) {
      return;
    }

    const nextTrail = resolveNavigationTrailForRoute({
      pathname,
      pendingTrail,
      storedTrail,
      canonicalTrail: [],
    });

    if (nextTrail.length === 0 || !trailEndsAtPathname(nextTrail, pathname)) {
      return;
    }

    pendingTrailRef.current = null;
    updateTrail(nextTrail);
    storeTrail(nextTrail);
  }, [pathname, updateTrail]);

  useLayoutEffect(() => {
    function handlePopState(event: PopStateEvent): void {
      pendingTrailRef.current = null;
      setPendingTrail(null);
      const storedTrail = readNavigationTrailFromHistoryState(event.state);

      updateTrail(
        storedTrail && trailEndsAtPathname(storedTrail, window.location.pathname)
          ? storedTrail
          : [],
      );

      if (storedTrail && trailEndsAtPathname(storedTrail, window.location.pathname)) {
        try {
          window.sessionStorage.setItem(reloadTrailStorageKey, JSON.stringify(storedTrail));
        } catch {
          // The history entry still restores correctly without the reload fallback.
        }
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [updateTrail]);

  const contextValue = useMemo<NavigationContextValue>(() => ({
    trail,
    pendingTrail,
    activatePage,
    prepareNavigation,
  }), [activatePage, pendingTrail, prepareNavigation, trail]);

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

  const pagePathname = new URL(page.item.href, "https://portfolio.local").pathname;

  if (trailEndsAtPathname(context.trail, pagePathname)) {
    return context.trail;
  }

  if (context.pendingTrail && trailEndsAtPathname(context.pendingTrail, pagePathname)) {
    return context.pendingTrail;
  }

  return page.canonicalTrail;
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
