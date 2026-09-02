import { randomUUID } from "node:crypto";
import path from "node:path";

import { saveLiveTransitionRequest } from "./live-transition.mjs";

function usage() {
  return "Usage: node tools/des-art-admin/prepare-live-transition.mjs --support-root <absolute-path> --choice <clean|overlay> --target-sha <40-char-sha>";
}

export function parseTransitionRequestArgs(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined || values.has(key)) throw new Error(usage());
    values.set(key, value);
  }
  if ([...values.keys()].some((key) => !["--support-root", "--choice", "--target-sha"].includes(key))) throw new Error(usage());
  const supportRoot = values.get("--support-root");
  const choice = values.get("--choice");
  const targetSha = values.get("--target-sha");
  if (!supportRoot || !path.isAbsolute(supportRoot) || !["clean", "overlay"].includes(choice ?? "") || !/^[0-9a-f]{40}$/i.test(targetSha ?? "")) throw new Error(usage());
  return { supportRoot: path.resolve(supportRoot), choice, targetSha: targetSha.toLowerCase() };
}

async function main() {
  const { supportRoot, choice, targetSha } = parseTransitionRequestArgs(process.argv.slice(2));
  await recordTransitionRequest({ supportRoot, choice, targetSha });
  // This command does not start Admin, archive data, or publish.
  process.stdout.write(`Saved local ${choice} live-transition request. No data was moved.\n`);
}

export async function recordTransitionRequest({ supportRoot, choice, targetSha, transitionId = randomUUID(), requestedAt = new Date().toISOString() }) {
  return saveLiveTransitionRequest({ supportRoot, choice, targetSha, transitionId, requestedAt });
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
