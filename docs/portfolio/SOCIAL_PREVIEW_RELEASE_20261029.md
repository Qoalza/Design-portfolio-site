# Social preview release — 2026-10-29

Status: production published; Telegram client acceptance awaiting user's fresh-link test.

User supplied original Figma exports Frame26093152.png and Frame26093153.png and authorized main+production. Wide2400x1260 (SHA256e83c720697b0098f95d4630fcf7fd611cb8b2dfcb93ab5dda1e94fd71e0d7ceb), square1280x1280 (SHA256488966c6e2d94727b6e83930f6e852ef874bbef57493f211f131a5a53ace6505). Both retain exact original bytes and sRGB. No resize, redraw or recompression.

Versioned URLs /artur-designer-social-preview-v2.png and /artur-designer-social-preview-square-v2.png; oldURL retained. Wide leads OpenGraph, square is secondary candidate, each type/dimensions/alt declared. Twitter large uses wide. No claim of automatic per-client square selection. OG specification read at https://ogp.me/ (structuredproperties/arrays).

Initial cover release0d93fa57bd87283f372d2f30cc86edec4d5b0f07 activated codeepoch5. Independent public+preview packaging preserves original PNGs; host RED/GREEN2 tests,11focused artifact/runtime/controller tests, lint/build/package passed. Two sequential fresh reviews found no actionable defects.

User then reported noTelegramcard whileHH displayed preview. Server/PNGs HTTP200 including TelegramBot UA probe. Found OGmetadata atbyte148940 afterlargecriticalCSS andliveDTO. Follow-up06325d78114896a41fb10b8e3616be7532703d89 moves onlysharemetadata aftercharset, beforestyles; liveJSONremainsheadend. A168KB CSSfixture RED/GREEN guards first4KB metadata andcharsetordering. Two sequentialreviews passed. Finalbuild/package and3focused host+unpackedartifact tests passed. ActualproductionOGimage nowbyte913; all4routes have bothorderedimages andTwitterwide; originalPNGhashes/dimensions/MIME unchanged. Hiddenbrowser homepageboots, real3cards, noJSerrors.

Deployed source06325d78114896a41fb10b8e3616be7532703d89; artifact24a7c2ae6f874dc44ead8620ff60e11a11d53f67fde9055947dbddb530d98d4e; renderer4173c2ff24b359ee5249aa54e836a37be429725106a2d2f4e7943885d2a16d5f; activation6; operationd9c130c3-01e5-4f3f-b5e2-f5ca6efcfc08. Main fast-forward only. CMSdescriptor/completehealth/PIDs/schema and contentb158f7017c45d2c9e67f0d905c725e0138c2cff2782c37f09bbed45cdea6fb4c unchanged. No Admin/content/UI/adaptive/dependencychanges.

Previous compatible artifactb0d7190db9cda7a803a100833ac2b6e2e1cbdd56e68deed76c6292318bf71fbf retained. Rollback requires newPortfolio-onlyintent against currentconfirmedslot; no datarestore. No rollback needed.

Telegram-specific cause is not proven by HTTP success or headorder. Recent boundednginxlog contained noactualfreshTelegramfetch exceptourmanualUAprobe. User asked to test https://art-des.ru/?preview=20261029 before sending; awaitingresult. NoTelegrammessages sent by agent. Does not claim preview support for Codex/chat UI. Evidence design-reference/releases/06325d7-social-previews/.

## Original 1x covers, user-authorized experiment

2026-10-29: user supplied Width.png1200x630 and Square.png640x640 and asked to replace published covers. Exact original bytes copied to v3 URLs; prior v2 URLs retained. No changes to metadata structure/order, PNG format, networking or page behavior. Wide130728bytes SHA2568d23347753e97b0ada1143e60823ad284dfaace27b4d2a2407fe01b881aa8b96; square84421bytes SHA2564f19a72ce5eb190dd4e7178e864f77c1e5c23548cd74c2e67a5e43952cc10b8e.

Runtime65e0c6bce2f2f01bdd3375e58a7e4011ff39feb6, artifact5a7fb3ac0c643dd35377197b3dab4e0bbfbe17b6cb7d4136e663c0519c3ac5e8, activation7, operationd4b629ce-84ad-4a10-ab46-dac2ca63547d. Three host/artifact tests, exact build/package, original-byte checks in public+preview packages and public four-route/two-image checks passed. Two sequential self-review passes covered completeness and scope/rollback: no actionable findings. CMS descriptor/full health and published content remained unchanged. Evidence: design-reference/releases/65e0c6b-social-previews-1x/public-postcheck.json. Telegram success not yet observed; image size remains a hypothesis.

Correction to preceding historical entry: activation6 operation was6f25e234-5999-42b4-be07-d0ae23c9c9f7; d9c130c3-01e5-4f3f-b5e2-f5ca6efcfc08 belonged to activation5.

## Minimal diagnostic page

User authorized a temporary independent page after 1x images also failed in Telegram. Published /preview-test-20261029: literal712-byte HTML, one existing widev3PNG, required OpenGraph fields and dimensions. No app template, scripts, preloader, styles, CMS read or htmlFor. Exact route only; not added to sitemap/navigation. GET/HEAD supported, other methods405. This isolates template/app involvement, not DNS/TLS/hosting or the shared image.

Runtime4753d298a903aaaabcf7b40db10ba6143c4a178b; artifact19b6b8976609c83988e333badd498234b7d3fd1f7fcc9021ac2708cd52353d91; activation8; operation6d105fd4-f87a-427d-8d2a-9c60c760827f. Four focused tests, lint, exact build/package passed. Sequential self-review covered isolation/completeness and exact-route/regression boundaries; no actionable findings. Public probe200/712bytes, four existing routes, both original image hashes, content and CMS invariance verified. Evidence design-reference/releases/4753d29-preview-probe/public-postcheck.json. Await Telegram result; no claim of root cause or resolution. Remove temporary route/module/test after diagnosis is complete.

## Wide-only preview

User requested removal of square artwork and all active references. Deleted squarev2/v3 public files and packaging entries. Main/project metadata now expose exactly one original widev3PNG1200x630; Twitter same. Historical evidence, Git history and user originals retained; no square files in active public/preview packages. Both previous square URLs verified404. No format-switch logic existed. Minimal probe already had one image and remains unchanged; Telegram cause remains unproven. User reports VK preview exists but uses a small square-shaped presentation of wide artwork; VK UI was not independently verified.

Deployed80a3e8e7e4e5fb70a09cd21d1f79eee17d4602d0; artifactf6ef2abad5871d5b276bcd2b38da65fc2993156f739f5c44406a42e5b2b2fa0d; activation9; operation1642df38-7401-4064-8233-75d6a42e4bdd. Lint/build/package, four focused tests and public four-route single-image+square404 checks passed; original wide hash, CMS health and content unchanged. Sequential self-review confirmed completeness then packaging/regression boundaries. Evidence design-reference/releases/80a3e8e-wide-only-preview/public-postcheck.json.

## Text-only test; obsolete diagnostic removed

User approved text-only test and requested removal of extra diagnostic URLs. Replaced /preview-test-20261029 with /preview-text-20261029, literal523-byte HTML with title/description/type/url and no image/link/script/style. Old diagnostic URL verified404. Main and all project previews still use one original widev3PNG. No other diagnostic routes found in active runtime source; historical evidence retained.

Published07d7d527f7634ad2b0d9e4c2c6051cb6909a742a; artifact4e577752a3377b7dead40452086bde5d4b85edf4790c5cf60713541c51b9c110; activation10; operatione85fe74f-cec8-4186-bbe5-b73ff757f268. Four focused tests, lint/build/package passed; sequential completeness/scope reviews found no actionable issues. Public text probe200, old probe404, square URLs404, four site routes/single-wide metadata/image hash and CMS/content unchanged verified. Evidence design-reference/releases/07d7d52-text-preview/public-postcheck.json. Await Telegram client result; prior wide-only release also failed per user.
