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
- Внешняя оболочка сохраняет принятую Figma-геометрию, fixed `1000px` Hero,
  сценарные табы, ruler, presets, resize handle и фиксированные locks.
- Motion использует pinned `motion@13.4.2`: вязкий drag, `500ms` ease-in-out
  presets, magnetic snap и быстрый release с докатом максимум `96px` за
  `320ms`. Внутренняя Corvo-разметка motion не получает.
- Ошибочный preview из основного checkout на `3001` остановлен. Порт `4190`
  не используется, потому что Zen блокирует его как зарезервированный.
  Живой `concept-v2-routing-404` на `4189` не изменён.

## Проверка

- Focused Hero tests: `5/5`.
- Runtime: быстрый physical drag `-250px` завершился на logical width `1357`,
  что подтверждает дополнительный physical докат `-96px`.
- Полный Concept V2 check: lint, `131/131` tests и Vite build — PASS.
- Fidelity/completeness review удалил случайно перенесённые неиспользуемые
  сцены; `media-campaigns`, `shared` и chrome assets байт-в-байт совпадают с
  разрешённым source.
- Regression/scope/risk review подтвердил, что `App.jsx`, `Routing404.jsx`,
  404 runtime и главная concept-страница не изменены. `npm audit` сообщает
  один pre-existing High advisory для pinned `vite@6.4.2`; Motion новых
  advisory не добавил, Vite update оставлен отдельным scope.

## Следующее действие

Показать правильный preview пользователю и дождаться оценки motion. После
подтверждения продолжить только с переданными пользователем компонентами.

## Stop-lines

Не интегрировать Hero в concept-страницу, не менять 404/preloader, не менять
внутреннюю Corvo-разметку, не выполнять merge/deploy/Figma write.

## Pointer

- `docs/exec-plans/project-responsive-hero.md`
