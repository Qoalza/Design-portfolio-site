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

### Mask и color

- Для `Line`, `Duotone`, `Solid` основной Figma mechanism — `Mask` с отдельным `Color` layer.
- Color задаётся semantic/component role, а не случайным HEX внутри consumer.
- `Color` icons сохраняют fixed colors и не перекрашиваются mask.
- Совпадающий текущий цвет текста/icon не объединяет их variables/roles.

### Size и export

- Размер Mask задаётся consumer context; вложенный icon frame наследует размер.
- Сохраняются исходный viewBox/canvas, внутренние отступы и optical alignment.
- Запрещено crop/compact по path bounds и извлечение внутреннего vector вместо полного frame.
- `Line` экспортируется настоящим SVG `stroke`, не outlined `fill`.
- В `Duotone` outline остаётся stroke; fill допустим только у залитых source layers.
- `Solid/Color` используют fill только при подтверждённом consumer→source mapping.
- Сохраняются `stroke-width`, `linecap`, `linejoin`, transforms, opacity и детали.
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

## Соответствие code

- Master hard-parameter change распространяется на конструктивную основу всех затронутых variants.
- Skin change переносится на соответствующие visual states и semantic roles.
- Пользователь не обязан указывать внутренний code file; Codex определяет owner по фактической архитектуре.
- Shared renderer/data change дополнительно следует `docs/shared/PROJECT_CONTENT.md` и contract tests.
- Runtime scroll, route history, sticky/action-bar state machines не являются частью этого документа.

## Project visual templates

- Утверждённый project surface — typed code-owned template, а не пользовательская Frame composition.
- Для сложных project surfaces Admin принимает утверждённый Figma Frame целиком и автоматически заполняет named content assets registry; отдельные внутренние слоты и визуальные параметры пользователю не доступны.
- Admin preview подтверждает выбранный целый source Frame, но не становится источником визуальных правил: карточка показывается в квадратном preview-контейнере, hero/canvas сохраняют пропорцию и уменьшаются до ширины редактора.
- Asset replacement сохраняет geometry, background, dots, radius, shadow, clipping и responsive behavior компонента.
- Общий Sarafan/Corvo canvas shell: ширина `1000px`, фон `#f5f6f7`, точки `#e3e6e8` диаметром `3px`, шаг `32px`.
- Sarafan model: content `888×240`, `x=56`, `y=56`.
- Sarafan scenarios: content `861×349.5`, `x=70`, `y=65`.
- Sarafan setup: desktop `603×414`, `x=68`, `y=151`; panel `464×588`, `x=480`, `y=72`, с утверждённой тенью.
- Эти параметры меняются только новым source mapping и code change; импорт нового содержимого Frame не является разрешением пересматривать дизайн.
