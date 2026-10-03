# HANDOFF

Обновлено: 2026-10-04.

Checkout: `codex/redesign-portfolio`, только
`/Users/designer/.codex/worktrees/redesign-portfolio/Design-portfolio-site`.
Цель активна. План: `docs/exec-plans/concept-v2-project-page-repair.md`.

Исправлены белая Figma в метриках Corvo и двойная граница под hatch.
Восстановлена внешняя страница Сараффана по текущим Figma секциям;
тестовая image/grid Hero-сцена сохранена. Добавлен ProjectHeaderShell,
выезжающий вместе с breadcrumbs на обоих проектах.

Последние проверки:210 tests, lint90. Сараффан1440: все высоты секций
совпали с макетом, общий конец4616; header0/crumb80/slot145 после прокрутки.
Evidence: `design-reference/project-repair-2026-10-04/sarafan-pinned.jpg`.

Следующее: два review (fidelity, затем regression), полная визуальная приемка
обеих страниц, scroll-return и no jump, итоговые tests/lint/build/screenshots.
До этого не завершать Goal.

Не трогать соседний чат/ветки/worktree. Experience, главную Hero, глобальный
скролл, прелоадер, принятый morph/copy/contact сохранять. Production, merge,
push, deploy и Figma write вне задачи.
