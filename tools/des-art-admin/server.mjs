import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { AdminStore, validateLocalRequest } from "./core.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(process.env.DES_ART_ADMIN_REPO ?? path.join(directory, "../.."));
const supportRoot = path.resolve(process.env.DES_ART_ADMIN_SUPPORT ?? path.join(repoRoot, ".des-art-admin-runtime"));
const port = Number(process.env.DES_ART_ADMIN_PORT ?? 41731);
const previewPort = Number(process.env.DES_ART_PREVIEW_PORT ?? 41732);
const csrfToken = randomBytes(32).toString("hex");
const store = new AdminStore({
  contentRoot: path.join(repoRoot, "content", "projects"),
  assetRoot: path.join(repoRoot, "public", "assets", "projects"),
  draftRoot: path.join(supportRoot, "drafts"),
  draftAssetRoot: path.join(supportRoot, "draft-assets"),
});

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
      response.end(template.replaceAll("__CSRF_TOKEN__", csrfToken).replaceAll("__PREVIEW_PORT__", String(previewPort)));
      return;
    }
    if (request.method === "GET" && url.pathname === "/admin.css") return staticFile(response, "admin.css", "text/css; charset=utf-8");
    if (request.method === "GET" && url.pathname === "/admin.js") return staticFile(response, "admin.js", "text/javascript; charset=utf-8");
    if (request.method === "GET" && url.pathname === "/api/projects") return json(response, 200, await store.listProjects());
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
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    json(response, /Host|Origin|CSRF/.test(message) ? 403 : 400, { error: message });
  }
}

const server = http.createServer(handler);
server.listen(port, "127.0.0.1", () => {
  console.log(`Des-art Admin: http://127.0.0.1:${port}`);
  console.log(`Project preview: http://127.0.0.1:${previewPort}`);
});
