# HANDOFF

Обновлено: 2026-09-27.

## Текущий checkout

- Ветка: `codex/redesign-portfolio`.
- Worktree: `/Users/designer/.codex/worktrees/redesign-portfolio/Design-portfolio-site`.
- Контракт и история сборки: `docs/exec-plans/redesign-portfolio-consolidation.md`.

## Checkpoint

- Локальный Concept V2 объединяет главную, страницу Corvo, 404, прелоадер,
  изолированный Hero preview и четыре сцены Corvo.
- Страница Corvo перенесена из `codex/redesign-project-page` (`44bafef`):
  карточка главной открывает `/projects/corvo`, ссылка «Главная» возвращает
  обратно, прямой вход на проект проходит через прелоадер.
- 160 tests, lint и Vite build прошли. В браузере проверены главная → Corvo →
  главная, прямой вход на Corvo, 404 и сцена Statistics. Текущая сборка
  доступна локально на `http://127.0.0.1:4191/` для визуальной приёмки.
- Исправлен скачок из «Обо мне» в незавершённый путь опыта после закрытия фото:
  блок опыта сохраняет геометрию при временной блокировке прокрутки. В браузере
  проверены открытие/закрытие фото и сохранение позиции секции.
- Текущая главная и её отдельный аудит:
  `docs/audits/concept-v2-mainpage-library-delta-2026-09-27.md`.

## Stop-lines

Не трогать Admin, Shared contract, `USERSPACE/**`, `main`, production,
Figma, опубликованный Next.js Portfolio и старые worktree/ветки. Очистка и
deploy не входят в эту цель.
