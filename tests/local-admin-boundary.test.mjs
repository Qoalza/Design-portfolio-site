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
const adminRail = await readFile(new URL("../tools/des-art-admin/src/admin-rail.tsx", import.meta.url), "utf8");
const adminComponents = await readFile(new URL("../tools/des-art-admin/src/admin-ui.tsx", import.meta.url), "utf8");
const adminCss = await readFile(new URL("../tools/des-art-admin/src/admin.css", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const deployCommand = await readFile(new URL("../tools/des-art-admin/server/art-des-publish", import.meta.url), "utf8");

test("admin server binds only to IPv4 loopback and validates local requests", () => {
  assert.match(server, /server\.listen\(port, "127\.0\.0\.1"/);
  assert.match(server, /validateLocalRequest/);
  assert.doesNotMatch(server, /0\.0\.0\.0/);
});

test("publish mode is server-owned and sandbox is the safe default", () => {
  assert.match(server, /DES_ART_ADMIN_PUBLISH_MODE/);
  assert.match(server, /publishMode\s*=.*\?\s*"live"\s*:\s*"sandbox"/s);
  assert.doesNotMatch(server, /value\.dryRun\s*!==\s*true/);
});

test("launcher uses argument arrays instead of shell command construction", () => {
  assert.match(launcher, /exec\("\/usr\/bin\/git", \[/);
  assert.match(launcher, /spawn\(command, args/);
  assert.doesNotMatch(launcher, /shell:\s*true/);
  assert.match(launcher, /Library", "Application Support", "Des-art Admin/);
  assert.match(launcher, /process\.env\.DES_ART_ADMIN_SUPPORT/);
  assert.match(launcher, /DES_ART_ADMIN_PREVIEW/);
  assert.match(launcher, /merge", "--ff-only", "origin\/main/);
  assert.match(launcher, /live-publish\.json/);
  assert.match(launcher, /npm-lock\.sha256/);
  assert.match(launcher, /createHash\("sha256"\)/);
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

test("publication stepper styles markers without constraining Radix labels", () => {
  assert.match(adminDialogs, /className="publish-stage-marker"/);
  assert.match(adminDialogs, /className="publish-stage-label"/);
  assert.match(adminCss, /\.publish-stage-marker\s*\{/);
  assert.doesNotMatch(adminCss, /\.publish-stages\s+span\s*\{/);
});

test("each section renders its own settings inside the section editor", () => {
  assert.match(adminEditor, /className="section-settings"/);
  assert.match(adminEditor, /Примечание/);
  assert.match(adminEditor, /Интерактивный экран/);
  assert.doesNotMatch(adminRail, /selected-section-settings/);
  assert.doesNotMatch(adminRail, /function SectionSettings/);
});

test("rich text toolbar uses Radix icons instead of letter glyph controls", () => {
  assert.match(adminComponents, /FontBoldIcon/);
  assert.match(adminComponents, /FontItalicIcon/);
  assert.match(adminComponents, /UnderlineIcon/);
  assert.doesNotMatch(adminComponents, /<strong>B<\/strong>/);
  assert.doesNotMatch(adminComponents, /<em>I<\/em>/);
  assert.doesNotMatch(adminComponents, /<u>U<\/u>/);
});

test("prepared macOS launcher bundle is complete", async () => {
  await access(new URL("../dist/Des-art Admin.app/Contents/Info.plist", import.meta.url));
  await access(new URL("../dist/Des-art Admin.app/Contents/MacOS/Des-art Admin", import.meta.url));
  const bundledLauncher = await readFile(new URL("../dist/Des-art Admin.app/Contents/Resources/launcher.mjs", import.meta.url), "utf8");
  assert.equal(bundledLauncher, launcher);
  const source = await readFile(new URL("../dist/Des-art Admin.app/Contents/Resources/source-repository.txt", import.meta.url), "utf8");
  assert.equal(source.trim(), "https://github.com/Qoalza/Design-portfolio-site.git");
});

test("canonical TypeScript config includes the fixed live preview output", async () => {
  const config = JSON.parse(await readFile(new URL("../tsconfig.json", import.meta.url), "utf8"));
  assert.ok(config.include.includes(".next-admin-preview-41732/types/**/*.ts"));
  assert.ok(config.include.includes(".next-admin-preview-41732/dev/types/**/*.ts"));
});

test("remote deploy command accepts only full SHAs and rolls back failed readiness", () => {
  assert.match(deployCommand, /\[0-9a-f\]\{40\}/);
  assert.match(deployCommand, /NEXT_PUBLIC_BUILD_SHA/);
  assert.match(deployCommand, /upload\[\[:space:\]\]/);
  assert.match(deployCommand, /Archive contains an unsafe path/);
  assert.match(deployCommand, /Archive contains a symbolic link/);
  assert.match(deployCommand, /runuser -u portfolio/);
  assert.match(deployCommand, /current\.rollback/);
  assert.match(deployCommand, /previous release restored/i);
  assert.doesNotMatch(deployCommand, /eval\s/);
});
