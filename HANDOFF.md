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
- Первая и вторая группы current Main/Library refresh завершены: semantic
  palette/control states и Projects. В Projects дублирование Corvo заменено
  «Сараффан.Радио» с локальными Figma media и статичными actions без ссылок.
  Знак взят из уже реализованной главной по прямому указанию пользователя.
  152 tests, lint, build, smoke и AX browser check прошли. Следующая группа:
  AI и только подтверждённые локальные детали Process, Experience, About и
  Footer.

## Stop-lines

Не трогать Admin, Shared contract, `USERSPACE/**`, `main`, production,
Figma, публичную страницу проекта и любые старые worktree/ветки. Очистка не
входит в эту цель.
