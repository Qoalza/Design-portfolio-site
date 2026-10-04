# HANDOFF

Обновлено: 2026-10-04.
Checkout: `codex/redesign-portfolio`, только `/Users/designer/.codex/worktrees/redesign-portfolio/Design-portfolio-site`.

## Checkpoint

Последняя правка: цвет фейда широкого desktop Hero главной привязан к
`--cv2-container-neutral-bg-main`; форма и opacity stops сохранены.
Браузер: 1920×1080 и 2751×1500; large fade и фон имеют RGB 22/25/26.
Изменение только CSS цвета, проектные Hero не затронуты.

Единая code baseline до CSS-правки фейда: `d48bba46a8a62dc3061be51f192d573f49c9642f`.
Сверка источников завершена; названия «Верстка» / «Фикс адаптив» перенесены
в DESIGN_SYSTEM.md. Девять исторических HANDOFF исправлены в их собственных
checkout и зафиксированы отдельными documentation commits. Полная карта:
`docs/exec-plans/redesign-portfolio-variant-registry.md`.
Code baseline: 205/205 tests, lint 95 source files. Эта группа меняет только docs;
новая browser/build приёмка не выполнялась. Blocker сверки отсутствует.

## Следующее действие

После показа этой группы остановиться до следующего этапа пользователя.
Согласованные дальнейшие направления: убрать только самовольно добавленный
адаптив портфолио; подключить Admin к контенту проектов и входным данным
двух готовых Hero; подготовить routing/release и проверку сложных состояний.
Главная через Admin не редактируется. Hero и сцены сохраняются без изменения.

## Stop-lines

Нет push, merge, deploy, Figma write, очистки веток/worktree или переносов реальных
Admin data. Отсутствующие папки и страховочная история сохранены до приёмки.
USERSPACE и неизвестные untracked вне scope. Актуальный runtime нужно заново
подтвердить перед приёмкой; прежний указатель просмотра был 127.0.0.1:4193.

## Pointers

- `docs/exec-plans/redesign-portfolio-variant-registry.md`
- `design-reference/raster-hero-f7db517-2026-10-04/ACCEPTANCE.md`
- `design-reference/project-title-fidelity-2026-10-04/ACCEPTANCE.md`
- `docs/requirements/admin-image-quality.md`
