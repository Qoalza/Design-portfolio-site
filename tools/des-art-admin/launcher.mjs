import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, openSync } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { ensureProductionDataBaseline, extractPublishedBuildSha } from "./production-data-bootstrap.mjs";

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

async function stopService(name) {
  const pidFile = path.join(supportRoot, `${name}.pid`);
  const pid = Number((await readFile(pidFile, "utf8").catch(() => "")).trim());
  if (!Number.isInteger(pid) || pid < 1) return;
  const { stdout: command } = await exec("/bin/ps", ["-p", String(pid), "-o", "command="]).catch(() => ({ stdout: "" }));
  if (!command.trim()) return;
  const expected = name === "admin" ? "tools/des-art-admin/server.mjs" : "npm run dev";
  if (!command.includes(expected)) throw new Error(`Сохранённый PID ${name} не принадлежит Des-art Admin. Синхронизация данных остановлена.`);
  try { process.kill(-pid, "SIGTERM"); } catch { return; }
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { process.kill(-pid, 0); } catch { return; }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Не удалось безопасно остановить локальный процесс ${name}.`);
}

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

async function confirmedPublishedSha() {
  let response;
  try {
    response = await fetch("https://art-des.ru/", {
      headers: { accept: "text/html" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error("Не удалось подтвердить SHA опубликованного Portfolio. Запуск Admin остановлен до изменения локальных данных.");
  }
  if (!response.ok) {
    throw new Error("Опубликованный Portfolio недоступен для проверки SHA. Запуск Admin остановлен до изменения локальных данных.");
  }
  const sha = extractPublishedBuildSha(await response.text());
  if (!sha) {
    throw new Error("Опубликованный Portfolio не вернул полный data-build-sha. Запуск Admin остановлен до изменения локальных данных.");
  }
  return sha;
}

async function ensureManagedRepository() {
  await mkdir(supportRoot, { recursive: true });
  try {
    await access(path.join(managedRepo, ".git"));
  } catch {
    await exec("/usr/bin/git", ["clone", "--no-hardlinks", sourceRoot, managedRepo]);
  }
  const { stdout: status } = await exec("/usr/bin/git", ["status", "--porcelain"], { cwd: managedRepo });
  if (status.trim()) throw new Error("Управляемая копия содержит несохранённые изменения. Автоматическая синхронизация остановлена.");
  await exec("/usr/bin/git", ["fetch", "origin", "main"], { cwd: managedRepo });
  const targetSha = (await exec("/usr/bin/git", ["rev-parse", "origin/main"], { cwd: managedRepo })).stdout.trim();
  const publishedSha = await confirmedPublishedSha();
  if (publishedSha !== targetSha) {
    throw new Error("SHA опубликованного Portfolio не совпадает с origin/main. Запуск Admin остановлен до обновления managed repository и sandbox-данных.");
  }
  await exec("/usr/bin/git", ["switch", "main"], { cwd: managedRepo });
  await exec("/usr/bin/git", ["merge", "--ff-only", "origin/main"], { cwd: managedRepo });
  const lock = await readFile(path.join(managedRepo, "package-lock.json"));
  const lockHash = createHash("sha256").update(lock).digest("hex");
  const marker = path.join(supportRoot, "npm-lock.sha256");
  const installedHash = await readFile(marker, "utf8").catch(() => "");
  let dependenciesPresent = true;
  try { await access(path.join(managedRepo, "node_modules")); } catch { dependenciesPresent = false; }
  if (!dependenciesPresent || installedHash.trim() !== lockHash) {
    await exec("npm", ["ci", "--no-audit", "--no-fund"], { cwd: managedRepo });
    await writeFile(marker, `${lockHash}\n`, { mode: 0o600 });
  }
  return { targetSha, publishedSha };
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
  await mkdir(logsRoot, { recursive: true });
  const { targetSha, publishedSha } = await ensureManagedRepository();
  await ensureProductionDataBaseline({
    supportRoot,
    managedRepo,
    stopService,
    resolveSourceSha: async () => targetSha,
    resolvePublishedSha: async () => publishedSha,
  });
  // The managed repository may have advanced while the existing Node processes
  // still hold the previous server and Next.js modules in memory.
  await stopService("admin");
  await stopService("preview");
  if (!(await reachable(adminPort))) {
    await detached(process.execPath, ["--experimental-strip-types", "tools/des-art-admin/server.mjs"], "admin", {
      DES_ART_ADMIN_REPO: managedRepo,
      DES_ART_ADMIN_SUPPORT: supportRoot,
      DES_ART_ADMIN_PORT: String(adminPort),
      DES_ART_PREVIEW_PORT: String(previewPort),
    });
  }
  if (!(await reachable(previewPort))) {
    await detached("npm", ["run", "dev", "--", "-H", "127.0.0.1", "-p", String(previewPort)], "preview", {
      DES_ART_ADMIN_PREVIEW: "1",
      DES_ART_PREVIEW_PORT: String(previewPort),
      DES_ART_ADMIN_DRAFT_ROOT: path.join(supportRoot, "preview-drafts"),
      DES_ART_ADMIN_DRAFT_ASSET_ROOT: path.join(supportRoot, "draft-assets"),
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
