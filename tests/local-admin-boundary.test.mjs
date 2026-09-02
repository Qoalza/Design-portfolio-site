import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const server = await readFile(new URL("../tools/des-art-admin/server.mjs", import.meta.url), "utf8");
const launcher = await readFile(new URL("../tools/des-art-admin/launcher.mjs", import.meta.url), "utf8");
const transitionOperator = await readFile(new URL("../tools/des-art-admin/prepare-live-transition.mjs", import.meta.url), "utf8");
const candidateSandbox = await readFile(new URL("../tools/des-art-admin/run-candidate-sandbox.mjs", import.meta.url), "utf8");
const projectRoute = await readFile(new URL("../src/app/projects/[slug]/page.tsx", import.meta.url), "utf8");
const projectsRoute = await readFile(new URL("../src/app/projects/page.tsx", import.meta.url), "utf8");
const previewAssetRoute = await readFile(new URL("../src/app/admin-preview-assets/[slug]/[...file]/route.ts", import.meta.url), "utf8");
const nextConfig = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
const adminUi = await readFile(new URL("../tools/des-art-admin/src/admin.tsx", import.meta.url), "utf8");
const adminDialogs = await readFile(new URL("../tools/des-art-admin/src/admin-dialogs.tsx", import.meta.url), "utf8");
const adminEditor = await readFile(new URL("../tools/des-art-admin/src/admin-editor.tsx", import.meta.url), "utf8");
const adminRail = await readFile(new URL("../tools/des-art-admin/src/admin-rail.tsx", import.meta.url), "utf8");
const adminCore = await readFile(new URL("../tools/des-art-admin/core.mjs", import.meta.url), "utf8");
const adminComponents = await readFile(new URL("../tools/des-art-admin/src/admin-ui.tsx", import.meta.url), "utf8");
const projectGallery = await readFile(new URL("../src/components/project-gallery.tsx", import.meta.url), "utf8");
const adminCss = await readFile(new URL("../tools/des-art-admin/src/admin.css", import.meta.url), "utf8");
const figmaImporter = await readFile(new URL("../tools/des-art-admin/figma-template-import.mjs", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const deployCommand = await readFile(new URL("../tools/des-art-admin/server/art-des-publish", import.meta.url), "utf8");

test("admin server binds only to IPv4 loopback and validates local requests", () => {
  assert.match(server, /server\.listen\(port, "127\.0\.0\.1"/);
  assert.match(server, /validateLocalRequest/);
  assert.doesNotMatch(server, /0\.0\.0\.0/);
});

test("publish mode is launcher-owned and exposes the established live workflow", () => {
  assert.match(server, /DES_ART_ADMIN_PUBLISH_MODE/);
  assert.match(server, /publishMode\s*=.*\?\s*"live"\s*:\s*"sandbox"/s);
  assert.match(adminUi, /publishMode/);
  assert.match(adminUi, /Связано с art-des\.ru/);
  assert.match(adminUi, /Опубликовать на art-des\.ru/);
  assert.match(adminDialogs, /mode === "live"/);
  assert.doesNotMatch(server, /value\.dryRun\s*!==\s*true/);
});

test("launcher uses argument arrays instead of shell command construction", () => {
  assert.match(launcher, /exec\("\/usr\/bin\/git", \["clone"/);
  assert.match(launcher, /spawn\(command, args/);
  assert.doesNotMatch(launcher, /shell:\s*true/);
  assert.match(launcher, /Library", "Application Support", "Des-art Admin/);
  assert.match(launcher, /process\.env\.DES_ART_ADMIN_SUPPORT/);
  assert.match(launcher, /DES_ART_ADMIN_PREVIEW/);
  assert.match(launcher, /merge", "--ff-only", "origin\/main/);
  assert.match(launcher, /live-publish\.json/);
  assert.match(launcher, /DES_ART_ADMIN_PUBLISH_MODE/);
  assert.match(launcher, /confirmedPublishedSha/);
  assert.match(launcher, /npm-lock\.sha256/);
  assert.match(launcher, /createHash\("sha256"\)/);
  assert.match(launcher, /ensureProductionDataBaseline/);
  assert.match(launcher, /launchSandboxWithoutBootstrap/);
  assert.match(launcher, /function isProductionLiveBaseline\(marker\)/);
  assert.match(launcher, /if \(!hasLiveBaseline && !liveTransitionStarted\) await launchSandboxWithoutBootstrap\(\)\.catch/);
  assert.doesNotMatch(launcher, /if \(!liveTransitionStarted\) await launchSandboxWithoutBootstrap\(\)\.catch/);
});

test("first live transition requires an explicit operator request and is not available in the Admin UI", () => {
  assert.match(launcher, /hasLiveBaseline/);
  assert.match(launcher, /выберите путь: чистый production baseline или перенос неопубликованных черновиков/);
  assert.match(launcher, /prepareTransferredDrafts: transferDrafts/);
  assert.match(launcher, /choice === "overlay"/);
  assert.match(transitionOperator, /--choice <clean\|overlay>/);
  assert.match(transitionOperator, /--target-sha <40-char-sha>/);
  assert.doesNotMatch(server, /\/api\/live-transition\//);
  assert.doesNotMatch(adminUi, /Переход в live…/);
  assert.doesNotMatch(adminUi, /Чистый production baseline/);
  assert.doesNotMatch(adminUi, /Перенести неопубликованные изменения в live drafts/);
  assert.match(transitionOperator, /saveLiveTransitionRequest/);
  assert.match(transitionOperator, /does not start Admin, archive data, or publish/);
});

test("existing live baseline starts without importing a transition module from managed main", () => {
  assert.match(launcher, /if \(!hasLiveBaseline\) \{\s*runtime = await transitionRuntime\(\);\s*transition = await runtime\.readLiveTransitionRequest\(supportRoot\);/s);
});

test("candidate sandbox runner is isolated from the normal Admin and cannot enable live mode", () => {
  assert.match(candidateSandbox, /--support-root/);
  assert.match(candidateSandbox, /Candidate sandbox support root must be inside the system temporary directory/);
  assert.match(candidateSandbox, /DES_ART_ADMIN_PUBLISH_MODE: "sandbox"/);
  assert.doesNotMatch(candidateSandbox, /live-publish\.json/);
  assert.match(candidateSandbox, /tools\/des-art-admin\/server\.mjs/);
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
  assert.match(projectRoute, /if \(isAdminPreview\) await connection\(\)/);
  assert.match(projectsRoute, /if \(isAdminPreview\) await connection\(\)/);
});

test("launcher removes only an exact Next-generated agent rules block before checking managed changes", () => {
  assert.match(launcher, /async function clearGeneratedAgentRules\(\)/);
  assert.match(launcher, /BEGIN:nextjs-agent-rules/);
  assert.match(launcher, /HEAD:AGENTS\.md/);
  assert.match(launcher, /if \(cleaned !== expected\) return/);
  assert.ok(launcher.indexOf("await clearGeneratedAgentRules();") < launcher.indexOf("git\", [\"status\", \"--porcelain\"]"));
});

test("admin UI keeps Radix Themes inside the local admin boundary", () => {
  assert.equal(packageJson.dependencies["@radix-ui/themes"], "3.3.0");
  assert.match(adminUi, /<Theme accentColor="blue" grayColor="sand" radius="medium"/);
  assert.doesNotMatch(projectRoute, /@radix-ui\/themes/);
});

test("Admin startup loads image processing only when a Figma import is requested", () => {
  assert.doesNotMatch(figmaImporter, /^import sharp from "sharp";$/m);
  assert.match(figmaImporter, /import\("sharp"\)/);
});

test("admin workflows use internal dialogs and manual SVG logos", () => {
  assert.doesNotMatch(adminUi, /window\.(?:prompt|confirm|alert)/);
  assert.match(adminDialogs, /NewProjectDialog/);
  assert.match(adminDialogs, /AlertDialog/);
  assert.match(adminEditor, /accept="image\/svg\+xml,\.svg"/);
  assert.match(server, /saveLogo/);
  assert.match(adminComponents, /<Dialog\.Trigger ref=\{trigger\} className="image-preview-trigger"/);
  assert.match(adminComponents, /<Dialog\.Trigger[^>]*>\s*<button type="button">\{children\}<\/button>/s);
  assert.doesNotMatch(adminCss, /\.image-preview-trigger\s*\{\s*display:\s*contents/);
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
  assert.match(adminEditor, /section-toggle-interactive/);
  assert.match(adminEditor, /Визуальное поведение задаёт Portfolio/);
  assert.match(adminEditor, /interactiveEnabled=\{Boolean\(visual\) \|\| addingVisual\}/);
  assert.match(adminEditor, /importFigma\("section"/);
  assert.doesNotMatch(adminRail, /selected-section-settings/);
  assert.doesNotMatch(adminRail, /function SectionSettings/);
});

test("card, hero and interactive visuals accept one approved Figma Frame without exposing internal slots", () => {
  assert.match(adminComponents, /export function FigmaTemplateField/);
  assert.match(adminEditor, /Превью карточки/);
  assert.match(adminEditor, /Главное изображение открытого проекта/);
  assert.match(adminEditor, /Ширина:\s*\{minWidth\}–\{slot\.maxWidth\} px/);
  assert.match(adminEditor, /Первое изображение фиксирует точный размер этого пула/);
  assert.match(adminComponents, /source \? "Обновить" : "Импортировать"/);
  assert.match(adminComponents, /className="figma-source-actions"/);
  assert.match(adminComponents, /aria-label=\{`Удалить \$\{title\}`\}/);
  assert.doesNotMatch(adminEditor, /VisualSlotEditor|Заменить изображение/);
  assert.doesNotMatch(adminEditor, /Тип интерактивного блока|<Select/);
  assert.match(server, /\/api\/figma\/status/);
  assert.match(server, /segments\[3\] === "figma-template"/);
  assert.match(adminCss, /\.figma-template-field\s*\{[^}]*min-width:\s*0/s);
  assert.match(adminCss, /\.figma-frame-preview\[data-shape="card"\][^{]*\{[^}]*aspect-ratio:\s*1/s);
  assert.match(adminCss, /\.figma-frame-preview\[data-shape="surface"\][^{]*img[^}]*max-width:\s*100%/s);
  assert.match(adminCss, /\.figma-frame-preview\[data-shape="surface"\]\s*\{[^}]*width:\s*fit-content/s);
  assert.doesNotMatch(adminComponents, /style=\{previewShape === "surface"/);
});

test("Admin keeps project identity global and exposes status actions without a visibility select", () => {
  assert.match(adminUi, /<ProjectIdentityEditor/);
  assert.match(adminUi, /className="project-tabs"/);
  assert.match(adminEditor, /export function ProjectIdentityEditor/);
  assert.match(adminCss, /\.project-identity\s*\{[^}]*background:\s*#fff/s);
  assert.doesNotMatch(adminRail, /<Select\.Root value=\{project\.visibility\}/);
  assert.match(adminRail, /export function ProjectOverview/);
  assert.match(adminRail, /export function ProjectDangerActions/);
  assert.ok(adminUi.indexOf("<ProjectOverview") < adminUi.indexOf("<CardSettings"));
  assert.ok(adminUi.indexOf("<ProjectDangerActions") > adminUi.indexOf("<CardSettings"));
  assert.match(adminRail, /Снять с публикации/);
  assert.match(adminRail, /preview\("home"\)/);
  assert.match(adminRail, /Все работы/);
  assert.match(adminRail, /Страница проекта/);
  assert.doesNotMatch(adminRail, /DropdownMenu\.Trigger asChild/);
  assert.match(adminRail, /className="preview-split-trigger"/);
  assert.match(adminRail, /<DropdownMenu\.Trigger[^>]*>\s*<button type="button" className="preview-split-trigger">/s);
  assert.match(adminCss, /\.preview-split-trigger\s*>\s*svg\s*\{[^}]*width:\s*16px[^}]*height:\s*16px/s);
  assert.match(adminRail, /className="project-action-row"/);
  assert.match(adminRail, /className="project-publish-button"/);
  assert.match(adminRail, /<IconButton size="3" variant="ghost" color="gray" aria-label="Сбросить до опубликованной версии" title="Сбросить до опубликованной версии" onClick=\{reset\}><ReloadIcon \/>/);
  assert.doesNotMatch(adminRail, /ResetIcon/);
  assert.match(adminCss, /\.project-action-row\s*\{[^}]*width:\s*100%/s);
  assert.match(adminCss, /\.project-publish-button\s*\{[^}]*flex:\s*1 1 auto/s);
  assert.doesNotMatch(adminComponents, /Dialog\.Trigger asChild/);
  assert.match(adminUi, /confirmation === "unpublish"/);
  assert.match(adminUi, /setVisibility\("draft"\)/);
});

test("gallery devices are derived from uploaded images instead of activation switches", () => {
  assert.doesNotMatch(adminRail, /function GallerySettings/);
  assert.doesNotMatch(adminRail, /pendingGalleryDevices/);
  assert.doesNotMatch(adminEditor, /pendingGalleryDevices/);
  assert.match(adminEditor, /const galleryGroups = \(\["desktop", "tablet", "mobile"\] as const\)/);
  assert.match(adminEditor, /groups: value\.groups\.filter\(\(group\) => group\.images\.length > 0\)/);
  assert.doesNotMatch(adminCore, /pendingDeviceIds/);
});

test("card settings do not expose unrelated platform switches", () => {
  assert.doesNotMatch(adminRail, /<RailGroup title="Платформы">/);
  assert.doesNotMatch(adminRail, /ProjectPlatform/);
});

test("Gallery device presentation is code-owned outside Admin data", () => {
  for (const device of ["desktop", "tablet", "mobile"]) {
    assert.match(projectGallery, new RegExp(`icon: "/assets/projects/corvo/${device}\\.svg"`));
  }
  assert.doesNotMatch(adminEditor, /icon:\s*"\/assets\/projects/);
});

test("rich text toolbar uses Radix icons instead of letter glyph controls", () => {
  assert.match(adminComponents, /FontBoldIcon/);
  assert.match(adminComponents, /FontItalicIcon/);
  assert.match(adminComponents, /UnderlineIcon/);
  assert.doesNotMatch(adminComponents, /<strong>B<\/strong>/);
  assert.doesNotMatch(adminComponents, /<em>I<\/em>/);
  assert.doesNotMatch(adminComponents, /<u>U<\/u>/);
});

test("gallery uses large device-sized horizontal tiles with bottom-left ordering and bottom-right deletion", () => {
  assert.match(adminEditor, /function GalleryDeviceStrip/);
  assert.match(adminEditor, /className="gallery-upload-tile"/);
  assert.match(adminEditor, /className="gallery-thumbnail"/);
  assert.match(adminEditor, /data-at-start=\{edges\.atStart/);
  assert.match(adminEditor, /data-at-end=\{edges\.atEnd/);
  assert.match(adminEditor, /aria-label="Переместить изображение влево"/);
  assert.match(adminEditor, /aria-label="Переместить изображение вправо"/);
  assert.match(adminEditor, /className="gallery-item-delete"/);
  assert.match(adminEditor, /className="gallery-item-controls"/);
  assert.match(adminEditor, /const scrollGallery = \(direction: -1 \| 1\)/);
  assert.match(adminEditor, /Прокрутить \$\{label\} влево/);
  assert.match(adminEditor, /Прокрутить \$\{label\} вправо/);
  assert.match(adminEditor, /function galleryThumbnailSize/);
  assert.match(adminEditor, /galleryThumbnailSize\(item, group\.deviceId\)/);
  assert.match(adminCss, /\.gallery-list\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(adminCss, /\.gallery-list\[data-at-start="true"\]/);
  assert.match(adminCss, /\.gallery-group\[data-device="mobile"\]/);
  assert.match(adminCss, /\.gallery-item-controls\s*\{[^}]*background:\s*#fff/s);
  assert.match(adminCss, /\.gallery-item-controls \.rt-IconButton\s*\{[^}]*background:\s*transparent/s);
  assert.match(adminCss, /\.gallery-scroll-button-left\s*\{[^}]*left:\s*8px/s);
  assert.match(adminCss, /\.gallery-scroll-button-right\s*\{[^}]*right:\s*8px/s);
  assert.match(adminCss, /--gallery-tile-width:\s*460px/);
  assert.match(adminCss, /\[data-device="tablet"\]\s*\{[^}]*--gallery-tile-height:\s*360px/s);
  assert.match(adminCss, /\[data-device="mobile"\]\s*\{[^}]*--gallery-tile-height:\s*320px/s);
  assert.match(adminCss, /\.gallery-list > li\.gallery-thumbnail\s*\{[^}]*flex:\s*0 0 auto/s);
});

test("rich toolbar active state is gray and clears when focus leaves the editor", () => {
  assert.match(adminComponents, /className=\{active \? "rich-toolbar-tool-active"/);
  assert.match(adminComponents, /color="gray"/);
  assert.match(adminComponents, /setState\(EMPTY_EDITOR_STATE\)/);
  assert.match(adminComponents, /onBlur=\{\(\) => setState\(EMPTY_EDITOR_STATE\)\}/);
  assert.match(adminCss, /\.rich-toolbar \.rt-IconButton\.rich-toolbar-tool-active/);
  assert.match(adminCss, /\.admin-shell \.rich-toolbar \.rt-IconButton:hover\s*\{[^}]*width:\s*32px/s);
  assert.match(adminCss, /\.admin-shell \.rich-toolbar \.rt-IconButton:focus-visible\s*\{[^}]*padding:\s*0 !important/s);
});

test("public Portfolio omits empty gallery device pools and the gallery itself when no images remain", () => {
  assert.match(projectGallery, /const populatedGroups = groups\.filter\(\(group\) => group\.images\.length > 0\)/);
  assert.match(projectGallery, /if \(populatedGroups\.length === 0\) return null/);
  assert.match(projectRoute, /block\.groups\.some\(\(group\) => group\.images\.length > 0\)/);
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
