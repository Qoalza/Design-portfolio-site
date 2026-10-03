# HANDOFF

Обновлено: 2026-10-04.

Checkout: `codex/redesign-portfolio`, только
`/Users/designer/.codex/worktrees/redesign-portfolio/Design-portfolio-site`.
Исправление страниц проектов завершено. План:
`docs/exec-plans/concept-v2-project-page-repair.md` (COMPLETE).

Corvo: белая Figma в метриках и одна Thin линия под hatch.
Сараффан: внешняя страница восстановлена по Figma; цветной logo в крошках и
intro сохранен; тестовая image/grid Hero сцена не менялась. Хедер и крошки
обоих проектов выезжают вместе, без изменения высоты документа.

Итоговая приемка и screenshots:
`design-reference/project-repair-2026-10-04/final/ACCEPTANCE.md`.
Проверки:210/210 tests, lint90, build; оба review; реальный runtime1440,
scroll down/up и no jump обоих проектов. Сараффан4616px, Corvo6357px.
Локальный просмотр:4193/projects/sarafan-radio и4193/projects/corvo.

Следующее действие: пользовательская визуальная приемка. Открытый blocker
отсутствует. Соседний чат/ветки/worktree не затрагивались. Production, merge,
push, deploy и Figma write не выполнялись и не разрешены этим checkpoint.
