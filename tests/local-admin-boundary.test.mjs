import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const server = await readFile(new URL("../tools/des-art-admin/server.mjs", import.meta.url), "utf8");
const launcher = await readFile(new URL("../tools/des-art-admin/launcher.mjs", import.meta.url), "utf8");
const projectRoute = await readFile(new URL("../src/app/projects/[slug]/page.tsx", import.meta.url), "utf8");
const previewAssetRoute = await readFile(new URL("../src/app/admin-preview-assets/[slug]/[file]/route.ts", import.meta.url), "utf8");
const nextConfig = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
const adminUi = await readFile(new URL("../tools/des-art-admin/src/admin.tsx", import.meta.url), "utf8");
const adminDialogs = await readFile(new URL("../tools/des-art-admin/src/admin-dialogs.tsx", import.meta.url), "utf8");
const adminEditor = await readFile(new URL("../tools/des-art-admin/src/admin-editor.tsx", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

test("admin server binds only to IPv4 loopback and validates local requests", () => {
  assert.match(server, /server\.listen\(port, "127\.0\.0\.1"/);
  assert.match(server, /validateLocalRequest/);
  assert.doesNotMatch(server, /0\.0\.0\.0/);
});

test("launcher uses argument arrays instead of shell command construction", () => {
  assert.match(launcher, /exec\("\/usr\/bin\/git", \[/);
  assert.match(launcher, /spawn\(command, args/);
  assert.doesNotMatch(launcher, /shell:\s*true/);
  assert.match(launcher, /Library", "Application Support", "Des-art Admin/);
  assert.match(launcher, /process\.env\.DES_ART_ADMIN_SUPPORT/);
  assert.match(launcher, /DES_ART_ADMIN_PREVIEW/);
});

test("admin is not an App Router route and preview access is env-gated", async () => {
  await assert.rejects(() => access(new URL("../src/app/admin", import.meta.url)));
  assert.match(projectRoute, /process\.env\.DES_ART_ADMIN_PREVIEW === "1"/);
  assert.match(projectRoute, /!isAdminPreview && project\.availability\.detail/);
  assert.match(previewAssetRoute, /DES_ART_ADMIN_PREVIEW !== "1"/);
  assert.match(launcher, /DES_ART_ADMIN_DRAFT_ROOT/);
  assert.match(launcher, /DES_ART_ADMIN_DRAFT_ASSET_ROOT/);
  assert.match(server, /segments\[1\] === "preview"/);
  assert.match(server, /ensurePreview/);
  assert.match(server, /preview-drafts/);
  assert.match(nextConfig, /DES_ART_ADMIN_PREVIEW === "1"/);
  assert.match(nextConfig, /\.next-admin-preview-\$\{previewPort\}/);
});

test("admin UI keeps Radix Themes inside the local admin boundary", () => {
  assert.equal(packageJson.dependencies["@radix-ui/themes"], "3.3.0");
  assert.match(adminUi, /<Theme accentColor="blue" grayColor="sand" radius="small"/);
  assert.doesNotMatch(projectRoute, /@radix-ui\/themes/);
});

test("admin workflows use internal dialogs and manual SVG logos", () => {
  assert.doesNotMatch(adminUi, /window\.(?:prompt|confirm|alert)/);
  assert.match(adminDialogs, /NewProjectDialog/);
  assert.match(adminDialogs, /AlertDialog/);
  assert.match(adminEditor, /accept="image\/svg\+xml,\.svg"/);
  assert.match(server, /saveLogo/);
});

test("prepared macOS launcher bundle is complete", async () => {
  await access(new URL("../dist/Des-art Admin.app/Contents/Info.plist", import.meta.url));
  await access(new URL("../dist/Des-art Admin.app/Contents/MacOS/Des-art Admin", import.meta.url));
  const bundledLauncher = await readFile(new URL("../dist/Des-art Admin.app/Contents/Resources/launcher.mjs", import.meta.url), "utf8");
  assert.equal(bundledLauncher, launcher);
  const source = await readFile(new URL("../dist/Des-art Admin.app/Contents/Resources/source-repository.txt", import.meta.url), "utf8");
  assert.equal(source.trim(), "https://github.com/Qoalza/Design-portfolio-site.git");
});
