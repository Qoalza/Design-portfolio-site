# Work Packet: Main Layout & Interaction Reconciliation v2

**Архивный статус:** `SUPERSEDED` последующим MLIR3 follow-up.

## 1. Результат текущей документационной задачи

Этот документ создан как утверждённый план будущей Goal. Само создание документа не запускает реализацию.

### Классификация создания `WORK_PACKET.md`

- Size: `MEDIUM`
- Risk: `LOW`
- Mode: `OPTIMIZED`
- Причина: создаётся один планировочный документ без реализации.
- Git-группа: только новый `WORK_PACKET.md`.

Не входят:

- код;
- остальные проектные документы;
- Figma;
- evidence;
- commit;
- push;
- PR;
- merge;
- deploy.

Для этой документационной задачи допускаются только:

1. создание `WORK_PACKET.md`;
2. последовательная проверка его разделов;
3. подтверждение, что никакие другие файлы не изменились.

Commit автоматически не создаётся.

## 2. Классификация будущей Goal

Эта классификация относится к последующей реализации и не смешивается с текущей документационной задачей.

- Size: `LARGE`
- Risk: `ELEVATED`
- Mode: `FULL`
- Причина: несколько маршрутов, переиспользуемые UI-компоненты, крупные Resume и Corvo-layout, новая трёхчастная Gallery и две связанные scroll/layout state machines.
- Статус: реализация запрещена до отдельного подтверждения пользователем этого `WORK_PACKET.md`.
- Figma: строго `read-only`.

## 3. Граница будущего workstream

В одну будущую Goal входят:

- build provenance для review preview;
- `SquareButton` и закрытая миграция его потребителей;
- `GeneralHeader` и `PageHeader`;
- общий metadata/action cluster карточки проекта;
- Resume и AI на главной;
- три актуальные иллюстрации секции главной «Начинаю не с макетов»;
- layout `/projects`;
- актуальный информационный layout Corvo с ограниченными контентными блоками, разделителями и универсальной оболочкой `ProjectCanvas`;
- новая Gallery Corvo с независимыми Desktop/Tablet/Mobile-каруселями, дискретной пагинацией и существующим lightbox;
- action bar открытого проекта;
- section navigation;
- focused Node tests;
- ручная browser matrix;
- новый evidence;
- обновление `HANDOFF.md` и соответствующей агрегатной записи `DESIGN_QA.md`;
- push Goal-ветки;
- создание либо обновление одного Draft PR.

Не входят:

- запись в Figma;
- визуальная переработка 404/500;
- global smooth scroll;
- mobile/tablet adaptation;
- реальная интерактивность, React-прототипы или `iframe` внутри `ProjectCanvas` на текущем этапе;
- несвязанный рефакторинг;
- новые browser-зависимости без отдельного approval;
- `codex-context-transfer-2026-08-15/` и `codex-context-transfer-2026-08-15.zip`;
- merge;
- deploy.

Merge и deploy требуют отдельных явных разрешений.

## 4. QA namespace и evidence

Использовать уникальный namespace `MLIR2-*`.

| ID | Дефект или блок | Основные Figma nodes | Code owner | Evidence |
|---|---|---|---|---|
| `MLIR2-INV` | Inventory и baseline | все актуальные узлы пакета | route/component inventory | `inventory.json` |
| `MLIR2-PROV` | Build provenance | не визуальный блок | root layout/build environment | `provenance/` |
| `MLIR2-SQB` | Square Button | `73:5324` | `ui-controls` и закрытый inventory | `square-button/` |
| `MLIR2-HDR` | General/Page Header | `591:33348`, `103:436`, `517:33813`, `505:23035` | `site-header` | `headers/` |
| `MLIR2-META` | Project metadata/action cluster | `510:28180`, `517:34103` | `MainProjectCard` | `project-actions/` |
| `MLIR2-RSM` | Resume | `510:28260`, `517:33604`, `510:28277` | homepage Resume | `resume/` |
| `MLIR2-AI` | AI-блок | `510:28231`, `510:28254` | homepage AI | `ai/` |
| `MLIR2-PROC` | Иллюстрации «Начинаю не с макетов» | точные актуальные child nodes фиксируются в `MLIR2-INV` | homepage process и `public/assets/homepage/process-*.png` | `process/` |
| `MLIR2-PRJ` | `/projects` layout | `373:50236`, `517:33813`, `526:36476` | projects route/layout | `projects/` |
| `MLIR2-CNT` | Corvo information layout и `ProjectCanvas` | `373:47103`, `544:2526`, `526:35796`, `526:36485`, `651:22762`, `656:146519`, `674:36727` | open-project route, `ProjectContent`, `ProjectCanvas` | `corvo-content/` |
| `MLIR2-GAL` | Corvo Gallery | `677:44301`, `679:47848`, `677:47843`, `680:48082`, `680:48107` | Gallery chapter, `ProjectGallery`, `ProjectMediaLightbox` | `corvo-gallery/` |
| `MLIR2-ABA` | Action bar | `576:33195`, `528:1540`, `553:3036`, `553:3314`, `688:52700` | `project-action-bar` | `action-bar/` |
| `MLIR2-NAV` | Section navigation | `373:47103`, `553:3314`, `526:35799`, `526:35796` | `project-section-navigation` | `navigation/` |
| `MLIR2-FIN` | Финальная регрессия | все затронутые nodes | общий workstream | `final/` |

Новый evidence-каталог:

`design-reference/main-layout-interaction-reconciliation/`

Каталог `design-reference/main-chapter-reconciliation-v2/` остаётся неизменяемым историческим evidence предыдущего состояния Figma. Он не подтверждает соответствие новым instances.

### Статусы пакета

`OPEN → IMPLEMENTED → VERIFIED → READY_FOR_USER_REVIEW → USER_ACCEPTED`

### Lifecycle агрегатной записи `DESIGN_QA.md`

Используется одна активная агрегатная запись без создания конкурирующей записи:

1. При старте утверждённой Goal существующая агрегатная запись по этим блокам переводится обратно в `OPEN`.
2. Вместе со статусом обновляется тело записи.
3. Старые утверждения `VERIFIED` и `READY_FOR_REVIEW` помечаются как относящиеся исключительно к предыдущему состоянию Figma.
4. Ссылка на `main-chapter-reconciliation-v2` сохраняется только как исторический evidence.
5. Активная часть записи содержит:
   - namespace `MLIR2-*`;
   - актуальный перечень дефектов;
   - новый evidence path;
   - текущий статус выполнения.
6. Под заголовком `OPEN` запрещено оставлять активный текст, утверждающий, что те же блоки уже проверены или готовы.
7. После фактического начала реализации статус меняется на `IN_PROGRESS`.
8. `READY_FOR_REVIEW` разрешён только после обязательного evidence для всех критичных `MLIR2-*`.
9. `CLOSED` разрешён только после явной пользовательской приёмки.
10. Отдельная действующая запись с противоречащим статусом не создаётся.

Соответствие внутренних статусов:

- `OPEN` → `DESIGN_QA: OPEN`;
- `IMPLEMENTED` и выполняемая проверка → `IN_PROGRESS`;
- все критичные блоки `VERIFIED` или выше → `READY_FOR_REVIEW`;
- `USER_ACCEPTED` → `CLOSED`.

Отсутствие доказательства оставляет блок `OPEN`.

Подтверждённый runtime-дефект от `2026-08-24`: в актуальном preview у иллюстраций секции «Начинаю не с макетов» визуально присутствует непрозрачная прямоугольная фоновая заливка. До повторной проверки всех трёх фактически загруженных ресурсов `MLIR2-PROC` остаётся `OPEN`, даже если прежний asset-check или commit был отмечен завершённым.

Подтверждённый runtime-дефект от `2026-08-24` на `/projects`: текстовая часть большой Corvo-карточки ведёт себя как фиксированная/растянутая по высоте, из-за чего визуальный интервал перед строкой устройств отличается от малых карточек. До проверки intrinsic-height и общего вертикального выравнивания карточек `MLIR2-PRJ` остаётся `OPEN`.

Подтверждённый runtime-дефект от `2026-08-24` в action bar: при открытии проекта на высоком viewport, где фактическая геометрия сразу требует `ADAPTIVE`, пользователь успевает увидеть мгновенное переключение `FULL → ADAPTIVE`. До проверки первого пользовательски видимого кадра без provisional-variant flash `MLIR2-ABA` остаётся `OPEN`.

Подтверждённый runtime-дефект от `2026-08-24` в Gallery: device-иконки в заголовках Tablet и Mobile визуально не соответствуют актуальному Figma/component source. До проверки точных icon frames во всех состояниях `MLIR2-GAL` остаётся `OPEN`.

## 5. Dependencies

Строгая последовательность:

1. `MLIR2-INV` предшествует всем изменениям.
2. `MLIR2-PROV` создаётся до первого runtime screenshot.
3. Все screenshots снимаются только из `CODE_SHA`, содержащего provenance-инструментацию.
4. `MLIR2-SQB` завершается до проверки controls в metadata, headers и navigation.
5. `MLIR2-HDR` завершается до финальной проверки action bar и sticky navigation.
6. `MLIR2-META` реализуется и проверяется одним срезом на главной и `/projects`.
7. `MLIR2-PRJ` начинается после проверки общего metadata/action contract.
8. `MLIR2-CNT` начинается после досконального read-only inventory актуального Corvo-layout, всех ограниченных контейнеров, разделителей и четырёх внутренних image-assets.
9. `MLIR2-GAL` начинается после `MLIR2-CNT`, `MLIR2-SQB` и визуального сопоставления всех gallery originals с точными Figma image nodes независимо от имён файлов.
10. `MLIR2-ABA` начинается после `MLIR2-CNT` и `MLIR2-GAL`, чтобы измеряться на окончательной высоте и фактических границах information/Gallery/footer.
11. `MLIR2-NAV` начинается после `MLIR2-CNT`; Gallery не входит в navigable sections.
12. `MLIR2-ABA` и `MLIR2-NAV` имеют отдельные commits и acceptance gates.
13. `MLIR2-PROC` начинается только после фиксации точных актуальных child nodes трёх иллюстраций и исходных asset hashes в `MLIR2-INV`; runtime evidence требует `MLIR2-PROV`.
14. `MLIR2-FIN` начинается после `VERIFIED` всех критичных блоков.

Этапы, изменяющие общие файлы, не объявляются параллельными. Resume, AI и process-иллюстрации независимы и получают отдельные commits и gates. `MLIR2-CNT → MLIR2-GAL → MLIR2-ABA` выполняются последовательно.

## 6. Build provenance

Используется одна модель: встроенная provenance-инструментация.

### Runtime-контракт

При обычной разработке без review/evidence:

- `NEXT_PUBLIC_BUILD_SHA` не требуется;
- `data-build-sha` отсутствует в отданном HTML.

Для production preview, используемого в review/evidence:

- полный `NEXT_PUBLIC_BUILD_SHA` обязателен;
- значение должно точно совпадать с ожидаемым полным `CODE_SHA`;
- сокращённое, пустое, отсутствующее или несовпадающее значение означает `FAIL`.

При provenance `FAIL`:

- preview не считается подтверждённым;
- `MLIR2-PROV` остаётся `OPEN`;
- browser matrix не начинается;
- screenshots и browser evidence не создаются;
- `READY_FOR_USER_REVIEW` недоступен.

Перед началом browser matrix фактически отданный HTML должен содержать точный полный SHA.

### Реализация provenance

- Поддержка добавляется ранним отдельным code commit.
- Полный SHA выводится как `data-build-sha` на корневом HTML-элементе только при заданном `NEXT_PUBLIC_BUILD_SHA`.
- Атрибут не влияет на layout, accessibility, focus order или пользовательский интерфейс.
- Production build запускается с явно переданным полным SHA.
- Preview подтверждается:
  - чтением `data-build-sha` из реально отданного HTML;
  - сверкой с ожидаемым `CODE_SHA`;
  - фиксацией PID, cwd и порта процесса.
- Все runtime screenshots создаются после provenance commit.
- Финальный documentation/evidence commit runtime не меняет.

### Проверки provenance

Happy path:

- задан полный SHA;
- HTML содержит тот же полный SHA;
- preview допускается к browser matrix.

Missing/mismatch paths:

- переменная отсутствует;
- значение пустое;
- значение сокращено;
- значение отличается от ожидаемого SHA.

Каждый отрицательный сценарий должен воспроизводимо подтверждать fail-closed поведение. Для чистой функции допустим focused Node test; фактическое наличие или отсутствие атрибута проверяется по отданному HTML.

Отдельный commit:

`Add verifiable preview build provenance`

## 7. Контракт `SquareButton`

Закрытый inventory ограничивается тремя маршрутами:

- стрелки блока «Начинаю не с макетов»;
- breadcrumb Back;
- gallery arrows;
- другие конкретно перечисленные на этапе `MLIR2-INV` icon-only controls этих маршрутов.

Новый потребитель вне inventory требует approval расширения scope.

### Discriminated union

Button-вариант:

- `kind: "button"`;
- `type`;
- `onClick`;
- `disabled?: boolean`;
- `href`, `target`, `rel` и `external` запрещены типами.

Link-вариант:

- `kind: "link"`;
- `href`;
- `external`;
- `disabled?: boolean`;
- при необходимости `target` и `rel`;
- button-only props запрещены типами.

Button- и link-only props остаются взаимоисключающими на уровне TypeScript.

### DOM-контракт

Enabled button:

- рендерится нативный `<button>`;
- keyboard activation соответствует нативному элементу.

Disabled button:

- рендерится `<button disabled>`;
- не получает click/navigation behavior;
- не участвует в tab order по нативной семантике.

Enabled link:

- рендерится `<a href="…">`;
- внутренний или внешний переход определяется link contract.

Disabled link:

- рендерится `<span role="link" aria-disabled="true">`;
- не имеет `href`;
- не участвует в tab order;
- не запускает navigation;
- не получает click handler, способный инициировать переход.

Общее:

- обязательный `aria-label`;
- используется целый icon Mask/Frame;
- вложенная иконка декоративна;
- есть видимый `focus-visible` для интерактивных вариантов;
- внешний URL требует `external` и безопасный `rel`;
- `ControlButton` сохраняется как compatibility-компонент для текстовых controls;
- пустой label и `:has(.label:empty)` не являются API Square Button.

### Focused checks

Проверить отдельно:

- enabled link;
- disabled link;
- enabled button;
- disabled button;
- TypeScript-ошибку при смешивании button- и link-only props;
- отсутствие navigation у disabled link;
- keyboard activation и focus-visible у enabled-вариантов.

## 8. Open-project content, Gallery и action bar contracts

### Information layout

- Основная информационная сетка Corvo остаётся `200 + 1000 px` внутри desktop-shell.
- `Body` шириной `1120 px` не разрешает растягивать внутренние контентные блоки: их подтверждённая ширина — `1000 px`.
- Горизонтальные разделители в information Body заканчиваются на границе `1000 px`, а не доходят до края `1120/1200 px`.
- Граница в конце информационной части обязательна и визуально продолжается верхней границей `Adaptive` action bar.
- Верхние и нижние paddings, расстояния между заголовком, абзацами, callout/canvas и разделителями для всех пяти information-sections берутся из точных актуальных Figma nodes; browser-default margins и схлопывание margins не заменяют layout spacing.
- Последний видимый элемент каждой information-section не касается нижнего divider. В частности, callout «О проекте» и последний абзац «Результата» сохраняют Figma-отступ до границы, а Gallery начинается с отдельного подтверждённого верхнего spacing после конца information.
- Левая section navigation ограничена information region и завершается до отдельной Gallery.
- Отрицательные margins, псевдо-разделители полной ширины и общий border на всю страницу не заменяют актуальную Figma nesting structure.

### `ProjectCanvas`

Создать одну универсальную оболочку для свободного содержимого:

- внешний контейнер, background, dot pattern, размеры, border radius, clipping и разделители реализуются кодом;
- текущее внутреннее содержимое передаётся как прозрачное raster image;
- API оболочки допускает будущий React-content slot или `iframe`, но реальная интерактивность и сам `iframe` сейчас не реализуются;
- новая зависимость для оболочки не добавляется;
- Figma является визуальным источником dot pattern, а не инструкцией переносить сотни точек отдельными DOM-элементами.

Подтверждённая геометрия текущих instances:

| Instance | Внешняя геометрия | Внутреннее содержимое |
|---|---:|---:|
| Quotes | `1000×450` | одно прозрачное изображение `852×366`, позиция `74×42` |
| Process map | `1000×480` | одно прозрачное изображение `906×390`, позиция `43×45` |
| Buttons / Inputs | `1000×268` | две независимые области `448 + 1 + 551 px`; отдельное прозрачное изображение в каждой области |

Dot pattern реализуется одним оптимизированным CSS background:

- tile `32×32 px`;
- dot `3×3 px`;
- dot color `#E3E6E8`;
- surface `#F5F6F7`;
- допустим `radial-gradient` или эквивалент без отдельных DOM nodes и без raster background request;
- визуальное совпадение шага, фазы и clipping с Figma обязательно.

Четыре внутренних image-assets экспортируются отдельно от серой поверхности, точек, внешнего clipping и центрального разделителя. Имена исходных файлов не используются как доказательство соответствия: mapping подтверждается визуально по Figma node и фиксируется в inventory/evidence. Каждый raster-source экспортируется минимум в `2×` от максимального CSS-размера показа и никогда не растягивается выше intrinsic resolution.

### Gallery

- Gallery является отдельным полноширинным блоком после information region и не добавляется в левую section navigation.
- Используются три независимых carousel state: Desktop, Tablet и Mobile.
- В актуальном Figma inventory по пять изображений в каждой группе.
- Геометрия preview: Desktop `740×512`, Tablet `400×566`, Mobile `180×320`, gap `24 px`; viewport, offsets, section heights и edge fade берутся из точных Figma nodes.
- Клик по стрелке перемещает ровно на один item; зацикливания нет.
- Обе стрелки сохраняют место; недоступное направление использует компонентное состояние `Disabled`, а не исчезает и не заменяется пустым placeholder.
- Horizontal swipe, pointer drag и horizontal trackpad intent разрешены только как дискретный переход на один item с snap к целому index; свободный horizontal scroll запрещён.
- Вертикальный wheel/trackpad/touch scroll страницы не перехватывается. Горизонтальный intent должен быть подтверждён до подавления browser default.
- Edge fade разрешён только справа и отражает наличие следующего item; слева fade не появляется ни на первом, ни на любом последующем item. На последнем item правый fade отсутствует. Fade не блокирует pointer events.
- Для изображений переиспользуется существующий `ProjectMediaLightbox`.
- Lightbox сохраняет aspect ratio, не растягивает изображение сверх его intrinsic dimensions и ограничивает его доступными viewport width/height; Mobile не масштабируется до визуального размера Desktop.
- Gallery originals сопоставляются с Figma визуально, а не по несовпадающим именам файлов.
- Каждый Gallery raster-source имеет intrinsic width/height не меньше максимального rendered CSS size × максимальный проверяемый DPR, но минимум `2×`; upscale низкоразрешённого файла запрещён.
- После полной загрузки текст, тонкие линии и элементы интерфейса остаются резкими: постоянный blur-placeholder, CSS blur, повторное пережатие с заметными артефактами и низкокачественный responsive candidate запрещены.

### Action bar states

Пользовательские состояния:

- `FULL`;
- `ADAPTIVE`.

Первый пользовательски видимый кадр action bar обязан сразу соответствовать фактической геометрии текущего viewport: `FULL`, если полоса не помещается в information, и `ADAPTIVE`, если все `88 px` уже помещаются. Внутреннее pre-measurement state может существовать технически, но provisional variant не должен быть виден пользователю. Видимый `FULL → ADAPTIVE` или `ADAPTIVE → FULL` flash во время обычной первоначальной загрузки запрещён.

Invalid, неполные или нечисловые rect:

- оставляют видимый `FULL`;
- не используют предыдущий `ADAPTIVE` как fallback;
- оставляют `MLIR2-ABA` в `OPEN`;
- не допускают visual PASS.

Обычная первоначальная загрузка с доступными anchors не считается invalid geometry. Реализация должна получить geometry-correct variant до первого отображаемого кадра — через синхронное pre-paint measurement, CSS/layout-механику или другой способ без самостоятельного высотного breakpoint и без видимого скрытия/прыжка плашки.

### Геометрическое правило variant

Используются фактические rect information region, Gallery boundary, footer и action bar высотой `88 px`:

```text
footerOffset = max(0, viewportHeight - footer.top)
barBottom = viewportHeight - footerOffset
barTop = barBottom - 88
visibleInformationInBarBand = max(0, min(information.bottom, barBottom) - max(information.top, barTop))
```

- `FULL` используется, пока в вертикальной полосе будущей плашки видно менее `88 px` information region; на высоком initial viewport, где сразу видны все `88 px`, первый variant уже `ADAPTIVE`.
- `FULL → ADAPTIVE` происходит, когда вся полоса `[barTop, barBottom]` помещается внутри information region; равенство `88 px` относится к `ADAPTIVE`.
- При входе Gallery в полосу плашки применяется явный приоритет `FULL`, поэтому action bar не залипает в завершившемся information region.
- В Gallery action bar остаётся `FULL`.
- Footer collision никогда не скрывает action bar: `footerOffset` поднимает её непосредственно над footer.
- Variant не выбирается по `scrollY`, breakpoint высоты viewport, label раздела или одному `information.top`.
- Координаты нормализуются к physical pixel через DPR; допускается техническая subpixel tolerance не более `1 CSS px` без видимого запаздывания перехода в Gallery.
- Измерения объединяются в один `requestAnimationFrame` и обновляются при scroll, resize, late fonts/images и `ResizeObserver` relevant anchors.
- Observer не изменяет в том же цикле свойства, влияющие на наблюдаемый rect.

### Component-only visual contract

- Высота, fill, stroke, padding и состояния action bar берутся только из component set `Footer action project` (`550:2868`) и актуальных variants `528:1540`, `576:33195`.
- Текущие подтверждённые fill/stroke: `#FCFCFD` и `#E2E5E7`; самостоятельный `#FFF` для `Adaptive` запрещён.
- `Full` и `Adaptive` различаются геометрией и component contract, а не подобранным под соседний фон цветом.

### Pure unit tests

Чистая функция получает `information.top/bottom`, `gallery.top`, `footer.top`, `viewportHeight`, `barHeight` и DPR. Variant всегда выводится из текущей геометрии и не наследуется из предыдущего состояния. Проверить:

- валидная initial geometry с intersection `< 88 px` → первый видимый `FULL`;
- валидная initial geometry с intersection `≥ 88 px` → первый видимый `ADAPTIVE` без промежуточного `FULL`;
- invalid/non-finite measurement → видимый `FULL` и invalid result;
- information intersection `87`, `88`, `89 px`;
- равенство `88 px` → `ADAPTIVE`;
- короткий viewport, где information ещё не достиг полосы плашки → `FULL`;
- `FULL → ADAPTIVE` при полном размещении `88 px`;
- немедленный `ADAPTIVE → FULL` при входе Gallery в bar band;
- Gallery → `FULL` независимо от предыдущего variant;
- footer offset поднимает action bar без изменения корректного region variant;
- physical-pixel normalization и subpixel boundary.

### Browser checks

- geometry-correct variant в первом пользовательски видимом кадре без provisional-state flash;
- initial `FULL` при открытии в viewport, где information занимает менее `88 px` полосы, без ошибочного `ADAPTIVE` flash;
- initial `ADAPTIVE` при открытии на высоком viewport, где information сразу занимает все `88 px` полосы, без видимого `FULL → ADAPTIVE` переключения;
- `FULL` при частично видимой information region меньше `88 px`;
- `ADAPTIVE` при полностью доступных `88 px` внутри information region;
- немедленный `FULL` при начале Gallery;
- `FULL` во всех трёх Gallery rows;
- action bar остаётся непосредственно над footer и не исчезает;
- точные Full/Adaptive left/width из фактических columns;
- component-only colors и borders;
- late fonts/images и изменение высот canvas/gallery;
- отсутствие ResizeObserver loop, horizontal overflow, дополнительного scroll range, console и hydration warnings.

Обязательные Figma viewport references: `553:3036` (`1440×999`, initial Full), `553:3314` (`1440×1356`, information Adaptive), `688:52700` (`1440×1356`, Gallery Full/footer collision).

### Измеримые условия

- Смена variant не увеличивает `document.documentElement.scrollHeight` более чем на `1 CSS px`.
- Action bar не резервирует повторные `88 px` и не создаёт дополнительный scroll range.
- Gallery и `ProjectCanvas` late layout changes вызывают повторное корректное измерение.
- Ни в одном кадре плашка не перекрывает footer и не остаётся `Adaptive` после окончания information region.

## 9. Section navigation state machine

### Состояния

- `SCROLL_TRACKING`;
- `PROGRAMMATIC_SCROLL(targetIndex)`.

### Поведение

- Повторный клик немедленно заменяет предыдущий target.
- Wheel, touchstart и scroll-клавиши немедленно отменяют programmatic state.
- Новое навигационное действие отменяет или заменяет target без ожидания watchdog.
- При отмене выполняется один итоговый геометрический пересчёт.
- Cleanup выполняется при unmount и route navigation.
- `prefers-reduced-motion` использует мгновенный переход.
- Direct hash, reload и Back/Forward восстанавливают правильный active section.
- Изменение массива sections нормализует active/target index.
- Название последнего раздела нигде не участвует в условии.
- Navigable inventory содержит только «О проекте», «Задача», «Процесс», «Система», «Результат».
- Gallery является отдельным блоком, не получает navigation item, hash target или programmatic target.
- Sticky navigation ограничена information region и заканчивается до Gallery.

### Успешное завершение

Переход успешно завершается при одном из условий:

- target достиг activation line с допустимой геометрической погрешностью;
- достигнута подтверждённая геометрическая граница information region, после которой target более точно недостижим;
- позиция устойчиво остановилась после подтверждённого продвижения и target более точно недостижим внутри information region.

Document bottom больше не является special-case для последнего navigable section: после «Результата» существует отдельная Gallery. Generic last-index не должен прокручивать пользователя к концу Gallery или footer.

### Watchdog и абсолютный предел

- `2000 ms` — watchdog отсутствия прогресса.
- Watchdog сбрасывается при каждом подтверждённом продвижении к target.
- Он не ограничивает общую длительность корректного перехода.
- Абсолютный аварийный предел фиксируется как `30000 ms` с момента запуска текущего target.
- Значение не выбирается заново во время реализации.
- Повторный клик запускает новый target и новый абсолютный период.
- Пользовательское вмешательство отменяет target немедленно.

`30000 ms` существенно больше watchdog и предназначен только для защиты от бесконечного минимального прогресса или browser anomaly.

При любом аварийном завершении:

1. programmatic state прекращается;
2. состояние возвращается в `SCROLL_TRACKING`;
3. выполняется ровно один итоговый геометрический пересчёт.

### Acceptance navigation

Проверить:

- нормальный переход первый → последний при `1280×720`;
- переход завершается раньше абсолютного предела;
- watchdog не срабатывает, пока есть реальный прогресс;
- отсутствие прогресса в течение `2000 ms`;
- бесконечный минимальный прогресс ограничивается абсолютными `30000 ms`;
- повторный клик немедленно заменяет target;
- wheel/touch/keyboard немедленно отменяют target;
- intermediate sections не становятся активными;
- клик «Результат» завершается у «Результата», а не у document bottom;
- вход в Gallery не создаёт шестой active item и не удерживает sticky navigation за information boundary.

## 10. Browser/viewport matrix

Для Corvo content/Gallery, action bar и navigation обязательны:

| Browser | 1280×720 | 1440×900 | 1440×999 | 1440×1200 | 1440×1356 | 1920×1080 |
|---|---:|---:|---:|---:|---:|---:|
| Chromium | Полная | Полная | Полная | Полная | Полная | Полная |
| Zen 1.21.15b (build 126.8.18) | Полная | Полная | Полная | Полная | Полная | Полная |

Точный Gecko-браузер для обязательной matrix: Zen `1.21.15b` (build `126.8.18`). Эти значения записываются в machine-readable результат.

Назначение viewport:

- `1440×900` — exact visual comparison;
- `1440×999` — точное initial Full reference `553:3036`;
- `1440×1200` — tall initial-state acceptance;
- `1440×1356` — точные information Adaptive и Gallery/footer states `553:3314`, `688:52700`;
- `1280×720` — короткий viewport и самый длинный navigation transition;
- `1920×1080` — wide viewport integrity.

Каждый результат содержит:

- route;
- browser и точную версию;
- viewport;
- `CODE_SHA`;
- Figma node;
- Figma screenshot;
- implementation screenshot;
- measurements;
- console result;
- `PASS` или `FAIL`.

### Gecko stop-line

Отсутствие Mozilla Firefox не блокирует readiness или начало Goal. Обязательная Gecko-проверка выполняется в подтверждённом Zen `1.21.15b` (build `126.8.18`). Если именно эта версия Zen недоступна:

- `MLIR2-CNT` и `MLIR2-GAL` не получают финальный cross-browser `VERIFIED`;
- `MLIR2-ABA` не получает `VERIFIED`;
- `MLIR2-NAV` не получает `VERIFIED`;
- общий пакет не получает `READY_FOR_USER_REVIEW`;
- Chromium не заменяет обязательную Gecko-проверку.

Замена зафиксированной версии Zen другим Gecko-браузером или другой версией требует явного изменения `WORK_PACKET.md`. Это изменение не расширяет implementation scope и не требует записи в Figma.

## 11. Browser integration и существующие проверки

Browser test runner в проекте отсутствует.

По умолчанию:

- pure Node unit tests выполняются автоматически;
- browser checks выполняются вручную по воспроизводимому сценарию;
- результаты сохраняются в machine-readable JSON;
- screenshots и console evidence прикладываются отдельно.

Добавление Playwright, Cypress или другой зависимости требует отдельного approval gate.

Существующие команды:

```text
node --test tests/main-chapter-interactions.test.mjs
node --test tests/navigation-trail.test.mjs
npm run lint
npm run build
```

Node unit tests не используются как доказательство browser behavior или visual PASS.

## 12. Acceptance criteria

Для каждого `MLIR2-*` блока фиксируются:

- route;
- browser/version;
- viewport;
- Figma file/node;
- Figma screenshot;
- implementation screenshot;
- overlay/diff или прямое сравнение;
- geometry;
- spacing;
- typography;
- colors;
- borders;
- visibility;
- component states;
- behavioral result;
- console result;
- проверенный `CODE_SHA`.

Допуски:

- geometry и spacing: не более `1 CSS px` из-за device-pixel rounding;
- typography, цвета, border width и component states совпадают без намеренных отклонений;
- rasterization/antialiasing допускается только как однопиксельная краевая разница без устойчивого смещения формы или цвета;
- любое необъяснённое отличие записывается и оставляет блок `OPEN`;
- отсутствие обязательного evidence оставляет блок `OPEN`.

Для всех raster-assets, добавленных или заменённых в этой Goal, дополнительно обязательны:

- intrinsic dimensions покрывают максимальный фактический размер показа на обязательной browser matrix с учётом DPR, но не менее `2×` от CSS width/height;
- браузер не выбирает responsive candidate ниже требуемой physical resolution и не увеличивает изображение выше intrinsic size;
- Figma export, локальный source и фактически загруженный browser resource сопоставлены по dimensions и content;
- после завершения загрузки отсутствуют blur/filter, заметное lossy-compression размытие и оставшийся low-quality placeholder;
- резкость проверяется на мелком тексте, тонких линиях и иконках при DPR `1` и `2`; скриншот всей страницы в уменьшенном масштабе не является достаточным доказательством;
- мыльный asset, upscale или неизвестный фактически загруженный candidate оставляет соответствующий `MLIR2-PROC`, `MLIR2-CNT` или `MLIR2-GAL` в `OPEN`.

Для `MLIR2-PROC` дополнительно обязательны:

- все три файла `process-discovery.png`, `process-prototype.png` и `process-delivery.png` заменены экспортами из точных актуальных Figma nodes, а не обработанными версиями прежних PNG;
- содержание, версия иллюстрации, кадрирование и пропорции каждого asset совпадают с Figma;
- прозрачные области Figma сохранены как реальная прозрачность PNG: `alphaMin = 0`, а визуальная проверка на контрастной подложке не выявляет прямоугольного фона;
- CSS-маски, chroma key, фильтры и подкрашивание контейнера не используются для сокрытия фоновой заливки;
- на фактическом runtime page ни у одной из трёх иллюстраций не видна прямоугольная граница собственного фона относительно фона секции; проверяется именно загруженный браузером resource, а не только локальный файл;
- для каждого asset в evidence зафиксированы Figma file/node, исходный baseline hash, итоговый SHA-256, pixel dimensions и результат alpha-проверки;
- старый asset, непрозрачный прямоугольный фон, незафиксированный источник или несовпадение содержания оставляют `MLIR2-PROC` в `OPEN`.

Для `MLIR2-PRJ` дополнительно обязательны:

- текстовая content-group каждой project card имеет intrinsic/Hug height по фактическому содержимому; фиксированная высота, растягивание строки grid/flex или искусственное заполнение свободного места запрещены;
- изменение длины «Что делал» изменяет высоту content-group, после чего вся группа заново центрируется по вертикали относительно соответствующей карточки/preview;
- строка Desktop/Tablet/Mobile расположена ровно через `32 px` после фактической нижней границы текста «Что делал» во всех вариантах карточек;
- большая Corvo-карточка и малые карточки используют один spacing-contract `32 px`, даже если их текст имеет разное число строк;
- проверяются минимум большая Corvo-карточка и одна малая карточка с другой длиной текста; визуально похожий отступ, полученный за счёт фиксированной высоты текста, не принимается.

Для `MLIR2-META` дополнительно обязательно:

- если переход к подробному описанию проекта недоступен, CTA сохраняет disabled-state, не получает navigation/click behavior и показывает видимый текст `Скоро` вместо `Подробнее`;
- доступный CTA продолжает показывать `Подробнее`; текст `Скоро` не применяется к доступным проектам;
- правило является общим контрактом project cards на главной и `/projects`, а не точечным условием для одного проекта;
- disabled-семантика, tab order, визуальное состояние и отсутствие перехода проверяются отдельно от текста.

Для `MLIR2-CNT` дополнительно обязательны:

- до реализации выполнен полный read-only inventory актуального Corvo-layout: information grid, ограниченные разделители, нижняя граница information и каждый ограниченный canvas;
- внешние оболочки canvas реализованы кодом и получают размеры, clipping, surface и фон из актуальной Figma; серый frame целиком не экспортируется;
- точечный фон реализован одним оптимизированным CSS-pattern, визуально совпадающим с Figma; отдельные DOM-элементы, component instances и raster-фон для точек запрещены;
- оболочка принимает независимое внутреннее содержимое и не связывает layout с конкретной картинкой; iframe и интерактивные прототипы в эту Goal не входят;
- Quotes, Process, Buttons и Inputs экспортированы как четыре отдельные прозрачные картинки; Buttons и Inputs остаются двумя независимыми областями `448 | 1 | 551`;
- размеры, ограничения ширины, clipping, разделитель Buttons/Inputs и укороченные content dividers совпадают с зафиксированными nodes;
- вертикальный ритм всех пяти information-sections, включая верхние/нижние paddings, paragraph gaps, callout/canvas gaps и переход `Результат → Gallery`, совпадает с Figma без margin collapse;
- устаревший asset, экспорт всей внешней оболочки или отсутствие реальной прозрачности оставляют `MLIR2-CNT` в `OPEN`.
- любой внутренний asset, который браузер показывает размытым либо растягивает выше intrinsic resolution, оставляет `MLIR2-CNT` в `OPEN`.

Для `MLIR2-GAL` дополнительно обязательны:

- Gallery является отдельным блоком после information и не входит шестым пунктом в левую navigation;
- Desktop, Tablet и Mobile имеют независимые позиции и по пять визуально сопоставленных с Figma originals;
- device-иконки Desktop, Tablet и Mobile берутся целиком из точного актуального Figma/component source; Tablet и Mobile не заменяются CSS-примитивами, приблизительными glyph, внутренним fragment вместо полного icon frame или самостоятельно нарисованным вариантом;
- размер frame, stroke, внутренние детали, alignment и расстояние до label совпадают с Figma; иконки не деформируются, не обрезаются и не меняются при переключении carousel item;
- стрелки всегда занимают предусмотренное место и на границах переходят в состояние `Disabled`, а не скрываются и не заменяются пустым placeholder;
- после любого переключения слева отсутствует fade; разрешён только правый fade при наличии следующего item, а на последнем item fade отсутствует;
- любой click, swipe, drag или горизонтальный trackpad input перемещает ровно на один элемент с обязательным snap; свободный горизонтальный scroll и перехват вертикального scroll запрещены;
- существующий lightbox переиспользован: изображение увеличивается с сохранением aspect ratio и intrinsic-size, ограничивается viewport, но mobile-preview не растягивается до условного полного экрана;
- все три группы, граничные states, ввод и lightbox проверены в Chromium и Zen `1.21.15b` (build `126.8.18`) на обязательной matrix.
- все 15 preview и их lightbox-state проверены на резкость фактически загруженного resource при DPR `1` и `2`; низкоразрешённый source/candidate оставляет `MLIR2-GAL` в `OPEN`.

Для `MLIR2-ABA` дополнительно обязательны:

- плашка в первом пользовательски видимом кадре сразу имеет geometry-correct `FULL` или `ADAPTIVE`; provisional-state flash запрещён, а при действительно невалидной геометрии fallback остаётся `FULL`;
- `ADAPTIVE` включается только когда вся фактическая полоса плашки высотой `88 px` помещается между реальными границами information;
- при входе Gallery в полосу плашка немедленно становится `FULL`, не залипая в завершившемся information;
- footer поднимает плашку над собой; плашка не перекрывает footer и не исчезает;
- цвет, border и состояния берутся только из Figma component set, без самостоятельных локальных цветов;
- решение не зависит от magic `scrollY`, высотного breakpoint, текста label или номера последнего раздела.

Регрессионно сохранить:

- title: `Artur Product`;
- Telegram: `https://t.me/Coco_soul`;
- CV: `https://disk.yandex.ru/i/iZ1UWgbO1LAOPw`;
- Corvo Figma URL: `https://www.figma.com/design/5vYeOVxLE28VNXEMOnopno/Corvo---Readme?node-id=0-1&t=aF2DFRqTKZaBO9Ig-1`.

## 13. Этапы будущей Goal

### Этап 1 — `MLIR2-INV`: inventory и baseline

- Scope: Git preflight, `BASE_SHA`, закрытый inventory потребителей, актуальные Figma nodes, code owners и исходный preview.
- Non-scope: любые изменения runtime, Figma и прежнего evidence.
- Dependency: нет.
- Acceptance: каждый затронутый блок сопоставлен с route, Figma node, code owner и runtime selector; неоднозначных tracked changes нет.
- Verification: read-only Git/code/Figma inspection и baseline screenshots из подтверждённого исходного SHA.
- Stop-line: неоднозначная Git-база или недоступный обязательный node оставляет зависимый блок `OPEN`.
- Output: `inventory.json`, зафиксированный `BASE_SHA`, закрытый список потребителей.

### Этап 2 — `MLIR2-PROV`: build provenance

- Scope: `NEXT_PUBLIC_BUILD_SHA`, условный `data-build-sha`, focused checks happy/missing/mismatch paths.
- Non-scope: визуальные изменения и browser runner.
- Dependency: `MLIR2-INV`.
- Acceptance: review preview fail-closed; обычный dev HTML не содержит атрибут; review HTML содержит точный полный `CODE_SHA`.
- Verification: focused Node checks и проверка фактически отданного HTML, PID, cwd и порта.
- Stop-line: без полного совпадающего SHA browser evidence не создаётся.
- Output: provenance code commit и `provenance/` evidence.

### Этап 3 — `MLIR2-SQB`: Square Button

- Scope: отдельный `SquareButton` и миграция только закрытого inventory трёх маршрутов.
- Non-scope: текстовые controls и новые потребители вне inventory.
- Dependency: `MLIR2-INV`, `MLIR2-PROV` для evidence.
- Acceptance: варианты и состояния совпадают с `73:5324`; enabled/disabled button/link соблюдают TypeScript и DOM-контракты.
- Verification: focused type/behavior checks, реальные controls на страницах и visual comparison.
- Stop-line: расширение inventory или новая зависимость требует approval; icon frame нельзя заменять внутренним vector.
- Output: отдельный component/migration commit и `square-button/` evidence.

### Этап 4 — `MLIR2-HDR`: GeneralHeader и PageHeader

- Scope: GeneralHeader по `591:33348`, PageHeader по `103:436`, instances `517:33813` и `505:23035`.
- Non-scope: 404/500, breadcrumb history и несвязанные header variants.
- Dependency: `MLIR2-INV`, `MLIR2-SQB` для square controls.
- Acceptance: оба header-контракта не смешаны; geometry, spacing, devices/tags и states совпадают с Figma.
- Verification: exact comparison `1440×900`, layout checks `1280×720` и `1920×1080`, реальные fixed states.
- Stop-line: неоднозначный component mapping оставляет блок `OPEN`; GeneralHeader и PageHeader нельзя принудительно объединять.
- Output: отдельный header commit и `headers/` evidence.

### Этап 5 — `MLIR2-META`: общий project metadata/action cluster

- Scope: единый structural contract `MainProjectCard`, включая actions, separator и Update info на главной и `/projects`.
- Non-scope: Resume, AI и layout остальных частей каталога.
- Dependency: `MLIR2-SQB`, актуальные nodes `510:28180` и `517:34103`.
- Acceptance: общий компонент и оба потребителя проверены в одном срезе; недоступный description CTA остаётся disabled и показывает `Скоро`, доступный показывает `Подробнее`; промежуточный commit с непроверенным потребителем запрещён.
- Verification: отдельные visual comparisons главной и `/projects`, CTA/Figma/disabled behavior, тексты `Скоро`/`Подробнее` и project metadata.
- Stop-line: нельзя коммитить общий contract до проверки обоих маршрутов.
- Output: один общий metadata/action commit и `project-actions/` evidence.

### Этап 6 — `MLIR2-RSM`: Resume

- Scope: полная композиция Resume по `510:28260`, `517:33604`, `510:28277`.
- Non-scope: глобальная typography-ревизия и независимые блоки главной.
- Dependency: `MLIR2-INV`; `MLIR2-SQB` только при наличии SquareButton в закрытом inventory Resume.
- Acceptance: geometry, spacing, typography, dividers, icons и experience composition совпадают без намеренных отклонений.
- Verification: exact comparison `1440×900`, полный ритм `1440×1200`, integrity `1280×720` и `1920×1080`, проверка ссылок.
- Stop-line: локальные margin overrides не заменяют воспроизведение структуры Figma.
- Output: отдельный Resume commit и `resume/` evidence.

### Этап 7 — `MLIR2-AI`: AI-блок

- Scope: актуальный AI-layout по `510:28231` и `510:28254`, включая новую нижнюю панель.
- Non-scope: сохранение удалённой старой структуры ради DOM-совместимости.
- Dependency: `MLIR2-INV`.
- Acceptance: старый заголовок отсутствует; geometry, spacing, dividers, typography и alignment совпадают с Figma.
- Verification: exact comparison `1440×900`, integrity `1280×720` и `1920×1080`, console check.
- Stop-line: старый layout нельзя сохранять при конфликте с актуальным Figma instance.
- Output: отдельный AI commit и `ai/` evidence.

### Этап 8 — `MLIR2-PROC`: иллюстрации «Начинаю не с макетов»

- Scope: только три process-иллюстрации главной — «Аналитика», «Проектирование» и «Финал» — и их файлы `public/assets/homepage/process-discovery.png`, `process-prototype.png`, `process-delivery.png`.
- Non-scope: изменение текстов, самостоятельная переработка композиции секции, CSS-маскировка фона и любые другие иллюстрации сайта.
- Dependency: `MLIR2-INV` с точными актуальными child node IDs и baseline hashes; `MLIR2-PROV` для runtime evidence.
- Acceptance: все три старых PNG заменены актуальными экспортами из зафиксированных Figma nodes; содержание, кадрирование и пропорции совпадают; прозрачные области имеют реальный alpha-канал и не образуют прямоугольный фон.
- Verification: read-only сравнение каждого asset с его Figma node; фиксация SHA-256, pixel dimensions и alpha statistics; просмотр на контрастной проверочной подложке; runtime comparison всей секции на штатном фоне при `1440×900`, integrity при `1280×720` и `1920×1080`.
- Stop-line: неизвестный или недоступный source node, повторное использование старого asset, отсутствие реальной прозрачности либо несовпадение содержания оставляет `MLIR2-PROC` в `OPEN`; удалять фон из старого PNG программно запрещено.
- Output: отдельный asset replacement commit `Refresh homepage process illustrations from current Figma` и `process/` evidence.

### Этап 9 — `MLIR2-PRJ`: layout `/projects`

- Scope: PageHeader, section boundaries, cards layout, «Что делал», footer junction и интеграция общего metadata/action cluster.
- Non-scope: принудительная единая абстракция разных project cards и изменения project data без подтверждённого расхождения.
- Dependency: `MLIR2-HDR`, `MLIR2-META`.
- Acceptance: layout `373:50236`, `517:33813` и `526:36476` совпадает с Figma; карточки сохраняют собственные contracts; текстовые groups имеют intrinsic/Hug height, вертикально центрируются относительно карточки/preview и сохраняют точные `32 px` до строки устройств; overflow и asset shift отсутствуют.
- Verification: exact comparison `1440×900`, integrity `1280×720` и `1920×1080`, сравнение большой Corvo и малой карточки с разной длиной текста, CTA/disabled/platform checks.
- Stop-line: fixed/stretch text height, неверный интервал перед devices, отрицательные margins и перенос размеров между разными cards не заменяют актуальную nesting structure.
- Output: отдельный projects layout commit и `projects/` evidence.

### Этап 10 — `MLIR2-CNT`: Corvo information layout и ProjectCanvas

- Scope: актуальная двухколоночная information-структура, укороченные разделители, нижняя граница information, переиспользуемая code-shell `ProjectCanvas`, три canvas-композиции и четыре независимых прозрачных inner assets.
- Non-scope: Gallery, action bar logic, iframe, React-прототипы и интерактивность внутри canvas.
- Dependency: `MLIR2-INV`, `MLIR2-PROV` для evidence и закрытый read-only inventory nodes/assets.
- Acceptance: все criteria `MLIR2-CNT` разделов 8 и 12 выполнены; внешняя геометрия и точки созданы кодом; Quotes, Process, Buttons и Inputs не слиты в экспорт внешнего frame.
- Verification: asset provenance/alpha checks, exact comparison `1440×1356`, integrity на остальных viewport matrix, проверка clipping, vertical section rhythm и content boundaries в Chromium/Zen `1.21.15b` (build `126.8.18`).
- Stop-line: неоднозначный node, потерянный section padding, margin collapse, старый, непрозрачный либо размытый/upscaled inner asset, экспорт целого серого frame или отдельные DOM-точки оставляют блок `OPEN`.
- Output: отдельный content/canvas commit `Reconcile Corvo information canvas layout` и `corvo-content/` evidence.

### Этап 11 — `MLIR2-GAL`: Gallery

- Scope: отдельный Gallery-блок, три независимые device-группы, шаговое перелистывание, `Disabled` arrows и существующий bounded lightbox.
- Non-scope: добавление Gallery в левую navigation, свободный horizontal scroll, новый lightbox-design и интерактивность внутри изображений.
- Dependency: `MLIR2-CNT`, `MLIR2-SQB`, `MLIR2-PROV` и закрытое визуальное сопоставление всех 15 originals с Figma nodes.
- Acceptance: все criteria `MLIR2-GAL` разделов 8 и 12 выполнены; каждая группа хранит независимый индекс; любой поддержанный ввод даёт один snap-step; все edge states совпадают с Figma.
- Verification: state/gesture checks, visual comparison всех device states и точных Desktop/Tablet/Mobile icon frames, lightbox aspect/intrinsic-size checks и полная Chromium/Zen `1.21.15b` (build `126.8.18`) matrix.
- Stop-line: неполное asset mapping, неверная/деформированная device-иконка, размытый/upscaled preview или lightbox resource, free scroll, vertical-scroll capture, левый fade, скрытая граничная стрелка или fullscreen-like mobile lightbox оставляют блок `OPEN`.
- Output: отдельный Gallery commit `Add device galleries and bounded media viewing` и `corvo-gallery/` evidence.

### Этап 12 — `MLIR2-ABA`: action bar

- Scope: geometry-correct first paint без provisional flash, геометрический переход `FULL ↔ ADAPTIVE` по фактической `88 px` полосе information, немедленный `FULL` в Gallery, ResizeObserver/scroll/resize lifecycle и footer collision.
- Non-scope: section-navigation programmatic state, global smooth scroll и изменение component colors вне Figma.
- Dependency: `MLIR2-HDR`, `MLIR2-CNT`, `MLIR2-GAL`, валидные information/Gallery/footer anchors и `MLIR2-PROV`.
- Acceptance: все pure и browser criteria разделов 8 и 12 выполнены; первый видимый variant сразу соответствует geometry; равенство всей полосы information даёт `ADAPTIVE`; invalid geometry даёт видимый `FULL`; Gallery имеет приоритет `FULL`; footer только поднимает плашку.
- Verification: pure geometry/state tests и полная Chromium/Zen `1.21.15b` (build `126.8.18`) matrix, включая точные references `553:3036`, `553:3314` и `688:52700`.
- Stop-line: без обязательной проверки в зафиксированном Zen, полного provenance, валидных anchors либо компонентных цветов блок не получает `VERIFIED`.
- Output: отдельный action bar commit `Implement region-driven project action bar` и `action-bar/` evidence.

### Этап 13 — `MLIR2-NAV`: section navigation

- Scope: пять information-sections, scroll tracking, programmatic target, отмена/замена, watchdog, absolute limit, information-boundary constraint и lifecycle cleanup.
- Non-scope: Gallery как navigable section, action bar variant selection и глобальная scroll policy.
- Dependency: `MLIR2-HDR`, `MLIR2-CNT`, актуальный inventory ровно пяти sections и `MLIR2-PROV`.
- Acceptance: все сценарии раздела 9 проходят, включая самый длинный переход `1280×720`, отсутствие прогресса, бесконечный минимальный прогресс и отсутствие phantom Gallery item.
- Verification: pure state tests и полная Chromium/Zen `1.21.15b` (build `126.8.18`) matrix на реальной Corvo page.
- Stop-line: без обязательной проверки в зафиксированном Zen, cleanup, bounded fallback, information-boundary behavior или при наличии generic last-index document-bottom behavior блок не получает `VERIFIED`.
- Output: отдельный navigation commit `Implement resilient project section navigation` и `navigation/` evidence.

### Этап 14 — `MLIR2-FIN`: финальная регрессия и handoff

- Scope: затронутые маршруты, evidence index, документация, final checks, confirmed preview, push и один Draft PR.
- Non-scope: merge, deploy, полный аудит сайта и любые новые visual fixes вне Work Packet.
- Dependency: все критичные `MLIR2-*` минимум `VERIFIED`.
- Acceptance: обязательный evidence полный; `CODE_SHA` и `DOC_SHA` разделены; remote/PR SHA подтверждены; ни один критичный блок не `OPEN`.
- Verification: focused tests, один финальный lint/build, provenance-проверка production preview и evidence audit.
- Stop-line: любой критичный `OPEN/FAIL`, SHA mismatch или отсутствующий Gecko result блокирует `READY_FOR_USER_REVIEW`.
- Output: documentation/evidence commit, remote Goal-ветка, один Draft PR и итоговый отчёт без merge/deploy.

## 14. Commit boundaries будущей Goal

1. `Add verifiable preview build provenance`
2. `Introduce explicit SquareButton and migrate scoped controls`
3. `Align GeneralHeader and PageHeader with current Figma`
4. `Reconcile shared project metadata and action cluster`
5. `Rebuild homepage Resume from current Figma`
6. `Rebuild homepage AI section from current Figma`
7. `Refresh homepage process illustrations from current Figma`
8. `Reconcile projects page layout`
9. `Reconcile Corvo information canvas layout`
10. `Add device galleries and bounded media viewing`
11. `Implement region-driven project action bar`
12. `Implement resilient project section navigation`
13. `Document MLIR2 verification evidence`

Общий metadata/action cluster нельзя коммитить до проверки главной и `/projects`.

Documentation/evidence commit не меняет runtime.

Создание самого `WORK_PACKET.md` в текущей документационной задаче commit не создаёт.

## 15. Approval gates

Требуют пользовательского разрешения:

- утверждение `WORK_PACKET.md` перед запуском Goal;
- расширение scope или закрытого inventory;
- добавление новой зависимости или browser runner;
- merge;
- deploy.

Push Goal-ветки и создание либо обновление одного Draft PR входят в финализацию будущей Goal. Они выполняются только после успешных финальных проверок согласованного этапа.

## 16. Readiness gates и stop-lines

Не являются пользовательскими approval:

- доступность актуального Figma node;
- однозначное сопоставление node с компонентом;
- чистая и понятная Git-база;
- доступность текущего preview;
- наличие подтверждённого Zen `1.21.15b` (build `126.8.18`) для обязательной Gecko-matrix; отсутствие Mozilla Firefox readiness не блокирует.

Правила:

- Figma строго read-only;
- если node недоступен, соответствующий блок остаётся `OPEN`;
- независимые блоки можно продолжить;
- недоступный node нельзя заменять старым screenshot;
- read-only повторная проверка Figma не требует дополнительного пользовательского разрешения;
- `NO DEV` variables не использовать;
- нельзя использовать magic `scrollY`;
- нельзя использовать label последнего раздела;
- нельзя использовать пустой label как API Square Button;
- visual PASS нельзя заменять lint/build;
- `MLIR2-CNT` не начинается до фиксации exact nodes, геометрии трёх canvas, четырёх independent inner assets, content dividers и component colors;
- `MLIR2-GAL` не начинается до визуального сопоставления всех 15 originals с Figma независимо от имён файлов;
- серый frame, CSS surface и dot pattern не экспортируются как часть inner assets;
- любой недоступный или неоднозначный inner/gallery asset оставляет только зависимый блок `OPEN` и не разрешает подмену старой версией.

## 17. Rollback

- Работа только в отдельной Goal-ветке от подтверждённого `BASE_SHA`.
- Используются логически независимые commits.
- Откат выполняется отдельным `git revert` после явного решения.
- Destructive reset, переписывание истории и потеря локальных изменений запрещены.
- Неудачный блок остаётся `OPEN`.
- Проверенные независимые commits сохраняются.

## 18. Evidence lifecycle и SHA model

`?review=<short-sha>` является только cache/review marker.

Отдельно фиксируются:

- `BASE_SHA`;
- визуально проверенный runtime `CODE_SHA`;
- финальный documentation/evidence `DOC_SHA`;
- remote branch SHA;
- Draft PR head SHA;
- preview process SHA.

Порядок:

1. Все runtime commits завершены.
2. Выполняются focused tests, lint и build.
3. Production preview запускается с полным `NEXT_PUBLIC_BUILD_SHA=<CODE_SHA>`.
4. Фактически отданный HTML проверяется до browser matrix.
5. Пустой, сокращённый, отсутствующий или несовпадающий SHA останавливает evidence.
6. SHA подтверждается из `data-build-sha`, PID, cwd и порта.
7. Browser evidence создаётся для подтверждённого `CODE_SHA`.
8. Создаётся documentation/evidence commit `DOC_SHA`, не меняющий runtime.
9. Goal-ветка отправляется в remote.
10. Создаётся или обновляется один Draft PR.
11. Подтверждаются remote SHA и PR head SHA.
12. Итоговый отчёт явно различает `CODE_SHA` и `DOC_SHA`.
13. Нельзя утверждать, что runtime screenshots сняты из `DOC_SHA`.
14. После любого нового runtime-изменения затронутые проверки выполняются заново.

## 19. Links and durable artifacts

В будущей Goal сохранить:

- основной Figma-файл `5ZzspE0OrqesDcTP0RRPHr`;
- актуальные локальные components основного Figma-файла, найденные на этапе inventory;
- Square Button library node `73:5324` в `CRcI38SOIkr5knjKXeCV5h`;
- Page Header library node `103:436` в `CRcI38SOIkr5knjKXeCV5h`;
- GeneralHeader node `591:33348`;
- Corvo section `373:47102` и full page `373:47103`;
- Corvo canvas nodes `651:22762`, `656:146519`, `674:36727` и их зафиксированные inner-image nodes;
- Gallery node `677:44301`, device-group nodes и все 15 сопоставленных image nodes;
- action bar component set `550:2868`, Adaptive `528:1540`, Full `576:33195`;
- action bar viewport references `553:3036`, `553:3314`, `688:52700`;
- новый evidence path;
- исторический evidence path с явной пометкой;
- будущие preview и Draft PR ссылки после их фактического создания.

Основной актуальный макет:

`https://www.figma.com/design/5ZzspE0OrqesDcTP0RRPHr/Концепт?node-id=262-2380`

Square Button component set:

`https://www.figma.com/design/CRcI38SOIkr5knjKXeCV5h/My-portfolio---Library?node-id=73-5324`

Новый Header component:

`https://www.figma.com/design/CRcI38SOIkr5knjKXeCV5h/My-portfolio---Library?node-id=103-436`

Актуальный Corvo section:

`https://www.figma.com/design/5ZzspE0OrqesDcTP0RRPHr/Концепт?node-id=373-47102`

## 20. Open technical decisions

Внутри пакета уже разрешены:

- browser integration по умолчанию ручная и machine-readable;
- обязательный Gecko-браузер — Zen `1.21.15b` (build `126.8.18`);
- namespace — `MLIR2-*`;
- evidence path — `design-reference/main-layout-interaction-reconciliation/`;
- provenance — полный `NEXT_PUBLIC_BUILD_SHA` и `data-build-sha`;
- review preview работает fail-closed;
- action bar и navigation разделены;
- `ProjectCanvas` — code-shell с CSS surface, clipping и одним оптимизированным dot pattern; сейчас принимает прозрачное изображение, а будущий slot/iframe не реализуется в этой Goal;
- недоступный переход к описанию проекта использует disabled CTA с текстом `Скоро`; доступный CTA сохраняет текст `Подробнее`;
- Quotes, Process, Buttons и Inputs — четыре независимых inner assets; Buttons/Inputs сохраняют две области `448 | 1 | 551`;
- Gallery — отдельный блок вне navigation, с тремя независимыми группами, шаговой пагинацией, `Disabled` arrows и существующим bounded lightbox;
- action bar выбирает состояние по фактическому попаданию всей полосы `88 px` в information: первый видимый variant сразу geometry-correct без flash, invalid — `FULL`, information — `ADAPTIVE`, Gallery — немедленный `FULL`, footer поднимает плашку без исчезновения;
- navigation absolute emergency limit — `30000 ms`;
- Resume и AI разделены;
- process-иллюстрации выделены в отдельный `MLIR2-PROC` с обязательной проверкой актуальности источника и реальной прозрачности;
- push и один Draft PR входят в Goal;
- merge и deploy не входят без отдельных разрешений.

Открытых продуктовых вопросов нет.

## 21. Финальная самопроверка плана

- [ ] Текущая документационная задача классифицирована как `MEDIUM / LOW / OPTIMIZED`.
- [ ] Будущая Goal отдельно классифицирована как `LARGE / ELEVATED / FULL`.
- [ ] Эти две классификации не смешиваются.
- [ ] Создание `WORK_PACKET.md` не создаёт commit.
- [ ] Реализация запрещена до пользовательского утверждения.
- [ ] Namespace и evidence path уникальны.
- [ ] Старый evidence остаётся неизменяемым и историческим.
- [ ] Заголовок и тело агрегатной записи `DESIGN_QA.md` соответствуют активному статусу.
- [ ] Старые утверждения готовности явно относятся к предыдущему состоянию Figma.
- [ ] Каждый этап содержит scope, non-scope, dependencies, acceptance, verification, stop-line и output.
- [ ] Shared metadata/action contract проверяется на главной и `/projects`.
- [ ] Недоступный description CTA остаётся disabled и показывает `Скоро`; доступный CTA показывает `Подробнее`.
- [ ] На `/projects` content-group карточек имеет intrinsic/Hug height, центрируется относительно preview и сохраняет `32 px` от фактического конца «Что делал» до строки устройств независимо от длины текста.
- [ ] `MLIR2-PROC` охватывает все три иллюстрации секции «Начинаю не с макетов» и не смешивается с Resume или AI.
- [ ] Для каждого process-asset зафиксированы точный Figma node, baseline hash, итоговый SHA-256, dimensions и alpha statistics.
- [ ] Старые PNG не редактируются для имитации нового экспорта; прямоугольный фон и несовпадение содержания блокируют `VERIFIED`.
- [ ] Подтверждённый `2026-08-24` runtime-дефект фона process-иллюстраций закрыт проверкой всех трёх фактически загруженных browser resources на странице.
- [ ] SquareButton использует discriminated union и закрытый inventory.
- [ ] Link-вариант SquareButton типизирует `disabled?: boolean`.
- [ ] Disabled link рендерится без `<a href>`, tab order и navigation.
- [ ] `MLIR2-CNT` фиксирует code-shell, CSS dot pattern, clipping, точную canvas-геометрию и четыре независимых прозрачных inner assets.
- [ ] Все пять information-sections сохраняют точные Figma paddings/gaps; контент не касается divider, а переход `Результат → Gallery` имеет отдельный подтверждённый spacing.
- [ ] Buttons и Inputs не объединены: это две области `448 | 1 | 551` с отдельными изображениями.
- [ ] `MLIR2-GAL` фиксирует три независимые группы по пять изображений, step-only input, `Disabled` arrows и bounded lightbox.
- [ ] Desktop/Tablet/Mobile используют точные полные icon frames из Figma; особенно Tablet и Mobile не подменены упрощёнными или деформированными вариантами.
- [ ] Gallery никогда не показывает fade слева; справа он показывается только при наличии следующего item.
- [ ] Все новые raster-assets имеют достаточный source и фактически загруженный candidate минимум `2×`, не upscale-ятся и визуально резки при DPR `1` и `2`.
- [ ] Gallery не является шестым пунктом navigation.
- [ ] Первый пользовательски видимый action bar сразу geometry-correct: высокий initial viewport показывает `ADAPTIVE` без flash, недостаточный viewport показывает `FULL`; только действительно invalid geometry использует fallback `FULL`.
- [ ] `ADAPTIVE` включается только при полном попадании фактической полосы `88 px` внутрь information с техническим допуском не более `1 px`.
- [ ] Gallery немедленно переводит action bar в `FULL`, а footer поднимает его без исчезновения.
- [ ] Цвета action bar берутся только из Figma component set.
- [ ] Pure unit tests и browser checks не смешаны.
- [ ] Browser matrix включает Chromium и Zen `1.21.15b` (build `126.8.18`) на шести viewport.
- [ ] Отсутствие обязательной проверки в зафиксированном Zen блокирует `VERIFIED` и общий `READY_FOR_USER_REVIEW`, но отсутствие Mozilla Firefox не блокирует начало Goal.
- [ ] Самый длинный navigation transition проверяется при `1280×720`.
- [ ] Watchdog отсутствия прогресса равен `2000 ms`.
- [ ] Navigation имеет фиксированный абсолютный аварийный предел `30000 ms`.
- [ ] Нормальный длинный переход, отсутствие прогресса и бесконечный минимальный прогресс проверяются отдельно.
- [ ] Build provenance имеет один контракт и отдельный code commit.
- [ ] Review preview fail-closed при отсутствующем или несовпадающем SHA.
- [ ] Browser evidence не создаётся до подтверждения полного `CODE_SHA`.
- [ ] Все screenshots относятся к `CODE_SHA` с provenance-инструментацией.
- [ ] Documentation/evidence commit не меняет runtime.
- [ ] Push и один Draft PR входят в финализацию Goal.
- [ ] Merge и deploy требуют отдельных разрешений.
- [ ] Read-only Figma checks являются readiness checks и не требуют лишнего подтверждения.
- [ ] 404/500, global smooth scroll и mobile/tablet adaptation исключены.
- [ ] Context-transfer каталог и ZIP не затрагиваются.

## 22. Условия готовности будущей Goal к запуску

До начала реализации необходимо:

1. получить отдельное явное подтверждение пользователя на запуск Goal;
2. повторно проверить branch, полный HEAD и `git status`;
3. классифицировать tracked и untracked изменения;
4. не изменять context-transfer папку и ZIP;
5. определить точный `BASE_SHA`;
6. создать одну Goal-ветку от подтверждённого `BASE_SHA`;
7. повторно получить актуальный read-only Figma context перечисленных nodes;
8. определить и зафиксировать точные актуальные child node IDs трёх process-иллюстраций, а также baseline hashes существующих PNG;
9. зафиксировать exact nodes, dimensions и прозрачные source-assets для Quotes, Process, Buttons и Inputs, не экспортируя внешние canvas;
10. визуально сопоставить все 15 Gallery originals с точными Figma image nodes независимо от имён файлов и сохранить hashes/dimensions;
11. зафиксировать information/Gallery/footer anchors, action bar component states/colors и три обязательных viewport references;
12. перевести агрегатную запись `DESIGN_QA.md` в непротиворечивое состояние `OPEN` с namespace `MLIR2-*`;
13. начать реализацию только после прохождения readiness checks.

Ни создание этого документа, ни его пользовательское утверждение сами по себе не разрешают merge или deploy.

## 23. Результат ревью плана

`PASS` от `2026-08-24`.

Последовательный и сомневающийся self-review выполнен после внесения новых требований. Исправлены найденные противоречия старой версии: скрытое/неизмеренное initial-state action bar, переключение по одному верхнему anchor, document-bottom special-case navigation, неполная browser matrix и отсутствие отдельных scope/dependencies/acceptance/stop-lines для `MLIR2-CNT` и `MLIR2-GAL`.

План готов к отдельному явному запуску будущей Goal. Этот статус подтверждает полноту исполнительного контракта, но не утверждает, что реализация уже выполнена или проверена.
