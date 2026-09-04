import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { lstat, readFile, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? "");
const targetSha = process.argv[3] ?? "";
if (!root || !/^[a-f0-9]{40}$/.test(targetSha)) throw new Error("Manifest validator requires an exact root and SHA.");
const canonicalRoot = await realpath(root);
async function hash(file) { const digest = createHash("sha256"); for await (const chunk of createReadStream(file)) digest.update(chunk); return digest.digest("hex"); }
async function inventory(directory = canonicalRoot) {
  const entries = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, item.name); const relative = path.relative(canonicalRoot, absolute).split(path.sep).join("/"); const metadata = await lstat(absolute);
    if (metadata.isSymbolicLink()) throw new Error(`Release contains symlink ${relative}.`);
    if (metadata.isDirectory()) entries.push(...await inventory(absolute));
    else if (metadata.isFile() && relative !== "RELEASE_MANIFEST.json") entries.push({ path: relative, bytes: (await stat(absolute)).size, sha256: await hash(absolute) });
    else if (!metadata.isFile()) throw new Error(`Release contains unsupported entry ${relative}.`);
  }
  return entries.sort((left, right) => left.path.localeCompare(right.path));
}
const manifest = JSON.parse(await readFile(path.join(canonicalRoot, "RELEASE_MANIFEST.json"), "utf8"));
if (manifest?.protocol !== "art-des-deploy-v2" || manifest.targetSha !== targetSha || !Array.isArray(manifest.entries)) throw new Error("Release manifest contract is invalid.");
if ((await readFile(path.join(canonicalRoot, "DEPLOY_SHA"), "utf8")).trim() !== targetSha) throw new Error("DEPLOY_SHA does not match the release target.");
if (JSON.stringify(await inventory()) !== JSON.stringify(manifest.entries)) throw new Error("Release files do not match the SHA-256 manifest.");
