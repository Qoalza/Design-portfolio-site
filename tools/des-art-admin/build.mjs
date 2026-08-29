import { build } from "esbuild";
import { copyFile, readFile, writeFile } from "node:fs/promises";

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
await copyFile(
  "tools/des-art-admin/launcher.mjs",
  "dist/Des-art Admin.app/Contents/Resources/launcher.mjs",
);
