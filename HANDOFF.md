# HANDOFF

Обновлено: 2026-09-24.

## Checkout

- Branch: `codex/concept-v2-scroll-lag`.
- Worktree: `/Users/designer/.codex/worktrees/concept-v2-scroll-lag/Design-portfolio-site`.
- Tested runtime SHA: `55c0da23c9a170738b45cb1dbdbc378889dfee9f` (`perf(concept-v2): defer project hover after scroll`).
- Local acceptance URL: `http://127.0.0.1:43221/`.

## Current checkpoint

- After the rasterized Hero mask removed the large compositor stall, the user reported a much smaller residual snag at the Hero → Projects boundary.
- A fresh trace showed that scroll activity was still written to the root `html` element and that settlement automatically restarted the 150 ms Project hover when the stationary pointer happened to land over the moving card. That caused a document-wide style invalidation and about 125 Paint events during the controlled anchor-scroll pass.
- Runtime commit `55c0da2` keeps the activity flag local to `.projects-section`. Pointer hover is removed synchronously for active scroll and remains suspended after settlement until the next real pointer movement; keyboard `:focus-within` stays independent.
- Two identical post-fix traces measured only 24 and 26 Paint events, zero long tasks, and maximum main-thread `RunTask` durations of `4.95 ms` and `4.58 ms`. The root element no longer receives `data-scroll-active`.
- A browser interaction check confirmed that one pointer movement removes the local gate and restores the exact existing line expansion, glow, shade opacity, front-image rotation and shadow without changing their CSS values.
- The preceding commits still retain the prerasterized Hero wave mask and cancel active Hero route pulses synchronously during scroll, with the first returning pulse immediate after settlement.

## Verification

- Focused RED/GREEN Project hover lifecycle test passed, including repeated scroll before pointer re-arm and cleanup.
- Full lint and 96/96 tests passed.
- Vite production build passed (82 modules).
- Built-runtime browser smoke passed.
- `git diff --check` passed.
- Fidelity/completeness review confirmed that every Project rest/hover declaration remains unchanged and keyboard focus is not gated.
- Regression/scope review confirmed finite listener cleanup and no change to Project media/layers, Lenis, Experience, dependencies, public Portfolio, Admin, shared contract, Figma, deploy or production.

## Acceptance and stop-lines

- Manual first and repeated Hero → Projects scroll-feel acceptance in the user's normal Zen window remains required; Chromium tracing proves the removed automatic hover work but does not substitute for that final Zen feel pass.
- Do not change the approved Hero dots, fade geometry, project visuals or animations unless new evidence requires a separately reviewed correction.
- No Figma write, public Portfolio, Admin, shared contract, canonical content/assets, dependency, push, PR, merge, deploy or production action occurred.

## Next action

- User tests `http://127.0.0.1:43221/` in Zen, including a pass with the pointer resting over the destination card. If a hitch remains, capture a Zen profile of this exact runtime before changing another visual/render owner.

## Pointers

- Execution record: `docs/exec-plans/concept-v2-runtime-optimization.md`.
- Runtime contract: `docs/portfolio/CONCEPT_V2_RUNTIME.md`.
- QA record: `tools/concept-v2/app/design-qa.md`.
