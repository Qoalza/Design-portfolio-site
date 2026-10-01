# DESIGN QA

Обновлено: 2026-09-30.

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

## READY_FOR_REVIEW — Concept V2 Experience grid pattern

- Current structural Figma source: pattern frame `4198:875236`; it wraps six
  sample instances of tile component `4100:309337` with zero gap. The current
  user-approved colors supersede the inspected sample values: `320×320px /
  1px #191E21` dividers, `20×20px / 1px #16191C` cells and whole-layer
  opacity `70%`.
- The rejected CSS used four independent gradients. Percentage positions for
  the `320px` and `20px` layers resolve against different available spaces,
  leaving the layers `150px` out of phase and making major separators change
  color.
- `GridPattern` now repeats one versioned
  `surface-grid-tile-16191c-191e21.svg`: minor rules exist
  only at `20…300px`, while each repeated tile owns one top and one left major
  rule. No minor rule crosses a tile seam and no adjacent border is doubled.
- Runtime computed styles confirm the single asset, `320px` repeat, opacity
  `.7` and Experience placement
  `calc(50% - 640px) 0`. Timeline, masks and narrow-screen behavior remain
  unchanged.
- The pattern owns the upper Experience boundary. The former bottom border on
  the decorative field was removed so the boundary renders as one rule.

## READY_FOR_REVIEW — Concept V2 project card hover during scroll

- User requested continuous pointer response regardless of scrolling. The
  projects-only scroll gate and its transition override are removed; both
  project cards retain their existing 150 ms hover motion and focus behavior.
- Browser check: Corvo and Сараффан.Радио remained hovered with active
  transitions while wheel scrolling moved the page. `161/161` tests and lint
  passed; user visual acceptance remains open.

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
  рабочий возврат наверх из pinned state). Боковая штриховка AI сверена с
  исходными Figma SVG. После обнаруженного при ресайзе растяжения она
  отрисовывается непрерывным векторным узором с постоянным шагом 16px;
  цвета и краевые линии взяты из исходных SVG. Малый Hero `3116:66338` имеет
  корень `1280px`, внешние отступы `24px` и текстовый блок `488px`.
  Runtime просмотрен при `1574/1728` px;
  пользовательская приёмка этого состояния остаётся открытой.
- Hero сохраняет разработанное адаптивное переключение: `small` используется,
  пока окно не достигнет одновременно `2313×1300px`; после этого включается
  существующая `large` композиция. Сверхширокий, но невысокий `2968×955`
  остаётся `small`, а `2567×1690` использует `large`.
- Повторная приёмка выполнена по текущему Main `4150:804068`, а не по
  предыдущей версии. Исправлены desktop-цвета заметок Projects/Process
  (`#475157`) и новый About Preview `320×436` с rear `256×336` на `y=50`.
  В текущем runtime подтверждены верхние маски/свечение Projects, сетки и
  декоративные слои Process, Experience, About и Footer.
  Viewer и утверждённые тайминги не менялись. Итог: lint, `161/161` tests,
  production build и два последовательных review без открытых находок;
  пользовательская визуальная приёмка остаётся открытой.
- После дополнительной пользовательской проверки заново собраны верхние
  состояния Projects и Process: линия Projects находится за изображениями,
  Process использует чистые desktop SVG и карточную сетку с hover-цветом.
  Исправлены рамки боковой штриховки AI, фаза сетки Experience, её нижний
  полноширинный separator перед About, прозрачный title frame About и цвета
  carousel dots. Tablet/mobile сохранили прежние SVG и стили. Проверено в
  отдельном runtime `1574px`, на `1024/760px`, через `162/162` tests, lint,
  production build и два последовательных review; пользовательская визуальная
  приёмка остаётся открытой.
- Последующая runtime-проверка восстановила верхнее точечное поле между AI и
  Experience, сохранив удалённое нижнее поле; About copy снова использует меру
  строки `572px`, а карточка сохраняет текущие `320×436px`. Hero переключается
  в `large` только при одновременных `2313×1300px`.


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
