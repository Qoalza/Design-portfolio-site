# Concept V2 main page / Library V2 — current delta

**Статус:** `READY_FOR_REVIEW`. **Дата:** 2026-09-27.
**Runtime source:** `codex/redesign-portfolio` at `eca46ce` before this work.

## Figma → runtime mapping

| Figma source | Runtime owner | Проверяемое состояние |
|---|---|---|
| Main `3960:274722` | `App.jsx`, `style.css` | desktop sections; Hero preserves viewport behavior |
| Projects + Process `3960:274725` | `App.jsx`, project CSS | two different project cards and hover/focus |
| AI `3960:274763` | `AISection`, AI CSS | `1280×335`, top and blue information strip |
| Typography `2172:2780` | direct consumers only | Onest Regular `12/14`, `0px`, Balance |
| Library controls | `Controls.jsx`, `style.css`, `v2/*` | enable, hover, press, disabled, keyboard focus |

## Confirmed current deltas

- Semantic main-page roles: Bg-main `#14181b`, Faint `#121517`, Thin
  `#181c1f`, Soft `#1d2124`, Surface border `#272d30`, text Primary
  `#e9eef2`, Secondary `#d3dbe0`, Tertiary `#b7c0c7`, Muted `#949ea6`.
- Header brand remains an instance-specific exception: `#f0f1f2` / `#909498`.
- Disabled tabs require label `#475157` and icon `#363d42`; active tab keeps
  label primary and icon `#43a2ee`.
- Figma's Hero height is illustrative. Current runtime viewport-height behavior
  is a user-confirmed invariant and is excluded from this delta.
- Current Projects source contains Corvo and Сарафан.Радио, not two Corvo cards.
- Current AI source has a `241px` content field and `94px` blue strip; it does
  not contain the earlier ChatGPT/Codex list.

## Группа 1 — выполнено

В runtime введены подтверждённые main-page palette roles; Header brand остался
instance-specific. Library states теперь сохраняют отдельный disabled color
для label и icon таба. Проверки: targeted RED→GREEN, полный набор из 151
tests, lint, Vite production build и built-runtime smoke.

## Группа 2 — выполнено

- `ProjectCard` получает самостоятельную конфигурацию каждого проекта, поэтому
  Corvo больше не дублируется во второй колонке.
- Обе карточки используют текущую component geometry: Preview `329px`, Main
  `332px`, общая высота `661px`; categories идут отдельной строкой в
  `Source Code Pro 14/16`, а content field имеет `212px`.
- «Сараффан.Радио»: `B2B2С · EVENT`, жёлтая метка «Тестовое задание»,
  актуальный текст Figma и два локальных Figma PNG с вариантами AVIF
  `640w/1080w`. AVIF производные не содержат неподдерживаемых `clap`/`clli`
  metadata boxes.
- Прямое пользовательское уточнение для знака: использован уже реализованный
  многослойный пурпурный знак главной (`radio-logo-*`), а не зелёный вектор,
  возвращённый current Figma export. Это локальная копия только в Concept V2;
  public homepage, canonical data и её assets не менялись.
- Элементы «Подробнее» и «Figma» для Сараффан сохранены как видимые статичные
  controls с `aria-disabled`, без `href`, фокуса и вымышленных переходов.
- Проверки итогового состояния: focused project tests, полный набор `152/152`,
  lint, Vite production build, built-runtime smoke. В локальном браузере
  подтверждены обе distinct cards, title/categories/tag и отсутствие активных
  ссылок у Сараффан.

## Группа 3 — выполнено

- `AISection` mapped to Figma `3960:274763`: panel `1280×335`, content field
  `241px` with `40×56px` padding, blue information strip `94px` with
  `32×56px` padding and `28px` Codex icon. Exact hatch and icon exports are
  local in `public/figma` and used by the runtime.
- Текст нижней полосы совпадает с source: «Данный сайт был разработан с 0 в
  codex, а дизайн в Figma. Без шаблонов.» Предыдущие ChatGPT/Codex cards,
  tool list и chip удалены из DOM и styles.
- Process повторно сверена с `3960:274725`: current desktop heading/cards,
  colors и 300 ms interaction остаются в утверждённом состоянии. Experience,
  About и Footer имеют current semantic palette и не получили неподтверждённых
  визуальных изменений; scroll/timeline, viewer/deck и footer layout сохранены.
- Итоговое evidence: focused AI tests, `152/152` tests, lint, production build,
  built-runtime smoke и AX-проверка current local preview. В AX-tree есть
  одна AI panel с eyebrow, heading, intro, tech note и новой source copy;
  ChatGPT/Codex tool cards отсутствуют.

## Пользовательская визуальная сверка — 2026-09-27

После просмотра реализации пользователь уточнил четыре расхождения; исходная
приёмка выше для этих мест заменена этой записью.

- Над работами теперь статичный текст `// остальные проекты в процессе
  публикации` вместо ссылки. Current Figma node `3960:274738` всё ещё содержит
  кнопку; точное пользовательское уточнение имеет приоритет для runtime.
- Подложка изображений: в локальном radial SVG оставался `#1D1E1F`, тогда как
  current card preview и его затухание используют `#181C1F`. Обе остановки
  градиента приведены к current цвету без изменения геометрии.
- AI `3960:274763`: центральные `1280×335`, `241/94` и внутренние отступы
  совпадали с source. Ошибка была по сторонам: синий фон выходил за центральную
  полосу, а масштабирование SVG почти скрывало линии. Боковые поля теперь
  тёмные с видимой диагональной штриховкой `#1D2124` сверху и `#00345E`
  снизу. На ширине до `760px` нижний текст переносится внутри блока.
- Указатель был выключен при ширине меньше `1280px` даже для мыши. Теперь
  включается по `(pointer:fine)` и даёт hand на активных ссылках/кнопках;
  статичные недоступные действия Сараффан остаются без ложного действия.
- Все три исходных SVG иконок Process содержали старые оттенки. Current
  instances `3960:274758/760/762` подтверждены через Figma properties:
  направляющие `#2D3438`, заливка `#1D2124`, внутренние линии `#475157`,
  контур `#747F87`. Исправлены только цвета; формы и анимация не менялись.

Проверен live runtime при `1574px` (Projects, Process, AI, Experience,
About/Footer) и `900/720/375px` для указателя, переноса AI и отсутствия
горизонтального переполнения. Дополнительных подтверждённых расхождений в
этих состояниях не найдено. Hero остаётся по высоте окна согласно
пользовательскому решению. Проверки итоговой реализации: `153/153` tests,
lint, Vite production build и визуальный локальный просмотр.

## Повторная проверка подложки превью — 2026-09-27

Пользовательский снимок после первого исправления показал полосу `#1D1E1F`
под обеими фотографиями, в то время как нижняя часть карточки была
`#181C1F`. Значит, первая правка SVG не устранила видимый дефект в Zen.
У current Figma instance `3960:274740` Preview `638.5×329` и Main
`638.5×332` имеют одинаковую сплошную заливку `#181C1F`; поверх Preview
лежит радиальный градиент из прозрачного `#181C1F` в тот же непрозрачный
цвет. Runtime теперь воспроизводит его в CSS по source координатам и stops,
не зависит от загрузки прежнего SVG URL. Конечный stop hover-подсветки тоже
`#181C1F`. Проверен переход между Preview и Main в локальном браузере при
ширине `1346px`, соответствующей пользовательскому снимку.

## Разделитель проектных карточек — 2026-09-27

Пользовательский снимок выявил обрыв вертикальной линии на `48px` выше
нижнего края карточек. Current Figma `3960:274726/739` задаёт секцию
`1173px`, сетку `757px` и карточки `661px`, расположенные после `96px`
верхнего поля. Runtime ошибочно задавал секцию `1125px` и сетку `709px`:
карточки выходили за контейнер на `48px`, а псевдоэлемент-разделитель
заканчивался у границы контейнера. Высоты секции и сетки приведены к source.
В браузере нижние границы линии, сетки и карточек совпадают при `1346px`,
`1280px`, `1279px` и `900px`; на узкой одноколоночной раскладке разделитель
по-прежнему скрыт.
