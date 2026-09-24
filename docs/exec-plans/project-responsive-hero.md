# Desktop Corvo Responsive Hero для Concept V2

**Статус:** Complete
**Baseline:** `codex/concept-v2-routing-404` · `4205fbe`
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
  inertia `160px / 420ms` и `28px / 460ms` boundary recoil;
- focused tests, полный Concept V2 check и runtime acceptance.

## Non-scope

- интеграция в главную concept-страницу;
- изменения 404, preloader или Portfolio Next.js;
- внутренние изменения Corvo iframe;
- scenario switching, popup enlarge, tablet/mobile Portfolio;
- merge, deploy или Figma write.

## Приёмка

- title и URL однозначно показывают Concept V2 runtime;
- основная страница и 404 не импортируют Hero;
- iframe сохраняет прямой `scale(.6)`, не принимает pointer/focus;
- быстрый drag получает максимум `160px` доката; на жёсткой границе clamp
  заменяется коротким `28px` inward recoil без выхода за допустимую ширину;
- presets, keyboard resize, magnetic snap и reduced motion сохраняются;
- `npm run check` проходит, после чего выполнены два последовательных review.

## Результат проверки

- focused Hero tests `6/6`;
- полный Concept V2 check: lint, `132/132` tests, Vite build — PASS;
- runtime fast drag из desktop: полный дополнительный докат `-160px`;
- runtime release в minimum: измеренный inward recoil примерно `27px` с
  возвратом к точной границе;
- `media-campaigns`, `shared` и chrome assets совпадают с source;
- главная concept-страница и 404 не изменены;
- pre-existing High advisory относится к pinned `vite@6.4.2`, не к Motion;
  обновление Vite не входит в этот scope.
