# HANDOFF

Обновлено: 2026-10-01.

## Текущий checkout

- Ветка: `codex/redesign-portfolio`.
- Worktree:
  `/Users/designer/.codex/worktrees/redesign-portfolio/Design-portfolio-site`.
- Реализация: `ed14e24` (`fix(concept-v2): sync current Figma palette`).
- Рабочий план:
  `docs/exec-plans/concept-v2-current-baseline-recovery.md` (`COMPLETE`).

## Checkpoint

- Ошибочная палитра со старой базы отменена; последние исправления главной и
  Corvo восстановлены до применения текущей Figma-дельты.
- Новые нейтральные токены, прямые SVG-цвета и состояния кнопок Light/Ghost
  синхронизированы с текущей страницей «Основа».
- Projects и Process используют последнюю структуру и анимации: превью не
  режутся разделителем, hover Process не меняет геометрию и не создаёт
  отдельных цветовых «кусков».
- Corvo сохраняет исправленные сетку, сцены и прозрачный media-ассет; размеры
  и текстовые роли синхронизированы с узлом `4232:620792`.
- Прелоадер и однозначная внешняя оболочка 404 обновлены. Внутренний граф 404
  сознательно не менялся и остаётся отдельной задачей.
- Итоговые проверки реализации: `167/167` tests, lint 66 source files,
  production build и `git diff --check`. Два последовательных review закрыты.
- Актуальный локальный просмотр: `http://127.0.0.1:4189/`; вкладка оставлена
  на главной в секции Projects.

## Stop-lines

Не менять Figma, внутренний граф 404, Admin, Shared contract, `USERSPACE/**`,
`main`, production и опубликованный Next.js Portfolio. Merge, push и deploy
не входят в завершённую цель.
