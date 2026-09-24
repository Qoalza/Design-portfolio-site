# HANDOFF

Обновлено: 2026-09-24.

## Checkout

- Branch: `codex/concept-v2-scroll-lag`.
- Worktree: `/Users/designer/.codex/worktrees/concept-v2-scroll-lag/Design-portfolio-site`.
- Tested runtime SHA: `714397c4fd77a8c55e33a059533ca469b520d8c7` (`perf(concept-v2): defer pulse restart past scroll`).
- Development URL: `http://127.0.0.1:43221/`.
- Production-preview acceptance URL: `http://127.0.0.1:43222/`.

## Current checkpoint

- The one-time Hero dot-field raster in `e2b4cbf` removed the large compositor stall. The user reported that scrolling became substantially better but retained a small snag.
- Controlled passes ruled out Header pinning, already-decoded Project media and the held Project-hover gate at this remaining point. Starting the same pass with the Hero lens active increased renderer paint/style work and GPU raster work; the lens still owned a second filtered/masked SVG network while the page began moving.
- Runtime commit `0e45829` subscribes the Hero lens to the existing Lenis activity signal. Physical scroll closes the lens in the same input turn, cancels queued pointer work and prevents layout-driven pointer events from reopening it while scrolling.
- Scroll closure is intentionally immediate: the local `--lens-progress` transition is disabled only while active scroll is published. The selected caption resets immediately without its delayed 160 ms default or 300 ms crossfade. After settlement, both approved animations return unchanged and a real pointer movement re-arms the interaction.
- The prior Project hover gate, route-pulse cancellation, responsive AVIF preparation and one-time DPR-aware dot-field canvas remain intact. No new listener loop, RAF owner, dependency, asset derivative or visual rest/hover state was introduced.
- A final timing probe found that the 36-path Hero pulse was recreated 5–7 ms before Lenis emitted its last scroll event. The restart now goes through one finite frame task, so a renewed gesture can cancel it and the immediate pulse is created only after the final scroll frame.

## Verification

- Focused RED/GREEN tests cover synchronous lens closure, scroll-time pointer rejection, immediate caption reset, timer cancellation and cleanup.
- Full lint and 101/101 tests passed.
- Vite production build passed (83 modules).
- Built-runtime browser smoke passed.
- `git diff --check` passed.
- Browser behavior checks proved `transition:none` in the same wheel turn, no reactivation from pointer movement during active scroll, neutral caption settlement with no outgoing node, and restoration of both the existing lens transition and Project card hover after real pointer movement.
- Two final production-preview passes began with the lens visibly active and crossed to `scrollY=1020` with zero dropped frames. Maximum renderer-main `RunTask` was `4.68 ms` and `3.37 ms`; only 13 Paint events occurred in each pass, with maximum Paint `1.05 ms` and `0.71 ms`.
- Three final production-preview timing probes placed the recreated pulse after the final scroll event, instead of before it. Three renderer traces reported zero dropped frames, maximum `RunTask` of `3.12–3.20 ms` and maximum Paint of `0.27–0.29 ms`.
- Final checks for `714397c`: 101/101 tests, lint, Vite production build, built-runtime browser smoke and `git diff --check` passed.
- Fidelity/completeness review found no change to rest-state lens geometry, radius, mask/filter, caption copy or approved 180/300 ms interaction timing. Regression/scope review found no change to Lenis configuration, Project visuals, Experience, media, dependencies, public Portfolio, Admin, shared contract, Figma, deploy or production.

## Acceptance and stop-lines

- The user completed the final scroll-feel pass in the normal browser context on 2026-09-24 and confirmed that the result works well. The runtime optimization is accepted; Chromium evidence remains supporting evidence rather than the acceptance substitute.
- The current dot field was already non-interactive. Any future interactive-dot work must remain a separate visual feature and explicitly decide whether to extend or replace the canvas renderer; do not silently reintroduce a live full-width CSS mask.
- Do not change the approved fade geometry, Project visuals or animations unless new evidence requires a separately reviewed correction.
- No Figma write, public Portfolio, Admin, shared contract, canonical content/assets, dependency, push, PR, merge, deploy or production action occurred.

## Next action

- No further optimization is queued. Preserve exact accepted runtime `714397c`; reopen only for a new reproduced regression.

## Pointers

- Execution record: `docs/exec-plans/concept-v2-runtime-optimization.md`.
- Runtime contract: `docs/portfolio/CONCEPT_V2_RUNTIME.md`.
- QA record: `tools/concept-v2/app/design-qa.md`.
