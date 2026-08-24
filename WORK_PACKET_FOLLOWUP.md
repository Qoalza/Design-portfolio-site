# WORK_PACKET_FOLLOWUP — MLIR3

## 1. Классификация и цель

- Size: `LARGE`
- Risk: `ELEVATED`
- Mode: `FULL`
- Namespace: `MLIR3-*`
- Ветка: `codex/main-layout-interaction-followup`
- Base SHA: `65ac0cd0a8259b71097b33ad2df2a6279ed682c7`
- Evidence: `design-reference/main-layout-interaction-followup/`
- Figma: строго read-only
- Merge и deploy: запрещены
- Итог Work Packet: `READY_FOR_USER_REVIEW`
- Итог активной записи `DESIGN_QA.md`: `READY_FOR_REVIEW`

Цель: исправить регрессии preview, типографики, иконок, Footer, action bar, sticky navigation и Gallery без самостоятельного изменения дизайна и несвязанного рефакторинга.

Старый каталог `design-reference/main-layout-interaction-reconciliation/` остаётся неизменяемым историческим evidence предыдущего runtime и не подтверждает новый `CODE_SHA`.

## 2. Источники истины

Приоритет:

1. Явные требования пользователя — поведение и UX.
2. Актуальные Figma instances проекта `5ZzspE0OrqesDcTP0RRPHr`.
3. Актуальная библиотека `CRcI38SOIkr5knjKXeCV5h`.
4. Фактический runtime из точного HEAD.
5. Старые документы, tests и evidence — только диагностический материал.

Начальные Figma anchors:

- открытый проект: `373:47102`;
- Corvo: `373:47103`;
- project viewport: `553:3036`;
- information layout: `553:3314`;
- Screens/Gallery chapter: `688:52700`;
- главная: `510:28120`;
- `/projects`: `373:50236`;
- project preview component: `507:24626`;
- Footer: library `124:4841`;
- Page Header: library `103:436`;
- Desktop/Tablet/Mobile icons: `100:7579`, `100:7581`, `100:7583`.

Каждый дополнительный источник сопоставляется с конкретным consumer и instance, а не только по имени.

## 3. Scope и non-scope

В Goal входят:

- системная миграция всего видимого Body-текста на Onest;
- inventory и исправление иконок существующих маршрутов;
- Telegram CTA;
- актуальный Footer;
- тени прозрачных preview на главной и `/projects`;
- first-paint и terminal geometry action bar;
- geometry-driven активация последней project section;
- overflow-driven Gallery pagination;
- top-layer Gallery lightbox;
- отключение увеличения верхнего preview;
- focused tests, Chromium/Zen verification и новый evidence;
- обновление `DESIGN_SYSTEM.md`, краткой ссылки в `AGENTS.md`, `HANDOFF.md`, `DESIGN_QA.md` и этого пакета;
- push и один stacked Draft PR.

Не входят:

- запись в Figma;
- global smooth scroll;
- новая mobile/tablet adaptation;
- визуальная переработка 404/500;
- новый browser runner без отдельного разрешения;
- несвязанный рефакторинг;
- context-transfer материалы;
- merge и deploy.

## 4. Статусы

Work Packet: `OPEN → IMPLEMENTED → VERIFIED → READY_FOR_USER_REVIEW → USER_ACCEPTED`.

`DESIGN_QA.md`: `OPEN → IN_PROGRESS → READY_FOR_REVIEW → CLOSED`.

Отображение:

| Work Packet | DESIGN_QA.md |
|---|---|
| `OPEN` | `OPEN` |
| хотя бы один блок `IMPLEMENTED` | `IN_PROGRESS` |
| все критичные блоки `VERIFIED`, финализация ещё идёт | `IN_PROGRESS` |
| Goal `READY_FOR_USER_REVIEW` | `READY_FOR_REVIEW` |
| пользователь выставил `USER_ACCEPTED` | `CLOSED` |

Codex не выставляет `USER_ACCEPTED` или `CLOSED`. Отсутствие обязательного evidence оставляет блок `OPEN`.

## 5. Блоки и зависимости

| ID | Результат | Потребители | Hard dependencies |
|---|---|---|---|
| `MLIR3-INV` | Figma/code/runtime inventory | Все маршруты | Нет |
| `MLIR3-TYP` | Body использует Onest | Весь сайт | INV |
| `MLIR3-ICO` | Корректный icon contract | Весь сайт | INV |
| `MLIR3-CTA` | Telegram CTA | Header consumers | TYP, ICO |
| `MLIR3-FTR` | Актуальный Footer | Все Footer consumers | TYP, ICO |
| `MLIR3-SHD` | Полные тени preview | `/`, `/projects` | INV |
| `MLIR3-ABA-I` | Корректный первый кадр action bar | Corvo | TYP |
| `MLIR3-ABA-T` | Terminal placement action bar | Corvo | ABA-I, FTR |
| `MLIR3-NAV` | Ранняя активация последней секции | Corvo | ABA-I, ABA-T |
| `MLIR3-GAL` | Pagination по реальному overflow | Corvo | TYP, ICO |
| `MLIR3-LBX` | Top-layer Gallery lightbox | Corvo | GAL |
| `MLIR3-PRV` | Верхний preview не интерактивен | Corvo | LBX |
| `MLIR3-REG` | Итоговая browser matrix | Все маршруты | Все code-блоки |
| `MLIR3-FIN` | Evidence, docs, push, Draft PR | Goal | REG |

## 6. Inventory и baseline

Составить закрытые таблицы:

- semantic typography role → точный Figma style → code token → consumers;
- icon consumer/state → Figma instance/source → `Stroke`, `Duotone`, `Solid` или `Color` → asset/renderer;
- preview frame → asset bounds → clipping layers;
- Footer node → exact text → geometry → code consumers;
- action bar/navigation/Gallery → DOM anchors, measurements и transitions.

Для Footer `124:4841` сохранить read-only screenshot/context, точный текст и consumer mapping. Строка `Deveploment and design Artur A.` не считается заранее утверждённой: если она действительно присутствует в node, реализовать буквально; иначе использовать актуальный текст node.

Stop-line: обязательный source недоступен или consumer нельзя сопоставить однозначно.

## 7. Typography

- Весь видимый не-heading UI-текст использует Onest.
- Source Code Pro удаляется из видимого UI.
- Исключение возможно только для настоящего code-content после явного подтверждения пользователя.
- Google Sans применяется только к semantic roles, подтверждённым актуальным Figma heading style; HTML heading или крупный размер сами по себе не являются основанием.
- Inventory фиксирует `semantic role → Figma style → code token → consumers`.
- Проверяются Onest font files, нужные weights, Cyrillic glyphs, `document.fonts.check`, computed family и отсутствие runtime fallback.
- После миграции повторно проверяются карточки, controls, navigation, action bar и Footer.

Постоянный font-driven rect shift более `1 CSS px` — `FAIL`.

## 8. Icon contract

Полный контракт хранится в `DESIGN_SYSTEM.md`; `AGENTS.md` содержит только короткое enforcement-правило и ссылку. Inventory и конкретное evidence находятся только в MLIR3 evidence.

- Stroke содержит настоящий SVG `stroke` и не заменяется outlined Fill.
- Duotone сохраняет stroke внешнего контура; fill разрешён только исходным залитым слоям.
- Solid и Color допустимы только при таком Figma source.
- Используется полный frame/viewBox, intrinsic bounds и внутренний баланс.
- Запрещены приблизительные glyph, CSS-примитивы и внутренние fragments.
- Одноцветные иконки используют semantic color/currentColor без устаревшего жёсткого fill.

XML-check подтверждает структуру, но не доказывает source type. Итог требует mapping consumer → Figma source, read-only evidence, XML/DOM-проверки и визуального сравнения.

## 9. Telegram CTA и Footer

Telegram:

- exact source выбирается по фактическому button instance;
- проверяются frame, stroke, viewBox, scale, gap, alignment и Onest metrics;
- состояния: normal, hover, focus-visible, active.

Не менять регрессионные значения:

- title: `Artur Product`;
- Telegram: `https://t.me/Coco_soul`;
- CV: `https://disk.yandex.ru/i/iZ1UWgbO1LAOPw`;
- Corvo Figma URL из текущего `content/projects/corvo.mdx`.

Footer:

- точный текст берётся только из подтверждённого `124:4841`;
- воспроизводятся geometry, spacing, alignment, year и links;
- Body typography использует Onest;
- проверяется каждый уникальный layout consumer;
- 404/500 остаются без Header и без визуального редизайна.

## 10. Preview shadows

Сначала доказать, обрезает ли тень raster, внешний CSS wrapper, внутренний clip или несколько уровней.

При подтверждении текущей причины:

- внешний wrapper сохраняет тень через `overflow: visible`;
- внутреннее кадрирование остаётся в отдельных clipping layers;
- тень принадлежит правильному frame;
- размеры карточки, crop и позиции не меняются.

Общий `MainProjectCard` проверяется одновременно на главной и `/projects`.

PASS: полная мягкая тень, сохранённый crop, неизменная карточка, отсутствие horizontal overflow и лишнего scroll range.

## 11. Action bar first paint

Внутренний measurement state может быть неизвестным, но пользователь не видит provisional Full, blank-frame, исчезнувшую плашку или отложенную интерактивность. Первый пользовательски видимый action bar сразу является geometry-correct Full или Adaptive без layout shift.

Реализация должна разрешить initial variant синхронно до первого пользовательски видимого paint:

- direct URL и hard reload измеряют фактические anchors до отображения variant;
- client navigation атомарно применяет новый variant до paint новой страницы;
- server markup резервирует только подтверждённую инвариантную geometry;
- invalid rect не выдаётся за visual PASS;
- timer, самостоятельный height breakpoint и задержка появления запрещены.

Допустимы synchronous pre-paint resolver и `useLayoutEffect`, если frame-by-frame evidence доказывает отсутствие wrong variant, blank-frame и shift. Проверяются direct URL, hard reload, client navigation, низкий initial Full, высокий initial Adaptive и late fonts/images.

## 12. Action bar terminal region

Terminal region всегда присутствует в document geometry и состоит из:

- gap `48 px` после Mobile-слайдов;
- полной высоты action bar.

Область не добавляется, не удаляется и не меняет высоту во время fixed→docked. Docking не меняет variant; Footer collision не выбирает Full/Adaptive.

PASS:

- Mobile bottom → bar top: `48 px`;
- terminal region: `48 px + barHeight`;
- `scrollHeight` одинаков непосредственно до и после docking;
- Gallery и Footer не перекрываются;
- нет прыжка, двойного divider или динамического дополнительного scroll range.

## 13. Последняя короткая section

Существующие programmatic navigation, отмена и watchdog сохраняются. Последняя section определяется структурным индексом, не label.

Threshold:

`max(headerStackBottom, usableBottom - lastSectionHeight)`

где `usableBottom` — фактическая верхняя граница видимого action bar.

К началу Gallery последний пункт уже активен. Запрещены условия по строке `Результат`, magic `scrollY` и document bottom.

## 14. Gallery pagination

Pagination строится по измеряемым snap positions:

1. Измерить `scrollWidth`, `clientWidth`, item starts и gaps.
2. `maxOffset = max(0, scrollWidth - clientWidth)`.
3. Построить уникальные `min(itemStart, maxOffset)`.
4. Нормализовать по DPR.
5. При отсутствии overflow оставить позицию `0`, обе кнопки Disabled и отключить wheel/drag/trackpad pagination.
6. После resize/DPR повторно измерить и clamp к ближайшей допустимой позиции.

Mobile не перелистывается, когда всё помещается; Tablet зависит от вместимости; Desktop перелистывается только при скрытом content. Loop и свободный horizontal scroll запрещены.

## 15. Gallery lightbox и верхний preview

Gallery lightbox:

- portal на `document.body`;
- top-layer через `<dialog>.showModal()` или эквивалент с доказанным поведением;
- фон не интерактивен;
- закрытие: кнопка, Escape, backdrop;
- focus containment и возврат trigger;
- scroll lock и восстановление позиции;
- повторное открытие без reload;
- корректная смена device-групп;
- intrinsic dimensions и aspect ratio; Mobile не растягивается до Desktop.

Верхний preview:

- изображения не ссылки и не кнопки;
- не получают focus;
- не имеют click/keyboard activation;
- не открывают lightbox;
- не показывают misleading pointer/hover/ARIA;
- композиция не меняется.

## 16. Внутренние interfaces и tests

Строгие TypeScript-контракты:

- `IconDefinition`;
- Gallery measurement result;
- action bar measurement;
- navigation measurement.

Pure helpers не читают DOM; DOM measurement остаётся в client controllers. `any` запрещён без документированной причины.

Pure tests покрывают Gallery overflow/no-overflow, DPR/clamp, action bar initial threshold и terminal offset, terminal navigation без label, icon metadata/source validation и URL regressions.

Browser-only checks не называются unit-тестами: first paint, hydration, DOM rects, resize, font/image loading, Footer collision, `scrollHeight`, top layer, focus и scroll lock.

## 17. Browser verification

Foundation-блоки проверяются в Chromium и Zen минимум при `1440×900`:

- typography на `/`, `/projects`, `/projects/corvo`, 404 и 500;
- полный icon inventory и основные states;
- Telegram CTA;
- Footer на каждом уникальном layout consumer;
- preview shadows на главной и `/projects`.

Для action bar, sticky navigation, Gallery pagination и lightbox обязательна полная matrix в Chromium и Zen `1.21.15b` (Gecko build `126.8.18`):

- `1280×720`;
- `1440×900`;
- `1440×999`;
- `1440×1200`;
- `1440×1356`;
- `1920×1080`.

Каждый результат содержит route, browser/version, viewport/DPR, `CODE_SHA`, Figma node, screenshots, measurements, console result и `PASS/FAIL`. Точное Figma-сравнение выполняется при `1440×900`.

## 18. Evidence lifecycle

Новый каталог: `design-reference/main-layout-interaction-followup/` с `README.md`, `inventory/`, `figma/`, `runtime/`, `comparisons/`, `measurements/`, `browser-results/`.

Старый MLIR2 evidence не переименовывается и не перезаписывается. Активная запись `DESIGN_QA.md` получает MLIR3 namespace и новый evidence path; старые утверждения явно обозначаются историческими.

## 19. Commit boundaries

1. `Define MLIR3 follow-up execution contract`
2. `Migrate site body typography to Onest`
3. `Reconcile site icon sources and rendering contracts`
4. `Align Telegram contact action with current library`
5. `Align shared footer with current library`
6. `Restore transparent project preview shadows`
7. `Stabilize project action bar initial and terminal geometry`
8. `Activate the terminal project section from usable geometry`
9. `Make Gallery pagination depend on rendered overflow`
10. `Move Gallery media viewing to the top layer`
11. `Document MLIR3 verification evidence`

Commit 3 включает durable contract в `DESIGN_SYSTEM.md` и только короткое enforcement-правило в `AGENTS.md`. Commit 10 включает отключение lightbox верхнего preview, но `MLIR3-LBX` и `MLIR3-PRV` имеют отдельные acceptance results.

## 20. Финализация

1. Завершить runtime code.
2. Выполнить focused tests.
3. Выполнить финальные `npm run lint` и `npm run build`.
4. Только после успешных проверок зафиксировать `CODE_SHA`.
5. Собрать production preview из `CODE_SHA` с полным `NEXT_PUBLIC_BUILD_SHA`.
6. Подтвердить полный SHA в отданном HTML.
7. Выполнить browser matrix и собрать fresh evidence.
8. Обновить `HANDOFF.md`, `DESIGN_QA.md`, этот пакет и evidence index.
9. Создать documentation/evidence commit `DOC_SHA`, не меняющий runtime.
10. Не повторять lint/build после чисто документационного commit без причины.
11. После любого изменения runtime получить новый CODE_SHA и повторить затронутые проверки/evidence.
12. Push финального HEAD.
13. Создать один stacked Draft PR с базой `codex/main-layout-interaction-reconciliation`.
14. Подтвердить local HEAD, remote SHA, PR head SHA и связь DOC_SHA с runtime CODE_SHA.
15. Передать три cache-marker URL с `review=<short-code-sha>`.
16. Перевести Work Packet в `READY_FOR_USER_REVIEW`, а `DESIGN_QA.md` — в `READY_FOR_REVIEW`.

Merge и deploy не выполнять.

## 21. Rollback и stop-lines

- Работа только в follow-up ветке.
- Один commit — один объяснимый результат.
- Reset и переписывание истории запрещены.
- Отмена — отдельным revert после явного решения.
- Регрессия общего компонента возвращает затронутые блоки в `OPEN`.

Остановить только затронутый этап при недоступном обязательном Figma source, неоднозначной Git-базе, destructive operation, новой зависимости без безопасной альтернативы, недоступном Zen для обязательной matrix либо необходимости merge/deploy/production-доступа.

## 22. SELF_REVIEW_1: PASS

Повторный полный проход выявил и устранил: риск blank-frame вместо variant flash; неоднозначную terminal region; сохранение Source Code Pro из старых styles; неправильный durable layer icon contract; переоценку XML-check; отсутствие обязательной двухбраузерной foundation-проверки; смешение Work Packet и DESIGN_QA статусов; неправильное положение lint/build относительно CODE_SHA; неподтверждённый Footer literal.

## 23. SELF_REVIEW_2: PASS

Независимый повторный проход подтвердил: pre-paint contract покрывает direct URL, hard reload и client navigation; verification различает wrong variant, blank-frame и layout shift; terminal region всегда равна `48 px + barHeight`; typography mapping семантический; icon rules/evidence находятся в правильных слоях; Chromium не заменяет Zen; верхний preview имеет полный non-interactive contract; Footer требует read-only source evidence; CODE_SHA фиксируется после tests/lint/build; DOC_SHA не выдаётся за runtime SHA; runtime-изменения инвалидируют затронутый evidence; статусы отображаются однозначно; merge и deploy запрещены.

План утверждён пользователем и готов к выполнению без дополнительного подтверждения.
