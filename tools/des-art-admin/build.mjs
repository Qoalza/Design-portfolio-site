import { build } from "esbuild";
import { execFile } from "node:child_process";
import { chmod, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const appRoot = "dist/Des-art Admin.app";
const resources = path.join(appRoot, "Contents", "Resources");
const runtime = path.join(resources, "runtime", "bin", "node");

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
await Promise.all([
  copyFile(
    "tools/des-art-admin/launcher.mjs",
    "dist/Des-art Admin.app/Contents/Resources/launcher.mjs",
  ),
  copyFile(
    "tools/des-art-admin/production-data-bootstrap.mjs",
    "dist/Des-art Admin.app/Contents/Resources/production-data-bootstrap.mjs",
  ),
]);

const configuredSha = process.env.DES_ART_ADMIN_BUILD_SHA;
const gitSha = configuredSha ?? (await exec("/usr/bin/git", ["rev-parse", "HEAD"])).stdout.trim();
if (!/^[a-f0-9]{40}$/.test(gitSha)) throw new Error("DES_ART_ADMIN_BUILD_SHA must be a full Git SHA.");
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
