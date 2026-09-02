import { readFile } from "node:fs/promises";
import path from "node:path";

import { saveLiveTransitionRequest } from "./live-transition.mjs";

function usage() {
  return "Usage: node tools/des-art-admin/prepare-live-transition.mjs --support-root <absolute-path> --selection <clean|delta> [--units-file <absolute-json-path>]";
}

export function parseTransitionRequestArgs(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined || values.has(key)) throw new Error(usage());
    values.set(key, value);
  }
  if ([...values.keys()].some((key) => !["--support-root", "--selection", "--units-file"].includes(key))) throw new Error(usage());
  const supportRoot = values.get("--support-root");
  const selection = values.get("--selection");
  const unitsFile = values.get("--units-file");
  if (!supportRoot || !path.isAbsolute(supportRoot) || !["clean", "delta"].includes(selection ?? "")) throw new Error(usage());
  if (unitsFile && !path.isAbsolute(unitsFile)) throw new Error("Transition units file must be an absolute path.");
  if (selection === "clean" && unitsFile) throw new Error("A clean baseline cannot include selected sandbox units.");
  return { supportRoot: path.resolve(supportRoot), selection, unitsFile };
}

export async function loadTransitionUnits(unitsFile) {
  if (!unitsFile) return undefined;
  const units = JSON.parse(await readFile(unitsFile, "utf8"));
  if (!Array.isArray(units)) throw new Error("Transition units file must contain a JSON array.");
  return units;
}

async function main() {
  const { supportRoot, selection, unitsFile } = parseTransitionRequestArgs(process.argv.slice(2));
  await recordTransitionRequest({ supportRoot, selection, unitsFile });
  // This command does not start Admin, archive data, or publish.
  process.stdout.write(`Saved local ${selection} live-transition request. No data was moved.\n`);
}

export async function recordTransitionRequest({ supportRoot, selection, unitsFile }) {
  const units = await loadTransitionUnits(unitsFile);
  return saveLiveTransitionRequest({ supportRoot, selection, units });
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
