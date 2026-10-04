# Concept V2 — повторная проверка и закрытие плановых расхождений

Статус: `COMPLETE`
Режим: `FULL`
Область: `PORTFOLIO / Concept V2`
Размер: `LARGE`
Риск: `ELEVATED`
Ветка: `codex/redesign-portfolio`
Базовый commit: `e8014cf5e4b23fd2d9f6cb0be60f69a20d843c2e`

## Outcome

Заново пройти весь утверждённый перечень обновлений Concept V2. Каждый пункт получает `CHECK` только после сверки точного source, кода и нужного состояния локального интерфейса. Каждый `FAIL` исправляется в этой ветке и повторно проверяется до закрытия цели.

## Источники и границы

- Figma Concept V.2, страница «Основа», файл `sgKtUASp0aYzdkeH8kcXrL`; одинаковое имя токена не доказывает одинаковую конкретную привязку consumer-а.
- Runtime: текущий checkout и `http://127.0.0.1:4193`.
- Sarafan Hero — только статическая база `3495d1f`, уже интегрированная как `add8058`; Figma Hero её не заменяет.
- Главный Hero не меняется по компоновке, контенту, размеру или поведению; из Figma для него принимаются лишь подтверждённые цвета.
- Не входят: Figma write, соседние worktree/ветки, Admin, Shared contract, production, main, push, PR, deploy, `USERSPACE/**`, новые tooltip-триггеры, Copy/View у статического кода и смысл текста примера кода.

## Критические инварианты

- Experience: собственный Lenis, stopper, rearm/reset и отсутствие фантомного заполненного кадра.
- Глобальная настройка мыши/трекпада действует по сайту, не меняя специальную механику Experience.
- Прелоадер сохраняет фиксированную высоту между статусами, не прыгает, растёт вниз, расположен на 100px выше и содержит автоматический тестовый цикл.
- Morph: `StrokeMorphIcon`, stroke-only, spring `stiffness:605`, `damping:36`; Copy Link сохраняет плавную смену ширины, правую границу группы и возврат через 2 секунды.
- Line/Duotone — настоящий inline SVG stroke; Color сохраняет палитру; monochrome получает `currentColor`; CSS mask не заменяет line icon.

## Реестр проверки

| ID | Target → required result | Статус и проверка |
| --- | --- | --- |
| G1 | Изменённые серые и текстовые роли → consumer по конкретной Figma binding, без глобальной замены по имени. | CHECK — consumer-specific source bindings reviewed; no global gray-token replacement. |
| G2 | Общие Light/Ghost → source values, border hover/press и SVG-иконки. | CHECK — source states and vector-frame checks pass. |
| M1 | Главная Hero → только approved colors; layout/content/height не менять. | CHECK — exact Hero structure and interaction checks pass; layout untouched. |
| M2 | Главная Projects → активные actions, Sarafan details `/projects/sarafan-radio`, Figma hover-morph. | CHECK — local route and both card actions verified. |
| M3 | «Как я работаю» → пользовательский Muted у описаний сохраняется. | CHECK — accepted Muted override remains. |
| M4 | Experience → Inktech, title-case роли, тексты и scroll-инварианты. | CHECK — Inktech corrected; 20 Experience/scroll invariants pass. |
| M5 | «Обо мне» и footer → типографика/цвет current Figma, footer 12/14 `#788087`, если source подтверждает. | CHECK — footer uses 12/14 `#788087`; focused check passes. |
| M6 | CV → supplied Google Drive URL. | CHECK — supplied Google Drive URL verified in local AX tree. |
| C1 | Corvo: 6 section headings → Google Sans 24/32/500; project name/subtitles не менять. | CHECK — existing focused project fidelity check passes. |
| C2 | Corvo text grid → padding 64, column 936, естественные высоты от верных type/content/padding. | CHECK — current grid rules and natural heights retained. |
| C3 | Corvo intro, notice, token-card wording, year, Hero hint → exact source values. | CHECK — focused source-value checks pass. |
| C4 | Corvo Metrics → right icons; all four actions hover-morph to Arrow-angle-top-right; supplied URLs exact. | CHECK — actions, supplied targets and morph consumer pass focused checks. |
| C5 | Corvo → 88px hatch between Design-system and Result. | CHECK — existing 88px hatch fidelity check passes. |
| C6 | Corvo controls/breadcrumb/footer/list → true SVG; Color Corvo retains palette; Telegram visible. | CHECK — forwarded Telegram, inline breadcrumbs and Color logo verified locally. |
| C7 | Corvo exceptions → B2B stays; no static-code control/content refresh. | CHECK — B2B and static-code exceptions retained. |
| S1 | Sarafan card and route → active `/projects/sarafan-radio`; Hero equals accepted baseline. | CHECK — route verified locally; accepted Hero baseline retained. |
| S2 | Sarafan non-Hero → current Figma headings/body, 88px hatch, exact Figma/FigJam links, morph actions. | CHECK — source `4332:731910/731919/731975`, local route and media verified. |
| P1 | Preloader normal → Secondary glyph, caption 16/24 350; preserve fixed non-jumping behavior/cycle. | CHECK — normal state seen locally; lifecycle/layout checks pass. |
| R1 | 404 → title 44/56 and text 16/24/350/current colors; graph unchanged. | CHECK — exact local route/source check; graph untouched. |
| I1 | Shared morph → direct/reverse/interrupted, no masks/fills, reduced-motion and stable layout frames. | CHECK — shared morph focused checks pass; accepted Copy Link behavior retained. |

## Ordered execution

1. **Plan baseline.** Target → this worktree. Change → record scope, exceptions and statuses. Expected → no generic visual pass. Verification → source/code/runtime evidence before `CHECK`.
2. **Confirmed failures.** Target → Experience and Corvo action component. Change → employer update without geometry changes; forward icon into `ControlButton`. Expected → screenshot defects disappear without touching Experience mechanics. Verification → focused checks and route screenshot.
3. **Shared primitives.** Target → G1/G2/I1. Change → map visual consumer to exact source binding/state, repair only proven mismatches. Expected → pages inherit correct shared roles. Verification → source/DOM/hover/press checks.
4. **Main page.** Target → M1–M6. Change → repair each Fail and retain listed exceptions. Verification → local main route and interaction states.
5. **Projects.** Target → C1–C7/S1–S2. Change → exact instance/link comparison and narrow fixes. Verification → local routes, link targets and hover states.
6. **Auxiliary states.** Target → P1/R1. Change → visual values only. Verification → local state transitions, behavior invariants.
7. **Close.** fidelity/completeness review, then regression/scope review; run tests, lint, build, diff check and clean worktree verification.

## Acceptance and completion

Every row is `CHECK`; every repair is seen in its exact local route/state; shared changes are checked in every listed consumer; final evidence belongs to final commit only.

## Stop-lines

Stop dependent work if a current source requires a new Hero composition, shared contract/data ownership, dependency, Figma write or another out-of-plan change. Never resolve uncertainty by accessing the neighboring chat’s worktree.
