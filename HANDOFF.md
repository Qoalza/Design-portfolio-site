# HANDOFF

Обновлено: 2026-09-24.

## Checkout

- Branch: `codex/concept-v2-scroll-lag`.
- Worktree: `/Users/designer/.codex/worktrees/concept-v2-scroll-lag/Design-portfolio-site`.
- Tested runtime SHA: `7b12f8f7f8b6f366a3863764ed0a7e762af18e3e` (`perf(concept-v2): prerasterize hero wave mask`).
- Local acceptance URL: `http://127.0.0.1:43221/`.

## Current checkpoint

- The remaining concentrated Hero → Projects hitch was isolated to the desktop Small Hero's full-width SVG mask. Its source applies `feGaussianBlur stdDeviation="75"` over a `2106×714` filter region while the masked dotted field leaves the viewport.
- An identical controlled scroll trace at `1438×879` measured a roughly `30 ms` maximum Graphics/SwapBuffers stage with the live SVG mask. Disabling that mask reduced the maximum to roughly `2.4 ms`.
- Runtime commit `7b12f8f` replaces only the live mask resource with a pre-rasterized `2880×640` alpha PNG. The CSS dots, fade size and position, Hero geometry, route map, project cards, hover mechanics and Lenis behavior are unchanged.
- The replacement trace measured about `3.6 ms` maximum SwapBuffers and `3.5 ms` maximum Graphics.Pipeline on the same pass.
- A 2× pixel comparison of the old SVG-rendered field and the new raster-mask field measured mean channel delta `0.063/255` and maximum delta `7/255`; visual inspection found no observable difference.
- The preceding runtime commit `5250d763425a353c62f4bc921cc2bf760e4ae1d1` still cancels active Hero route pulse paths synchronously during scroll and resumes with an immediate first pulse after settlement.

## Verification

- Focused RED/GREEN Hero test passed.
- Full lint and 95/95 tests passed.
- Vite production build passed (82 modules).
- Built-runtime browser smoke passed.
- `git diff --check` passed.
- Fidelity/completeness review confirmed the same mask sizing/position, live CSS dot texture, unchanged geometry and visually indistinguishable output.
- Regression/scope review confirmed no change to Project media/layers, hover animation, Lenis, Experience, dependencies, public Portfolio, Admin, shared contract, Figma, deploy or production.

## Acceptance and stop-lines

- Manual first and repeated Hero → Projects scroll-feel acceptance in the user's normal Zen window remains required; Chromium tracing proves the isolated rendering cost but does not substitute for that final Zen feel pass.
- Do not change the approved Hero dots, fade geometry, project visuals or animations unless new evidence requires a separately reviewed correction.
- No Figma write, public Portfolio, Admin, shared contract, canonical content/assets, dependency, push, PR, merge, deploy or production action occurred.

## Next action

- User tests `http://127.0.0.1:43221/` in Zen. If the concentrated hitch remains, capture a Zen profile of the updated exact runtime before changing another visual/render owner.

## Pointers

- Execution record: `docs/exec-plans/concept-v2-runtime-optimization.md`.
- Runtime contract: `docs/portfolio/CONCEPT_V2_RUNTIME.md`.
- QA record: `tools/concept-v2/app/design-qa.md`.
