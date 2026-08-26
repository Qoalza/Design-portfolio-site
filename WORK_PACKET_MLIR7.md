# WORK_PACKET_MLIR7 — Gallery motion, Tech typography, error controls и site metadata

## 1. Классификация и результат

- Size: `LARGE`; Risk: `ELEVATED`; Mode: `FULL`.
- Namespace: `MLIR7-*`.
- Исполнение: последовательными Git-группами с обязательной пользовательской проверкой после каждой runtime-группы.
- Автономный режим не включён.
- Figma строго `read-only`; merge и deploy запрещены.
- Итог Work Packet: `READY_FOR_USER_REVIEW`; `DESIGN_QA.md`: `READY_FOR_REVIEW`.

Цель: устранить периодически мгновенное переключение Gallery, дефекты увеличенных device frames, восстановить полный Tech typography contract, синхронизировать AI-control, Share Tooltip, 404/500 controls и подключить утверждённый favicon с новой схемой title.

## 2. Git-база и readiness

- Рабочая папка: `/Users/designer/Documents/GitHub/Design-portfolio-site`.
- `BASE_SHA`: `80f5d1144e4f5698251d1d7c71513a5131b5e51f`.
- Базовая ветка: `codex/gallery-project-error-reconciliation-mlir6`.
- MLIR6 runtime `CODE_SHA`: `cca7d77f3a6cc8e5af37a26bae2abfe89f796642`.
- Ветка Goal: `codex/gallery-tech-favicon-reconciliation-mlir7`.
- Финальный stacked Draft PR: base `codex/gallery-project-error-reconciliation-mlir6`.
- Исключены и не изменяются `codex-context-transfer-2026-08-15/` и ZIP.

Перед runtime и финальным PR повторно проверить branch, полный HEAD, status и remote base. Неизвестный diff, несовпадающий remote base, reset/rebase/force-push или rewrite — stop-line.

## 3. Источники истины

1. Этот Work Packet и утверждённая title-схема.
2. Актуальные Figma instances/components/styles.
3. Фактический runtime из `BASE_SHA`.
4. MLIR6 evidence — только исторический baseline.

Основной Figma fileKey: `5ZzspE0OrqesDcTP0RRPHr`; Library: `CRcI38SOIkr5knjKXeCV5h`.

### Gallery source map

- Instance `677:44301`.
- Desktop track `680:48162`; frames `680:48078`, `680:48799`, `680:48813`, `680:48814`, `680:48815`.
- Tablet track `680:48163`; frames `680:48156`, `680:48802`, `680:48812`, `680:48858`, `680:48859`.
- Mobile track `680:48164`; frames `680:48159`, `680:48803`, `680:48805`, `680:48860`, `680:48861`.
- Device icons are icon-only sources: Desktop `321:29845`, Tablet `338:30103`, Mobile `321:29860`.
- Arrows `526:36407`, `60:2601`.

### Tech source map

- Home `510:28120`; `/projects` `373:50236`; Corvo `373:47103`.
- Tags `506:23146`; Corvo header `505:23035`; projects header `517:33813`.
- Footer Library `124:4841`.
- Tech/L `S:25d64e04204a7e6155f896ff75d759dc73aec5f2,118:138`: Source Code Pro 400, `16/20`, `-0.6 px`.
- Tech/M `S:6c773c4035a051f4c4196b1d151a152d52e68f11,46:273`: Source Code Pro 400, `14/16`, `-0.5 px`.
- Tech/S `S:da68d6eb7eec01ef25e586fb6e9abb4e43af10bb,46:286`: Source Code Pro 400, `12/16`, `-0.3 px`.
- `01`: `515:30720`/`515:30721`; `02`: `515:30754`/`515:30755`; `03`: `515:30773`/`515:30774`.
- Все Tech styles дополнительно используют explicit user override `zero=1`; остальные Figma feature settings сохраняются.

До G3 обязателен закрытый inventory `fileKey+nodeId → semantic role → Figma style → code owner → route → artifact` для всех Tech consumers.

### Остальные sources

- AI `510:28231`; Disabled TextButton `725:88725`; variant `732:89541`; Figma icon `773:90993`; label `Скоро тут будет файл`; `Size=Large`, `Color=Neutral+Accent`, `State=Disable`.
- Tooltip Library `207:1498`; action bar set `550:2868`; Adaptive `528:1540`; Full `576:33195`.
- 404 `420:54056`, Button frame `420:54066`, label `420:54067`.
- 500 `420:54081`, Button frame `420:54090`, label `420:54091`.

Письменный контракт пользователя определяет оба слоя как настоящие интерактивные кнопки. Геометрия и текст берутся из указанных live frames, а variant, size, states и DOM-семантика — из действующего системного `ControlButton`. Отсутствие instance mapping у detached frame не отменяет этот поведенческий контракт.

## 4. Scope и non-scope

В scope: Gallery controller и все input paths; lightbox и все 15 frames; полный Tech inventory/consumers; AI Disabled TextButton; Share Tooltip `Ссылка скопирована`; интерактивные системные Button controls 404/500; favicon; route titles; tests, evidence, docs, push и один Draft PR.

Не входят: Gallery loop/free scroll; изменение root Lenis coefficients; action-bar state machine, `200 px` threshold или terminal geometry; canonical Share payload; общий Body/Heading redesign; новые breakpoints; favicon regeneration; PWA manifest; новые зависимости; Figma writes; context-transfer; merge/deploy.

## 5. Статусы и gates

Work Packet: `OPEN → IMPLEMENTED → VERIFIED → READY_FOR_USER_REVIEW`.

`DESIGN_QA.md`: `OPEN → IN_PROGRESS → READY_FOR_REVIEW → CLOSED`.

После каждой runtime-группы G1–G6: focused tests, Chromium/Zen check, commit, production preview exact SHA, пользовательский отчёт и обязательная остановка. G4-A/G4-B имеют два commits, но один gate после обоих. Исправления gate-дефекта — дополнительным commit той же группы, без rewrite.

## 6. G0 — исполнительный контракт

- Создать этот файл и активную QA-запись `MLIR7: OPEN`.
- Commit: `Define the MLIR7 execution contract`.
- Пользовательского gate нет.
- После commit tracked worktree чист; допустимы только исключённые context-transfer материалы.
- При старте G1 QA переходит в `IN_PROGRESS`.

## 7. G1 — MLIR7-GAL

Commit: `Stabilize all Gallery movement paths`.

Для Desktop/Tablet/Mobile проверить Previous/Next, настоящий horizontal trackpad-like input и pointer drag: первый, второй и минимум пятый переход после hard reload, client navigation, idle `500 ms`, resize/remeasure и закрытия lightbox. Trace: index, offsets, target, actual/animated position, Lenis identity/state, immediate, controller lifecycle, RAF, ResizeObserver, transforms и normalized frame progress.

Все input paths вызывают один `requestGalleryStep(groupId, direction, source)` и один controller. User transition никогда не использует `immediate`; CSS и Lenis не двигают track параллельно. Instant — target в первом frame, отсутствие промежуточных позиций или first sample уже target — всегда `FAIL`.

PASS: минимум два intermediate samples; monotonic trajectory; first/second/subsequent progress совпадает с допуском frame; stable controller; one input/one step; real overflow disabled; root scroll стабилен на horizontal series; следующая vertical series работает сразу; idle Gallery updates `0` за `500 ms`; второго RAF нет. Chromium/Zen `1440×900`, только реальные inputs.

## 8. G2 — MLIR7-LBX

Commit: `Correct enlarged Gallery frame rendering`. Hard dependency: принятый G1.

Для каждого из 15 items определить raster/frame ownership, stroke, radius, clipping, wrappers, background, effects, base/intrinsic size. Frame реализуется ровно один раз. В Chromium и Zen `1440×900` каждый item открыть реальным click, записать screenshot, geometry, frame properties, currentSrc/natural size/DPR/scale, закрыть и подтвердить focus/scroll restoration. Contact sheet допустим, но каждый item имеет отдельный result. Дополнительно `1440×1200`, DPR 1/2 для первого/среднего/последнего item каждой группы.

Сохраняется DPR-aware `targetScale=min(1.5, viewport clamps, intrinsic/(base×DPR))`. Верхний preview неинтерактивен.

## 9. G3 — MLIR7-TYP

Commit: `Apply the complete Tech typography contract`.

Закрытый inventory охватывает project tags, hero/main tags, resume/freelance/Eyeconweb, process/tool tags, cards/page headers, `01/02/03`, Footer и каждый дополнительный live Tech consumer. Централизовать `--type-tech-s-*`, `--type-tech-m-*`, `--type-tech-l-*`; instance-specific styles не упрощать.

PASS для каждого consumer: нужные Latin/Cyrillic Source Code Pro files загружены; computed family/weight/size/line-height/spacing/features точны; `zero=1`; реальный glyph `0` перечёркнут; geometry `±1 CSS px`; обычные Body/Heading не изменены. Chromium/Zen `1440×900` на `/`, `/projects`, Corvo, 404 и 500.

## 10. G4 — два commits, один gate

### G4-A — MLIR7-AI

Commit: `Align the AI disabled control`.

Системный `TextButton`: Large, Neutral+Accent, Disabled, без href, label `Скоро тут будет файл`, полный icon frame `773:90993`. Старые Figma label/link/icon semantics удалить. PASS: exact instance geometry/tokens, non-focusable, no navigation, Chromium/Zen `1440×900`.

### G4-B — MLIR7-TIP

Commit: `Update the project copy feedback`.

Success text и screen-reader feedback: `Ссылка скопирована`. Canonical payload, rejection, inverse Check, Full/Adaptive placement, motion, repeat и keyboard contract сохраняются. PASS только после Full/Adaptive success/rejection/repeat/keyboard, no clipping и unchanged action state/scrollHeight.

## 11. G5 — MLIR7-404/500

Correcting commit: `Restore interactive error page controls`.

- Обе кнопки рендерятся как нативные `<button>` через общий `ControlButton`, а не локальную CSS-имитацию.
- 404: `На главную` переходит на `/`.
- 500: `Перезагрузить` выполняет полную перезагрузку текущей страницы.
- Variant, size, typography, padding, radius, colors и normal/hover/active/focus-visible берутся из общей дизайн-системы; live frames `420:54066` и `420:54090` фиксируют конкретную геометрию и labels.
- Pointer cursor, Tab focus, `Enter` и `Space` activation обязательны.
- Вся остальная композиция и rects 404/500 остаются без изменений.

Focused tests и evidence G5:

- source/component check подтверждает общий `ControlButton`, нативный button DOM и отсутствие локальной имитации;
- мышью и клавиатурой на 404 подтвердить фактический URL `/`;
- мышью и клавиатурой на 500 подтвердить новую document navigation того же URL, а не React reset;
- зафиксировать normal/hover/active/focus-visible computed states, pointer cursor и border-box с допуском `±1 CSS px`;
- сравнить stage/art/message/footer rects до и после исправления: изменение вне button rects запрещено;
- Chromium и Zen, `1440×900`, routes `/__mlir7-not-found-check__` и `/error-test?trigger=500`; без expanded matrix на этом gate;
- console, hydration и CSS errors отсутствуют.

## 12. G6 — MLIR7-META

Commit: `Connect the approved favicon and site metadata`.

До application edits выполнить disposable production proof вне Git worktree на Next `16.2.10`/React `19.2.7`: ordinary 404, dynamic-project 404 и deterministic 500, без client JS. Записать status, число/title tags, metadata source, streaming и duplicates. Допустимы только stable layout/page metadata, generateMetadata, route-local layout и `title.absolute`. `globalNotFound`, duplicate root layout и catch-all запрещены без решения пользователя. Если exact ordinary 404 initial title требует такой архитектуры, только G6 остаётся OPEN и останавливается.

Browser favicon использует только предоставленный пользователем `/Users/designer/Documents/Figma/LOGO/Symbol.svg`: точная копия подключена по уникальному URL `/artur-designer-favicon.svg` из `public/artur-designer-favicon.svg`. Root metadata явно объявляет единственный browser icon как `image/svg+xml`, `sizes="any"`; route metadata его не переопределяет. Цвета фиксированы и одинаковы в light/dark; file-convention icon, `prefers-color-scheme`, ICO и PNG browser-favicon fallback отсутствуют. Apple Touch Icon остаётся неизменённым отдельным системным asset; PWA assets не подключаются. Paths, fills, viewBox, пропорции и композиция `Symbol.svg` не изменяются.

Titles absolute где требуется: `/` `Artur Designer`; `/projects` `Мои работы — Artur Designer`; project `<Название> — Artur Designer`; 404 `Страница не найдена — Artur Designer`; 500 `Ошибка — Artur Designer`. Проверять отсутствие `Des-art`, `Artur Product` и фамилии только в metadata-generating code и actual metadata output.

PASS: exact initial HTML titles ordinary/dynamic 404 and 500; no hydration change/duplicates; direct/reload/client nav; один актуальный SVG browser favicon выбран в Zen и Arc light/dark, в tab и address bar; нет ICO/PNG favicon links или старого cache resource; SVG отвечает `image/svg+xml`/`200`; application/review hashes равны пользовательскому source; Apple Touch Icon hash не изменён.

## 13. G7 — финальные проверки и evidence

Commit: `Document the MLIR7 verification evidence`. Runtime не меняет.

Обновить Work Packet, HANDOFF, DESIGN_QA и новый evidence `design-reference/gallery-tech-favicon-reconciliation-mlir7/` с source-map, Tech inventory, 15-frame inventory, Chromium/Zen screenshots, traces, measurements и results.json.

## 14. Группы и зависимости

| Group | Result | Dependency | Gate |
|---|---|---|---|
| G0 | Contract + QA OPEN | readiness | no |
| G1 | Gallery motion | G0 | yes |
| G2 | 15 lightbox frames | accepted G1 | yes |
| G3 | Tech typography | accepted G2 + inventory | yes |
| G4-A | AI Disabled | accepted G3 | after G4-B |
| G4-B | Share Tooltip | G4-A | one G4 gate |
| G5 | Error controls | accepted G4 | yes |
| G6 | Favicon/title | accepted G5 + proof | yes |
| G7 | Final evidence/docs | accepted G1–G6 | final |

## 15. Checks, matrix и provenance

Commands: `node --experimental-strip-types --test tests/*.test.mjs`, `npm run lint`, `NEXT_PUBLIC_BUILD_SHA=<CODE_SHA> npm run build`.

Final Chromium/Zen matrix: `/` and `/projects` at `1280×720`, `1440×900`, `1920×1080`; Corvo Gallery/lightbox at those plus `1440×1200`; action regression at `1280×720`, `1440×900`, `1440×999`, `1440×1200`, `1440×1356`, `1920×1080`; 404/500 at three standard viewports; favicon/title in light/dark.

После runtime commits: focused tests, lint, final `CODE_SHA`, provenance build, verify full `data-build-sha`, fresh matrix/evidence. Missing/short/mismatch SHA — FAIL. G7 creates documentation-only `DOC_SHA`; no repeat lint/build after pure docs. Push, stacked Draft PR, verify local/remote/PR DOC_SHA and preview CODE_SHA, only then statuses READY.

## 16. Stop-lines и rollback

Stop-lines: unknown diff; dirty state after G0; base mismatch/history rewrite; inaccessible/ambiguous Figma mapping; incomplete Tech inventory; unresolved frame ownership; unproven Gallery root cause or any Instant first transition; unavailable real Zen input; incomplete 15-item runtime matrix; new dependency; unsupported exact metadata without forbidden architecture; favicon mismatch; build provenance failure; Figma write/merge/deploy/production access.

Rollback: only MLIR7 branch, separate G0–G7 groups and G4 commits, no reset/rebase, revert only after explicit decision, MLIR6/context-transfer/favicon review source untouched.

## 17. Definition of Done

G0 exists before runtime and leaves clean tracked state; G1–G6 pass user gates; one canonical Gallery controller yields no Instant transition across every device/input/reset context; all 15 lightbox items pass both browsers; Tech inventory and slashed-zero contract pass; AI and Tooltip have independent commits/results; 404/500 use exact interactive system Buttons and their required navigation/reload contracts while the surrounding composition remains unchanged; Next production proof confirms exact titles; approved favicon is connected; tests/lint/build/provenance/fresh matrix pass; G7 evidence/docs, remote and Draft PR are confirmed; merge/deploy not performed.

## 18. Self-review

`SELF_REVIEW_1: PASS`: G0, every Gallery input/reset context, all 15 lightbox items, closed Tech inventory, split G4 commits and exact title paths are present.

`SELF_REVIEW_2: PASS`: final index or static mapping cannot create false PASS; detached error frames cannot override the explicit interactive Button contract; a visual match without real mouse/keyboard navigation and reload is not PASS; Next metadata requires production proof; G0/G7 lifecycle and Git cleanliness agree; full matrix runs only on final runtime; gates, stop-lines and no-merge/deploy remain enforced.

## 19. Результат исполнения

- Статус: `USER_ACCEPTED`.
- Финальный runtime `CODE_SHA`: `a322cf7341ee351d50f1a98cdb9d857fe46dd956`.
- Focused tests: `142/142`; lint: `PASS`; production build: `PASS`.
- Production preview подтвердил полный `data-build-sha` до browser evidence.
- Chromium: `22/22`; Zen `1.21.15b`: `22/22` на обязательной route/viewport matrix.
- Все runtime-группы G1–G6 приняты пользователем. G7 изменяет только документацию и evidence.
- Evidence: `design-reference/gallery-tech-favicon-reconciliation-mlir7/`.
- Пользовательская приёмка получена 2026-08-26. Merge и deploy выполняются отдельной утверждённой Goal.
