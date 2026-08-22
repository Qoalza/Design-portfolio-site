export type NavigationTrailItem = {
  href: string;
  label: string;
};

export const HOME_TRAIL_ITEM: NavigationTrailItem = {
  href: "/",
  label: "Главная",
};

const historyStateKey = "__portfolioNavigationTrail";

function normalizeHref(href: string): string {
  const url = new URL(href, "https://portfolio.local");
  return `${url.pathname}${url.search}`;
}

function sameDestination(firstHref: string, secondHref: string): boolean {
  return normalizeHref(firstHref) === normalizeHref(secondHref);
}

export function appendNavigationTrail(
  currentTrail: readonly NavigationTrailItem[],
  item: NavigationTrailItem,
): NavigationTrailItem[] {
  const normalizedItem = { ...item, href: normalizeHref(item.href) };
  const existingIndex = currentTrail.findIndex(({ href }) => sameDestination(href, item.href));

  if (existingIndex >= 0) {
    return [
      ...currentTrail.slice(0, existingIndex),
      normalizedItem,
    ];
  }

  return [...currentTrail, normalizedItem];
}

export function truncateNavigationTrail(
  trail: readonly NavigationTrailItem[],
  href: string,
): NavigationTrailItem[] {
  const itemIndex = trail.findIndex((item) => sameDestination(item.href, href));
  return itemIndex >= 0 ? trail.slice(0, itemIndex + 1) : [...trail];
}

export function isNavigationTrail(value: unknown): value is NavigationTrailItem[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => (
    typeof item === "object"
    && item !== null
    && "href" in item
    && typeof item.href === "string"
    && "label" in item
    && typeof item.label === "string"
  ));
}

export function trailEndsAtPathname(
  trail: readonly NavigationTrailItem[],
  pathname: string,
): boolean {
  const lastItem = trail.at(-1);
  return Boolean(lastItem && new URL(lastItem.href, "https://portfolio.local").pathname === pathname);
}

export function navigationTrailsEqual(
  firstTrail: readonly NavigationTrailItem[],
  secondTrail: readonly NavigationTrailItem[],
): boolean {
  return firstTrail.length === secondTrail.length && firstTrail.every((item, index) => (
    item.href === secondTrail[index]?.href && item.label === secondTrail[index]?.label
  ));
}

export function readNavigationTrailFromHistoryState(state: unknown): NavigationTrailItem[] | null {
  if (typeof state !== "object" || state === null || !(historyStateKey in state)) {
    return null;
  }

  const value = (state as Record<string, unknown>)[historyStateKey];
  return isNavigationTrail(value) ? value : null;
}

export function writeNavigationTrailToHistoryState(
  state: unknown,
  trail: readonly NavigationTrailItem[],
): Record<string, unknown> {
  const currentState = typeof state === "object" && state !== null
    ? state as Record<string, unknown>
    : {};

  return {
    ...currentState,
    [historyStateKey]: [...trail],
  };
}

export function resolveNavigationTrailForRoute({
  pathname,
  pendingTrail,
  storedTrail,
  canonicalTrail,
}: {
  pathname: string;
  pendingTrail: readonly NavigationTrailItem[] | null;
  storedTrail: readonly NavigationTrailItem[] | null;
  canonicalTrail: readonly NavigationTrailItem[];
}): NavigationTrailItem[] {
  if (pendingTrail && trailEndsAtPathname(pendingTrail, pathname)) {
    return [...pendingTrail];
  }

  if (storedTrail && trailEndsAtPathname(storedTrail, pathname)) {
    return [...storedTrail];
  }

  return [...canonicalTrail];
}
