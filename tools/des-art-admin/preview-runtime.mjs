import { createHash } from "node:crypto";
import { realpath, readFile } from "node:fs/promises";
import path from "node:path";

export const PREVIEW_RUNTIME_PROTOCOL = 1;

export async function createPreviewRuntimeIdentity({ repoRoot, sourceFiles, gitSha } = {}) {
  const resolvedRoot = await realpath(repoRoot);
  const digest = createHash("sha256");
  digest.update(`protocol:${PREVIEW_RUNTIME_PROTOCOL}\nroot:${resolvedRoot}\n`);
  for (const relative of [...new Set(sourceFiles ?? [])].sort()) {
    const absolute = path.join(resolvedRoot, relative);
    digest.update(`file:${relative}\n`);
    digest.update(await readFile(absolute));
    digest.update("\n");
  }
  return {
    protocol: PREVIEW_RUNTIME_PROTOCOL,
    repoRoot: resolvedRoot,
    fingerprint: digest.digest("hex"),
    gitSha: /^[0-9a-f]{40}$/i.test(gitSha ?? "") ? gitSha.toLowerCase() : null,
  };
}

export function previewHealthMatches(value, expected) {
  return value?.preview === true
    && value.protocol === expected.protocol
    && value.repoRoot === expected.repoRoot
    && value.fingerprint === expected.fingerprint
    && (value.gitSha ?? null) === (expected.gitSha ?? null);
}
