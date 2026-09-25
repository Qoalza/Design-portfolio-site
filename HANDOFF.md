# HANDOFF

Обновлено: 2026-09-25.

## Текущий checkout

- Branch: `codex/concept-v2-responsive-hero`.
- Worktree: `/Users/designer/.codex/worktrees/concept-v2-responsive-hero/Design-portfolio-site`.
- Baseline: `4205fbe` (`codex/concept-v2-routing-404`).
- Development URL: `http://127.0.0.1:4173/preview/project-responsive-hero`.

## Checkpoint

- Corvo Responsive Hero перенесён из ошибочного Next.js checkout в standalone
  Concept V2 Vite app.
- Hero доступен только по изолированному preview-route и не монтируется в
  главную concept-страницу или 404.
- Готовая Corvo-сцена скопирована без внутренних изменений и отображается
  прямым `scale(.6)` в неинтерактивном iframe.
- Общий Corvo `assets/authorization/logo.svg`, используемый Media Campaigns,
  сохранён отдельно от неактивной Authorization scene и защищён focused-тестом.
- Внешняя оболочка обновлена по актуальным Figma nodes: fixed `980px` Hero,
  header `52px`, ruler `64px`, новая геометрия сценарных и размерных табов.
- Оба типа табов реализованы переиспользуемыми Library V2 components с
  точными inline SVG, typography и visual states. Hover-линия сценария
  выезжает снизу; size-tab переключается визуально без transition.
- Motion использует pinned `motion@13.4.2`: вязкий drag, `500ms` ease-in-out
  presets, magnetic snap и быстрый release с докатом максимум `160px` за
  `420ms`. На жёсткой границе вместо съеденного clamp-ом доката срабатывает
  `28px` inward recoil за `460ms`. Внутренняя Corvo-разметка motion не получает.
- Ошибочный preview из основного checkout на `3001` остановлен. Порт `4190`
  не используется, потому что Zen блокирует его как зарезервированный.
  Живой `concept-v2-routing-404` на `4189` не изменён.

## Проверка

- Focused Hero tests: `8/8`; полный Concept V2 suite: `134/134`.
- Lint и Vite production build — PASS.
- Fidelity/completeness review подтвердил актуальные Figma geometry, states,
  tokens, typography и icon contract верхней оболочки.
- Regression/scope/risk review подтвердил отсутствие изменений в Corvo scene,
  iframe geometry/source, `width.mjs`, `motion.mjs`, `App.jsx` и основной
  Concept-странице.
- Runtime: Corvo logo визуально подтверждён в `min-width`; SVG совпадает с
  разрешённым source байт-в-байт и отдаётся как `image/svg+xml`.
- Runtime: быстрый drag из desktop завершился на logical width `894`, что
  подтверждает полный дополнительный physical докат `-160px`; release в
  minimum дал измеренный inward recoil примерно `27px` и вернулся к границе.
- Полный Concept V2 check: lint, `132/132` tests и Vite build — PASS.
- Fidelity/completeness review удалил случайно перенесённые неиспользуемые
  сцены; `media-campaigns`, `shared` и chrome assets байт-в-байт совпадают с
  разрешённым source.
- Regression/scope/risk review подтвердил, что `App.jsx`, `Routing404.jsx`,
  404 runtime и главная concept-страница не изменены. `npm audit` сообщает
  один pre-existing High advisory для pinned `vite@6.4.2`; Motion новых
  advisory не добавил, Vite update оставлен отдельным scope.

## Следующее действие

Показать пользователю завершённый isolated preview. Дальнейшее scenario
switching, popup увеличения или интеграция в страницу требуют нового scope.

## Stop-lines

Не интегрировать Hero в concept-страницу, не менять 404/preloader, не менять
внутреннюю Corvo-разметку, не выполнять merge/deploy/Figma write.

## Pointer

- `docs/exec-plans/project-responsive-hero.md`
