export function getCanonicalProjectUrl(location: Pick<Location, "origin" | "pathname">): string {
  return `${location.origin}${location.pathname}`;
}
