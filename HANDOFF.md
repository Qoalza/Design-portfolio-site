# HANDOFF

Обновлено: 2026-09-24.

## Checkout

- Branch: `codex/concept-v2-scroll-lag`.
- Worktree: `/Users/designer/.codex/worktrees/concept-v2-scroll-lag/Design-portfolio-site`.
- Tested runtime SHA: `e2b4cbfb488476171f135e9bfcf2ac853255eb27` (`perf(concept-v2): rasterize hero dot mask once`).
- Development URL: `http://127.0.0.1:43221/`.
- Production-preview acceptance URL: `http://127.0.0.1:43222/`.

## Current checkpoint

- After the rasterized Hero mask removed the large compositor stall, the user reported a much smaller residual snag at the Hero → Projects boundary.
- A fresh trace showed that scroll activity was still written to the root `html` element and that settlement automatically restarted the 150 ms Project hover when the stationary pointer happened to land over the moving card. That caused a document-wide style invalidation and about 125 Paint events during the controlled anchor-scroll pass.
- Runtime commit `55c0da2` keeps the activity flag local to `.projects-section`. Pointer hover is removed synchronously for active scroll and remains suspended after settlement until the next real pointer movement; keyboard `:focus-within` stays independent.
- Two identical post-fix traces measured only 24 and 26 Paint events, zero long tasks, and maximum main-thread `RunTask` durations of `4.95 ms` and `4.58 ms`. The root element no longer receives `data-scroll-active`.
- A browser interaction check confirmed that one pointer movement removes the local gate and restores the exact existing line expansion, glow, shade opacity, front-image rotation and shadow without changing their CSS values.
- The preceding commits still retain the prerasterized Hero wave mask and cancel active Hero route pulses synchronously during scroll, with the first returning pulse immediate after settlement.
- Clean wheel and trackpad traces showed that the earlier automated anchor pass also paid the one-time global custom-cursor activation cost. With the cursor warmed, Chromium crossed the complete Hero boundary without a main-thread stall; Project media, Lenis class mutation, active pulse removal and offscreen Experience work were ruled out as the remaining concentrated owner.
- The remaining Firefox/Zen-sensitive render owner was the full-width CSS `mask-image` on `.hero-bottom-dots`. Removing only that mask cut the controlled GPU workload substantially, while replacing the radial dot generator alone did not.
- Runtime commit `e2b4cbf` keeps the existing `2880×640` mask, exact `110% calc(112% + 100px)` geometry, `16px` dot grid and current colors, but applies them once to a DPR-aware canvas. The original masked element remains as the load/error fallback and is removed from rendering only after the bitmap is ready.
- Desktop Small Hero at `1438×879`, DPR `2.2` produced the expected `3164×704` canvas. Mobile resets to the original CSS field with a `0×0` canvas; authored Large Hero retains its original unmasked field and gradient overlay.

## Verification

- Focused RED/GREEN Project hover lifecycle test passed, including repeated scroll before pointer re-arm and cleanup.
- Full lint and 99/99 tests passed.
- Vite production build passed (83 modules).
- Built-runtime browser smoke passed.
- `git diff --check` passed.
- Fidelity/completeness review confirmed the same mask source, position, size, dot spacing, colors and visual stacking; the `1438×879` browser check showed no observable Hero delta.
- Regression/scope review confirmed finite resize/media cleanup and no change to Project media/layers, Hero graph/pulses, Lenis, Experience, dependencies, public Portfolio, Admin, shared contract, Figma, deploy or production.
- Two final production-preview boundary traces crossed to `scrollY=1636.5` with zero dropped/high-latency/missing frames. Maximum renderer-main `RunTask` was `2.20 ms` and `3.21 ms`; maximum Paint was `0.13 ms` and `0.20 ms`.

## Acceptance and stop-lines

- Manual first and repeated Hero → Projects scroll-feel acceptance in the user's normal Zen window remains required; Chromium tracing proves the bounded renderer work but does not substitute for that final Zen feel pass.
- The current dot field was already non-interactive. Any future interactive-dot work must remain a separate visual feature and explicitly decide whether to extend or replace the canvas renderer; do not silently reintroduce a live full-width CSS mask.
- Do not change the approved fade geometry, Project visuals or animations unless new evidence requires a separately reviewed correction.
- No Figma write, public Portfolio, Admin, shared contract, canonical content/assets, dependency, push, PR, merge, deploy or production action occurred.

## Next action

- User tests `http://127.0.0.1:43222/` in Zen, including first and repeated passes with the pointer resting over the destination card. If a hitch remains, capture a Zen profile of exact runtime `e2b4cbf` before changing another visual/render owner.

## Pointers

- Execution record: `docs/exec-plans/concept-v2-runtime-optimization.md`.
- Runtime contract: `docs/portfolio/CONCEPT_V2_RUNTIME.md`.
- QA record: `tools/concept-v2/app/design-qa.md`.
