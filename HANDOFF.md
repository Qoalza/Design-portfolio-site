# HANDOFF

Обновлено: 2026-09-24.

## Checkout

- Branch: `codex/concept-v2-scroll-lag`.
- Worktree: `/Users/designer/.codex/worktrees/concept-v2-scroll-lag/Design-portfolio-site`.
- Tested runtime SHA: `0e45829e703937f31fe050e90c93dd62a83fa5b2` (`perf(concept-v2): suspend hero lens during scroll`).
- Development URL: `http://127.0.0.1:43221/`.
- Production-preview acceptance URL: `http://127.0.0.1:43222/`.

## Current checkpoint

- The one-time Hero dot-field raster in `e2b4cbf` removed the large compositor stall. The user reported that scrolling became substantially better but retained a small snag.
- Controlled passes ruled out Header pinning, already-decoded Project media and the held Project-hover gate at this remaining point. Starting the same pass with the Hero lens active increased renderer paint/style work and GPU raster work; the lens still owned a second filtered/masked SVG network while the page began moving.
- Runtime commit `0e45829` subscribes the Hero lens to the existing Lenis activity signal. Physical scroll closes the lens in the same input turn, cancels queued pointer work and prevents layout-driven pointer events from reopening it while scrolling.
- Scroll closure is intentionally immediate: the local `--lens-progress` transition is disabled only while active scroll is published. The selected caption resets immediately without its delayed 160 ms default or 300 ms crossfade. After settlement, both approved animations return unchanged and a real pointer movement re-arms the interaction.
- The prior Project hover gate, route-pulse cancellation, responsive AVIF preparation and one-time DPR-aware dot-field canvas remain intact. No new listener loop, RAF owner, dependency, asset derivative or visual rest/hover state was introduced.

## Verification

- Focused RED/GREEN tests cover synchronous lens closure, scroll-time pointer rejection, immediate caption reset, timer cancellation and cleanup.
- Full lint and 101/101 tests passed.
- Vite production build passed (83 modules).
- Built-runtime browser smoke passed.
- `git diff --check` passed.
- Browser behavior checks proved `transition:none` in the same wheel turn, no reactivation from pointer movement during active scroll, neutral caption settlement with no outgoing node, and restoration of both the existing lens transition and Project card hover after real pointer movement.
- Two final production-preview passes began with the lens visibly active and crossed to `scrollY=1020` with zero dropped frames. Maximum renderer-main `RunTask` was `4.68 ms` and `3.37 ms`; only 13 Paint events occurred in each pass, with maximum Paint `1.05 ms` and `0.71 ms`.
- Fidelity/completeness review found no change to rest-state lens geometry, radius, mask/filter, caption copy or approved 180/300 ms interaction timing. Regression/scope review found no change to Lenis configuration, Project visuals, Experience, media, dependencies, public Portfolio, Admin, shared contract, Figma, deploy or production.

## Acceptance and stop-lines

- Manual first and repeated Hero → Projects scroll-feel acceptance in the user's normal Zen window remains required; Chromium tracing proves the bounded renderer work but does not substitute for that final Zen feel pass.
- The current dot field was already non-interactive. Any future interactive-dot work must remain a separate visual feature and explicitly decide whether to extend or replace the canvas renderer; do not silently reintroduce a live full-width CSS mask.
- Do not change the approved fade geometry, Project visuals or animations unless new evidence requires a separately reviewed correction.
- No Figma write, public Portfolio, Admin, shared contract, canonical content/assets, dependency, push, PR, merge, deploy or production action occurred.

## Next action

- User tests `http://127.0.0.1:43222/` in Zen, including first and repeated passes after moving the pointer over the Hero map. If a hitch remains, capture a Zen profile of exact runtime `0e45829` before changing another visual/render owner.

## Pointers

- Execution record: `docs/exec-plans/concept-v2-runtime-optimization.md`.
- Runtime contract: `docs/portfolio/CONCEPT_V2_RUNTIME.md`.
- QA record: `tools/concept-v2/app/design-qa.md`.
