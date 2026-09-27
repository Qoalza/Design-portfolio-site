# HANDOFF

Обновлено: 2026-09-27.

## Текущий checkout

- Ветка: `codex/redesign-portfolio`.
- Worktree: `/Users/designer/.codex/worktrees/redesign-portfolio/Design-portfolio-site`.
- Базовый контракт: `docs/exec-plans/redesign-portfolio-consolidation.md`.
- Активное обновление главной: `docs/exec-plans/concept-v2-mainpage-library-refresh.md`.

## Checkpoint

- Страховочная копия всей доступной истории Redesign и двух незакоммиченных
  вариантов проверена восстановлением. Старые worktree и ветки не менялись.
- В эту ветку добавлены готовые 404 commits `f4b63e0` и `9e4660d`; focused
  404 tests прошли.
- Готовый прелоадер `fb0f744` интегрирован: `main.jsx` объединяет главную,
  `/preloader`, `/navigation-lab`, 404 и isolated Hero routes. Lint, 151
  tests, production build и built-runtime smoke прошли.
- Corvo сверена с `ba28b67`: три сцены идентичны; у Authorization сохранена
  намеренная мобильная разница оболочки. Финальный Statistics diff уже есть
  в этой линии, перенос не нужен. В браузере проверены главная, прелоадер,
  404 и переключение всех четырёх сцен.
- Реестр исторических вариантов зафиксирован в
  `docs/exec-plans/redesign-portfolio-variant-registry.md`. Runtime не
  сообщает console errors при проверке собранной линии.
- Текущий checkpoint: сборка готова к пользовательской приёмке. До отдельной
  задачи очистки старые worktree и ветки не менять.
- Current Main/Library refresh готов к пользовательской приёмке: semantic
  palette/control states, самостоятельная «Сараффан.Радио» и AI source panel
  `1280×335` реализованы. В AI нет прежнего tool list/chip; Process,
  Experience, About и Footer сохранены после точечной сверки без изменения
  scroll/viewer/hover-механик. Hero продолжает использовать высоту окна.
  Тесты `152/152`, lint, build, smoke и AX browser check current local preview
  прошли. Рабочий ledger: `docs/audits/concept-v2-mainpage-library-delta-2026-09-27.md`.

## Stop-lines

Не трогать Admin, Shared contract, `USERSPACE/**`, `main`, production,
Figma, публичную страницу проекта и любые старые worktree/ветки. Очистка не
входит в эту цель.
