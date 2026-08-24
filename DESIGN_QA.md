# DESIGN QA

Обновлено: 2026-08-24

## Назначение

Короткий список открытых визуальных дефектов и пакетов pixel-perfect правок. Это не история разработки и не замена `HANDOFF.md`.

Правила:

- добавлять только подтверждённые и ещё не закрытые визуальные расхождения;
- объединять связанные дефекты по экрану или общей причине;
- после принятого исправления удалять запись либо кратко переносить важную системную причину в `PROJECT_HISTORY.md`;
- не создавать запись для каждой мелочи, исправленной и принятой в рамках одной задачи;
- перед исправлением сверять с актуальной Figma, если макет мог измениться.

Статусы: `OPEN`, `IN_PROGRESS`, `READY_FOR_REVIEW`, `CLOSED`.

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
