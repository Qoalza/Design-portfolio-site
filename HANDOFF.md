# HANDOFF

Обновлено: 2026-09-25.

## Текущий checkout

- Branch: `codex/concept-v2-responsive-hero`.
- Worktree: `/Users/designer/.codex/worktrees/concept-v2-responsive-hero/Design-portfolio-site`.
- Baseline: `fcd0438` (`Fix Hero boundary controls and add Corvo scenes`).
- Development URL: `http://127.0.0.1:4173/preview/project-responsive-hero`.

## Checkpoint

- Hero доступен только по `/preview/project-responsive-hero`; главная
  Concept-страница и 404 не изменены.
- Внешняя оболочка сохраняет `980px` Hero, header `52px` и ruler `64px`.
- Верхние крайние разделители всегда Surface `#272d30`; scenario underline
  имеет видимый быстрый вход снизу, text-selection отключен.
- Motion сохраняет вязкий drag, preset easing, magnetic release и inertia;
  наружный ввод на min/max теперь останавливается на границе без recoil.
- Все четыре готовые сцены Corvo связаны с tab-выбором. Они перенесены из
  разрешённого source byte-to-byte и загружаются без изменения внутренних
  HTML/CSS/assets, layout, scale или breakpoint-логики.

## Проверка

- Focused Hero tests `8/8`; полный Concept V2 suite `134/134`.
- Lint, Vite production build и built runtime smoke — PASS.
- Runtime: Statistics, My Space и Authorization переключены и подтвердили
  свои URL; Authorization визуально загружен.
- Runtime: ArrowRight в max сохраняет slider на logical width `1933`.
- `diff -qr` подтвердил точное совпадение 142 Corvo source files.
- Два review-прохода: fidelity/completeness и regression/scope/risk — без
  открытых замечаний.

## Следующее действие

Показать пользователю завершённый isolated preview. Popup увеличения или
интеграция Hero в страницу требуют нового scope.

## Stop-lines

Не интегрировать Hero в concept-страницу, не менять 404/preloader, не менять
внутреннюю Corvo-разметку, не выполнять merge/deploy/Figma write.

## Pointer

- `docs/exec-plans/project-responsive-hero.md`
