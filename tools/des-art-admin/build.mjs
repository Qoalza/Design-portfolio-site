import { build } from "esbuild";
import { execFile } from "node:child_process";
import { chmod, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const appRoot = "dist/Des-art Admin.app";
const resources = path.join(appRoot, "Contents", "Resources");
const runtime = path.join(resources, "runtime", "bin", "node");
const bundledSource = path.join(resources, "source");
const bundledRuntimeFiles = [
  "admin-errors.mjs",
  "core.mjs",
  "draft-contract.mjs",
  "figma-template-import.mjs",
  "figma-frame.mjs",
  "figma-template-map.mjs",
  "human-errors.mjs",
  "material-state.mjs",
  "preview-runtime.mjs",
  "production-data-bootstrap.mjs",
  "deploy-v2.mjs",
  "publish-job-state.mjs",
  "publish-diagnostics.mjs",
  "publish-worker.mjs",
  "server.mjs",
  "public/admin.css",
  "public/admin.js",
  "public/index.html",
];
const bundledSharedFiles = [
  "project-contract.ts",
  "project-visual-registry.ts",
  "projects.ts",
];

async function copyIntoBundle(source, destination) {
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

await build({
  entryPoints: ["tools/des-art-admin/src/admin.tsx"],
  bundle: true,
  outfile: "tools/des-art-admin/public/admin.js",
  platform: "browser",
  format: "iife",
  target: ["safari17", "chrome120", "firefox120"],
  jsx: "automatic",
  minify: true,
  sourcemap: false,
  legalComments: "none",
  loader: { ".woff2": "dataurl" },
});

const bundlePath = "tools/des-art-admin/public/admin.js";
const bundle = await readFile(bundlePath, "utf8");
await writeFile(bundlePath, bundle.replace(/[ \t]+$/gm, ""));
await rm(bundledSource, { recursive: true, force: true });
await mkdir(bundledSource, { recursive: true });
await writeFile(path.join(bundledSource, "package.json"), '{"private":true,"type":"module"}\n', { mode: 0o644 });
await Promise.all([
  copyFile(
    "tools/des-art-admin/launcher.mjs",
    "dist/Des-art Admin.app/Contents/Resources/launcher.mjs",
  ),
  copyFile(
    "tools/des-art-admin/launcher-policy.mjs",
    "dist/Des-art Admin.app/Contents/Resources/launcher-policy.mjs",
  ),
  copyFile(
    "tools/des-art-admin/managed-repository.mjs",
    "dist/Des-art Admin.app/Contents/Resources/managed-repository.mjs",
  ),
  copyFile(
    "tools/des-art-admin/production-data-bootstrap.mjs",
    "dist/Des-art Admin.app/Contents/Resources/production-data-bootstrap.mjs",
  ),
  ...bundledRuntimeFiles.map((file) => copyIntoBundle(
    path.join("tools", "des-art-admin", file),
    path.join(bundledSource, "tools", "des-art-admin", file),
  )),
  ...bundledSharedFiles.map((file) => copyIntoBundle(
    path.join("src", "lib", file),
    path.join(bundledSource, "src", "lib", file),
  )),
]);

const configuredSha = process.env.DES_ART_ADMIN_BUILD_SHA ?? process.env.NEXT_PUBLIC_BUILD_SHA;
const gitSha = configuredSha ?? (await exec("/usr/bin/git", ["rev-parse", "HEAD"])).stdout.trim();
if (!/^[a-f0-9]{40}$/.test(gitSha)) throw new Error("Admin build SHA must be a full Git SHA.");
await mkdir(path.dirname(runtime), { recursive: true });
if (process.platform === "darwin") {
  const architecture = process.arch === "arm64" ? "arm64" : "x86_64";
  await exec("/usr/bin/lipo", [process.execPath, "-thin", architecture, "-output", runtime]);
} else {
  await copyFile(process.execPath, runtime);
}
await chmod(runtime, 0o755);
await writeFile(path.join(resources, "build-sha.txt"), `${gitSha}\n`, { mode: 0o644 });
if (process.platform === "darwin") {
  await rm(path.join(appRoot, "Contents", "_CodeSignature"), { recursive: true, force: true });
  await exec("/usr/bin/codesign", ["--force", "--deep", "--sign", "-", appRoot]);
}
