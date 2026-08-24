const FULL_GIT_SHA = /^[0-9a-f]{40}$/i;

export function getBuildShaAttribute(value: string | undefined): string | undefined {
  return value && FULL_GIT_SHA.test(value) ? value : undefined;
}

export function isExpectedBuildSha(
  actual: string | undefined,
  expected: string,
): boolean {
  return Boolean(
    actual &&
      FULL_GIT_SHA.test(actual) &&
      FULL_GIT_SHA.test(expected) &&
      actual === expected,
  );
}
