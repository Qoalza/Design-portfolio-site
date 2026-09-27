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
