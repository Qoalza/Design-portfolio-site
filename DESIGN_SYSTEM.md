# DESIGN SYSTEM

Обновлено: 2026-09-01.

## Назначение

Долговечный контракт соответствия Figma design system и code components. Per-goal evidence хранится в `design-reference/**`; Portfolio scroll/navigation runtime — в `docs/portfolio/RUNTIME.md`.

## Доступ к Figma

- Figma по умолчанию всегда read-only.
- Запись допустима только по прямому запросу пользователя и после отдельного подтверждения exact action непосредственно перед write.
- Разрешение менять code/site/docs не разрешает менять Figma.

## Полнота source mapping

Перед visual implementation исследовать exact instance/component:

- hierarchy и каждый непосредственный child;
- component properties, variants и states;
- variables и bindings;
- typography;
- Auto Layout, Hug/Fill/Fixed, constraints, min/max;
- sizes, padding, gaps, alignment;
- fills, strokes, effects, radii, clipping;
- icons и responsive behavior.

Затем сопоставить source с существующим code component, CSS и runtime computed styles.

Screenshot, внешнее сходство и предположение не заменяют mapping. Визуально пустой frame может задавать геометрию/interaction. Каждый непосредственный child получает один результат:

1. точная реализация;
2. доказанный структурный эквивалент с тем же observable result;
3. узкое прямое пользовательское исключение.

`NO DEV` или другое исключение относится только к названному элементу.

## Master / Skin

### Master

- внутренняя конструктивная основа;
- hard parameters: размеры, padding, radii, geometry, layout, icon/additional element placement;
- источник размерных вариантов;
- instance Hug/Fill/Fixed определяется placement context, а не Master.

### Skin

- публичный Figma component с вложенным Master;
- визуальные variants/states каждого поддержанного размера;
- state по умолчанию не меняет geometry/padding без отдельного source exception;
- конструктивно отличающаяся форма является отдельной Master variation;
- icon выбирается через Swap, visibility/loader/text-only/icon-only — только если предусмотрено source contract;
- structural bindings принадлежат Master, visual state bindings — Skin.

Code не обязан повторять `Master → Skin` двумя React components. Один typed public component допустим, если сохраняет geometry, variants, states и semantic roles.

## Icons

### Families

- `Line` и `Duotone`: `Light` stroke `1 px`, `Medium` stroke `1.3 px`, если exact source не задаёт иначе.
- `Solid` и `Color`: без Light/Medium, по exact source.
- Каноническая единица — полный icon component frame/canvas, не внутренний vector/path.

### Runtime rendering и color

- Figma может собирать `Line`, `Duotone` и `Solid` через `Mask` с отдельным `Color` layer, но этот authoring mechanism не переносится в runtime автоматически.
- `Line` и stroked-слои `Duotone` в runtime выводятся только настоящим inline SVG внутри отдельного layout-frame. CSS mask для них запрещена: она превращает stroke в альфа-силуэт и не гарантирует заложенную толщину.
- Layout-frame задаёт consumer size; полный SVG сохраняет исходный `viewBox`, остаётся его реальным дочерним элементом и масштабирует только геометрию. Если export выдал leaf без component canvas, сохраняются bytes leaf, но runtime восстанавливает отдельный внешний frame с exact bounds/offset leaf из Figma — leaf нельзя растягивать через `inset:0;width:100%;height:100%`.
- Каждый stroked path сохраняет точный `stroke-width` из source и получает `vector-effect="non-scaling-stroke"`, если consumer масштабирует frame, но толщина линии должна оставаться неизменной.
- Запрещены CSS `filter`, `drop-shadow`, дублирование path, искусственный `paint-order` и другие способы имитации толщины.
- Color задаётся semantic/component role, а не случайным HEX внутри consumer.
- Для перекрашиваемых control icons source-color заменяется на `currentColor` внутри inline SVG; остальные stroke/fill attributes остаются исходными.
- `Color` icons сохраняют fixed colors и не перекрашиваются mask.
- Совпадающий текущий цвет текста/icon не объединяет их variables/roles.

### Морф иконки (`морф`)

- Термины «морф», «морф иконки» и запрос «сделай морф иконки X в Y» означают
  этот контракт. Использовать существующий механизм; новый animation engine,
  CSS-подмена или отдельная реализация для consumer не создаются.

- Переиспользуемый runtime-компонент — `StrokeMorphIcon`; его `icon` prop
  принимает подготовленные stroke-данные, а смена значения запускает morph.
- Источники берутся из exact Figma SVG целиком. Разные `viewBox` нормализуются
  через `svgToIcon` на общей сетке; вручную перерисовывать промежуточные формы
  запрещено. Если число subpath различается и автоматическое соответствие
  создаёт наложения, конечный exact centerline можно разделить в местах без
  изменения его геометрии так, чтобы каждому исходному subpath соответствовал
  отдельный конечный участок.
- В DOM сохраняется `frame > svg > path`: `fill:none`, `stroke:currentColor`,
  exact `stroke-width`, `linecap`, `linejoin` и `vector-effect` задаются нашим
  компонентом. CSS mask, outlined fill и покадровая подмена SVG запрещены.
- Morphicons используется только как geometry/spring engine. Политика
  reduced motion задаётся `reducedMotion="user"`. Стандартная настройка на
  20% быстрее preset `snappy`, сохраняя его damping ratio:
  `stiffness:605`, `damping:36`. Смена цели во время анимации должна
  продолжаться из текущей промежуточной формы без скачка.
- Для новой пары добавить exact SVG-источники в локальный asset registry,
  создать module-scope данные через `svgToIcon` и переключать только `icon`.
- Trigger, длительность активного состояния и сопутствующий текст задаются
  конкретным сценарием. Двухсекундный возврат относится к Corvo Copy Link и
  не становится значением по умолчанию для других морфов.
- При приёмке проверить обе конечные иконки, промежуточный кадр, прямой и
  обратный переход, повторное переключение до завершения, layout-frame,
  computed `fill:none`, `stroke-width` и отсутствие `mask-image`.

### Size и export

- Размер layout-frame задаётся consumer context; вложенный полный SVG занимает frame без crop по path bounds. При leaf-only export frame занимает consumer, а неизменённый SVG занимает его exact source bounds внутри восстановленного component canvas.
- Сохраняются исходный viewBox/canvas, внутренние отступы и optical alignment.
- Запрещено crop/compact по path bounds и извлечение внутреннего vector вместо полного frame.
- `Line` экспортируется настоящим SVG `stroke`, не outlined `fill`.
- В `Duotone` outline остаётся stroke; fill допустим только у залитых source layers.
- `Solid/Color` используют fill только при подтверждённом consumer→source mapping.
- Сохраняются `stroke-width`, `linecap`, `linejoin`, transforms, opacity и детали.
- Проверка миграции включает DOM-анатомию `frame > svg > path`, соответствие `viewBox`, фактический computed `stroke-width` и отсутствие `mask-image`; одно имя asset или наличие строки `1.3` недостаточно.
- Для `Medium / Social logo / Figma` current source — leaf `15.3×21.3` внутри `24×24` component frame: runtime сохраняет frame и размещает leaf в bounds `x:4.35`, `y:1.35`, `w:15.3`, `h:21.3` (`18.125%`, `5.625%`, `63.75%`, `88.75%`). Это guard против non-uniform stretch, а не новый путь или утолщение.
- XML validation доказывает syntax/attributes, но не source family; mapping остаётся обязательным.

### Platform icons

Принят долговечный rendering contract:

- использовать полный icon frame/canvas;
- сохранять intrinsic dimensions конкретного варианта;
- не принуждать разные platform icons к generic `20×20`;
- применять mask/currentColor/semantic color role там, где это соответствует Figma source;
- не использовать stale hard-coded color внутри consumer как замену semantic contract.

Этот mechanism считается принятым. Визуальное соответствие конкретных current platform-icon instances всё равно требует current Figma/runtime проверки и не выводится автоматически из механики.

Локальная baseline/library документация находится в `design-system/README.md` и `design-system/icons/README.md`.

## Variables и semantic roles

- Figma bindings имеют приоритет над визуальным предположением.
- Text, Icon, Container, Border и другие роли остаются отдельными variables/tokens, даже если сегодня разрешаются в один цвет.
- Alias одной роли должен меняться независимо от других.
- При переносе в code сохранять semantic separation CSS/component tokens.
- Уникальный binding exact instance может переопределить общий default; такое отклонение должно быть подтверждено source mapping.

## Surface grid pattern

- Переиспользуемая сетка Concept V2 реализуется компонентом `GridPattern` и
  CSS-примитивом `.surface-grid-pattern`.
- Текущий exact source — `4198:875236`; он размножает один instance компонента
  `4100:309337` без gaps. После пользовательской коррекции плитка имеет размер
  `320×320px` и внешний stroke `1px #191E21`; каждая ячейка — `20×20px` со
  stroke `1px #16191C`; opacity общего контейнера — `70%`.
- Code повторяет один законченный versioned SVG-тайл
  `surface-grid-tile-16191c-191e21.svg`. Внутренние
  линии существуют только на координатах `20…300px`, а верхняя и левая
  границы принадлежат самой плитке. Повторение создаёт ровно один разделитель
  на каждом шве без наложенных слоёв и двойных границ.
- `GridPattern` не принимает визуальных параметров. Компонент уже содержит
  absolute fill, `pointer-events: none`, opacity, asset, размер, repeat и
  origin `calc(50% - 640px) 0`. Для повторного использования достаточно
  вставить `<GridPattern/>` в positioned-контейнер; переопределять сетку в
  consumer CSS нельзя.

## Concept V2 process cards

- Текущий exact source ряда — `4150:804103`; три desktop instances образуют
  frame `1280×297px` с gap `16px` и ширинами `401 / 446 / 401px`.
- Каждая карточка имеет фон `#181C1F`, внутренний stroke `1px #1D2124`, radius
  `12px` и clipped overflow. Декоративное поле занимает `214×194px` от
  левого верхнего угла; шаг клетки `36px`, default stroke `#272D30`, hover
  stroke `#173954`. Поверх поля лежит один radial fade из
  `process-grid-fade.svg`.
- Верхний animated separator находится на верхней границе с inset `12px`.
  Контент начинается на `y=1`, имеет padding `36px` и gap `48px`: иконка
  `64×64px`, номер Source Code Pro `36/40`, gap до dots `12px`; copy использует
  Google Sans Regular `20/28` и Onest `350 16/24` с gap `12px`.
- Default роли: number/dots/body `#949EA6`, heading `#B7C0C7`. Hover роли:
  number/heading `#D3DBE0`, dots `#43A2EE`, body `#B7C0C7`; icon, grid и верхняя
  линия используют текущие hover assets/colors. Ранее утверждённая runtime
  механика и длительность `300ms Ease In` сохраняются.

## Concept V2 AI attribution frame

- Текущий exact source — `4151:854664` внутри AI `4150:804109`.
- Desktop frame имеет размер `638×89px`, фон `#14181B`, только верхний stroke
  `1px #1D2124`, padding `24px 36px 24px 40px` и gap `24px`.
- Gear использует exact полный frame `24×24px`. Текст занимает `514×40px`,
  Source Code Pro Regular `16/20`, tracking `-0.6px`, цвет `#B7C0C7`; строка
  «Без шаблонов.» фиксируется второй строкой.
- Весь desktop AI section имеет `1574×355px` в source: верхний отступ `80px`,
  центральная панель `1280×275px`, две колонки по `640px`. Copy/View и часы
  остаются исключёнными по прямому указанию пользователя.

## Соответствие code

- Master hard-parameter change распространяется на конструктивную основу всех затронутых variants.
- Skin change переносится на соответствующие visual states и semantic roles.
- Пользователь не обязан указывать внутренний code file; Codex определяет owner по фактической архитектуре.
- Shared renderer/data change дополнительно следует `docs/shared/PROJECT_CONTENT.md` и contract tests.
- Runtime scroll, route history, sticky/action-bar state machines не являются частью этого документа.

## Project visual templates

### Оболочки Hero в Concept V2

- **Верстка** — утверждённая оболочка Corvo с уже разработанной сценой внутри; изолированный просмотр `/preview/project-responsive-hero`.
- **Фикс адаптив** — утверждённая оболочка для растровых изображений; изолированные просмотры `/preview/project-raster-hero` и `/preview/project-raster-hero-variants`. Название охватывает текущий внешний вид и анимацию переключения.
- Эти имена обозначают тип оболочки, а не название проекта. Переименование не меняет геометрию, содержимое или механику.


- Утверждённый project surface — typed code-owned template, а не пользовательская Frame composition.
- Для сложных project surfaces Admin принимает утверждённый Figma Frame целиком и автоматически заполняет named content assets registry; отдельные внутренние слоты и визуальные параметры пользователю не доступны.
- Admin preview подтверждает выбранный целый source Frame, но не становится источником визуальных правил: карточка показывается в квадратном preview-контейнере, hero/canvas сохраняют пропорцию и уменьшаются до ширины редактора.
- Asset replacement сохраняет geometry, background, dots, radius, shadow, clipping и responsive behavior компонента.
- Общий Sarafan/Corvo canvas shell: ширина `1000px`, фон `#f5f6f7`, точки `#e3e6e8` диаметром `3px`, шаг `32px`.
- Sarafan model: content `888×240`, `x=56`, `y=56`.
- Sarafan scenarios: content `861×349.5`, `x=70`, `y=65`.
- Sarafan setup: desktop `603×414`, `x=68`, `y=151`; panel `464×588`, `x=480`, `y=72`, с утверждённой тенью.
- Эти параметры меняются только новым source mapping и code change; импорт нового содержимого Frame не является разрешением пересматривать дизайн.

## Gallery lightbox

- Целевой максимум увеличения изображения в публичной галерее — `×1.5` от его базового device-представления.
- Фактический масштаб — минимум из `×1.5`, доступной области viewport, intrinsic-разрешения исходного файла и device pixel ratio (DPR).
- Апскейл выше безопасного предела исходника запрещён: если плотности недостаточно, lightbox открывает изображение меньшим, без искусственного увеличения и размытия.
- Lightbox сохраняет исходную пропорцию самого файла; device-рамка и подложка галереи не переносятся в увеличенное изображение.


### Качество растровых изображений

Качество имеет приоритет перед весом. Для экранов интерфейса/схем/текста использовать полноразмерный WebP lossless только после проверки декодированного результата и реального уменьшения веса; запрещено автоматически уменьшать исходное разрешение или использовать near-lossless. Исходники сохранять. Фото и иллюстрации требуют выбора по контексту, а не общей перекодировки всех PNG. Требование автоматизации Admin и границы реализации: `docs/requirements/admin-image-quality.md` (пока не реализовано).
Hero Сараффана: runtime WebP lossless4096×2958; исходные PNG сохранены рядом. Подготовка `cwebp -lossless -exact`, без resize. Проверены декодированные растры и размеры; тест защищает VP8L и полное разрешение.

## Текущий desktop-only scope портфолио

По пользовательскому решению 2026-10-04 mobile/tablet адаптация самого портфолио исключена и удалена. Canvas минимум1280px; узкое окно не переключает главную в мобильную композицию. У главной сохранены два утверждённых desktop Hero: small и large; large включается только при width>=2313px и height>=1300px одновременно. Фейд использует --cv2-container-neutral-bg-main. Эти ограничения не относятся к проектным Hero: их адаптивы, сцены, масштаб и анимация сохраняются. Admin интегрирует входные данные готовых оболочек, не переделывает их визуальное поведение.
