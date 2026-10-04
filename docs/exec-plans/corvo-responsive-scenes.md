# Corvo responsive scenes

Статус: COMPLETE — все четыре сцены приняты пользователем после ручной
проверки. Дата: 2026-09-20.

## Результат и границы

Четыре независимые HTML/CSS-сцены Corvo из пользовательского плана
`USERSPACE/User Plans/PLAN – Corvo adaptive front.md`, исполняемые строго
последовательно: Авторизация, Медиакампании, Май спейс, Статистика. Gate 2
для My Space прямо одобрен пользователем. Текущая Git-группа ограничена My
Space; «Статистика» не создаётся до отдельного следующего запроса.

Область PORTFOLIO; размер LARGE; риск ELEVATED; режим FULL. Работа изолирована
в worktree `/Users/designer/.codex/worktrees/corvo-responsive-scenes/Design-portfolio-site`,
ветка `codex/corvo-responsive-scenes`, baseline
`76fcd9024ad9e6d3cfcf101bd8f0e23e191e8c04`. Публичный runtime, Admin, shared
contract, root config и существующие assets не затрагиваются.

## Итог

Authorization, Media Campaigns, Media Items и Statistics реализованы во всех
трёх адаптивах. Пользователь вручную проверил и утвердил итоговые сцены
2026-09-20. Blocker и незавершённые обязательные этапы отсутствуют; дальнейшие
изменения относятся к новой цели.

## Post-acceptance handoff 2026-09-20

После отдельной типографической проверки пользователь утвердил Manrope как
единственную рабочую версию для Portfolio. Канонические маршруты
`authorization`, `media-campaigns`, `my-space` и `statistics` используют
Manrope 400/500/600 из Google Fonts и не ссылаются на TT Norms Pro.

Прежняя TT Norms-реализация сохранена вне раздаваемого `site/` в
`tools/corvo-responsive-scenes/archive/tt-norms/` только как исторический
reference. Она исключена из integration scope. Практический контракт передачи
зафиксирован в `tools/corvo-responsive-scenes/INTEGRATION_HANDOFF.md`.

## История выполнения

Этап 1 — Авторизация. Preflight завершён: текущий worktree выделен;
Figma context прочитан read-only для roots `3600:172160`, `3600:172155`,
`3600:172158` файла `sgKtUASp0aYzdkeH8kcXrL`.

Figma подтверждает `TT Norms Pro` со стилями Normal (weight 450) и Medium.
Пользователь предоставил точный локальный комплект: `TTNormsPro-Normal.ttf`
и `TTNormsPro-Medium.ttf` из `/Users/designer/Downloads/TT Norms Pro/TTF/`.
Копии лежат только в игнорируемом `site/assets/fonts/`; правило в `.gitignore`
не допускает их в staging, commit или GitHub. SHA-256: Normal
`b751aadc1c9b418c94b4f855015b68a9bc071c9d78e4e184329655420f93b6bb`,
Medium `46c446b02b133c0bb41d0658cca13374433b874f094eb28e4c644ce5a0fd2341`.

Три Figma reference exports сохранены вне раздаваемого `site/` в
`/Users/designer/.codex/visualizations/2026/09/19/01a0ba73-953a-7c01-b7a4-db33c0075a1c/corvo-responsive-scenes/authorization/figma-2026-09-19/`.

## Corrective plan v2 — Media campaigns

**Outcome.** Локальная Media campaigns в точности воспроизводит Figma roots
`3600:173694` (1440 × 960), `3600:173727` (744 × 1100) и `3600:173759`
(360 × 640), без упрощённых визуальных substitute-элементов.

**Confirmed source and baseline.** Свежие Figma exports и runtime captures
сделаны 2026-09-19. Аудит подтвердил четыре исправляемых расхождения:

1. В desktop rail отсутствует верхний 20px control, а active-state и порядок
   Figma navigation states собраны неверно.
2. Tablet filters не переносят Search на отдельную нижнюю строку; структура
   table не сохраняет Figma top/side padding, 40px header и 56px rows.
3. Mobile profile перекрывает Menu; scroll indicator имеет неверную ширину;
   mobile table использует desktop-подобные 56/64px ячейки вместо 32/48px
   source structure с фиксированными left/action columns.
4. CSS-нарисованные флаги нарушают asset contract; требуется заменить их
   локальными векторными assets, не меняя content или соседние сцены.

### Зафиксированные пользователем дополнения 2026-09-19

- Desktop rail: иконки и active-state заметно расходятся с source. Проверять не
  по имени файла, а по `3600:173695`: порядок Layout, active Dashboard,
  Bar-chart, Announcement, Pie, Referals; каждый основной control — 48px,
  иконка 20px, left inset 14px.
- Пользователь уточнил текущий rail reference: активна именно третья
  Bar-chart control после Layout и Dashboard; нижняя 48px account group
  показывает отдельный active User tab (white with shadow) и отдельный
  inactive Shield tab. Нельзя заменять их одной большой нейтральной кнопкой.
- Table: не должно быть разделителей между всеми столбцами. Допустима только
  вертикальная граница после первого столбца; остальные разделения — только
  горизонтальные строки.
- Switcher Active/Deactivated: активная надпись `#3b3d3c`, неактивная
  `#777c79`; оба состояния нельзя наследовать из общего цвета текста.
- Search field имеет явный белый container fill с нейтральной 1px border;
  прозрачный фон на сером page background — defect.
- Header: desktop Date control обязан следовать cloud source `3600:173697`:
  48px Day-control с внутренним отступом 16px, 16px gaps, vertical divider,
  календарь с `Select day` и значением даты в 269px field. Не оставлять
  плоскую строку без source padding или caption.
- По прямому указанию пользователя tablet metric-cards больше не клипуются:
  три карточки равномерно заполняют ширину, как на desktop. Для устойчивого
  mobile layout граница — до 479px; mobile outer card/table растягиваются по
  доступной ширине, а график масштабируется вместе с карточкой.
- Desktop-метрики сохраняют elastic `flex`-раскладку с chart, растягивающимся
  вместе с карточкой. Tablet 480–959px использует `flex: 1 0 252px`: карточки
  сначала растут вместе с доступной шириной, а после source minimum 252px не
  сжимаются и уходят за край; при расширении viewport снова растягиваются.
- Desktop GEO не центрирует флаги: они начинаются с левого внутреннего
  отступа колонки; в tablet сохраняется отдельное центрирование.
- Свежая сверка rail с `3600:173695` исправила порядок: Coins swap завершает
  основной список после Referals, Laptop находится над Account, а между
  логотипом и Layout нет отдельной видимой control. `rail-layout.svg`,
  `rail-user.svg` и `rail-shield.svg` заменены exact cloud-Figma SVG bytes.
- Проверка 2026-09-20 признала предыдущий mask-checkpoint неверным: CSS
  `mask-size: 24px 100%` неравномерно растягивал 20/16px Color frames,
  превращал stroke-export в silhouette и делал толщину/геометрию зависимой
  от consumer size. Старый тест ошибочно закреплял этот механизм.
- Все иконки Media campaigns теперь рендерятся прямыми локальными SVG, без
  CSS mask, filter или transform. Каждый asset сохраняет полный Figma
  frame/viewBox, source stroke-width, line properties и semantic color.
  `vector-effect="non-scaling-stroke"` не используется: Zen/Firefox
  растрировал его тоньше для external SVG `<img>`.
- Rail использует native 20px frames с inactive `#878c89` и active
  `#545755`; Profile и Shield сохраняют distinct 24px frames. FTD использует
  mapped 20px `Medium / Charts / Pie-chart-02`; desktop/tablet Pencil остаётся
  20px, mobile Percent использует отдельный Light 16px frame.
- Regression guard проверяет 37 icon assets, их canvas/viewBox, source
  stroke, intrinsic frame, semantic colors и отсутствие mask/filter;
  runtime audit дополнительно подтверждает selected source и computed sizes
  в 1440/744/360.
- Source map текущей группы: `3600:173697` → `header-chevron-color.svg`,
  `header-calendar-color.svg`; `3600:173698` → `create-color.svg`;
  `3600:173723` → `metric-registration-color.svg`,
  `metric-deposit-color.svg`, `metric-ftd-color.svg`; `3600:173725` →
  `search-color.svg`, `filter-color.svg`, `columns-color.svg`;
  `3600:173726` → `table-{chevron,prev,next,lock,eye,copy,edit}-color.svg`;
  `3600:173728` → `menu-tablet-color.svg`; `3600:173760` →
  `menu-mobile-color.svg`, `mobile-registration-color.svg`.

**Scope.** Только `site/media-campaigns/`, её Figma-export assets,
`SOURCE_MAP.md` и этот ExecPlan. **Non-scope:** Authorization, My Space,
Statistics, shared contract, Admin, Figma write, fonts, push/merge/deploy.

**Execution.**

1. **Rail and mobile header →** восстановить source order, sizes and
   containment из `3600:173695` и `3600:173760` → верхний rail control и menu
   видимы в своих source slots → screenshot at 1440/360 and bounding boxes.
2. **Filters and table structure →** применить Figma 20/16/0px table insets,
   48/40/32px headers and 64/56/48px rows; вернуть tablet Search на отдельную
   строку, fixed action column and sufficient source rows → screenshots at
   1440/744/360 plus exact DOM geometry check.
3. **Source assets and indicators →** заменить hand-drawn visible flags only
   downloaded Figma vectors and set mobile indicator to 34 × 10px → local
   asset-reference check and source mapping review.
4. **Verification →** compare the three runtime captures side-by-side with
   fresh Figma exports; then run two independent reviews: (a) source fidelity
   and completeness, (b) regression, scope and asset provenance. Re-run all
   affected checks after the last edit.

**Acceptance.** Each target viewport preserves its source canvas size and
top-level geometry; visible icons, flags and graphs are concrete local assets,
not CSS drawings; tablet Search is below controls; mobile Menu remains visible;
each table follows its source row/header dimensions and fixed-column behavior;
the only vertical table divider follows the first column; no fonts are tracked;
Git scope stays local and Media-only.

**Stop-lines.** Stop for any Figma asset that cannot be source-mapped, any
needed contract/dependency change, or a required change outside the Media
scene. No push, PR, merge, deploy or Figma write.

### My Space visual acceptance correction 2026-09-20

- Повторная приёмка проведена по текущему runtime и точным cloud nodes:
  Global `3600:186216` / `3600:186179`, mobile info `3600:186219`, metrics
  `3600:186231` / `3600:186209` / `3600:186171`, filters `3600:186233` и
  tablet table `3600:186212`.
- Исправлены mobile value chips, value-only info cards и позиция carousel
  dots; tablet получил source KPI-copy, однострочные tabs + Search, точные
  194/180/180/144px первые колонки, URL chips и семь видимых строк.
- Final browser evidence: 360px — blocks 177/104/56/220, dots x=8 w=344,
  table y=673 h=1; 744px — tabs 208, Search 496, table 716×512, GEO видим,
  eight semantic rows; 1440px — full 11 headers, table 1344×320. Console
  warnings/errors: 0 на всех трёх viewport.
- Fidelity/completeness review подтвердил все обнаруженные visual gaps;
  regression/scope review подтвердил сохранение desktop values, полного
  table contract и соседней Media campaigns сцены.

### Verification 2026-09-20 — icon corrective group

- Предыдущая проверка этой группы признана недостаточной после визуальной
  приёмки пользователя: она допускала смесь настоящих stroke SVG и
  экспортированных fill-outline silhouettes. `non-scaling-stroke` на первой
  группе и обычное масштабирование второй делали визуальный вес неодинаковым.
- Guard был ужесточён до реализации и упал на `create-color.svg`: каждая из
  37 line-иконок теперь обязана иметь centerline stroke, Medium 1.3px либо
  Light 1px и intrinsic source frame; fill-only path допустим только как
  source duotone layer с opacity 0.2.
- Source geometry для всех иконок прочитана из реальных main components через
  read-only Figma Plugin API. SVG пересобраны из `vectorPaths`, relative
  transforms, stroke caps/joins и полного component frame; CSS masks,
  filters и обводка по fill bounds не используются.
- Cross-browser приёмка в Zen (Firefox) выявила корневую разницу:
  `vector-effect="non-scaling-stroke"` в external SVG `<img>` растрировался
  тоньше, чем в Chromium. Атрибут удалён, relative transforms запечены
  непосредственно в финальные 20/16/24px path coordinates, а responsive
  Lock/Eye/Copy/Pencil/Chevron получают отдельные intrinsic source-size
  варианты вместо CSS-масштабирования.
- Fidelity review после пересборки проверяет desktop в Chromium и Zen,
  tablet
  744×1100 и mobile 360×640. Отдельно сверены rail active/inactive,
  Filter/Columns, header, три metric icons, Lock/Eye/Copy/Edit и Light
  mobile icons; FTD снова использует исходную Pie-chart geometry.
- Regression/scope review подтверждает Media-only boundary, отсутствие
  изменений Figma и отсутствие новых зависимостей. Focused test, XML parse,
  server syntax и `git diff --check` повторены после последнего изменения,
  проходят и относятся только к итоговому состоянию.

## Corrective plan v3 — responsive fidelity completion

**Статус плана: COMPLETE — pending user visual acceptance.** Пользователь прямо разрешил и план, и
реализацию одной Media-only Git-группы. Область `PORTFOLIO`; размер `LARGE`;
риск `ELEVATED`; режим `FULL`. Baseline: `4cd4420` в выделенном worktree.

**Исходники.** Read-only Figma roots: desktop `3600:173694` (1440×960),
tablet `3600:173727` (744×1100), mobile `3600:173759` (360×640); детальные
nodes Global desktop `3600:173697`, tablet `3600:173728`, mobile
`3600:173760`, Table desktop `3600:173726`, mobile `3600:173774`.

**Решение по adaptive contract.** Готовый пользовательский PLAN является
источником runtime-границ независимо от исторических имён Figma-фреймов:
mobile `≤599px`, tablet `600–959px`, desktop `≥960px`. Контент сохраняет
свои исходные minimums и clipping, а не сжимает таблицу или накладывает
controls друг на друга.

**Scope.** Только `tools/corvo-responsive-scenes/site/media-campaigns/`, её
asset mapping, focused guard и этот план. **Non-scope:** остальные Corvo
сцены, public Next runtime, Admin, shared contract, Figma write, dependencies,
fonts, push, PR, merge и deploy.

### Последовательные slices

1. **Header contract →** перевести старые 480/960 media ranges на confirmed
   600/960 boundaries; восстановить desktop 6px icon-frame + 2px body
   spacing, semantic colors Day/date, а для tablet/mobile — отдельные source
   2px/6px values; вернуть source-sized profile-chevron. **Ожидание:** header
   не меняет порядок и не сталкивает элементы на 360/600/744/959/960.
   **Проверка:** RED/GREEN source assertions + computed geometry на пяти
   viewport. **Stop-line:** необходимость менять header content/semantics.
2. **Rail and icon fidelity →** привести нижние account glyphs к 20×20
   source frames и мобильный Menu к Medium 20px/1.3px source frame; сохранить
   direct full-frame SVG path without mask/filter/scale. **Ожидание:**
   одинаковый visual weight в Chromium и Zen. **Проверка:** intrinsic SVG
   assertions, XML parse and rendered-size audit. **Stop-line:** недостающий
   source asset.
3. **Metrics and graph states →** применить source muted negative token,
   distinct third tablet chart pair matching desktop data, exact mobile 6px
   dots inside 34×10 track. **Ожидание:** first/last curves are distinct at
   tablet and mobile indicator remains source-sized. **Проверка:** asset hash/
   DOM mapping guard + tablet/mobile capture. **Stop-line:** chart source
   cannot be mapped to an existing approved local export.
4. **Responsive filters and table →** preserve intrinsic desktop/tablet
   column minimums and scroll behavior; restore a non-overlapping tablet
   filters layout; keep mobile left/action cells pinned and add the missing
   Action leading divider. **Ожидание:** at maximum compression no content
   columns collapse below source min widths, no controls overlap, and mobile
   Action has the same visual boundary as Name. **Проверка:** focused CSS
   contract plus DOM widths/overflow at 360, 599, 600, 744, 1279, 1280.
   **Stop-line:** a required structural data/contract change.
5. **Full validation →** inspect current diff against Figma in two separate
   passes: (a) fidelity/completeness; fix every confirmed discrepancy, then
   (b) regression/scope/assets. Re-run focused tests, XML parse, server syntax,
   `git diff --check`, and the exact responsive browser matrix after the final
   edit. Create one local Media-only commit. No external mutation follows.

**Acceptance.** The 12 reported details are independently guarded: date
spacing/colors; profile arrow; 20px rail account glyphs; table min widths and
mobile Action divider; source breakpoints; muted red; three distinct tablet
curves; source dots; mobile day layout and Menu stroke. Each final screenshot
comes from the current commit and each test describes a visible contract, not
an implementation accident.

**Plan review.** Fidelity/completeness lens found that old breakpoints were a
root cause rather than a local tablet defect; the plan handles them first.
Regression/scope lens found no data, dependency, Figma-write or production
boundary. The only retained risk is native Zen rasterization, explicitly
covered by intrinsic full-frame SVG checks plus Zen visual acceptance.

**Corrective addendum 2026-09-20.** Exact reads of mobile table
`3600:173774`, tablet table `3600:173758` and desktop table `3600:173726`
replace the earlier inferred table model. All three adaptations retain all six
fields (`ID & Name`, `URL`, `Reward plan`, `GEO`, `Created at`, `Action`) and
use horizontal traversal below their intrinsic minimum. Mobile is 708px wide
with fixed 120px Name and 62px Action; tablet has an 892px minimum with fixed
194px Name, 129px Created and 80px Action; desktop has an 1146px minimum with
fixed 220px Name, a non-collapsing 180px GEO minimum, 136px Created and 90px
Action. Edge columns stay pinned and each divider is one physical 1px border,
without a supplementary shadow. Mobile Date retains a 16px outer item gap,
6px icon-frame end spacing and 2px text-body start spacing.

**Tablet Fixed-column addendum 2026-09-20.** Figma's `ID & Name` column is
Fixed for the tablet table; the prior CSS preserved only its divider. Tablet
header and body cells now use `position: sticky; left: 16px` with a white
surface and a painted trailing divider, retaining the table's source inner
inset. At 600px, after a 146px horizontal scroll, the first cell remains at
`x=29px`; the remaining columns move underneath it. The footer has a higher
stacking level and continues to cover the clipped final row.

**Zen and chart addendum 2026-09-20.** The first Fixed implementation retained
`border-collapse: collapse`, which is not a reliable sticky-cell substrate in
Zen. The tablet table now uses `border-collapse: separate; border-spacing: 0`,
preserving the same geometry while allowing the fixed first column to stay
anchored. Tablet Registration now directly reuses `desktop-chart-1.svg` and
`desktop-chart-2.svg`; the incorrect tablet-specific curve exports are no
longer referenced.

**Tablet type-scale addendum 2026-09-20.** Tablet metrics previously used
`clamp(18px, 3.225vw, 24px)`, which changed the visible numeric type size within
one responsive state. The tablet contract is a fixed `24px / 28px` metric
scale; browser readings at 600, 744 and 959px all resolve to that exact
pair. No `vw` or `clamp()` value remains in the tablet metric rule.

**Tablet edge-column addendum 2026-09-20.** The exact read of
`3600:173758` establishes six source columns: `ID & Name` is fixed at 194px,
`URL`/`Reward plan`/`GEO` are elastic, `Created at` is 129px and `Action` is
fixed at 80px. The tablet’s 892px intrinsic minimum preserves all fields for
horizontal traversal; nothing is hidden. Both edge cells are sticky at the
16px table inset. Their divider is one physical 1px `#f2f2f2` border — no
supplementary shadow. Runtime measurements at 744px and 959px retain exactly
194px / 80px and report all six cells as visible table cells.

**Tablet GEO/trailing-padding addendum 2026-09-20.** GEO content follows the
source left alignment. The sticky Action column now paints the explicit 16px
white trailing padding frame from `3600:173758`, including the 1px row boundary,
so horizontally scrolling Created-at content cannot show through the right
inset. At 744px Action ends at x=715, the padding occupies x=715–731 and the
table container ends at x=732.

**Full responsive re-audit 2026-09-20.** Figma-to-code reads covered the three
page roots plus every table source and the mobile filter source. Section
geometry was sampled at 360/599/600/744/959/960/1440. The exact design
frames resolve at 360 to 344×92 filters and 344×545 table; at 744 to 720×112
filters and 720×552 table; at 1440 to 1344×48 filters and 1344×424 table.
All six table cells remain rendered at every width. Mobile Name/Action resolve
to 120/62px, tablet to 194/80px and desktop to 220/90px; desktop GEO never
drops below 180px. Switcher internals now account for the CSS border model and
match the source 32px/40px heights and source widths: mobile 88/100, tablet
144/144, desktop 106/118. Responsive picture sources consistently use the
599/1279 contract rather than legacy 479/959 fallbacks.

## My Space / Media items — план коррекции визуальной приёмки · 2026-09-20

**Статус: Ready for visual acceptance.** Пользователь остановил предыдущую реализацию
после visual acceptance и явно разрешил аудит, план и исправление. Базовая
ревизия: `bf7527a`. Предыдущий My Space ошибочно следовал preview
`3510:113449` / `3510:118257`; он не является source of truth для этого
сценария и не должен дальше влиять на разметку или тесты.

### Outcome и source of truth

`/my-space/` совпадает с блоком **Media items** из cloud Figma file
`sgKtUASp0aYzdkeH8kcXrL` во всех трёх режимах: desktop `3600:186134`, tablet
`3600:186175`, mobile `3600:186213`. Точные дочерние targets: title/action
`3600:186142` / `3600:186180` / `3600:186218`, info `3600:186143` /
`3600:186181` / `3600:186219`, metrics `3600:186171` / `3600:186209` /
`3600:186231`, filters `3600:186173` / `3600:186211` / `3600:186233`, table
`3600:186174` / `3600:186212` / `3600:186234`.

**Confirmed audit baseline.** Current runtime shows the wrong title
`Media Campaign`, wrong Email/Payment/Affiliate strip and emoji substitutes,
borrowed Media campaigns graph exports, Filter/Columns controls that do not
exist in the target, and an eight-field preview table. Its measured geometry
also contradicts Figma: global/title is `80 + 108` instead of desktop `128 +
100`; tablet is `72 + 96` instead of `116 + 100`; mobile is `137 + 92`
instead of `177 + 104`. The current metric, filters and table dimensions do
not follow the source roots. Existing rail, basic header primitives, local
fonts and static-server shell remain reusable only where their visual contract
matches these exact targets.

### Scope

**Include:** `site/my-space/`, exact local Figma SVG exports needed by this
scene, `test-my-space.mjs`, `SOURCE_MAP.md`, this ExecPlan and `HANDOFF.md`.
Replace the wrong My Space source mapping, content, asset bindings, responsive
layout and table contract. **Do not change:** Authorization, Media campaigns,
Statistics, public runtime, Admin, shared data/schema, dependencies or fonts.
No Figma write, local-Figma access, push, PR, merge or deploy.

### Ordered execution

1. **Map exact My Space sources and assets → local artifact set → no invented
   glyphs or graph variants.**
   - Preserve semantic HTML and the verified generic shell only when its
     computed geometry agrees with the target.
   - Download the direct cloud-Figma exports for visible info icons,
     title-action icon, metric icons, graph line pairs, indicators and any
     table glyph that does not already match its exact source asset.
   - Record only the confirmed My Space node-to-file map in `SOURCE_MAP.md`.
   - Verify every visible non-text glyph has a local exact source asset and no
     temporary Figma URL or emoji placeholder remains.

2. **Replace the false preview composition → the source Media items structure
   → exact source data, hierarchy and clipping.**
   - Title/action: `Tech Innovations Inc.`, its specified subtitle and
     `Create items`; no `Media Campaign` or campaign-profile strip.
   - Info cards: `ID A1234864`, `Access Private`, `Link corvo.com`, with their
     three exported icons; preserve Figma HUG widths and mobile clipping rather
     than converting them to a grid.
   - Metrics: use the source-specific 440×220 desktop cards, 252×192 tablet
     cards and one 344×190 mobile card with indicators. Text sizes are fixed
     per adaptive mode, never fluidly scaled inside a breakpoint.
   - Filters: only Active/Deactivated plus Search. Match 1344×48 desktop,
     716×48 tablet and 344×92 mobile; do not retain borrowed Filter/Columns.
   - Table: render the complete source field sequence (ID & Name, URL, Reward
     plan, GEO, Media items, Deposits Count, Deposits Amount, Clicks, Unique
     Clicks, Registrations, Created at) as semantic markup. Preserve source
     widths/minima and the scene-specific clipping; do not reuse the eight
     field preview-table contract.
   - Verify source values, aria structure, exact local asset paths and no
     unexpected horizontal/vertical expansion of the root frame.

3. **Implement exact responsive geometry → stable three-mode contract → visual
   acceptance evidence.**
   - Desktop uses rail 72 and content geometry from root `3600:186134`;
     tablet has no rail, a 116px global/breadcrumb block and 12px-left/16px-
     right content (filters/table 716px); mobile has a 177px global block,
     104px title, 56px info, 220px metrics and a residual 1px table below the
     viewport. The root radius stays 28px.
   - Use only mobile `<600`, tablet `600–959`, desktop `≥960` mode rules. No
     root `transform`, `zoom`, `clamp()` typography, invented scroll or
     intermediate breakpoint.
   - Replace the focused test assertions with this source contract, then run
     it together with the Media campaigns guard and `git diff --check`.
   - Browser-review 360×640, 744×1100 and 1440×960 against the exact cloud
     targets; check computed geometry, clipping, image load failures and
     browser errors. Correct confirmed deviations, repeat the affected checks,
     then commit this coherent My Space correction.

### Acceptance and stop-line

- All visible structures, content and assets derive from the eleven precise
  Figma nodes above; no borrowed preview composition or generic substitute
  remains.
- Each canonical viewport has its source frame height, required clip and
  stated key dimensions; within a mode fonts remain constant while the layout
  reflows according to Figma constraints.
- The original Media campaigns scene continues passing its focused guard.

Stop before any change outside the listed My Space paths, any Figma write,
or a source conflict that cannot be resolved from the exact roots. After the
commit, stop for visual acceptance; do not start Statistics.

### Execution evidence

- Точные cloud-Figma SVG exports сохранены в `site/assets/my-space/`; browser
  reports zero missing images and zero warnings/errors.
- Measured runtime geometry at 1440×960: global 128, title 100, info 88,
  metrics 228 with three 440×220 cards, filters 1344×48, table 1344×320.
- Measured runtime geometry at 744×1100: global 116, title 100, info 76,
  metrics 200 with 252×192 cards, filters 716×48, table 716×512.
- Measured runtime geometry at 360×640: global 177, title 104, info 56,
  metrics 220 with one 344×190 card, filters 344×92 and table 344×1 at y673.
- `node tools/corvo-responsive-scenes/test-my-space.mjs`,
  `node tools/corvo-responsive-scenes/test-media-campaigns.mjs` and
  `git diff --check` pass after the final correction.
- Follow-up responsive acceptance: the shared Media campaigns header remains a
  standalone 80/72/137px block and breadcrumbs are its 48/44/40px sibling
  below it. Runtime measurements pass at 360, 480, 744, 1024 and 1440px;
  Search stays visible in tablet landscape, cards/filter/table fill their
  available width without root overflow, missing images are 0, and browser
  warnings/errors are 0.
- KPI follow-up removes the divergent Media items chart implementation:
  markup, responsive classes, SVG assets and all KPI CSS now come directly
  from the proven Media campaigns component. At 480px the card is 464×190,
  chart 438×68 and centered dots 34×10; at 1024px the card/chart use the
  shared tablet rules. Table header/body first-column right edges both measure
  223.117px, both cells are sticky, and the URL copy-icon-to-chip gap is the
  shared tablet 8px. Missing images and browser warnings/errors remain 0.
- Final compressed-tablet acceptance uses cloud Figma node `3600:186135` for
  the rail state and the supplied narrow-tablet reference for the title flow.
  At 600px the title grows to 124px, the subtitle wraps to 48px, the fixed
  137.234px action remains clear at the right and root scroll width stays
  600px. At 744px the same intrinsic layout returns to a 100px title and a
  one-line 24px subtitle. At 1440px Workspace is the active 48×48 bordered
  rail item and Media campaigns is inactive.
- Icon-state correction uses the exact cloud-Figma masks from the same
  `3600:186135` node rather than recoloring the previous exports. Runtime at
  1440px confirms inactive Media campaigns is a 20×20 outline at `#878c89`,
  while active Workspace is the distinct filled 20×20 laptop at `#545755`
  inside the existing white/bordered state. Both committed SVG masks are
  byte-identical to their downloaded Figma assets; missing images remain 0.
- User-authorized breadcrumb correction overrides the incomplete tablet/mobile
  variants in Figma: all three modes now retain `Home | Media Campaign > Media
  Items`. Runtime at 360/744/1440 confirms all five direct children are visible,
  each chevron shares the exact vertical center of its sibling crumbs
  (165/102/112px), root width does not overflow, missing images are 0 and the
  browser console is clean.
- Mobile title follow-up removes the fixed 280px copy minimum and reserves a
  48px action lane inside the fluid text container. At 360px the subtitle is
  292×40px, the Create items control remains 32×32px at x=320, their rectangles
  do not overlap, root scroll width stays 360px and the console is clean.

## Statistics implementation · 2026-09-20

**Source and scope.** User approved Media items and supplied the exact cloud
Figma section `3600:199174`. Its canonical children are desktop `3600:199175`,
tablet `3600:199187` and mobile `3600:199198`; table nodes are
`3600:199186` / `3600:199197` / `3600:199208`. The implementation reuses the
existing Media campaigns/My Space chrome and responsive breakpoints. It adds
only `/statistics/`, two scene-specific SVGs, a focused contract test and source
evidence; Media campaigns and Media items remain unchanged.

**Implemented contract.** The scene keeps the shared rail, header, complete
breadcrumbs and title composition, removes KPI/identity/tabs/create blocks,
then renders Search plus Export/Columns and a semantic nine-column table. Only
the visible Figma fields are present. Each adaptive owns fixed column widths;
the 1391/1221/994px table is clipped by its 1344/720/344px frame and never
stretched or made horizontally scrollable. The Pie-chart navigation item uses
the active filled state while the former Media campaigns item is inactive.

**Acceptance evidence.** Focused Statistics, Media campaigns and Media items
checks pass together. Browser review at 1440×960, 744×1100 and 360×640 confirms
root dimensions and zero root overflow, table widths 1391/1221/994px, correct
mobile Search→Export→Columns order, zero missing images and zero console
warnings/errors. The final mobile table starts at y=345 exactly as source.

**Export icon correction.** The handwritten approximation was replaced with
the exact cloud-Figma `Medium / General / Share-01` asset from node
`3600:198853`. The committed SVG is the unredrawn 20×20 mask returned by design
context; CSS applies the instance color `#5e6260`. Focused test protects the
source path fingerprint, and browser checks at 744/360 confirm a 20×20 glyph,
zero missing images and no root overflow.

**Gate 4 runtime captures.** Current runtime for implementation commit
`537b23e` was captured after the export correction and final responsive checks.
The three PNG files are outside the served site and repository at:

- `/Users/designer/.codex/visualizations/2026/09/19/01a0ba73-953a-7c01-b7a4-db33c0075a1c/corvo-statistics-537b23e/corvo-statistics-537b23e-1440x960.png`;
- `/Users/designer/.codex/visualizations/2026/09/19/01a0ba73-953a-7c01-b7a4-db33c0075a1c/corvo-statistics-537b23e/corvo-statistics-537b23e-744x1100.png`;
- `/Users/designer/.codex/visualizations/2026/09/19/01a0ba73-953a-7c01-b7a4-db33c0075a1c/corvo-statistics-537b23e/corvo-statistics-537b23e-360x640.png`.

The captures are linked to the cloud-Figma read dated 2026-09-20 for section
`3600:199174` and exact Export component `3600:198853`. Gate 4 remains open
until explicit user acceptance.
