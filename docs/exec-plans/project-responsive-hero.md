# Desktop Corvo Responsive Hero для Concept V2

**Статус:** Ready for user review — icon fidelity, tab motion and dark-scene radius correction
**Baseline этой ревизии:** `codex/concept-v2-responsive-hero` · `20f7408`
**Target:** standalone Concept V2 app, isolated preview only

## Результат

Перенести уже принятую desktop-реализацию Corvo Responsive Hero в правильный
Concept V2 worktree. Hero должен быть доступен по отдельному preview-route,
не встраиваться ни в одну страницу и сохранять Figma-оболочку, прямой
`scale(.6)` готовой Corvo-сцены, presets, drag-resize и motion.

## Scope

- route `/preview/project-responsive-hero` в `tools/concept-v2/app`;
- Hero chrome и code-owned Corvo definition;
- точная неизменённая копия разрешённой Corvo Media Campaigns scene;
- pinned `motion@13.4.2`;
- drag spring, fixed preset easing, magnetic release и заметная короткая
  inertia `160px / 420ms`;
- focused tests, полный Concept V2 check и runtime acceptance.

## Non-scope

- интеграция в главную concept-страницу;
- изменения 404, preloader или Portfolio Next.js;
- внутренние изменения Corvo iframe;
- popup enlarge, tablet/mobile Portfolio;
- merge, deploy или Figma write.

## Приёмка

- title и URL однозначно показывают Concept V2 runtime;
- основная страница и 404 не импортируют Hero;
- iframe сохраняет прямой `scale(.6)`, не принимает pointer/focus;
- быстрый drag получает максимум `160px` доката; на жёсткой границе внешний
  импульс не сдвигает фрейм и не вызывает recoil;
- presets, keyboard resize, magnetic snap и reduced motion сохраняются;
- `npm run check` проходит, после чего выполнены два последовательных review.

## Результат проверки

- focused Hero tests `6/6`;
- полный Concept V2 check: lint, `132/132` tests, Vite build — PASS;
- runtime fast drag из desktop: полный дополнительный докат `-160px`;
- runtime release на жёсткой границе остаётся на точном крайном значении;
- `media-campaigns`, `shared` и chrome assets совпадают с source;
- главная concept-страница и 404 не изменены;
- pre-existing High advisory относится к pinned `vite@6.4.2`, не к Motion;
  обновление Vite не входит в этот scope.

## Ревизия 2026-09-25 — актуальные Library V2 tabs

### Target

Актуализировать только внешнюю оболочку Hero по Figma `3774:200462` и
библиотечные сценарные/размерные табы по `2147:1776` и `2151:15044`.

### Change

- Hero `980px`, header `52px`, ruler `64px`.
- Scenario tabs: `40px`, exact typography/colors/icons, быстрый motion нижней
  линии на hover; Media Campaigns остаётся единственным active-сценарием.
- Size tabs: `48px`, exact typography/colors/icons и мгновенные visual states.
- Сегменты ruler остаются `256 / 141 / 415 / 188 / 200`.
- Iframe Corvo, его logical/display geometry, `scale(.6)`, breakpoints,
  содержимое, assets, presets и принятый resize motion не меняются.

### Verification

- focused component/geometry tests;
- overlays header/ruler для пяти presets;
- iframe source/geometry regression check;
- lint, полный test suite, production build;
- fidelity/completeness review, затем regression/scope/risk review.

### Result

- Hero обновлён до `980px`; header — до `52px`, ruler — до `64px`.
- Сценарные и размерные табы вынесены в переиспользуемые Library V2
  компоненты с точными состояниями, typography, icon canvas и цветами.
- Hover underline сценарного таба выезжает снизу за `140ms`; active-линия
  остаётся сплошной, size-tab меняет visual state мгновенно.
- Координаты групп, hint, ширины табов и сегментов ruler соответствуют
  измерительному контракту актуальных Figma nodes.
- Corvo iframe, `scale(.6)`, preset-значения, width model, drag softness,
  inertia, magnetic release и isolated route не изменены.
- Fidelity/completeness review и regression/scope/risk review завершены без
  открытых замечаний.
- Финальная проверка: lint — PASS; focused Hero tests `8/8`; полный test suite
  `134/134`; Vite production build — PASS.

### Stop-lines

Нет popup, integration в concept page, Portfolio tablet/mobile, изменений
внутреннего Corvo iframe, Figma write, merge или deploy.

## Ревизия 2026-09-25 — крайние упоры и готовые сцены

### Target

Исправить внешний control layer, который ошибочно подсвечивал крайние
разделители и делал recoil на границах; подключить три уже готовые Corvo-сцены
к существующим сценарным табам. Внутренности iframe остаются вне редактирования
и Figma-сверки.

### Change

- Верхние крайние разделители min/max всегда используют Surface `#272d30` и
  никогда не получают active-цвет.
- Hover-подчёркивание scenario tab проходит видимые `4px` снизу вверх за
  `140ms`; текст таба нельзя выделить курсором.
- На min/max hard boundary drag, inertia и keyboard outward input фиксируются
  непосредственно на границе, без inward recoil.
- `Media Campaigns`, `Statistics`, `My Space`, `Authorization` получили свои
  URL в definition; выбор таба мгновенно меняет `iframe.src`, не меняя ширину
  или motion-state.
- Полный набор Corvo files скопирован напрямую из
  `tools/corvo-responsive-scenes/site` commit `127256e`; `diff -qr` подтвердил
  byte-to-byte совпадение всех 142 файлов.

### Verification

- focused Hero tests `8/8`;
- lint и полный Concept V2 suite `134/134`;
- Vite production build и built runtime smoke — PASS;
- runtime: переключены Statistics, My Space и Authorization, каждый подтвердил
  свой `iframe.src`; Authorization визуально загружен;
- runtime: ArrowRight при max оставляет slider на logical width `1933`;
- fidelity/completeness и regression/scope/risk review закрыты без замечаний.

## Ревизия 2026-09-25 — линия табов и артефакты тёмной сцены

### Target → Change → Expected result → Verification

- Внешняя линия сценарных табов: скрыть её в покое, сохранив быстрый подъём
  снизу на hover и сплошную active-линию; в готовом runtime проверить
  покадровое движение `4px → 0` и скрытие после ухода курсора.
- Оболочка iframe: устранить расхождение логической и физической ширины на
  preset и при drag; сделать `displayWidth` единственной анимируемой величиной,
  а logical width и высоту продукта выводить из неё. Ожидается отсутствие
  щелей и независимого запаздывания высоты на breakpoint.
- Тёмная Authorization: подложка внешнего viewport соответствует исходному
  `#242625`, чтобы субпиксельный край и скругление не вспыхивали белым.
  HTML/CSS/assets Corvo и его прямой `scale(.6)` не изменяются.

### Проверка и итог

- В runtime неактивная линия имеет `visibility:hidden`; на hover измерены
  промежуточные положения от `4px` до `0`, после ухода — снова hidden.
- Tablet: внешняя ширина `767.398px`, scaled iframe `767.400px`; максимальная
  замеренная разница при переходах и drag — менее `0.007px`.
- На тёмной сцене Tablet → max: `45` кадров, максимальный интервал `8.6ms`, без
  интервалов свыше `25ms`; во время ручного drag: `70` кадров, максимум
  `10.5ms`, без интервалов свыше `25ms` на текущем локальном устройстве.
- Corvo source files не входят в diff. Focused Hero tests `8/8`, полный suite
  `134/134`, lint и Vite production build — PASS.
- Fidelity/completeness и regression/scope/risk review закрыты без открытых
  замечаний. Это локальная проверка, а не обещание одинаковой частоты кадров
  на любом устройстве.

## Ревизия 2026-09-25 — точный clip таба и правый край iframe

### Target → Change → Expected result → Verification

- Сценарный таб Library V2 `2147:1776`: заменить пяти-пиксельную область
  линии на `1px` с `overflow:hidden` у линии и таба. Неактивная линия стоит
  на `1px` ниже видимой области; hover за `250ms` переводит её на место без
  `visibility`-скачка и без выхода под header. Active-линия остаётся сплошной.
- Внешняя оболочка Authorization: её исходный iframe-документ округляет
  дробную ширину до целых CSS-пикселей и оставляет справа узкий белый canvas.
  Логическая ширина iframe округляется вверх менее чем на `1px`; непрерывная
  физическая ширина, `scale(.6)`, drag, inertia и размеры preset не меняются.
  Высота оболочки определяется тем же округлённым диапазоном, что и сцена.
- У тёмной Authorization убрана дополнительная скруглённая маска внешнего
  viewport; остаются её собственные внутренние скругления и фон `#242625`.
  HTML, CSS и assets исходной Corvo-сцены не меняются.

### Проверка и остаточный риск

- RED→GREEN focused Hero test `8/8`; затем lint, полный suite `134/134`,
  production build — PASS.
- Built runtime: tab и линия имеют clip и высоту `1px`, hover движется от
  `1px` к `0` за `250ms`; нет отрицательного overshoot.
- Authorization на дробной ширине: внешний viewport `667.227px`, iframe
  `667.800px`, документ/корневая сцена имеют одинаковые `1113px`; излишек
  обрезает внешний viewport. Mobile, Tablet, Desktop и max сохранили высоту
  исходной сцены при `scale(.6)`; на проходе через breakpoint mismatch высоты
  `0px` в измеренной последовательности.
- Проверка в Codex browser выполнена. Автоматическое управление открытым Zen
  временно недоступно, поэтому окончательная визуальная приёмка именно в Zen
  остаётся за пользователем; нельзя заявлять кроссбраузерное завершение.

## Ревизия 2026-09-25 — Medium-иконки, видимый hover и левое скругление

### Target → Change → Expected result → Verification

- Девять иконок верхних табов: текущий Figma Hero `3774:200461` содержит
  четыре scenario-иконки и пять size-иконок в полном `16×16` frame. У всех
  Medium-векторов stroke `1.3px` на итоговом размере. Исходный SVG `24×24`
  внутри frame `16×16` уменьшался вместе с stroke до `≈0.87px`;
  `vector-effect="non-scaling-stroke"` сохраняет исходную толщину.
- Key: source — один line-вектор без fill, поворот `45°`, один составной path;
  прежняя замена была неверным обведённым fill-контуром. Mobile: source —
  line-вектор без fill, два path в bounds `x=4`, `y=1.333`, `8×13.333`;
  прежний fill-силуэт заменён исходной геометрией. Остальные семь source roles
  подтверждены: три scenario — line без fill; size-min/tablet/desktop/max —
  stroke `1.3px` с source fill `20%` (min/max как отдельные vector layers).
- Сценарный underline остаётся толщиной `1px` и целиком clipped в tab frame;
  к физическому ходу `1px/250ms` добавлен синхронный opacity-ramp и плавный
  центрированный easing, чтобы промежуточное движение читалось, а не выглядело
  мгновенным. Active остаётся сплошным и всегда видимым.
- Authorization: внешний viewport снова имеет только левое скругление
  `8px 0 0 8px`; тёмная подложка и округление логической ширины iframe,
  устранившие правое мерцание, сохранены.

### Проверка

- RED focused test подтвердил прежние ошибки; затем focused `8/8`, полный
  Concept V2 suite `134/134`, lint и Vite production build — PASS.
- Built runtime: все девять видимых SVG занимают `16px`; на всех stroked paths
  computed `1.3px` и `non-scaling-stroke`; Mobile не содержит fill-layer.
- Hover Statistics измерен по кадрам: opacity `0 → 0.23 → 0.50 → 1`, а
  translateY `1 → 0.94 → 0.50 → 0px` за `250ms`.
- Authorization на Tablet: viewport `767.398px`, iframe `767.400px`, background
  `#242625`, radius `8px 0 0 8px`; лишняя доля пикселя обрезается справа.
- Внутренние Corvo files и motion-параметры не изменены. Пользовательская
  визуальная приёмка в Zen остаётся отдельным шагом.

## Ревизия 2026-09-25 — Mobile Duotone по прямой правке пользователя

- Target → только иконка Mobile в size-tab; текущий Figma Hero instance имеет
  семейство Line без fill, но пользователь явно утвердил Duotone, как у Tablet
  и Desktop. Этот override не меняет исходный Figma-файл.
- Change → сохранены bounds `x=4`, `y=1.333`, `8×13.333`, два исходных path и
  stroke `1.3px`; корпус получил fill `currentColor` с opacity `0.2`, точка
  осталась без fill. Остальные иконки, iframe и resize не менялись.
- Expected result → Mobile визуально относится к Duotone-группе устройств,
  не теряя точную геометрию и обводку.
- Verification → focused Hero tests `8/8`, lint и Vite production build PASS.
  В собранном runtime проверены все пять size-tab icons: frame `16px`, каждый
  stroked path `1.3px` с `non-scaling-stroke`; Mobile/Tablet/Desktop имеют
  computed fill-opacity `0.2` и тот же semantic `currentColor`.

## Ревизия 2026-09-25 — возврат плавной высоты resize

- Target → внешняя высота Hero viewport при смене preset и ручном resize.
- Root cause → в коррекции дробной ширины высоту сделали дискретной функцией
  анимируемой ширины. На границе адаптива она мгновенно менялась с `660` на
  `384px`, хотя ширина продолжала плавно двигаться.
- Change → высота снова имеет собственный MotionValue и анимируется тем же
  переходом, что и ширина. Целевая высота по-прежнему вычисляется из
  утверждённого breakpoint; логическая ширина iframe и overscan остаются
  производными от физической ширины, чтобы не вернуть мерцающий край.
- Expected result → frame, resize hatch и iframe viewport плавно меняют
  высоту; конечные размеры и масштаб Corvo прежние. Reduced motion и жёсткая
  граница мгновенно фиксируют обе величины.
- Verification → исходный скачок воспроизведён в built runtime; focused
  regression test RED `7/8` → GREEN `8/8`, полный suite `134/134`, lint и
  production build PASS.
  Покадровый runtime Mobile → Tablet: высота `505 → 519 → 531 → 545px`,
  обратно: `536 → 522 → 509 → 496px`; ширина менялась синхронно. Финальные
  размеры Tablet `767.4×660px`, Mobile `357.15×384px`; внутренние Corvo
  files не изменены.

## Ревизия 2026-09-25 — устранение артефакта Authorization при плавной высоте

- Target → высота iframe внутри анимируемой внешней оболочки, без изменения
  HTML/CSS/assets Corvo и без потери внешнего resize-motion.
- Root cause → iframe наследовал интерполируемую высоту оболочки, тогда как
  `.authorization` меняет собственную высоту дискретно на `640/1100/960px`
  по media query. При переходе Tablet → Mobile белый document canvas
  выступал ниже уже скруглённой мобильной сцены.
- Change → физическая ширина и высота внешней оболочки продолжают плавное
  движение; логическая высота iframe теперь вычисляется из текущей физической
  ширины и её округлённого логического viewport, ровно как его breakpoint.
  Тёмная подложка, левое скругление и overscan справа не менялись.
- Expected result → никаких белых полос под Authorization или на правом крае
  во время перехода; итоговые размеры, scale `0.6` и Corvo-файлы прежние.
- Verification → до правки в runtime зафиксирован кадр шириной `345px` с
  iframe `448px` поверх мобильной сцены высотой `384px` и видимой белой
  полосой. После правки при ширине `357px`: iframe `384px`, внешняя оболочка
  ещё `455px`, излишек заполняет тёмная подложка. Обратный переход также
  проверен по кадрам; на широком viewport подтверждены правый край и левый
  radius. Focused `8/8`, весь suite `134/134`, lint и build — PASS.

## Ревизия 2026-09-25 — устранение регрессии движения iframe

- Target → вернуть ранее согласованную непрерывную высоту iframe без белого
  canvas за пределами текущей сцены Authorization.
- Root cause → последнее исправление связало высоту самого iframe с
  дискретным breakpoint, хотя внешняя рамка продолжала интерполяцию. В
  покадровом runtime Mobile → Tablet iframe прыгал `384 → 660px`, когда рамка
  достигла лишь `≈386px`. Новый эффект растворения не нужен.
- Change → высота iframe снова следует анимируемой высоте рамки; отдельная
  внешняя обрезка ограничивает его видимость фактической высотой текущего
  адаптива. Содержимое Corvo, `scale(.6)`, breakpoint, presets и easing не
  изменены.
- Expected result → iframe и рамка движутся синхронно, при этом белый фон
  iframe не выступает за тёмную сцену.
- Verification → focused Hero tests `8/8`, полный suite `134/134`, lint и
  production build PASS. В собранном runtime при Mobile → Tablet и обратно
  расхождение высот iframe/рамки не превысило `0.1px` в замеренных кадрах;
  высота clip меняется только у исходного breakpoint. Скругление в Zen
  остаётся отдельной непроверенной браузерной проблемой.

## Ревизия 2026-09-25 — покрытие дробной высоты и мобильные внешние углы

- Target → только внешняя оболочка iframe; внутренний продукт и изменения
  соседнего исполнителя не редактировать.
- Evidence → при физической высоте `573.375px` дробная CSS-высота iframe
  `955.625px` дала document viewport `955px`: незакрытый край `0.375px`.
  Максимум в исходной выборке перехода — `0.440625px`.
- Change → округлять анимируемую логическую высоту iframe вверх, сохраняя
  непрерывный внешний clip, presets, easing, drag и scale. По прямому запросу
  восстановить внешние левые радиусы `8px` Authorization только при `<600px`;
  на остальных размерах сохранить состояние соседней задачи.
- Verification → regression checks охватывают 10001 дробную высоту и все
  конечные presets. Suite `138/138`, lint и production build PASS. В built
  runtime пять переходов по 750ms (462 кадра): незакрытый X/Y край отсутствует;
  переходы с изменением высоты содержат 62–65 уникальных высот. Mobile/min
  левые радиусы `8px`, остальные Authorization `0px`; справа `0px`.
- Review → полнота: восстановлена только мобильная внешняя форма, без новых
  эффектов. Регрессии/scope: product files и motion constants не затронуты,
  конечные размеры сохранены. Проверка покрытия не доказывает отсутствие
  всех возможных compositor-артефактов; Zen визуально не подтверждён.
