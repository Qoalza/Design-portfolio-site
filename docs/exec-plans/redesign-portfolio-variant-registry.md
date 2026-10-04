# Redesign portfolio — реестр исторических вариантов

Статус сверки: `COMPLETE`. Дата актуализации: 2026-10-04.
Приёмка runtime и готовность production release этим статусом не подтверждаются.

Этот реестр фиксирует судьбу каждого самостоятельного состояния Concept V2.
Полная таблица найденных commits и refs хранится в проверенной внешней копии:
`/Users/designer/.codex/visualizations/2026/09/24/01a0d52f-749d-72f2-92be-f7ea54c8f074/redesign-portfolio-preservation/`.

| Состояние | Статус | Где находится и почему |
| --- | --- | --- |
| Ранний опубликованный снимок Concept V2 (`38b85aa`, PR #50) | Сохранено отдельно | Исторический baseline остаётся в Git, включая опубликованный `/concept-v2/`; это не собираемая новая версия. |
| Foundation отдельного приложения, Header, controls, cursor и footer | Включено | Уже входят в предков `4a8f1c6`; повторный перенос старых веток не нужен. |
| Базовая собранная главная и isolated Hero проекта (`4a8f1c6`) | Включено | Основа ветки `codex/redesign-portfolio`. |
| Карточки проектов, Process и AI | Включено | Принятая реализация и ассеты находятся в базовой линии. |
| Experience timeline, fade и scroll states | Включено | Текущая реализация и связанные исправления уже присутствуют в базовой линии. |
| Поздний About и viewer | Включено | Принятая версия входит в `4a8f1c6`. |
| Ранний тяжёлый About deck (`2c7ec2b`) | Сохранено отдельно | Сохраняется в истории `concept-v2-heavy-polish`, но не накладывается на позднюю принятую версию. |
| Оптимизация scroll/runtime до `6078715` | Включено | Вся принятая линия присутствует в базе. |
| Готовая 404 (`f4b63e0`, `9e4660d`) | Включено | Перенесена в новую линию без изменения результата. |
| Готовый прелоадер (`fb0f744`) | Включено | Интегрирован merge-коммитом `d94a707`; маршруты новой линии сохранены. |
| Hero главной и итоговая Statistics из `ba28b67` | Включено | Нужные изменения уже были в основе; чужая история ветки не объединялась. |
| Четыре сцены Corvo | Включено | Media Campaigns, Statistics и My Space совпадают с исходником. Authorization сохранена в принятой оболочке для малой ширины. |
| Experience с сеткой 96px | Исторический baseline | Входил в исходную сборку; последующие изменения сетки фиксируются текущим кодом и более поздней приёмкой. |
| Experience с сеткой 64px | Сохранено отдельно | Проверяемый patch `variants/experience-64px.patch`; не включается без отдельного решения. |
| Ранняя логика pause/resume для pulse | Сохранено отдельно | Проверяемый patch `variants/pulse-pause-resume.patch`; финальная scroll-логика остаётся в runtime. |
| Отдельный Corvo interaction prototype | Сохранено отдельно | Прототип остаётся в исходной истории, он не заменяет принятый Hero проекта. |
| 29 недостижимых из обычных refs Concept/Corvo commits из reflog | Сохранено отдельно | Каждый закреплён archive-ref в bare-копии и в проверенном bundle; ни один не выброшен. |
| Импортированный прототип `source.tar.gz` | Сохранено отдельно | Полный архив сохранён с контрольной суммой; не заменяет текущую сборку. |
| Ранние версии Hero, Corvo и главной в отдельных ветках | Сохранено отдельно | Остаются в исходных ветках и во внешней копии; их не вливают целиком из-за посторонних изменений. |

Ни одна запись этого реестра не означает удаления исходника. Очистка старых
веток и worktree возможна только отдельной задачей после приёмки этой сборки.


## Сверка единой линии — 2026-10-04

Exact checkpoint исходников: `d48bba46a8a62dc3061be51f192d573f49c9642f`.
Общая ветка: `codex/redesign-portfolio`; worktree:
`/Users/designer/.codex/worktrees/redesign-portfolio/Design-portfolio-site`.
Основная папка `/Users/designer/Documents/GitHub/Design-portfolio-site` находится
на `codex/project-responsive-hero` и не является актуальной общей сборкой.
`tools/concept-v2/app` — актуальный исходник; `public/concept-v2` — исторический
опубликованный снимок. Название Concept V2 сохраняется; переименование и
переключение production маршрутов не входят в эту группу документации.

| Источник | Судьба и доказательство |
| --- | --- |
| `concept-v2-preloader` / `concept-v2-preloader-integration` | Включены в историю общей линии; integration через `d94a707`. |
| `concept-v2-routing-404` | Два patch-equivalent изменения уже перенесены; повторный перенос не нужен. |
| `concept-v2-scroll-lag` | Включён в предков общей линии. |
| `trackpad-stopper-direction` / approved-sync (`d09796e`) | Все 11 отдельных изменений имеют patch-equivalent переносы в общей линии. |
| `redesign-main-fidelity` (`4edde66`) | Все 17 отдельных изменений имеют patch-equivalent переносы. |
| `concept-v2-figma-delta-3ec86f0` | Включён в историю общей линии. |
| `corvo-hero-impl` / `corvo-page-content-impl` / `corvo-project-page-refresh` | Соответственно 1/1/3 отдельных изменения перенесены с эквивалентными patch. |
| `redesign-project-page` (`9085e82`) | Страница интегрирована через `3b4207f`, затем обновлена, включая `e8014cf`, `270e82f`, `52d174d`; старые 11 commits не вливать целиком. |
| `corvo-fidelity-repair` (`e25c499`) | Девять patch-equivalent переносов; финальный grid diff адаптирован через `0efd127` и последующие общие GridPattern changes. |
| `concept-v2-hero-grid-20260930` (`5dd1e71`) | Старый grid заменён последующей работой `6f74333` и общей сеткой; не возвращать прежние CSS поверх текущего Hero. |
| Corvo scenes из `ba28b67` | 142/142 файла находятся в `tools/concept-v2/app/public/responsive-scenes/corvo-v1`; 141 идентичен. Отличие `authorization/style.css` — уже зафиксированная правка оболочки, а не потерянная сцена. |
| `raster-hero-static-shading`, выбранный source `f7db517` | Итоговое дерево перенесено через `78fb140`. CSS, package/lock, carousel helpers, variants и tooltip совпадают с source. Основной компонент изменён только под 4096×2958; тест дополнен проверкой lossless WebP. |
| `raster-hero-shading` (`7bb78ff`) | Историческая экспериментальная линия; выбран более поздний итог `f7db517`, автоматический merge не нужен. |
| `7efd6ef`, названия оболочек | Раздел «Верстка» / «Фикс адаптив» перенесён дословно в DESIGN_SYSTEM.md этой группой. Preview titles и код не переименованы. |
| Основная папка: `9acbca4`, `a4c33f9` | Отдельный `availability-preview.html`, вне общей сборки редизайна. |

### Исправленные указатели checkout

В девяти HANDOFF заменены ошибочные checkout/checkpoint на фактические,
добавлен указатель на общую линию. Старые тексты сохранены в Git.
У detached approved-sync создана только ветка для фиксации документации;
исходный checkpoint `d09796e` сохранён. Ни один кодовый файл не изменён.

| Worktree | Ветка | Code checkpoint | Documentation commit |
| --- | --- | --- | --- |
| `/private/tmp/raster-hero-static-shading` | `codex/raster-hero-static-shading` | `7efd6ef` | `c81ddb6` |
| `/Users/designer/.codex/worktrees/concept-v2-approved-sync/Design-portfolio-site` | `codex/approved-sync-handoff-correction` | `d09796e` | `00ebedc` |
| `/Users/designer/.codex/worktrees/corvo-fidelity-repair/Design-portfolio-site` | `codex/corvo-fidelity-repair` | `e25c499` | `77978fc` |
| `/Users/designer/.codex/worktrees/corvo-hero-impl/Design-portfolio-site` | `codex/corvo-hero-impl` | `9f049b9` | `8bce227` |
| `/Users/designer/.codex/worktrees/corvo-page-content-impl/Design-portfolio-site` | `codex/corvo-page-content-impl` | `f2e7bc0` | `80f637c` |
| `/Users/designer/.codex/worktrees/corvo-project-page-refresh/Design-portfolio-site` | `codex/corvo-project-page-refresh` | `c4a1c41` | `cb78f12` |
| `/Users/designer/.codex/worktrees/raster-hero-shading/Design-portfolio-site` | `codex/raster-hero-shading` | `7bb78ff` | `228429d` |
| `/Users/designer/.codex/worktrees/redesign-project-page/Design-portfolio-site` | `codex/redesign-project-page` | `9085e82` | `87d11c4` |
| `/Users/designer/.codex/worktrees/trackpad-stopper-direction/Design-portfolio-site` | `codex/trackpad-stopper-direction` | `d09796e` | `06591d9` |

### Отсутствующие папки и сохранённая история

Следующие шесть регистрационных записей указывают на отсутствующие папки.
Они не участвуют в сборке. До отдельной задачи очистки после приёмки не
выполнять prune/remove; ветки и commits сохраняются. Git не доказывает
сохранность прежних незакоммиченных файлов отсутствующих папок.

- `/private/tmp/art-des-release-main`
- `/private/tmp/art-des-sarafan-hotfix`
- `/private/tmp/concept-v2-hero-grid-20260930`
- `/private/tmp/design-portfolio-concept-v2-latest`
- `/private/tmp/design-portfolio-figma-guidance`
- `/private/tmp/design-portfolio-redesign-main-fidelity`

В выборке последних 1000 reflog-записей обнаружены десять relevant commits,
не достижимых из обычных refs. Наличие каждого проверено через cat-file в
существующей `redesign-history.git` страховочной копии:
`64e8d98d24`, `8c0b8f4ba6`, `3307dbd72d`, `94176531e5`, `c496ffb583`,
`e1e35eac7a`, `3fcb24a341`, `a1f19ceaab`, `2861f2b459`, `86a27c165e`.
Это проверка выборки, не полный новый аудит всех недостижимых объектов.
В страховочной копии остаются 29 archive refs. Восстанавливать эти варианты
в активный runtime или удалять копию не требуется.

### Проверки и дальнейшие границы

На code checkpoint `d48bba4`: 205/205 tests, lint 95 source files;
относительные source imports разрешаются. Сверка не меняла runtime.
Для этой группы документации: diff-check, соответствие checkout/branch,
дословное совпадение перенесённого раздела, проверка scope каждого commit.
Build/browser и production readiness этим этапом не подтверждены.

Следующие отдельные группы: удаление только самовольно добавленного адаптива
портфолио; Admin для контента проектов и входных данных двух готовых Hero;
release routing и приёмка сложных состояний. Работающие Hero и их сцены не
менять. Merge/deploy/архивирование прежнего production — отдельные разрешения.
