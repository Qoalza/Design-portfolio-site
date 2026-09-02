import { spawn } from "node:child_process";
import { access, mkdir, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";

function usage() {
  return "Usage: node tools/des-art-admin/run-candidate-sandbox.mjs --support-root <empty-temporary-directory> [--repo-root <absolute-path>] [--port <1024-65535>] [--preview-port <1024-65535>]";
}

function validPort(value) {
  return Number.isInteger(value) && value >= 1024 && value <= 65535;
}

export function assertCandidateSandboxSupportRoot(supportRoot) {
  const temporaryRoot = path.resolve(os.tmpdir());
  const candidateRoot = path.resolve(supportRoot);
  const relative = path.relative(temporaryRoot, candidateRoot);
  if (!relative || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("Candidate sandbox support root must be inside the system temporary directory.");
  }
  return candidateRoot;
}

export function parseCandidateSandboxArgs(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined || values.has(key)) throw new Error(usage());
    values.set(key, value);
  }
  if ([...values.keys()].some((key) => !["--support-root", "--repo-root", "--port", "--preview-port"].includes(key))) throw new Error(usage());
  const supportRoot = values.get("--support-root");
  if (!supportRoot) throw new Error(usage());
  const port = Number(values.get("--port") ?? 42731);
  const previewPort = Number(values.get("--preview-port") ?? 42732);
  if (!validPort(port) || !validPort(previewPort) || port === previewPort) throw new Error("Candidate sandbox ports must be distinct numbers from 1024 through 65535.");
  const repoRoot = path.resolve(values.get("--repo-root") ?? process.cwd());
  return { supportRoot: assertCandidateSandboxSupportRoot(supportRoot), repoRoot, port, previewPort };
}

export function candidateSandboxEnvironment({ repoRoot, supportRoot, port, previewPort }) {
  return {
    ...process.env,
    DES_ART_ADMIN_REPO: repoRoot,
    DES_ART_ADMIN_SUPPORT: supportRoot,
    DES_ART_ADMIN_PORT: String(port),
    DES_ART_PREVIEW_PORT: String(previewPort),
    DES_ART_ADMIN_PUBLISH_MODE: "sandbox",
  };
}

async function main() {
  const options = parseCandidateSandboxArgs(process.argv.slice(2));
  await access(path.join(options.repoRoot, "tools", "des-art-admin", "server.mjs"));
  await mkdir(options.supportRoot, { recursive: true });
  if ((await readdir(options.supportRoot)).length) throw new Error("Candidate sandbox support root must be empty.");
  const child = spawn(process.execPath, ["--experimental-strip-types", "tools/des-art-admin/server.mjs"], {
    cwd: options.repoRoot,
    env: candidateSandboxEnvironment(options),
    stdio: "inherit",
  });
  const exited = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`Candidate Admin server exited with status ${code ?? "unknown"}.`)));
  });
  const ready = new Promise((resolve, reject) => {
    const deadline = Date.now() + 30_000;
    const check = () => {
      const request = http.get({ hostname: "127.0.0.1", port: options.port, path: "/", timeout: 600 }, (response) => {
        response.resume();
        if (response.statusCode === 200) resolve(); else retry();
      });
      const retry = () => Date.now() >= deadline ? reject(new Error("Candidate Admin sandbox did not become ready.")) : setTimeout(check, 150);
      request.on("error", retry); request.on("timeout", () => { request.destroy(); retry(); });
    };
    check();
  });
  await Promise.race([ready, exited]);
  process.stdout.write(`Candidate Admin sandbox: http://127.0.0.1:${options.port}/\n`);
  await exited;
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
