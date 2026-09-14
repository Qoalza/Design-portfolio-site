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
- Completed code scope: exact Medium full-frame vectors; About sharp border and caption gradient; uniform `1.5×` viewer composition; Experience fade after completion; shared 3px/16px SVG dot tile; Process Default/Enable hover; and responsive Hero captions.
- Automated evidence: `48/48` tests, lint, production build, browser smoke and `git diff --check` after the final CSS cleanup. The test suite also rejects stale viewer X/Y scales, obsolete radial dot fields and complete-state fade suppression.
- Manual visual matrix is still required for Chromium, Firefox and WebKit. The available desktop automation surface timed out, therefore no visual browser acceptance is claimed yet.

## Не является записью этого файла

- принятые 404/500 pages;
- старый Admin Figma Frame preview checkpoint без воспроизведения на current source/runtime;
- MLIR2–MLIR7 history/closed packages;
- preloaders/loading states без подтверждённого current Figma discrepancy;
- старые `READY_FOR_USER_REVIEW` screenshots;
- feature backlog, архитектурные планы и deploy tasks.
