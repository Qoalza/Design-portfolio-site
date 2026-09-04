import { createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { AdminStore, validateLocalRequest } from "./core.mjs";
import { DraftValidationError, draftValidation } from "./draft-contract.mjs";
import { readFigmaToken, saveFigmaToken } from "./figma-template-import.mjs";
import { humanError } from "./human-errors.mjs";
import { PUBLISH_STAGES, isReusablePublishJob, publishInputFingerprint, publishReadiness, resumeInputMatches } from "./publish-worker.mjs";
import { claimPublishWorker, mutatePublishJob, reconcileOrphanedPublishJob } from "./publish-job-state.mjs";
import { createPreviewRuntimeIdentity, previewHealthMatches } from "./preview-runtime.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(process.env.DES_ART_ADMIN_REPO ?? path.join(directory, "../.."));
const previewRepoRoot = path.resolve(process.env.DES_ART_ADMIN_PREVIEW_REPO ?? repoRoot);
const supportRoot = path.resolve(process.env.DES_ART_ADMIN_SUPPORT ?? path.join(repoRoot, ".des-art-admin-runtime"));
const storeRoot = path.resolve(process.env.DES_ART_ADMIN_STORE_ROOT ?? supportRoot);
const port = Number(process.env.DES_ART_ADMIN_PORT ?? 41731);
const previewPort = Number(process.env.DES_ART_PREVIEW_PORT ?? 41732);
const PREVIEW_REQUEST_TIMEOUT_MS = 5000;
const publishMode = process.env.DES_ART_ADMIN_PUBLISH_MODE === "live" ? "live" : "sandbox";
const maintenanceMode = process.env.DES_ART_ADMIN_MAINTENANCE === "1";
const csrfToken = randomBytes(32).toString("hex");
const adminAssetVersion = createHash("sha256")
  .update(await readFile(path.join(directory, "public", "admin.js")))
  .update(await readFile(path.join(directory, "public", "admin.css")))
  .digest("hex")
  .slice(0, 12);
const store = new AdminStore({
  contentRoot: path.join(repoRoot, "content", "projects"),
  assetRoot: path.join(repoRoot, "public", "assets", "projects"),
  draftRoot: path.join(storeRoot, "drafts"),
  draftAssetRoot: path.join(storeRoot, "draft-assets"),
  snapshotRoot: path.join(storeRoot, "published-snapshots"),
});
const jobsRoot = path.join(storeRoot, "jobs");
const previewRoot = path.join(storeRoot, "preview-drafts");
const logsRoot = path.join(supportRoot, "logs");
const previewMarker = path.join(supportRoot, "preview-runtime.json");
const imageTypes = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
]);

async function launchPublishWorker(jobFile, patch = {}) {
  const ownerId = randomBytes(16).toString("hex");
  const claimed = await claimPublishWorker(jobFile, { ownerId, pid: process.pid });
  if (!claimed.claimed) return { launched: false, job: claimed.job };
  const job = await mutatePublishJob(jobFile, (current) => ({
    ...current,
    ...patch,
    worker: current.worker,
    updatedAt: new Date().toISOString(),
  }));
  const workerArgs = [process.execPath, "--experimental-strip-types", path.join(directory, "publish-worker.mjs"), jobFile];
  const command = process.platform === "darwin" ? "/usr/bin/caffeinate" : workerArgs.shift();
  const child = spawn(command, workerArgs, {
    cwd: repoRoot,
    detached: true,
    stdio: "ignore",
    env: { ...process.env, DES_ART_PUBLISH_WORKER_OWNER: ownerId },
  });
  child.unref();
  return { launched: true, job };
}

const userError = (response, status, title, message) => json(response, status, { errorTitle: title, error: message });

function currentGitSha(root = repoRoot) {
  try {
    if (execFileSync("/usr/bin/git", ["status", "--porcelain", "--untracked-files=no"], { cwd: root, encoding: "utf8" }).trim()) return null;
    return execFileSync("/usr/bin/git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  } catch { return null; }
}

function localPublishStateAvailable(job) {
  if (job.status === "queued" || job.status === "running") return true;
  try {
    const sha = execFileSync("/usr/bin/git", ["rev-parse", "--verify", `refs/heads/${job.branch}`], { cwd: repoRoot, encoding: "utf8" }).trim();
    return sha === job.contentCommit;
  } catch {
    return false;
  }
}

async function hasVerifiedLiveBaseline() {
  if (publishMode !== "live") return false;
  try {
    const marker = JSON.parse(await readFile(path.join(supportRoot, "production-data-baseline.json"), "utf8"));
    return marker?.version === 5 && marker.state === "live"
      && typeof marker.sourceSha === "string" && marker.sourceSha === currentGitSha();
  } catch { return false; }
}

const previewRuntime = await createPreviewRuntimeIdentity({
  repoRoot: previewRepoRoot,
  gitSha: currentGitSha(previewRepoRoot),
  sourceFiles: [
    "tools/des-art-admin/server.mjs",
    "tools/des-art-admin/core.mjs",
    "tools/des-art-admin/figma-template-import.mjs",
    "tools/des-art-admin/preview-runtime.mjs",
    "src/lib/project-contract.ts",
    "src/lib/project-visual-registry.ts",
    "src/app/admin-preview-health/route.ts",
  ],
});

function requestPreview(pathname) {
  return new Promise((resolve) => {
    const request = http.get({ hostname: "127.0.0.1", port: previewPort, path: pathname, timeout: PREVIEW_REQUEST_TIMEOUT_MS }, (result) => {
      const chunks = [];
      result.on("data", (chunk) => chunks.push(chunk));
      result.on("end", () => resolve({ status: result.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8") }));
    });
    request.on("error", () => resolve({ status: 0, body: "" }));
    request.on("timeout", () => { request.destroy(); resolve({ status: 0, body: "" }); });
  });
}

async function healthyPreview() {
  const result = await requestPreview("/admin-preview-health");
  if (result.status !== 200) return false;
  try { return previewHealthMatches(JSON.parse(result.body), previewRuntime); } catch { return false; }
}

async function stopOwnedStalePreview() {
  const marker = JSON.parse(await readFile(previewMarker, "utf8").catch(() => "null"));
  if (!marker || marker.repoRoot !== previewRuntime.repoRoot || marker.protocol !== previewRuntime.protocol || !Number.isSafeInteger(marker.pid)) {
    throw new Error("На preview-порту работает неизвестная версия. Admin не будет останавливать её автоматически.");
  }
  let command = "";
  try { command = execFileSync("/bin/ps", ["-p", String(marker.pid), "-o", "command="], { encoding: "utf8" }); } catch {}
  if (!command.includes("next") || !command.includes(String(previewPort))) {
    throw new Error("Сохранённый Preview PID не подтверждён. Admin не будет останавливать другой процесс.");
  }
  try { process.kill(-marker.pid, "SIGTERM"); } catch { throw new Error("Не удалось безопасно остановить устаревший Preview."); }
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if ((await requestPreview("/admin-preview-health")).status === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Устаревший Preview не завершился. Автоматический перезапуск остановлен.");
}

async function ensurePreview() {
  if (await healthyPreview()) return;
  if ((await requestPreview("/admin-preview-health")).status !== 0) await stopOwnedStalePreview();
  await mkdir(logsRoot, { recursive: true });
  const output = openSync(path.join(logsRoot, "preview.log"), "a", 0o600);
  try {
    const nextCli = path.join(repoRoot, "node_modules", "next", "dist", "bin", "next");
    const child = spawn(process.execPath, [nextCli, "dev", "--webpack", "-H", "127.0.0.1", "-p", String(previewPort)], {
      cwd: previewRepoRoot,
      detached: true,
      stdio: ["ignore", output, output],
      env: {
        ...process.env,
        DES_ART_ADMIN_PREVIEW: "1",
        DES_ART_PREVIEW_PORT: String(previewPort),
        DES_ART_ADMIN_DRAFT_ROOT: previewRoot,
        DES_ART_ADMIN_DRAFT_ASSET_ROOT: path.join(supportRoot, "draft-assets"),
        DES_ART_PREVIEW_PROTOCOL: String(previewRuntime.protocol),
        DES_ART_PREVIEW_REPO_ROOT: previewRuntime.repoRoot,
        DES_ART_PREVIEW_FINGERPRINT: previewRuntime.fingerprint,
        DES_ART_PREVIEW_GIT_SHA: previewRuntime.gitSha ?? "",
      },
    });
    await writeFile(path.join(supportRoot, "preview.pid"), `${child.pid}\n`, { mode: 0o600 });
    await writeFile(previewMarker, `${JSON.stringify({ ...previewRuntime, pid: child.pid, command: "next dev --webpack" })}\n`, { mode: 0o600 });
    child.unref();
  } finally {
    closeSync(output);
  }
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    if (await healthyPreview()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Предпросмотр не запустился. Повторите попытку.");
}

function json(response, status, value) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(value));
}

async function body(request, limit = 25 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw new Error("Request body is too large.");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

async function staticFile(response, name, type) {
  const source = await readFile(path.join(directory, "public", name));
  response.writeHead(200, { "content-type": type, "cache-control": "no-store" });
  response.end(source);
}

async function handler(request, response) {
  try {
    validateLocalRequest({
      method: request.method,
      host: request.headers.host,
      origin: request.headers.origin,
      csrf: request.headers["x-des-art-csrf"],
    }, csrfToken, port);
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    const segments = url.pathname.split("/").filter(Boolean);

    if (request.method === "GET" && url.pathname === "/") {
      const template = await readFile(path.join(directory, "public", "index.html"), "utf8");
      response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      response.end(template
        .replaceAll("__CSRF_TOKEN__", csrfToken)
        .replaceAll("__PREVIEW_PORT__", String(previewPort))
        .replaceAll("__PUBLISH_MODE__", publishMode)
        .replaceAll("__ADMIN_ASSET_VERSION__", adminAssetVersion));
      return;
    }
    if (request.method === "GET" && url.pathname === "/admin.css") return staticFile(response, "admin.css", "text/css; charset=utf-8");
    if (request.method === "GET" && url.pathname === "/admin.js") return staticFile(response, "admin.js", "text/javascript; charset=utf-8");
    if (request.method === "GET" && segments[0] === "assets" && segments[1] === "projects" && segments.length >= 4) {
      const slug = decodeURIComponent(segments[2]);
      const fileName = segments.slice(3).map(decodeURIComponent).join("/");
      const source = await store.readImage(slug, fileName);
      const type = imageTypes.get(path.extname(fileName).toLowerCase());
      if (!type) return userError(response, 415, "Изображение не удалось открыть", "Формат этого файла не поддерживается. Используйте PNG, JPG, GIF, WebP или SVG в предусмотренном поле.");
      response.writeHead(200, { "content-type": type, "cache-control": "no-store" });
      response.end(source);
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/projects") return json(response, 200, await store.listProjects());
    if (request.method === "GET" && url.pathname === "/api/figma/status") {
      try {
        await readFigmaToken();
        return json(response, 200, { connected: true });
      } catch {
        return json(response, 200, { connected: false });
      }
    }
    if (request.method === "POST" && url.pathname === "/api/figma/token") {
      await saveFigmaToken((await body(request)).token);
      return json(response, 200, { connected: true });
    }
    if (request.method === "POST" && url.pathname === "/api/projects") {
      return json(response, 201, await store.createProject(await body(request)));
    }
    if (request.method === "GET" && url.pathname === "/api/changes") {
      const inventory = await store.getChangeInventory();
      if (!(await hasVerifiedLiveBaseline())) inventory.resettableSlugs = [];
      return json(response, 200, inventory);
    }
    if (request.method === "POST" && url.pathname === "/api/validate") {
      const value = await body(request);
      if (value.scope === "project") {
        const project = await store.getProject(value.slug);
        return json(response, 200, draftValidation(project));
      }
      const inventory = await store.getChangeInventory();
      return json(response, 200, { valid: inventory.projects.every((item) => item.valid), projects: inventory.projects });
    }
    if (request.method === "POST" && segments[0] === "api" && segments[1] === "preview" && segments[2]) {
      const slug = decodeURIComponent(segments[2]);
      const value = await body(request);
      const route = value.route === "home" || value.route === "catalog" ? value.route : "project";
      await store.preparePreview(slug, previewRoot, route);
      await ensurePreview();
      const pathname = route === "home" ? "/" : route === "catalog" ? "/projects" : `/projects/${encodeURIComponent(slug)}`;
      if ((await requestPreview(`${pathname}?admin-preview=1&draft=${encodeURIComponent(slug)}`)).status !== 200) {
        throw new Error("Предпросмотр не открыл страницу проекта. Черновик не опубликован.");
      }
      return json(response, 200, { ready: true, url: `http://127.0.0.1:${previewPort}${pathname}?admin-preview=1&draft=${encodeURIComponent(slug)}` });
    }
    if (request.method === "GET" && url.pathname === "/api/publish/readiness") return json(response, 200, await publishReadiness({ supportRoot, repoRoot, mode: publishMode }));
    if (request.method === "GET" && url.pathname === "/api/publish/status") {
      const names = (await readdir(jobsRoot).catch(() => [])).filter((name) => name.endsWith(".json")).sort().reverse();
      const jobFile = names[0] ? path.join(jobsRoot, names[0]) : null;
      return json(response, 200, jobFile ? await reconcileOrphanedPublishJob(jobFile) : null);
    }
    if (request.method === "POST" && url.pathname === "/api/publish/start") {
      if (maintenanceMode) return userError(response, 403, "Публикация отключена", "Этот запуск Admin выполняет только безопасный локальный ремонт черновика.");
      const value = await body(request);
      const readiness = await publishReadiness({ supportRoot, repoRoot, mode: publishMode });
      if (!readiness.ready) return userError(response, 409, "Публикацию нельзя запустить", "Окружение публикации не настроено полностью. Требуется ручная диагностика разработчиком перед повторным запуском.");
      if (value.scope !== "project" && value.scope !== "all") return userError(response, 400, "Не удалось определить состав публикации", "Админка не поняла, нужно опубликовать один проект или все изменения. Закройте окно публикации и запустите нужное действие заново.");
      await store.ensureSnapshotBaseline();
      const all = await store.listProjects();
      const inventory = await store.getChangeInventory();
      const selectedSlugs = value.scope === "project" ? [value.slug] : inventory.changedSlugs;
      const selected = all.filter((project) => selectedSlugs.includes(project.slug));
      if (value.scope === "project" && selected.length !== 1) return userError(response, 404, "Проект для публикации не найден", "Обновите список проектов, снова откройте нужный проект и повторите публикацию.");
      const invalid = selected.map((project) => ({ project, validation: draftValidation(project) })).filter((item) => !item.validation.valid);
      if (invalid.length) {
        const issues = invalid.flatMap(({ project, validation }) => validation.issues.map((issue) => ({ ...issue, projectSlug: project.slug, projectTitle: project.title })));
        throw new DraftValidationError(issues);
      }
      const files = selected.map((project) => path.join(store.draftRoot, `${project.slug}.json`));
      await mkdir(jobsRoot, { recursive: true });
      const existingFiles = [];
      for (const file of files) { try { await readFile(file); existingFiles.push(file); } catch {} }
      const inputFingerprint = await publishInputFingerprint({ files: existingFiles, draftAssetRoot: store.draftAssetRoot });
      const priorNames = (await readdir(jobsRoot).catch(() => [])).filter((name) => name.endsWith(".json")).sort().reverse();
      for (const name of priorNames) {
        const candidate = JSON.parse(await readFile(path.join(jobsRoot, name), "utf8"));
        const identity = { mode: publishMode, scope: value.scope, slug: value.slug, inputFingerprint };
        if (typeof candidate.repoRoot === "string" && path.resolve(candidate.repoRoot) === repoRoot
          && typeof candidate.supportRoot === "string" && path.resolve(candidate.supportRoot) === supportRoot
          && isReusablePublishJob(candidate, identity)
          && localPublishStateAvailable(candidate)) {
          return json(response, 200, candidate);
        }
      }
      const id = `${Date.now()}-${value.scope === "project" ? selected[0].slug : "all"}`;
      const jobFile = path.join(jobsRoot, `${id}.json`);
      const job = { id, mode: publishMode, scope: value.scope, slug: value.slug, repoRoot, supportRoot, draftAssetRoot: store.draftAssetRoot, files: existingFiles, inputFingerprint, snapshotRoot: store.snapshotRoot, status: "queued", message: "Подготовка", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), stages: PUBLISH_STAGES.map(([stageId, label]) => ({ id: stageId, label, status: "pending" })) };
      await writeFile(jobFile, `${JSON.stringify(job, null, 2)}\n`, { mode: 0o600 });
      const launched = await launchPublishWorker(jobFile);
      return json(response, 202, launched.job);
    }
    if (request.method === "POST" && url.pathname === "/api/publish/resume") {
      if (maintenanceMode) return userError(response, 403, "Публикация отключена", "Этот запуск Admin выполняет только безопасный локальный ремонт черновика.");
      const value = await body(request);
      if (typeof value.jobId !== "string" || !/^[a-zA-Z0-9._-]+$/.test(value.jobId)) return userError(response, 400, "Job не найден", "Не удалось определить публикацию для продолжения.");
      const jobFile = path.join(jobsRoot, `${value.jobId}.json`);
      let job;
      try { job = JSON.parse(await readFile(jobFile, "utf8")); } catch { return userError(response, 404, "Job не найден", "Не удалось найти сохранённую публикацию для продолжения."); }
      job = await reconcileOrphanedPublishJob(jobFile);
      if (["queued", "running"].includes(job.status) && job.worker) return json(response, 202, job);
      const resumableIdentity = job.id === value.jobId
        && job.status === "failed"
        && job.mode === publishMode
        && path.resolve(job.repoRoot) === repoRoot
        && path.resolve(job.supportRoot) === supportRoot
        && /^codex\/content-publish-\d{8}-\d{6}$/.test(job.branch)
        && /^[a-f0-9]{40}$/.test(job.contentCommit)
        && /^[a-f0-9]{64}$/.test(job.inputFingerprint);
      if (!resumableIdentity) return userError(response, 409, "Публикацию нельзя продолжить", "Этот job не достиг сохранённого commit, уже выполняется или не совпадает с текущим окружением.");
      const currentInputFingerprint = await publishInputFingerprint({ files: job.files, draftAssetRoot: job.draftAssetRoot });
      if (!resumeInputMatches(job, currentInputFingerprint)) return userError(response, 409, "Черновик изменился после остановки", "Сохранённый commit относится к предыдущей версии черновика. Запустите новую публикацию, чтобы подготовить актуальные данные.");
      const readiness = await publishReadiness({ supportRoot, repoRoot, mode: publishMode });
      if (!readiness.ready) return userError(response, 409, "Публикацию нельзя продолжить", "Окружение публикации не настроено полностью. Исправьте указанную проблему и повторите действие.");
      const launched = await launchPublishWorker(jobFile, {
        status: "queued",
        message: "Возобновление публикации",
        resumeRequested: true,
      });
      return json(response, 202, launched.job);
    }
    if (segments[0] === "api" && segments[1] === "projects" && segments[2]) {
      const slug = decodeURIComponent(segments[2]);
      if (request.method === "GET" && segments.length === 3) return json(response, 200, await store.getProject(slug));
      if (request.method === "PUT" && segments.length === 3) {
        const value = await body(request);
        await store.saveDraft(slug, value);
        return json(response, 200, value);
      }
      if (request.method === "POST" && segments[3] === "duplicate") {
        const value = await body(request);
        return json(response, 201, await store.duplicateProject(slug, value.slug));
      }
      if (request.method === "POST" && segments[3] === "visibility") {
        const value = await body(request);
        return json(response, 200, await store.setVisibility(slug, value.visibility));
      }
      if (request.method === "POST" && segments[3] === "reset-to-production") {
        if (!(await hasVerifiedLiveBaseline())) return userError(response, 403, "Сброс недоступен", "Не удалось подтвердить текущую опубликованную версию для безопасного сброса.");
        const value = await store.resetToProduction(slug);
        await rm(path.join(previewRoot, `${slug}.json`), { force: true });
        return json(response, 200, value);
      }
      if (request.method === "POST" && segments[3] === "upload") {
        const value = await body(request);
        const buffer = Buffer.from(value.data, "base64");
        return json(response, 201, await store.saveImage(slug, value.name, value.mime, buffer, value.alt, { templateId: value.templateId, slot: value.slot, operation: value.operation, referenceSrc: value.referenceSrc }));
      }
      if (request.method === "POST" && segments[3] === "figma-template") {
        return json(response, 200, await store.importFigmaVisual(slug, await body(request)));
      }
      if (request.method === "POST" && segments[3] === "logo") {
        const value = await body(request);
        return json(response, 201, await store.saveLogo(slug, value.name, Buffer.from(value.data, "base64")));
      }
      if (request.method === "DELETE" && segments[3] === "permanent") {
        await store.permanentlyDelete(slug);
        return json(response, 200, { deleted: true });
      }
    }
    if (request.method === "POST" && url.pathname === "/api/projects/reorder") {
      return json(response, 200, await store.reorder((await body(request)).slugs));
    }
    if (segments[0] === "api" && segments[1] === "drafts" && segments[2]) {
      const slug = decodeURIComponent(segments[2]);
      if (request.method === "GET") return json(response, 200, await store.getDraft(slug));
      if (request.method === "PUT") {
        const value = await body(request);
        await store.saveDraft(slug, value);
        return json(response, 200, { saved: true });
      }
    }
    if (request.method === "POST" && url.pathname === "/api/shutdown") {
      json(response, 200, { stopped: true });
      setTimeout(async () => {
        try {
          const previewPid = Number((await readFile(path.join(supportRoot, "preview.pid"), "utf8")).trim());
          if (Number.isSafeInteger(previewPid) && previewPid > 1) process.kill(previewPid, "SIGTERM");
        } catch {}
        server.close(() => process.exit(0));
      }, 50);
      return;
    }
    userError(response, 404, "Раздел админки не найден", "Запрошенное действие больше недоступно. Обновите страницу и повторите его из текущего интерфейса.");
  } catch (error) {
    if (error instanceof DraftValidationError) {
      return json(response, 422, { errorTitle: `Нужно исправить · ${error.issues.length}`, error: "Откройте проблему из списка — админка покажет конкретное поле и способ исправления.", issues: error.issues });
    }
    const explanation = humanError(error);
    json(response, explanation.status, { errorTitle: explanation.title, error: explanation.message });
  }
}

const server = http.createServer(handler);
server.listen(port, "127.0.0.1", () => {
  console.log(`Des-art Admin: http://127.0.0.1:${port}`);
  console.log(`Project preview: http://127.0.0.1:${previewPort}`);
});
