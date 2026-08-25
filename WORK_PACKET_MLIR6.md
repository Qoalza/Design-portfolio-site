# WORK_PACKET_MLIR6 — Gallery, project components, homepage и 404

## 1. Контракт Goal

- Size: `LARGE`; Risk: `ELEVATED`; Mode: `FULL`.
- Namespace: `MLIR6-*`.
- Исполнение автономное; Figma строго read-only.
- `BASE_SHA`: `9efff3deefaeba31424fd87910905e364dd70f93`.
- Ветка: `codex/gallery-project-error-reconciliation-mlir6`.
- Evidence: `design-reference/gallery-project-error-reconciliation-mlir6/`.
- Merge, deploy, `USER_ACCEPTED` и `CLOSED` запрещены.
- Итог Work Packet: максимум `READY_FOR_USER_REVIEW`; `DESIGN_QA.md`: максимум `READY_FOR_REVIEW`.

Цель: исправить Gallery/Lenis, lightbox и device frames, общие project-компоненты, action bar и Share Tooltip, AI/process на главной и 404, сохранив принятую action-bar state machine.

## 2. Git readiness

Предыдущая favicon-review группа отдельно зафиксирована commit `9efff3deefaeba31424fd87910905e364dd70f93`; favicon не подключён к приложению. `.DS_Store` и `codex-context-transfer-2026-08-15/` с ZIP не входят в MLIR6.

Перед Draft PR подтвердить `origin/codex/action-bar-initial-state-fix` на том же `BASE_SHA`. Если ref отсутствует — безопасно push неизменённую base-ветку. Несовпадение SHA, force-push или rewrite — stop-line.

## 3. Источники истины

1. Этот Work Packet.
2. Актуальные Figma instances/components.
3. Фактический runtime и код.
4. Старые docs/evidence — только история.

Каждый изменяемый визуальный элемент до кода исследуется послойно: children/wrappers, properties/states, variables, typography, Auto Layout, Hug/Fill/Fixed, constraints/min/max, padding/gaps/alignment, fills/assets, strokes/effects/radii/clipping, icon frame и responsive constraints. Каждый child получает точную реализацию, доказанный эквивалент либо прямое исключение. `NO DEV` действует только на явно отмеченный слой.

## 4. Figma source map

Основной fileKey: `5ZzspE0OrqesDcTP0RRPHr`.

### Gallery

- Gallery: `677:44301`.
- Tracks: Desktop `680:48162`, Tablet `680:48163`, Mobile `680:48164`.
- Desktop frames: `680:48078`, `680:48799`, `680:48813`, `680:48814`, `680:48815` — base `740×512`.
- Tablet frames: `680:48156`, `680:48802`, `680:48812`, `680:48858`, `680:48859` — base `400×566`.
- Mobile frames: `680:48159`, `680:48803`, `680:48805`, `680:48860`, `680:48861` — base `180×320`.
- Device icons, не frames: Desktop `321:29845`, Tablet `338:30103`, Mobile `321:29860`.

`figma/gallery-inventory.json` фиксирует для всех 15 frames fileKey/nodeId, component mapping, dimensions, fill asset, intrinsic pixels, stroke, radius, effects, clipping, image rect, transparency и order. До CSS frame определяется, находится ли рамка в raster либо Figma layer. Frame реализуется ровно один раз.

### Остальные nodes

- Square Button/Cross: Library `CRcI38SOIkr5knjKXeCV5h`, `73:5324`.
- Home/card: `510:28120`, `510:28180`.
- Projects page/card: `373:50236`, `517:34103`.
- Tags/header: `506:23146`, `505:23035`, `517:33813`.
- Action bar: set `550:2868`, Adaptive `528:1540`, Full `576:33195`, screens `553:3314`, `553:3036`.
- Tooltip: Library `CRcI38SOIkr5knjKXeCV5h`, `207:1498`.
- AI: `510:28231`; TextButton `725:88725`.
- Process: `510:28183`, shell `73:6063`, arrows `515:30871`/`515:30873`, images `515:30749`/`515:30751`/`515:30778`.
- 404: `420:54056`; conditional 500: `420:54081`.
- Удалённый `373:50562` не использовать.

## 5. Scope

Входят: единый `GalleryInputArbiter`, Gallery motion/RAF, lightbox/device frames, card CTA/tags/Update info, action-bar internal layout, canonical Clipboard Share и Tooltip, AI/process, 404, conditional 500 regression, tests/evidence/docs/push/stacked Draft PR.

Не входят: изменение action-bar state machine/threshold `200 px`/terminal `48+88`, `navigator.share`, 500 redesign без общей зависимости, общий responsive redesign, новые breakpoints, global scroll redesign, free Gallery scroll/loop, новые зависимости, Figma writes, context-transfer, merge и deploy.

## 6. `MLIR6-GAL` — GalleryInputArbiter и Lenis `1.3.25`

До коэффициентов записать first/second/arrow/wheel/diagonal traces, Gallery target/animated position, root `actualScroll`/target/velocity, RAF subscribers и event counts. Проверить immediate-first-path, Lenis recreation, offset remeasure, CSS/Lenis competition, duplicate classifiers и duplicate RAF.

Один `GalleryInputArbiter` используется Gallery handler и `ReactLenis.options.virtualScroll`. Результат idempotent для одного native event.

State machine: `IDLE → UNDECIDED → HORIZONTAL_LOCKED|VERTICAL_PASSTHROUGH → IDLE`.

- `UNDECIDED`: delta буферизуются; Gallery не движется; `virtualScroll` возвращает `false`; root target/velocity/scroll не меняются.
- `VERTICAL_PASSTHROUGH`: текущий Lenis payload получает суммарный buffered `deltaY`, проходит обычный root mutation path ровно один раз; buffer очищается; следующие events проходят root обычно; Gallery не меняется.
- `HORIZONTAL_LOCKED`: `virtualScroll=false`; никакие delta не проходят root mutation. Предыдущая root inertia один раз останавливается в `actualScroll` максимум за frame без обратного скачка; это локальная передача управления, не global Lenis stop. Series даёт максимум один Gallery step.
- Post-factum correction запрещён.
- На series end очищаются direction, accumulators, release marker, ownership и latch. Следующая vertical series работает с первого события.
- Horizontal interception обязан быть реально non-passive.

Стрелки, wheel и pointer вызывают один `requestGalleryStep(direction)`. First/subsequent movement используют один path. Один `ScrollFrameCoordinator`; Gallery работает on-demand; idle/hidden groups не обновляются.

PASS: buffered vertical delta применяется один раз; horizontal delta не проходит root mutation; паразитный `deltaY` не меняет root/scrollY; прежняя inertia останавливается за frame без reverse jump; следующий vertical input работает сразу; один step; одинаковый first/subsequent motion; нет duplicate listeners, correction или второго RAF; idle updates = 0 за 500 ms.

## 7. `MLIR6-LBX` — lightbox и frames

Формула качества:

```text
qualityScaleX = intrinsicPixelWidth / (baseCssWidth × DPR)
qualityScaleY = intrinsicPixelHeight / (baseCssHeight × DPR)
targetScale = min(1.5, availableCssWidth/baseCssWidth,
                  availableCssHeight/baseCssHeight,
                  qualityScaleX, qualityScaleY)
```

Available area учитывает modal padding, safe area и close control. Evidence фиксирует `currentSrc`, `naturalWidth/Height`, CSS rect, DPR и scale. Устройства не нормализуются; нет blur/re-encode/придуманного background; raster/CSS frame не дублируются.

Закрытие: системный Cross, Escape, свободная область вне image/controls. Image click не закрывает. Focus/scroll восстанавливаются. Верхний preview не является интерактивным и не обещает lightbox.

## 8. `MLIR6-PRJ` — cards

Consumers: Corvo и Сараффан на главной; большая Corvo и малые cards `/projects`; card action clusters; tags также в обоих page headers.

CTA Hug означает отсутствие width/min-width/flex-grow/grid stretch/100% и других фиксирующих constraints. Для enabled `Подробнее` и disabled `Скоро` border-box сравнивается с Figma Button: height, padding, text inset, gap, width, radius (`±1px`).

Tags: Source Code Pro Regular `400`, `14/16`, letter-spacing `-0.5px`, feature settings и отдельные semantic roles. Card `Update info`: тот же tech style, muted token, Hug и полный wrapper с height/padding/alignment/divider.

## 9. `MLIR6-ACT/TIP` — action bar и Share

Послойно сопоставить outer/content/leading group/buttons/divider/Update info/trailing/Share/Tooltip/padding/gaps/states. Не менять initial resolver, inclusive `200 px`, Full после Gallery, terminal `48 px`, height `88 px` и scrollHeight.

Canonical payload: `window.location.origin + window.location.pathname`. Search/hash/review исключены. `navigator.share` не вызывается. `Скопировано` показывается только после resolved `clipboard.writeText(payload)`; rejection не показывает success. Repeated pointer/keyboard activation повторно копирует тот же payload и перезапускает feedback. Full/Adaptive используют один builder.

Tooltip source `CRcI38SOIkr5knjKXeCV5h:207:1498`: точные wrapper/icon/padding/gap/radius/fill/stroke/effect/typography/placement/motion. Check использует `Semantic/Element/invers`; Rocket — accent exception. Portal/collision/keyboard/screen-reader contract сохраняются.

## 10. `MLIR6-AI/PROC`

AI `510:28231`: top `120`, bottom `80`, heading Google Sans Medium `36/48 -0.1`, description Onest `16/24`, точные columns/fact/separator/TextButton. Текст буквально: «Вся разработка данного сайта, была полностью выполнена мной в Codex, с нуля. Дизайн был разработан отдельно.»

Process: сначала stacking inventory Header/viewport/track/fades/arrows/transforms/filters/masks/overflow. Header должен быть выше arrow; внутри блока arrow выше illustrations/fades. Не менять geometry, 250 ms и arrow-only behavior; wheel прокручивает page.

## 11. `MLIR6-404`

Единый route: `/__mlir6-not-found-check__`; отдельно direct navigation и hard reload. Диагностировать computed CSS math, stage/art/message/shadow/footer rects и overflow, доказать точную несовместимую declaration, затем минимальный equivalent. В Chromium/Zen stage совпадает с `420:54056`, footer снизу, shadow/art не обрезаны, overflow и errors отсутствуют. 500 проверяется только при общей зависимости.

## 12. Группы и commits

| Group | Результат | Dependency | Commit |
|---|---|---|---|
| G0 | Governing docs, packet, QA | readiness | `Define the MLIR6 reconciliation contract` |
| G1 | Arbiter, Gallery motion, Lenis/RAF | G0 | `Stabilize Gallery gesture and motion handling` |
| G2 | Lightbox/device frames | G1 + inventory | `Align Gallery lightbox and device frames` |
| G3 | Cards CTA/tags/card metadata | G0 | `Reconcile project card controls and metadata` |
| G4 | Action layout/canonical Share/Tooltip | G0; G3 if shared metadata | `Reconcile project action bar and share feedback` |
| G5 | Homepage AI/process | G0 | `Reconcile homepage AI and process layers` |
| G6 | 404/conditional 500 | G0 | `Fix the 404 cross-browser layout` |
| G7 | Final evidence/docs | G1–G6 | `Document MLIR6 verification evidence` |

G1–G6 runtime. G3/G4 имеют независимые PASS. G7 runtime не меняет.

## 13. Проверки

Focused tests покрывают arbiter idempotency/buffering/root gate/inertia/vertical recovery/one-step/RAF; full Gallery inventory/DPR frame formula/lightbox dismissal; CTA/tags/card metadata; canonical clipboard payload/success/rejection/repeat/keyboard/Tooltip motion/action regression; AI/process; 404 direct/reload.

```text
node --experimental-strip-types --test tests/*.test.mjs
npm run lint
NEXT_PUBLIC_BUILD_SHA=<CODE_SHA> npm run build
```

Focused browser checks выполняются после каждой runtime-группы только на её маршрутах. Полная финальная Chromium/Zen matrix:

- `/`: `1280×720`, `1440×900`, `1920×1080`.
- `/projects`: те же.
- Corvo Gallery/lightbox: `1280×720`, `1440×900`, `1440×1200`, `1920×1080`.
- Action regression: `1280×720`, `1440×900`, `1440×999`, `1440×1200`, `1440×1356`, `1920×1080`.
- 404 route: `1280×720`, `1440×900`, `1920×1080`.
- Conditional 500: `1440×900`.

Использовать реальные BiDi wheel/pointer/keyboard actions. Arbiter evidence фиксирует prior inertia, horizontal takeover, root actual/target/velocity/scrollY, один Gallery step и следующий vertical series. Share evidence в Full/Adaptive фиксирует исходный URL, ожидаемый payload, фактический clipboard, отсутствие `navigator.share`, success/rejection/repeat/keyboard и Tooltip timing.

## 14. Evidence, provenance и статусы

Evidence: `design-reference/gallery-project-error-reconciliation-mlir6/{figma,chromium,zen,traces,measurements}` плюс `results.json`; каждый result содержит ID, route, browser/version, viewport/DPR, полный CODE_SHA, fileKey/nodeId, screenshots, measurements, console, PASS/FAIL. Geometry tolerance `±1 CSS px`; необъяснённое расхождение остаётся OPEN. Старое evidence не доказывает новый HEAD.

Lifecycle: Work Packet `OPEN→IMPLEMENTED→VERIFIED→READY_FOR_USER_REVIEW`; QA `OPEN→IN_PROGRESS→READY_FOR_REVIEW→CLOSED`. CLOSED только после пользовательской приёмки.

После G1–G6: focused tests, lint, build, полный CODE_SHA, preview с `NEXT_PUBLIC_BUILD_SHA`, проверка точного `data-build-sha`, final matrix. Runtime fix требует нового CODE_SHA и повторения затронутого evidence. Затем docs/evidence G7, DOC_SHA, push, stacked Draft PR и сверка local/remote/PR SHA. Merge/deploy запрещены.

## 15. Stop-lines и rollback

Stop-lines: недоступный/неоднозначный Figma source; неполный Gallery inventory; неразрешимая raster/layer frame классификация; невозможный pre-mutation arbiter без loss/double delta/post-correction; passive failure; Zen real-input unavailable; новая dependency; неизвестный tracked diff; build SHA mismatch; remote base mismatch/force-push; merge/deploy/Figma write.

Rollback: только MLIR6 branch, отдельные G0–G7 commits, никаких destructive reset/rebase, отмена отдельным revert после решения, context-transfer не трогать.

## 16. Definition of Done

Все MLIR6 blocks имеют fresh PASS; полный inventory и ровно одна frame implementation; единый arbiter сохраняет buffered vertical delta один раз и блокирует horizontal root mutation; first/subsequent motion одинаковы; DPR-aware lightbox точен; cards/action имеют независимые PASS; canonical Share payload и Tooltip проверены Full/Adaptive; AI/process/404 подтверждены; focused tests/lint/build успешны; preview отдаёт CODE_SHA; fresh Chromium/Zen evidence собрано; remote base/branch/Draft PR сверены; merge/deploy не выполнены.

## 17. Результат исполнения

- Runtime-группы `G1–G6`: `VERIFIED`.
- Проверенный `CODE_SHA`: `cca7d77f3a6cc8e5af37a26bae2abfe89f796642`.
- Focused tests: `121/121 PASS`; `npm run lint`: `PASS`; production build: `PASS`.
- Production preview отдаёт точный полный `data-build-sha`, равный `CODE_SHA`.
- Chromium `151.0.0.0` и Zen `1.21.15b` (build `126.8.18`) прошли обязательные focused checks и финальную matrix; conditional 500 regression дополнительно подтверждена при `1440×900`.
- Fresh evidence: `design-reference/gallery-project-error-reconciliation-mlir6/`.
- G7 является documentation/evidence-only и не меняет runtime. Его полный `DOC_SHA`, remote SHA и Draft PR head подтверждаются в финальном отчёте после push.
- После успешной Git/PR-финализации внутренний статус пакета: `READY_FOR_USER_REVIEW`; агрегатный статус `DESIGN_QA.md`: `READY_FOR_REVIEW`.
- Merge и deploy не выполнялись.
