import { execFile, spawn } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const exec = promisify(execFile);
const resources = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(resources, "../../..");
const fallbackSource = path.basename(appRoot) === "dist" ? path.dirname(appRoot) : path.resolve(resources, "../..");
const configuredSource = process.env.DES_ART_ADMIN_SOURCE
  ?? await readFile(path.join(resources, "source-repository.txt"), "utf8").catch(() => fallbackSource);
const sourceRoot = configuredSource.trim();
const supportRoot = path.resolve(
  process.env.DES_ART_ADMIN_SUPPORT
    ?? path.join(os.homedir(), "Library", "Application Support", "Des-art Admin"),
);
const managedRepo = path.join(supportRoot, "repository");
const logsRoot = path.join(supportRoot, "logs");
const adminPort = 41731;
const previewPort = 41732;

function reachable(port) {
  return new Promise((resolve) => {
    const request = http.get({ hostname: "127.0.0.1", port, path: "/", timeout: 500 }, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });
    request.on("error", () => resolve(false));
    request.on("timeout", () => { request.destroy(); resolve(false); });
  });
}

async function openAdmin() {
  await exec("/usr/bin/open", [`http://127.0.0.1:${adminPort}`]);
}

async function ensureManagedRepository() {
  await mkdir(supportRoot, { recursive: true });
  try {
    await access(path.join(managedRepo, ".git"));
  } catch {
    await exec("/usr/bin/git", ["clone", "--no-hardlinks", sourceRoot, managedRepo]);
  }
  try {
    await access(path.join(managedRepo, "node_modules"));
  } catch {
    await exec("npm", ["install", "--no-audit", "--no-fund"], { cwd: managedRepo });
  }
}

async function detached(command, args, name, env = {}) {
  const output = openSync(path.join(logsRoot, `${name}.log`), "a", 0o600);
  try {
    const child = spawn(command, args, { cwd: managedRepo, detached: true, stdio: ["ignore", output, output], env: { ...process.env, ...env } });
    await writeFile(path.join(supportRoot, `${name}.pid`), `${child.pid}\n`, { mode: 0o600 });
    child.unref();
  } finally {
    closeSync(output);
  }
}

async function waitUntilReady(port, timeout = 60_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await reachable(port)) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Local service on port ${port} did not start.`);
}

async function main() {
  if (await reachable(adminPort)) return openAdmin();
  await mkdir(logsRoot, { recursive: true });
  await ensureManagedRepository();
  await detached(process.execPath, ["--experimental-strip-types", "tools/des-art-admin/server.mjs"], "admin", {
    DES_ART_ADMIN_REPO: managedRepo,
    DES_ART_ADMIN_SUPPORT: supportRoot,
    DES_ART_ADMIN_PORT: String(adminPort),
    DES_ART_PREVIEW_PORT: String(previewPort),
  });
  if (!(await reachable(previewPort))) {
    await detached("npm", ["run", "dev", "--", "-H", "127.0.0.1", "-p", String(previewPort)], "preview", {
      DES_ART_ADMIN_PREVIEW: "1",
    });
  }
  await waitUntilReady(adminPort);
  await waitUntilReady(previewPort);
  await openAdmin();
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);
  await exec("/usr/bin/osascript", ["-e", `display alert "Des-art Admin" message ${JSON.stringify(message)} as critical`]).catch(() => {});
  process.exitCode = 1;
});
