# WORK_PACKET_POLISH — MLIR4: финальная синхронизация интерфейса и Lenis-scroll

## 1. Результат и режим

- Size: `LARGE`
- Risk: `ELEVATED`
- Mode: `FULL`
- Namespace: `MLIR4-*`
- Ветка: `codex/main-layout-interaction-polish`
- Предварительная база: `12c05c3`
- PR base: `codex/main-layout-interaction-followup`
- Evidence: `design-reference/main-layout-interaction-polish/`
- Figma: строго read-only
- Merge и deploy: запрещены
- Итог Goal: `READY_FOR_USER_REVIEW`

Цель: синхронизировать используемые стили, variables и компоненты с актуальной Figma; исправить главную, каталог проектов, action bar, sticky-навигацию и Gallery; добавить общий Tooltip и мягкий desktop-scroll через Lenis.

Не входят:

- произвольная компенсация разницы рендеринга шрифтов между Figma и браузером;
- новая mobile/tablet adaptation;
- изменение мобильной touch-прокрутки;
- декоративные parallax/reveal-эффекты;
- несвязанный рефакторинг;
- запись в Figma;
- merge и deploy.

Старые MLIR3 evidence остаются неизменяемой историей предыдущего HEAD.

## 2. Источники истины и readiness

Приоритет:

1. Этот Work Packet.
2. Актуальные instances проекта `5ZzspE0OrqesDcTP0RRPHr`.
3. Библиотека `CRcI38SOIkr5knjKXeCV5h`.
4. Runtime из точного текущего HEAD.
5. Старые документы и evidence — только диагностика.

Перед изменениями:

- подтвердить ветку, полный HEAD, remote и Draft PR предыдущей Goal;
- создать новую ветку строго от `12c05c3`, если он остаётся актуальной базой;
- определить принадлежность tracked/untracked файлов;
- не изменять и не добавлять context-transfer каталог и архив;
- создать `WORK_PACKET_POLISH.md`;
- открыть агрегатную запись MLIR4 в `DESIGN_QA.md`.

Stop-line:

- база изменилась или неоднозначна;
- обнаружены неизвестные tracked changes;
- требуется reset/rewrite;
- обязательный Figma source недоступен;
- `lenis@1.3.25` нельзя проверить или безопасно установить;
- реализация требует расширения scope, merge либо deploy.

## 3. MLIR4-SYS — стили, variables и компоненты

Сначала составить delta-inventory всех используемых сайтом:

- typography styles;
- semantic variables;
- Button и TextButton variants;
- актуальные размеры компонентов;
- Tooltip;
- иконки затронутых компонентов;
- реальные code consumers каждого источника.

Синхронизировать с актуальной библиотекой:

- перенести исправленные `Body / Medium / L` и `Body / Medium / M`, включая реальные weights;
- Body-роли используют Onest;
- Google Sans остаётся у подтверждённых heading-ролей;
- Source Code Pro сохраняется только у подтверждённых Tech-ролей;
- обновить используемые variables и component parameters;
- добавить системный размер `Large` для TextButton, а не локальный стиль одной кнопки;
- не переносить приблизительные старые значения.

Визуальная тяжесть браузерного рендеринга шрифтов остаётся отдельным наблюдением. Не компенсировать её произвольным weight, opacity, transform или letter-spacing.

После синхронизации повторно измерить переносы, высоты, центрирование и отступы затронутых компонентов.

## 4. MLIR4-HOME — главная

### Hero

Исправить `PRODUCT DESIGNER` по актуальной Figma:

- Google Sans Medium;
- `14/20`;
- актуальный letter-spacing;
- одна строка на целевом desktop viewport;
- точные gap и alignment;
- обе линии используют актуальный separation component и цвет/variable;
- остальная композиция Hero не меняется.

### Codex-блок

Использовать текст:

> Вся разработка данного сайта, кроме дизайна, была полностью выполнена мной в Codex, с нуля

Добавить после разделителя системный TextButton `Large`:

- текст `Figma`;
- точная external-link иконка;
- Onest;
- geometry и states из актуального instance;
- ссылка берётся из актуального Figma/source mapping;
- отдельная локальная разновидность кнопки запрещена.

### Резюме

Заменить подпись CTA на `Полное CV`, сохранив действующую ссылку, variant, размер и download-иконку.

## 5. MLIR4-PRJ — проекты и Tooltip

### Доступность проектов

Единственным доступным подробным проектом остаётся Corvo.

Для остальных проектов:

- не создавать активную ссылку на незавершённый detail route;
- основная кнопка — настоящее Disabled-состояние с текстом `Скоро`;
- рядом — Disabled-контрол `Файл пока недоступен`;
- ширина CTA — Hug/content width по Figma;
- direct route недоступного проекта возвращает штатный not-found;
- MDX и исходные материалы не удаляются.

Доступность route, карточки и CTA определяется единым источником данных.

### Общий Tooltip

Реализовать переиспользуемый Tooltip из library node `207:1498`. Для Disabled-кнопок `Скоро` использовать placement node `735:90306`:

- текст: `Вот-вот, горяченькое несу уже!`;
- иконка: точный `Light / Maps / Rocket`;
- актуальные фон, border, blur, radius, padding, typography и colors;
- optional title выключен;
- появление и скрытие — opacity-анимация `150 ms`;
- без дополнительного декоративного motion;
- отступ от trigger — `12 px`;
- по умолчанию левый край Tooltip совпадает с левым краем trigger;
- при правом collision выравнивание переключается на правый край;
- при вертикальном collision Tooltip переворачивается;
- Tooltip не клипуется карточкой.

Disabled-кнопка остаётся некликабельной. Hover/focus обрабатывает внешняя оболочка:

- оболочка доступна с клавиатуры;
- `role="tooltip"` и `aria-describedby`;
- touch: первый tap показывает Tooltip, tap вне области закрывает;
- detail action при этом не появляется.

Placement и взаимодействие централизованы. Будущий consumer передаёт только текст, необязательную иконку и trigger.

## 6. MLIR4-ABA — нижняя action bar

Сохранить высоту `88 px`, terminal gap `48 px` и существующую общую state machine.

### Первый кадр

Правильный вариант определяется до первого пользовательски видимого paint:

- высокий viewport сразу показывает Adaptive;
- низкий viewport сразу показывает Full;
- отсутствуют Full→Adaptive flash, blank-frame и layout shift;
- direct URL, hard reload и client navigation проверяются отдельно;
- fonts/images late loading не сбрасывают вариант через Full.

Допустим pre-paint resolver или `useLayoutEffect`, если frame-by-frame evidence подтверждает правильный первый кадр.

### Full/Adaptive contract

Full → Adaptive происходит, когда информационного блока доступно не менее `160 px`:

```text
entryPassed =
  informationTop <= viewportBottom - 160px

informationStillActive =
  informationBottom > actionBarTop

variant =
  entryPassed && informationStillActive
    ? ADAPTIVE
    : FULL
```

Все значения берутся из реальных rect и DPR-нормализуются.

Следствия:

- до появления `160 px` информации — Full;
- внутри information layout — Adaptive;
- при завершении information layout и начале Gallery — сразу Full;
- Gallery и terminal region не могут оставаться Adaptive;
- docking над Footer не меняет variant;
- terminal region всегда занимает `48 px + 88 px`;
- docking не меняет `scrollHeight`.

Запрещены timer, отдельный height-breakpoint и magic `scrollY`.

## 7. MLIR4-NAV — sticky-навигация

### Последний раздел

Последний раздел определяется структурным индексом, не строкой `Результат`.

Оставить только треть текущего раннего опережения:

```text
currentAdvance =
  max(0, currentTerminalThreshold - standardThreshold)

newAdvance =
  currentAdvance / 3

newTerminalThreshold =
  standardThreshold + newAdvance
```

При программном переходе:

- выбранный пункт фиксируется до достижения target;
- geometry tracking не может сразу переключить `Процесс` обратно на `Результат`;
- ручная прокрутка пользователя отменяет programmatic lock;
- после отмены возобновляется обычное geometry tracking.

### Конечная граница sticky

Навигация не тянется до нижнего divider.

Использовать те же canonical section anchors, по которым определяется активный раздел:

- когда anchor последнего nav item выравнивается с anchor последнего информационного раздела, навигация достигает terminal position;
- после этого она перестаёт быть sticky и движется вместе с документом;
- при обратной прокрутке остаётся в terminal position, пока header boundary не достигает верхнего рабочего отступа первого пункта;
- рабочий отступ подтверждается по Figma, ожидаемое значение — `44 px`;
- после достижения этой границы навигация снова становится sticky.

Запрещены условия по названиям разделов, document bottom и случайным offsets.

## 8. MLIR4-GAL — Gallery и lightbox

### Lightbox

Интерактивны только изображения Gallery. Верхний главный preview проекта остаётся неинтерактивным.

Клик по Gallery-карточке:

- открывает изображение в portal на `document.body`;
- использует top layer через `<dialog>.showModal()`;
- затемняет весь сайт;
- блокирует фон и его прокрутку;
- сохраняет intrinsic aspect ratio;
- не растягивает Mobile до Desktop-размера;
- закрывается кнопкой, Escape и backdrop;
- возвращает focus trigger и точную scroll position;
- повторно работает без reload.

Факт наличия dialog-компонента в коде не считается PASS: реальный click обязан открыть top-layer окно.

### Pagination

Сохранить дискретный контракт:

- движение только по измеренным допустимым offsets;
- один выраженный горизонтальный жест — один шаг;
- loop и свободный horizontal scroll отсутствуют;
- при отсутствии overflow обе стрелки Disabled;
- вертикальный жест над Gallery прокручивает страницу;
- горизонтальный жест управляет только Gallery;
- resize/DPR повторно измеряет positions и выполняет clamp без пустого пространства.

## 9. MLIR4-SCR — Lenis

Добавить точную зависимость `lenis@1.3.25`, зафиксировать её в lockfile и dependency inventory. Версия и MIT-лицензия подтверждаются по [официальному release](https://github.com/darkroomengineering/lenis/releases/tag/v1.3.25) и [репозиторию Lenis](https://github.com/darkroomengineering/lenis).

### Единый animation-frame coordinator

Использовать `lenis/react` с `autoRaf: false`.

Создать один общий `ScrollFrameCoordinator`, владеющий единственным `requestAnimationFrame`:

1. обновить root Lenis через `rootLenis.raf(timestamp)`;
2. обновить зарегистрированный Gallery Lenis;
3. после обновления scroll positions выполнить один coalesced geometry pass action bar и sticky navigation;
4. не допускать отдельных постоянных RAF-loop внутри этих подсистем.

Это устраняет конфликт разных циклов, лишние DOM measurements и возможное дрожание состояний.

### Вертикальный desktop-scroll

Root Lenis включается только при desktop layout и fine pointer:

- `smoothWheel: true`;
- `syncTouch: false`;
- `lerp: 0.1`;
- `wheelMultiplier: 1`;
- `autoRaf: false`;
- `stopInertiaOnNavigate: true`;
- без ускорения и длинного хвоста;
- сохраняется лёгкая микроинерция после wheel/trackpad gesture;
- мобильная и touch-прокрутка не меняются;
- при системном reduced-motion остаётся native scroll.

Из активного Lenis-path удалить конкурирующий `scroll-behavior: smooth`. Если Lenis не запущен, используется native fallback.

Sticky navigation, hash links и программные переходы используют тот же controller:

- переход плавный;
- пользовательский ввод сразу перехватывает управление;
- при смене route старая инерция прекращается;
- новая страница не продолжает движение предыдущей;
- при изменении desktop/fine-pointer media query controller корректно создаётся или уничтожается.

### Горизонтальная Gallery

Gallery-scoped Lenis:

- использует `autoRaf: false`;
- обновляется тем же `ScrollFrameCoordinator`;
- не получает raw gesture как свободную прокрутку;
- horizontal/vertical intent сначала классифицируется существующей механикой;
- горизонтальный жест выбирает ровно один измеренный target;
- Lenis только мягко доводит Gallery до этого target;
- стрелки используют тот же путь;
- отсутствие overflow полностью отключает движение;
- lightbox останавливает root и Gallery controllers и восстанавливает их после закрытия.

Начальное ощущение должно быть близко к официальному Lenis demo: мягкость заметна как качество, но не как отдельная тяжёлая анимация. Дальнейшая субъективная настройка силы выполняется только после пользовательской проверки preview.

## 10. Внутренние контракты

Предусмотреть строгие TypeScript interfaces:

- `ProjectAvailability`;
- `TooltipContent` и `TooltipPlacement`;
- `ActionBarMeasurement`;
- `SectionNavigationMeasurement`;
- `ScrollController`;
- `ScrollFrameSubscriber`;
- `GalleryMeasurement`.

Pure helpers не читают DOM. DOM measurements остаются в client controllers. `any` запрещён без документированной причины.

## 11. Проверки

### Focused tests

Покрыть:

- Body Medium L/M mapping;
- TextButton Large;
- project availability и route guard;
- Tooltip placement, collision и Disabled semantics;
- action bar: initial state, `160 px` entry и information exit;
- отсутствие Adaptive в Gallery;
- неизменность terminal region и `scrollHeight`;
- terminal navigation advance `/ 3`;
- programmatic lock для `Процесс`;
- sticky terminal/re-entry geometry;
- Gallery overflow/no-overflow;
- ScrollController cancel/reset;
- один RAF coordinator без двойной регистрации;
- URL regressions действующих ссылок.

### Browser verification

Chromium и Zen обязательны.

На `/` и `/projects` при `1440×900`:

- typography/components/variables;
- Hero;
- Codex-блок;
- `Полное CV`;
- availability проектов;
- Hug-width CTA;
- Tooltip hover, keyboard focus и touch emulation.

На `/projects/corvo`:

- `1280×720`;
- `1440×900`;
- `1440×999`;
- `1440×1200`;
- `1440×1356`;
- `1920×1080`.

Проверить:

- direct URL, hard reload и client navigation;
- первый кадр action bar;
- порог `160 px`;
- Adaptive только внутри information layout;
- Full в Gallery;
- sticky navigation вниз/вверх;
- клик `Процесс`;
- terminal navigation;
- Gallery arrows и horizontal gesture;
- no-overflow;
- lightbox mouse/keyboard/backdrop/Escape/focus/scroll lock;
- вертикальный wheel/trackpad Lenis;
- лёгкую остаточную микроинерцию;
- отсутствие движения после route transition;
- отсутствие двойного RAF, console, hydration и ResizeObserver ошибок;
- отсутствие заметных frame drops и задержки между gesture и реакцией.

Мобильный layout и touch-scroll не перерабатываются. Проверяется только отсутствие инициализации Lenis на coarse/touch input.

Субъективную силу сглаживания принимает пользователь на preview; исполнитель не усиливает её сверх стартового профиля.

## 12. Git и финализация

Commit boundaries:

1. `Define MLIR4 polish execution contract`
2. `Synchronize current typography variables and controls`
3. `Align homepage content and hero components`
4. `Gate unavailable projects and add shared tooltips`
5. `Restore project action bar and navigation geometry`
6. `Restore Gallery viewing and discrete interaction`
7. `Integrate Lenis with the shared scroll frame`
8. `Document MLIR4 verification evidence`

Финализация:

1. Завершить runtime.
2. Выполнить focused tests.
3. Запустить `npm run lint` и `npm run build`.
4. Зафиксировать runtime `CODE_SHA`.
5. Собрать production preview из точного `CODE_SHA`.
6. Подтвердить полный SHA в отданном HTML.
7. Выполнить свежую Chromium/Zen verification.
8. Сохранить evidence только из этого runtime.
9. Обновить `DESIGN_SYSTEM.md`, `HANDOFF.md`, `DESIGN_QA.md`, packet и evidence index.
10. Создать documentation-only `DOC_SHA`.
11. Push финального HEAD.
12. Создать один stacked Draft PR в `codex/main-layout-interaction-followup`.
13. Подтвердить local, remote и PR SHA.
14. Передать review-ссылки для `/`, `/projects` и `/projects/corvo`.
15. Перевести Work Packet в `READY_FOR_USER_REVIEW`, а MLIR4 в `DESIGN_QA.md` — в `READY_FOR_REVIEW`.

`USER_ACCEPTED`, `CLOSED`, merge и deploy без решения пользователя запрещены.

## 13. FINAL_SELF_REVIEW_1 — PASS после исправления

При финальном техническом ревью обнаружен конфликт:

- root Lenis использовал `autoRaf: true`;
- план одновременно требовал общий RAF для Gallery, action bar и navigation.

Это могло создать два независимых цикла, повторные measurements и дрожание геометрии.

Исправлено:

- `autoRaf: false`;
- один `ScrollFrameCoordinator`;
- root Lenis, Gallery и geometry subscribers обновляются в определённом порядке одним кадром;
- добавлены проверки двойной регистрации и frame drops.

## 14. FINAL_SELF_REVIEW_2 — PASS

Полный план повторно проверен после исправления. Подтверждено:

- все пользовательские правки присутствуют;
- проблема рендеринга шрифтов отделена от реальных изменений styles;
- Hero, Codex-блок и CV описаны однозначно;
- недоступные проекты не ведут на сломанные страницы;
- Tooltip имеет точные текст, иконку, placement и timing;
- Disabled-контрол не становится активным;
- action bar не прыгает и возвращается в Full перед Gallery;
- новый порог равен `160 px`;
- состояние `Процесс` остаётся достижимым;
- раннее включение `Результата` сокращено на две трети;
- sticky navigation имеет конечную границу;
- lightbox разрешён только в Gallery;
- Gallery сохраняет дискретную механику;
- Lenis не затрагивает mobile/touch-scroll;
- вертикальный и горизонтальный Lenis не создают конкурирующих циклов;
- dependency version и лицензия подтверждены официальными источниками;
- acceptance criteria наблюдаемы и проверяемы;
- старое evidence не используется для нового HEAD;
- пользовательская приёмка, merge и deploy не присваиваются автоматически.

План самосогласован, decision-complete и готов для запуска отдельной Codex Goal.
