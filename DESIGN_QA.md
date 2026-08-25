# DESIGN QA

Обновлено: 2026-08-25

## Назначение

Короткий список открытых визуальных дефектов и пакетов pixel-perfect правок. Это не история разработки и не замена `HANDOFF.md`.

Правила:

- добавлять только подтверждённые и ещё не закрытые визуальные расхождения;
- объединять связанные дефекты по экрану или общей причине;
- после принятого исправления удалять запись либо кратко переносить важную системную причину в `PROJECT_HISTORY.md`;
- не создавать запись для каждой мелочи, исправленной и принятой в рамках одной задачи;
- перед исправлением сверять с актуальной Figma, если макет мог измениться.

Статусы: `OPEN`, `IN_PROGRESS`, `READY_FOR_REVIEW`, `CLOSED`.

## READY_FOR_REVIEW — Main Layout & Interaction Follow-up (`MLIR5-*`)

Активный пакет: `WORK_PACKET_MLIR5.md`. Новое evidence сохраняется только в `design-reference/main-layout-interaction-polish-mlir5/`.

- `MLIR5-SCR`: root Lenis не прерывается обычным wheel-input; Gallery Lenis не выполняют постоянную работу в покое.
- `MLIR5-TTP`: общий Tooltip сохраняет одну строку и имеет реальный enter/exit `200 ms`.
- `MLIR5-TXB`: AI TextButton использует системный Figma-вариант `Neutral+Accent`.
- `MLIR5-ABA`: initial resolver и последующий порог `200 px` проверяются как независимые контракты.
- `MLIR5-LBX`: реальный Zen pointer click открывает Gallery lightbox, а drag остаётся дискретным.

MLIR4 runtime `0d834e9d96f78e34e4e8e4796468446c7ccbad8d` и `design-reference/main-layout-interaction-polish/` остаются историческим baseline и не подтверждают MLIR5. `CLOSED` разрешён только после явной пользовательской приёмки.

MLIR5 runtime зафиксирован в `effc718663489d433aa801f88ef424347736d801`. Focused tests прошли `102/102`, lint и production build успешны, preview отдаёт тот же полный SHA. Chromium и Zen `1.21.15b` matrices прошли `6/6`; реальные wheel и Zen pointer sequences, Tooltip motion, AI TextButton, initial action bar и terminal docking подтверждены свежим evidence. Полный индекс: `design-reference/main-layout-interaction-polish-mlir5/README.md`.

## READY_FOR_REVIEW — Main Layout & Interaction Polish (`MLIR4-*`)

Активный пакет: `WORK_PACKET_POLISH.md`. Новое evidence сохраняется только в `design-reference/main-layout-interaction-polish/`.

- `MLIR4-SYS`: актуальные typography styles, semantic variables, TextButton Large и затронутые icon sources.
- `MLIR4-HOME`: Hero, Codex attribution и CTA «Полное CV» на главной.
- `MLIR4-PRJ`: централизованная доступность проектов, disabled CTA и общий Tooltip.
- `MLIR4-ABA`: geometry-driven Full/Adaptive action bar без неверного первого кадра.
- `MLIR4-NAV`: уточнённый terminal threshold и sticky/docked section navigation.
- `MLIR4-GAL`: Gallery lightbox и дискретная overflow-aware пагинация.
- `MLIR4-SCR`: desktop Lenis через единый `ScrollFrameCoordinator` без конкурирующих animation loops.

MLIR3 runtime `fce9e2288c3a80a28da51479a5668fa33b22fb59` и каталог `design-reference/main-layout-interaction-followup/` остаются историческим evidence предыдущего состояния. Они не подтверждают MLIR4.

MLIR4 runtime зафиксирован в `0d834e9d96f78e34e4e8e4796468446c7ccbad8d`. Focused tests прошли `95/95`, lint и production build успешны, preview отдаёт тот же полный SHA. Обязательные Chromium и Zen `1.21.15b` matrices прошли `6/6`, foundation-маршруты и touch/reduced-motion fallbacks проверены на свежем evidence из этого CODE_SHA; полный индекс — `design-reference/main-layout-interaction-polish/README.md`. `CLOSED` разрешён только после явной пользовательской приёмки.

## READY_FOR_REVIEW — Main Layout & Interaction Follow-up (`MLIR3-*`)

Активный пакет: `WORK_PACKET_FOLLOWUP.md`. Новое evidence сохраняется только в `design-reference/main-layout-interaction-followup/`.

- `MLIR3-TYP`: весь видимый не-heading UI-текст должен использовать Onest без устойчивого runtime fallback.
- `MLIR3-ICO`, `MLIR3-CTA`: все иконки должны быть сопоставлены с актуальным Figma source type; Telegram CTA должен использовать точный полный icon frame.
- `MLIR3-FTR`: текст, геометрия и typography общего Footer должны быть повторно подтверждены по library node `124:4841`.
- `MLIR3-SHD`: прозрачные project preview на главной и `/projects` не должны обрезать мягкие внешние тени.
- `MLIR3-ABA-I`, `MLIR3-ABA-T`: первый видимый action bar должен сразу иметь правильный variant; у конца Gallery bar должен располагаться после постоянного gap `48 px`, не перекрывая Mobile и Footer.
- `MLIR3-NAV`: последний короткий information-раздел должен активироваться по геометрии до входа в Gallery без проверки label.
- `MLIR3-GAL`, `MLIR3-LBX`, `MLIR3-PRV`: Gallery controls зависят от фактического overflow, lightbox работает в top layer, верхний project preview остаётся неинтерактивным.

Предыдущий MLIR2 runtime `69dc9b7823cebc839482a037e6dbb9abaa6ca182` и каталог `design-reference/main-layout-interaction-reconciliation/` остаются историческим evidence предыдущего состояния. Они не подтверждают MLIR3 и не используются вместо свежих проверок нового `CODE_SHA`.

MLIR3 runtime зафиксирован в `fce9e2288c3a80a28da51479a5668fa33b22fb59`. Focused tests прошли 78/78, lint и production build успешны. Обязательные Chromium и Zen `1.21.15b` matrices прошли 6/6 на свежем evidence из этого `CODE_SHA`; полный отчёт находится в `design-reference/main-layout-interaction-followup/README.md`. `CLOSED` разрешён только после явной пользовательской приёмки.

## READY_FOR_REVIEW — Main Layout & Interaction Reconciliation v2 (`MLIR2-*`)

Активный пакет: `WORK_PACKET.md`. Новое evidence сохраняется в `design-reference/main-layout-interaction-reconciliation/`.

- `MLIR2-SQB`: отдельный SquareButton и закрытая миграция icon-only controls.
- `MLIR2-HDR`: актуальные GeneralHeader и PageHeader.
- `MLIR2-META`, `MLIR2-RSM`, `MLIR2-AI`, `MLIR2-PROC`, `MLIR2-PRJ`: новые instances главной и `/projects`.
- `MLIR2-CNT`, `MLIR2-GAL`, `MLIR2-ABA`, `MLIR2-NAV`: актуальный Corvo information layout, Gallery и две layout/scroll state machines.
- `MLIR2-PROV`: подтверждаемая связь review preview с полным `CODE_SHA`.

Прежний статус `READY_FOR_REVIEW` и evidence `design-reference/main-chapter-reconciliation-v2/README.md` относятся только к предыдущему состоянию Figma и сохраняются как исторический материал. Они не доказывают готовность текущих `MLIR2-*` блоков.

Runtime-исправления follow-up собраны в `69dc9b7823cebc839482a037e6dbb9abaa6ca182`. Обязательные Chromium и Zen `1.21.15b` matrices прошли на шести viewport со свежими screenshots из этого HEAD; focused tests, lint и production build успешны, preview отдаёт тот же полный SHA. Все критичные `MLIR2-*` блоки имеют обязательное evidence в `design-reference/main-layout-interaction-reconciliation/README.md`; старые screenshots не переиспользуются как доказательство нового HEAD. `CLOSED` разрешён только после явной пользовательской приёмки.

## READY_FOR_REVIEW — error pages 404/500

Источник: актуальные Figma nodes `420:54056` (404) и `420:54081` (500).

- Вся композиция должна оставаться по центру viewport по горизонтали и вертикали.
- Footer должен быть прижат к нижней границе экрана.
- Тени иллюстраций не должны обрезаться.
- Текстовый блок должен сохранять положение относительно иллюстрации и общие горизонтальные/вертикальные constraints.
- Общая сцена центрируется и пропорционально помещается в доступную высоту между верхом viewport и footer.
- Иллюстрация кадрируется отдельным слоем; сообщение 500 и его тень находятся вне clipping-контекста.
- Актуальные позиции сообщений в координатах сцены: 404 — `342×77 px`, 500 — `2×122 px`.
- Focused production-проверка: footer снизу, горизонтальный overflow отсутствует, видимые части композиции и тень 500 не обрезаны.

## READY_FOR_REVIEW — platform-иконки на `/projects`

Источник: Figma node `373:50236`.

- Сломаны геометрия и/или цвет вариантов `Desktop`, `Tablet`, `Mobile` и `Only Desktop`.
- Дефект повторялся ранее в других SVG-иконках.
- Общая причина подтверждена: tight-bound SVG с размерами `21×19`, `17×21`, `13×21` ранее принудительно рендерились как `20×20`, а жёсткий `#E2E2EC` внутри SVG не позволял общему компоненту применить цвет Figma.
- Единый typed mapping сохраняет собственные размеры SVG, а общий mask-рендер использует `currentColor`; computed-цвет всех вариантов — Figma `#75848F`.
- Остальные части карточек в эту группу не входят без отдельного подтверждения.
