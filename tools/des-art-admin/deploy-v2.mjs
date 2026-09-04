import { createHash } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { cp, lstat, mkdir, mkdtemp, readdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
export const DEPLOY_V2_PROTOCOL = "art-des-deploy-v2";
export const MAX_RUNTIME_ARCHIVE_BYTES = 75 * 1024 * 1024;
const VALID_STATES = new Set(["queued", "running", "complete", "failed"]);
const VALID_PHASES = new Set(["validate", "activate", "readiness", "retention", "complete"]);
export const UPLOAD_NO_PROGRESS_TIMEOUT_MS = 90_000;
export const UPLOAD_HARD_TIMEOUT_MS = 15 * 60_000;
export const SERVER_OPERATION_TIMEOUT_MS = 10 * 60_000;

const sshBaseArgs = (config) => [
  "-o", "BatchMode=yes",
  "-o", "ConnectTimeout=15",
  "-o", "ServerAliveInterval=15",
  "-o", "ServerAliveCountMax=4",
  "-i", config.keyPath,
  `${config.user}@${config.host}`,
];

async function fileSha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

async function runtimeEntries(root, directory = root) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    if (entry.isSymbolicLink()) throw new Error(`Runtime release cannot contain symbolic links: ${relative}`);
    if (entry.isDirectory()) output.push(...await runtimeEntries(root, absolute));
    else if (entry.isFile()) output.push({ path: relative, bytes: (await stat(absolute)).size, sha256: await fileSha256(absolute) });
    else throw new Error(`Runtime release contains an unsupported entry: ${relative}`);
  }
  return output.sort((left, right) => left.path.localeCompare(right.path));
}

async function copyDirectoryContents(source, destination) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    await cp(path.join(source, entry.name), path.join(destination, entry.name), { recursive: true, force: true });
  }
}

export async function createRuntimeReleaseArchive({ archive, sourceRoot, sha, execImpl = exec }) {
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("Runtime release SHA must be a full Git SHA.");
  const standaloneRoot = path.join(sourceRoot, ".next", "standalone");
  if (!(await lstat(path.join(standaloneRoot, "server.js")).catch(() => null))?.isFile()) {
    throw new Error("Next standalone server is missing. Run the exact production build first.");
  }
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "art-des-runtime-release-"));
  const releaseRoot = path.join(temporaryRoot, "release");
  try {
    await mkdir(releaseRoot, { recursive: true });
    await copyDirectoryContents(standaloneRoot, releaseRoot);
    await cp(path.join(sourceRoot, ".next", "static"), path.join(releaseRoot, ".next", "static"), { recursive: true, force: true });
    await cp(path.join(sourceRoot, "public"), path.join(releaseRoot, "public"), { recursive: true, force: true });
    await writeFile(path.join(releaseRoot, "DEPLOY_SHA"), `${sha}\n`, { mode: 0o644 });
    const entries = await runtimeEntries(releaseRoot);
    await writeFile(path.join(releaseRoot, "RELEASE_MANIFEST.json"), `${JSON.stringify({
      protocol: DEPLOY_V2_PROTOCOL,
      targetSha: sha,
      entries,
    }, null, 2)}\n`, { mode: 0o644 });
    await execImpl("tar", ["--no-mac-metadata", "--no-xattrs", "--no-acls", "--no-fflags", "-czf", archive, "-C", releaseRoot, "."], {
      env: { ...process.env, COPYFILE_DISABLE: "1" },
      maxBuffer: 10 * 1024 * 1024,
    });
    const bytes = (await stat(archive)).size;
    if (bytes > MAX_RUNTIME_ARCHIVE_BYTES) throw new Error(`Runtime release is ${bytes} bytes; maximum is ${MAX_RUNTIME_ARCHIVE_BYTES}.`);
    return { sha, bytes, artifactSha256: await fileSha256(archive), entries: entries.length };
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

export function parseDeployStatusV2(output) {
  let value;
  try { value = JSON.parse(output); } catch { throw new Error("Deploy v2 status is not valid JSON."); }
  if (value?.protocol !== DEPLOY_V2_PROTOCOL
    || typeof value.operationId !== "string"
    || !/^[a-f0-9]{40}-[a-f0-9]{16}$/.test(value.operationId)
    || !VALID_STATES.has(value.state)
    || !VALID_PHASES.has(value.phase)
    || !/^[a-f0-9]{40}$/.test(value.targetSha ?? "")
    || typeof value.updatedAt !== "string") throw new Error("Deploy v2 status has an invalid contract.");
  return value;
}

export async function uploadRuntimeRelease({
  archive,
  config,
  sha,
  artifactSha256,
  bytes,
  onProgress = () => {},
  spawnImpl = spawn,
  noProgressTimeoutMs = UPLOAD_NO_PROGRESS_TIMEOUT_MS,
  hardTimeoutMs = UPLOAD_HARD_TIMEOUT_MS,
}) {
  const source = createReadStream(archive);
  await new Promise((resolve, reject) => {
    const child = spawnImpl("ssh", [...sshBaseArgs(config), "upload-v2", sha, artifactSha256, String(bytes)], {
      stdio: ["pipe", "ignore", "pipe"],
    });
    let transferred = 0;
    let stderr = "";
    let settled = false;
    let progressTimer;
    let hardTimer;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimer);
      clearTimeout(progressTimer);
      source.destroy();
      if (error) reject(error); else resolve();
    };
    const resetProgressTimer = () => {
      clearTimeout(progressTimer);
      progressTimer = setTimeout(() => {
        child.kill("SIGTERM");
        finish(new Error("Release upload made no progress for 90 seconds."));
      }, noProgressTimeoutMs);
    };
    hardTimer = setTimeout(() => {
      child.kill("SIGTERM");
      finish(new Error("Release upload exceeded the 15 minute limit."));
    }, hardTimeoutMs);
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    source.on("data", (chunk) => {
      transferred += chunk.length;
      onProgress({ bytesTransferred: transferred, bytesTotal: bytes });
      resetProgressTimer();
    });
    source.on("error", finish);
    child.on("error", finish);
    child.on("close", (code) => finish(code === 0 ? undefined : new Error(stderr.trim() || `Release upload failed with exit code ${code}.`)));
    resetProgressTimer();
    source.pipe(child.stdin);
  });
}

export async function startDeployOperation({ command, config, sha, artifactSha256 }) {
  const { stdout = "" } = await command("deploy.start-v2", "ssh", [
    ...sshBaseArgs(config), "start-v2", sha, artifactSha256,
  ], { maxBuffer: 10 * 1024 * 1024 });
  const status = parseDeployStatusV2(stdout);
  if (status.targetSha !== sha) throw new Error("Deploy v2 started a different target SHA.");
  return status;
}

export async function readDeployOperation({ command, config, operationId }) {
  const { stdout = "" } = await command("deploy.status-v2", "ssh", [
    ...sshBaseArgs(config), "status-v2", operationId,
  ], { maxBuffer: 10 * 1024 * 1024 });
  return parseDeployStatusV2(stdout);
}

export async function waitForDeployOperation({
  command,
  config,
  operation,
  onStatus = () => {},
  timeoutMs = SERVER_OPERATION_TIMEOUT_MS,
  pollIntervalMs = 2_000,
}) {
  const started = Date.now();
  let status = operation;
  for (;;) {
    onStatus(status);
    if (status.state === "complete") return status;
    if (status.state === "failed") throw new Error(`Server deploy failed (${status.errorCode ?? "DEPLOY_FAILED"}).`);
    if (Date.now() - started >= timeoutMs) throw new Error("Server deploy exceeded the 10 minute limit.");
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    status = await readDeployOperation({ command, config, operationId: operation.operationId });
  }
}

export async function resolveFreshDeployTarget({ command, cwd, contentCommit, savedMergeSha, productionSha }) {
  for (const candidate of [contentCommit, savedMergeSha, productionSha]) {
    if (!/^[a-f0-9]{40}$/.test(candidate ?? "")) throw new Error("Deploy ancestry requires full Git SHAs.");
  }
  await command("deploy-target.fetch", "git", ["fetch", "origin", "main"], { cwd });
  const { stdout = "" } = await command("deploy-target.resolve", "git", ["rev-parse", "origin/main"], { cwd });
  const freshMain = stdout.trim();
  if (!/^[a-f0-9]{40}$/.test(freshMain)) throw new Error("Fresh origin/main SHA is invalid.");
  for (const ancestor of [contentCommit, savedMergeSha, productionSha]) {
    await command("deploy-target.ancestry", "git", ["merge-base", "--is-ancestor", ancestor, freshMain], { cwd });
  }
  return freshMain;
}

async function requirePage(fetchImpl, url) {
  const response = await fetchImpl(url, { redirect: "error" });
  if (!response.ok) throw new Error(`Public route ${url} returned ${response.status}.`);
  return response.text();
}

export async function verifyPublicRelease({ baseUrl, sha, project, fetchImpl = fetch }) {
  const root = await requirePage(fetchImpl, `${baseUrl}/`);
  if (!root.includes(sha)) throw new Error("Public build SHA marker does not match the deploy target.");
  await requirePage(fetchImpl, `${baseUrl}/projects`);
  if (project) {
    const detail = await requirePage(fetchImpl, `${baseUrl}/projects/${encodeURIComponent(project.slug)}`);
    if (!detail.includes(project.title)) throw new Error("Public project marker is missing; a custom 404 cannot pass verification.");
    for (const asset of project.assets ?? []) {
      const response = await fetchImpl(new URL(asset, baseUrl), { redirect: "error" });
      if (!response.ok) throw new Error(`Public project asset ${asset} returned ${response.status}.`);
    }
  }
  return { verified: true, sha };
}
