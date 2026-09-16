# DESIGN QA

Обновлено: 2026-09-16.

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

## READY_FOR_REVIEW — Concept V2 current Figma delta implementation

- Source and implementation cover current Concept V2 Main page `3075:60105`, Hero `3125:81643`, Experience `3142:82981` and Library V2 `9:387`.
- Implemented: semantic palette migration, Hero fact-chip/lower field, Projects action, Process roles, AI geometry/chip, Experience and About/Footer roles, plus full-frame `Medium / Files / File-05` for CV and Resume.
- Preserved: About deck/viewer/cursor mechanics, Experience entry gateway and timeline, Hero caption motion, Process 300 ms behavior and all out-of-scope products.
- Final automated verification passed: 61 tests, lint, production build, browser smoke and whitespace check. Firefox/WebKit visual passes remain unverified; user visual review is the remaining acceptance gate.
- Full ledger, node mapping and commit sequence: `docs/audits/concept-v2-current-figma-delta-2026-09-16.md`.


## READY_FOR_REVIEW — Concept V2 «Обо мне», accepted Plan 3.0 scope

- Scope: current Concept V2 worktree `codex/concept-v2-about-correction`, not the historical About implementation.
- Accepted on `94f6f9c`: Figma-accurate hatch direction/step and independent lower borders; no duplicate section rule; 16/24 section subtitle; compact interruptible card handoff; proportional embedded-card content; full-card hover action with the approved cursor; and independent viewer selection state.
- User-confirmed interaction additions: the hover label is informational, the whole dimmed active card opens the viewer; closing viewer clears the active-card dim state without extra click; dogs caption has a required break after «Это мои сладкие дети,». 
- Current Figma instance `3223:155136`: embedded rear cards are `256×336` (`0.8×` of `320×420`) with an `−80 px` pair overlap. This geometry is intentionally scoped to the embedded deck; the viewer retains its independent prior geometry until its own Figma instance is revised.
- Completed proof: user visual acceptance plus focused motion, hover/viewer/resize regression checks, `npm run check`, `npm run check:browser`, and `git diff --check` on final HEAD `94f6f9c`.
- Deferred, not accepted as complete: direct 1.5× enlarged-viewer geometry and the remaining image-card border/gradient refinements. The later site-wide icon, point-pattern, process-hover and experience-fade work requires a separate plan and goal.

## Не является записью этого файла

- принятые 404/500 pages;
- старый Admin Figma Frame preview checkpoint без воспроизведения на current source/runtime;
- MLIR2–MLIR7 history/closed packages;
- preloaders/loading states без подтверждённого current Figma discrepancy;
- старые `READY_FOR_USER_REVIEW` screenshots;
- feature backlog, архитектурные планы и deploy tasks.
