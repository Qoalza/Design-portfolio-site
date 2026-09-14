# DESIGN QA

Обновлено: 2026-08-31.

## Назначение

Только текущие подтверждённые visual/interaction findings со статусами:

`OPEN | IN_PROGRESS | READY_FOR_REVIEW`

Закрытые и superseded пакеты здесь не хранятся. После пользовательской приёмки запись удаляется; важный системный root cause при необходимости сохраняется в `PROJECT_HISTORY.md`, evidence остаётся в `design-reference/**`.

## OPEN — current platform icon visual fidelity

Механика platform icons уже принята и **не является дефектом**:

- full icon frame/canvas;
- intrinsic dimensions;
- mask/currentColor/semantic color role;
- отсутствие forced generic `20×20`;
- отсутствие stale hard-coded consumer color.

Этот долговечный contract находится в `DESIGN_SYSTEM.md`.

Открытым остаётся только визуальное/source соответствие конкретных current platform-icon instances.

Перед закрытием:

1. получить exact current Figma source mapping для затронутых platform icons;
2. проверить current `main`/runtime instances;
3. подтвердить geometry, frame, color, alignment и source family;
4. получить пользовательскую visual acceptance конкретных current instances.

Историческая системная причина сохраняется в `PROJECT_HISTORY.md`.


## READY_FOR_REVIEW — Concept V2 «Обо мне», accepted Plan 3.0 scope

- Scope: current Concept V2 worktree `codex/concept-v2-about-correction`, not the historical About implementation.
- Accepted on `94f6f9c`: Figma-accurate hatch direction/step and independent lower borders; no duplicate section rule; 16/24 section subtitle; compact interruptible card handoff; proportional embedded-card content; full-card hover action with the approved cursor; and independent viewer selection state.
- User-confirmed interaction additions: the hover label is informational, the whole dimmed active card opens the viewer; closing viewer clears the active-card dim state without extra click; dogs caption has a required break after «Это мои сладкие дети,». 
- Current Figma instance `3223:155136`: embedded rear cards are `256×336` (`0.8×` of `320×420`) with an `−80 px` pair overlap. This geometry is intentionally scoped to the embedded deck; the viewer retains its independent prior geometry until its own Figma instance is revised.
- Completed proof: user visual acceptance plus focused motion, hover/viewer/resize regression checks, `npm run check`, `npm run check:browser`, and `git diff --check` on final HEAD `94f6f9c`.
- Deferred, not accepted as complete: direct 1.5× enlarged-viewer geometry and the remaining image-card border/gradient refinements. The later site-wide icon, point-pattern, process-hover and experience-fade work requires a separate plan and goal.

## READY_FOR_REVIEW — Concept V2 visual fidelity, Plan 4.0

- Scope: `codex/concept-v2-visual-fidelity` from accepted baseline `7b1f3e4`; no production or shared-contract changes.
- Sources: About `3223:155421`, `3223:155136`, `3223:139419`, `3263:179635`; Process `3210:124239`; Experience `3142:82981`; dot tile `3116:67455`; current header/buttons and icon-library Medium assets.
- Completed code scope: exact Medium full-frame vectors; About sharp border and caption gradient; uniform `1.5×` viewer composition; Experience fade after completion; shared 3px/16px SVG dot tile; Process Default/Enable hover; responsive Hero captions; the user-requested 150ms two-way sticky Header; and the revised Experience entry with no captured scroll or forced snapping.
- Automated evidence: `49/49` tests, lint, production build, browser smoke and `git diff --check` after `63f70c9`. A later user visual check caught the About caption-gradient structural layer and viewer control-state/position regression; both were corrected and the focused About test, lint, build, smoke and diff checks were rerun. The test suite also rejects stale viewer X/Y scales, obsolete radial dot fields, complete-state fade suppression, and the obsolete Experience `scrollTo`/Lenis-stop entry gateway. The current guard retains the `81/80px` Header threshold, asserts the compact-only 24px/180ms heading-track transition, and proves tall pinned field geometry against the Header-free viewport; the About deck is constrained to one shared eased path for embedded and viewer transitions and retains bounded motion continuity on an interrupted handoff.
- Local-browser visual evidence: `1280×720` shows the restored About gradient, exact dot tile and full-frame vector cursor layer; `1440×960` exactly matches viewer card/control coordinates; `1439×960` and `1440×959` keep a uniformly scaled, fully visible viewer card. Viewer selection remains independent. The active Header shell is `z-index:20` versus project-divider `8`; at `1700×1318`, Experience renders equal `106px` top and bottom dot fields below the Header. Firefox/WebKit are unavailable, and the separate Chrome automation attempt timed out, so those engines are not represented as acceptance.

## Не является записью этого файла

- принятые 404/500 pages;
- старый Admin Figma Frame preview checkpoint без воспроизведения на current source/runtime;
- MLIR2–MLIR7 history/closed packages;
- preloaders/loading states без подтверждённого current Figma discrepancy;
- старые `READY_FOR_USER_REVIEW` screenshots;
- feature backlog, архитектурные планы и deploy tasks.
