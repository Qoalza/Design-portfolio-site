# Desktop Corvo Responsive Hero для Concept V2

**Статус:** Complete — external controls and ready Corvo scenes
**Baseline:** `codex/concept-v2-responsive-hero` · `bd66525`
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
