import { randomBytes } from "node:crypto";
import { closeSync, openSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { AdminStore, validateLocalRequest } from "./core.mjs";
import { DraftValidationError, draftValidation } from "./draft-contract.mjs";
import { PUBLISH_STAGES, publishReadiness } from "./publish-worker.mjs";
import { readFigmaToken, saveFigmaToken } from "./figma-frame.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(process.env.DES_ART_ADMIN_REPO ?? path.join(directory, "../.."));
const supportRoot = path.resolve(process.env.DES_ART_ADMIN_SUPPORT ?? path.join(repoRoot, ".des-art-admin-runtime"));
const port = Number(process.env.DES_ART_ADMIN_PORT ?? 41731);
const previewPort = Number(process.env.DES_ART_PREVIEW_PORT ?? 41732);
const publishMode = process.env.DES_ART_ADMIN_PUBLISH_MODE === "live" ? "live" : "sandbox";
const csrfToken = randomBytes(32).toString("hex");
const store = new AdminStore({
  contentRoot: path.join(repoRoot, "content", "projects"),
  assetRoot: path.join(repoRoot, "public", "assets", "projects"),
  draftRoot: path.join(supportRoot, "drafts"),
  draftAssetRoot: path.join(supportRoot, "draft-assets"),
  snapshotRoot: path.join(supportRoot, "published-snapshots"),
});
const jobsRoot = path.join(supportRoot, "jobs");
const previewRoot = path.join(supportRoot, "preview-drafts");
const logsRoot = path.join(supportRoot, "logs");
const imageTypes = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
]);

function reachable(targetPort) {
  return new Promise((resolve) => {
    const request = http.get({ hostname: "127.0.0.1", port: targetPort, path: "/", timeout: 700 }, (result) => {
      result.resume();
      resolve(Boolean(result.statusCode));
    });
    request.on("error", () => resolve(false));
    request.on("timeout", () => { request.destroy(); resolve(false); });
  });
}

async function ensurePreview() {
  if (await reachable(previewPort)) return;
  await mkdir(logsRoot, { recursive: true });
  const output = openSync(path.join(logsRoot, "preview.log"), "a", 0o600);
  try {
    const child = spawn("npm", ["run", "dev", "--", "-H", "127.0.0.1", "-p", String(previewPort)], {
      cwd: repoRoot,
      detached: true,
      stdio: ["ignore", output, output],
      env: {
        ...process.env,
        DES_ART_ADMIN_PREVIEW: "1",
        DES_ART_PREVIEW_PORT: String(previewPort),
        DES_ART_ADMIN_DRAFT_ROOT: previewRoot,
        DES_ART_ADMIN_DRAFT_ASSET_ROOT: path.join(supportRoot, "draft-assets"),
      },
    });
    await writeFile(path.join(supportRoot, "preview.pid"), `${child.pid}\n`, { mode: 0o600 });
    child.unref();
  } finally {
    closeSync(output);
  }
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    if (await reachable(previewPort)) return;
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
      response.end(template.replaceAll("__CSRF_TOKEN__", csrfToken).replaceAll("__PREVIEW_PORT__", String(previewPort)).replaceAll("__PUBLISH_MODE__", publishMode));
      return;
    }
    if (request.method === "GET" && url.pathname === "/admin.css") return staticFile(response, "admin.css", "text/css; charset=utf-8");
    if (request.method === "GET" && url.pathname === "/admin.js") return staticFile(response, "admin.js", "text/javascript; charset=utf-8");
    if (request.method === "GET" && segments[0] === "assets" && segments[1] === "projects" && segments.length >= 4) {
      const slug = decodeURIComponent(segments[2]);
      const fileName = segments.slice(3).map(decodeURIComponent).join("/");
      const source = await store.readImage(slug, fileName);
      const type = imageTypes.get(path.extname(fileName).toLowerCase());
      if (!type) return json(response, 415, { error: "Неподдерживаемый формат изображения." });
      response.writeHead(200, { "content-type": type, "cache-control": "no-store" });
      response.end(source);
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/projects") return json(response, 200, await store.listProjects());
    if (request.method === "GET" && url.pathname === "/api/figma/status") {
      try { await readFigmaToken(); return json(response, 200, { connected: true }); }
      catch { return json(response, 200, { connected: false }); }
    }
    if (request.method === "POST" && url.pathname === "/api/figma/token") {
      await saveFigmaToken((await body(request)).token);
      return json(response, 200, { connected: true });
    }
    if (request.method === "POST" && url.pathname === "/api/projects") {
      return json(response, 201, await store.createProject(await body(request)));
    }
    if (request.method === "GET" && url.pathname === "/api/changes") return json(response, 200, await store.getChangeInventory());
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
      const context = value.context === "card" ? "card" : "page";
      await store.preparePreview(slug, previewRoot, context);
      await ensurePreview();
      const pathname = context === "card" ? "/projects" : `/projects/${encodeURIComponent(slug)}`;
      return json(response, 200, { ready: true, url: `http://127.0.0.1:${previewPort}${pathname}?admin-preview=1&draft=${encodeURIComponent(slug)}` });
    }
    if (request.method === "GET" && url.pathname === "/api/publish/readiness") return json(response, 200, await publishReadiness({ supportRoot, mode: publishMode }));
    if (request.method === "GET" && url.pathname === "/api/publish/status") {
      const names = (await readdir(jobsRoot).catch(() => [])).filter((name) => name.endsWith(".json")).sort().reverse();
      return json(response, 200, names[0] ? JSON.parse(await readFile(path.join(jobsRoot, names[0]), "utf8")) : null);
    }
    if (request.method === "POST" && url.pathname === "/api/publish/start") {
      const value = await body(request);
      const readiness = await publishReadiness({ supportRoot, mode: publishMode });
      if (!readiness.ready) return json(response, 409, { error: readiness.failures.join(". ") });
      if (value.scope !== "project" && value.scope !== "all") return json(response, 400, { error: "Неизвестная область публикации." });
      await store.ensureSnapshotBaseline();
      const all = await store.listProjects();
      const inventory = await store.getChangeInventory();
      const selectedSlugs = value.scope === "project" ? [value.slug] : inventory.changedSlugs;
      const selected = all.filter((project) => selectedSlugs.includes(project.slug));
      if (value.scope === "project" && selected.length !== 1) return json(response, 404, { error: "Проект для публикации не найден." });
      const invalid = selected.map((project) => ({ project, validation: draftValidation(project) })).filter((item) => !item.validation.valid);
      if (invalid.length) {
        const issues = invalid.flatMap(({ project, validation }) => validation.issues.map((issue) => ({ ...issue, projectSlug: project.slug, projectTitle: project.title })));
        throw new DraftValidationError(issues);
      }
      const files = selected.map((project) => path.join(store.draftRoot, `${project.slug}.json`));
      await mkdir(jobsRoot, { recursive: true });
      const id = `${Date.now()}-${value.scope === "project" ? selected[0].slug : "all"}`;
      const jobFile = path.join(jobsRoot, `${id}.json`);
      const existingFiles = [];
      for (const file of files) { try { await readFile(file); existingFiles.push(file); } catch {} }
      const job = { id, mode: publishMode, scope: value.scope, slug: value.slug, repoRoot, supportRoot, draftAssetRoot: store.draftAssetRoot, files: existingFiles, snapshotRoot: store.snapshotRoot, status: "queued", message: "Подготовка", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), stages: PUBLISH_STAGES.map(([stageId, label]) => ({ id: stageId, label, status: "pending" })) };
      await writeFile(jobFile, `${JSON.stringify(job, null, 2)}\n`, { mode: 0o600 });
      const workerArgs = [process.execPath, "--experimental-strip-types", path.join(directory, "publish-worker.mjs"), jobFile];
      const command = process.platform === "darwin" ? "/usr/bin/caffeinate" : workerArgs.shift();
      const child = spawn(command, workerArgs, { cwd: repoRoot, detached: true, stdio: "ignore" });
      child.unref();
      return json(response, 202, job);
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
      if (request.method === "POST" && segments[3] === "upload") {
        const value = await body(request);
        const buffer = Buffer.from(value.data, "base64");
        return json(response, 201, await store.saveImage(slug, value.name, value.mime, buffer, value.alt));
      }
      if (request.method === "POST" && segments[3] === "logo") {
        const value = await body(request);
        return json(response, 201, await store.saveLogo(slug, value.name, Buffer.from(value.data, "base64")));
      }
      if (request.method === "POST" && segments[3] === "frame") {
        return json(response, 201, await store.importFrame(slug, await body(request)));
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
    json(response, 404, { error: "Не найдено" });
  } catch (error) {
    if (error instanceof DraftValidationError) {
      return json(response, 422, { error: `Нужно исправить · ${error.issues.length}`, issues: error.issues });
    }
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    json(response, /Host|Origin|CSRF/.test(message) ? 403 : 400, { error: message });
  }
}

const server = http.createServer(handler);
server.listen(port, "127.0.0.1", () => {
  console.log(`Des-art Admin: http://127.0.0.1:${port}`);
  console.log(`Project preview: http://127.0.0.1:${previewPort}`);
});
