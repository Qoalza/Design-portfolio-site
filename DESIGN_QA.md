# DESIGN QA

Обновлено: 2026-09-27.

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

## READY_FOR_REVIEW — Concept V2 main page and Library V2 refresh

- Source: Main `3960:274722`, Projects/Process `3960:274725`, AI
  `3960:274763`, Library typography `2172:2780`.
- Shared semantic palette and control states have been updated; the Hero
  viewport-height behavior remains an explicit invariant.
- Separate Corvo and «Сараффан.Радио» cards now use
  `661px` desktop geometry, local Figma media, current copy/categories and
  the visible static actions required before destination URLs are decided.
  По уточнению пользователя обе статичные controls Сараффан теперь меняют
  указатель на hand при наведении, оставаясь без перехода.
  The Сараффан mark follows the existing main-page asset per direct user
  instruction; the working ledger records that source exception.
- AI now has the current `1280×335` source panel with the `241px` content
  field, `94px` blue strip and exact source copy. The follow-up below records
  the corrected side hatches.
  Previous tool cards and chip are absent. Process, Experience, About and
  Footer preserve their accepted geometry and interaction mechanics.
- Initial verification before user visual feedback: `152/152` tests, lint,
  production build, built-runtime smoke and AX-check of the local preview.
- The separate working ledger is
  `docs/audits/concept-v2-mainpage-library-delta-2026-09-27.md`.
- User review found follow-up deltas in the Projects status, image shade,
  AI side fields/hatching, fine-pointer activation and Process icon fills.
  These are corrected in the current Redesign checkout; `153/153` tests,
  lint, production build and live visual checks passed. User visual acceptance
  of this corrected state remains open. The same ledger records exact colors,
  source mapping and the explicit Projects exception to the older Figma button.
- A second user screenshot showed that the first project shade fix did not
  remove a visible `#1D1E1F` strip in Zen. The preview shade is now a CSS
  radial gradient with current `#181C1F` stops, avoiding the old SVG resource;
  the hover gradient ends at the same color. The audit ledger records the
  source instance and visual check at the user's `1346px` CSS viewport.
- The project-card separator formerly ended `48px` above the card bottoms.
  The Figma-mapped desktop section/grid heights are now `1173/757px`, so the
  `661px` separator reaches the card bottom. Local browser checks passed at
  `1346/1280/1279/900px`; user visual acceptance remains open.
- По новой пользовательской проверке верхняя панель Hero приведена к
  `General header` `3114:66048` (группы `191/711/378` px, шрифт логотипа и
  рабочий возврат наверх из pinned state). Боковая штриховка AI реализована
  исходными Figma SVG, по одному на верхнее и нижнее поле, без CSS-повтора и
  синтетических горизонтальных границ. Малый Hero `3116:66338` теперь имеет
  корень `1280px`, внешние отступы `24px` и текстовый блок `488px`.
  Runtime просмотрен при `1574/1728` px;
  пользовательская приёмка этого состояния остаётся открытой.
- Hero сохраняет одну горизонтальную композицию на всех размерах окна;
  вертикальный Figma Large не является runtime breakpoint. Проверены
  `2968×955` и `2567×1690` в локальном runtime.


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
