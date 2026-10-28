# Social preview release — 2026-10-29

Status: production published; Telegram client acceptance awaiting user's fresh-link test.

User supplied original Figma exports Frame26093152.png and Frame26093153.png and authorized main+production. Wide2400x1260 (SHA256e83c720697b0098f95d4630fcf7fd611cb8b2dfcb93ab5dda1e94fd71e0d7ceb), square1280x1280 (SHA256488966c6e2d94727b6e83930f6e852ef874bbef57493f211f131a5a53ace6505). Both retain exact original bytes and sRGB. No resize, redraw or recompression.

Versioned URLs /artur-designer-social-preview-v2.png and /artur-designer-social-preview-square-v2.png; oldURL retained. Wide leads OpenGraph, square is secondary candidate, each type/dimensions/alt declared. Twitter large uses wide. No claim of automatic per-client square selection. OG specification read at https://ogp.me/ (structuredproperties/arrays).

Initial cover release0d93fa57bd87283f372d2f30cc86edec4d5b0f07 activated codeepoch5. Independent public+preview packaging preserves original PNGs; host RED/GREEN2 tests,11focused artifact/runtime/controller tests, lint/build/package passed. Two sequential fresh reviews found no actionable defects.

User then reported noTelegramcard whileHH displayed preview. Server/PNGs HTTP200 including TelegramBot UA probe. Found OGmetadata atbyte148940 afterlargecriticalCSS andliveDTO. Follow-up06325d78114896a41fb10b8e3616be7532703d89 moves onlysharemetadata aftercharset, beforestyles; liveJSONremainsheadend. A168KB CSSfixture RED/GREEN guards first4KB metadata andcharsetordering. Two sequentialreviews passed. Finalbuild/package and3focused host+unpackedartifact tests passed. ActualproductionOGimage nowbyte913; all4routes have bothorderedimages andTwitterwide; originalPNGhashes/dimensions/MIME unchanged. Hiddenbrowser homepageboots, real3cards, noJSerrors.

Deployed source06325d78114896a41fb10b8e3616be7532703d89; artifact24a7c2ae6f874dc44ead8620ff60e11a11d53f67fde9055947dbddb530d98d4e; renderer4173c2ff24b359ee5249aa54e836a37be429725106a2d2f4e7943885d2a16d5f; activation6; operationd9c130c3-01e5-4f3f-b5e2-f5ca6efcfc08. Main fast-forward only. CMSdescriptor/completehealth/PIDs/schema and contentb158f7017c45d2c9e67f0d905c725e0138c2cff2782c37f09bbed45cdea6fb4c unchanged. No Admin/content/UI/adaptive/dependencychanges.

Previous compatible artifactb0d7190db9cda7a803a100833ac2b6e2e1cbdd56e68deed76c6292318bf71fbf retained. Rollback requires newPortfolio-onlyintent against currentconfirmedslot; no datarestore. No rollback needed.

Telegram-specific cause is not proven by HTTP success or headorder. Recent boundednginxlog contained noactualfreshTelegramfetch exceptourmanualUAprobe. User asked to test https://art-des.ru/?preview=20261029 before sending; awaitingresult. NoTelegrammessages sent by agent. Does not claim preview support for Codex/chat UI. Evidence design-reference/releases/06325d7-social-previews/.
