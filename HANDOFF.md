# HANDOFF

Обновлено: 2026-09-26.

## Текущий checkout

- Ветка: `codex/redesign-portfolio`.
- Worktree: `/Users/designer/.codex/worktrees/redesign-portfolio/Design-portfolio-site`.
- Полный контракт: `docs/exec-plans/redesign-portfolio-consolidation.md`.

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
- Следующий checkpoint: зафиксировать реестр исторических вариантов и
  показать собранный runtime пользователю для приёмки.

## Stop-lines

Не трогать Admin, Shared contract, `USERSPACE/**`, `main`, production,
Figma, публичную страницу проекта и любые старые worktree/ветки. Очистка не
входит в эту цель.
