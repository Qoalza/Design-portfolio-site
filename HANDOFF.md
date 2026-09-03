# HANDOFF

Обновлено: 2026-09-03.

## Checkout

- Репозиторий: `/Users/designer/Documents/GitHub/Design-portfolio-site`.
- Изолированный worktree: `/private/tmp/design-portfolio-admin-publish-reliability`.
- Ветка: `codex/admin-publish-reliability`; base `origin/main` — `baf7729d2568821abe304b749e029e6fb9f1a599`.
- Текущий пользовательский checkout, protected untracked и `USERSPACE/**` не затронуты.

## Current checkpoint

- Активный FULL ExecPlan: `docs/exec-plans/admin-publish-reliability.md`.
- Milestone 1 завершён: созданы before/after SHA-256 manifests live Admin и удалены ровно три ложные локальные publish-ветки.
- Before/after manifest идентичен: `237` файлов, SHA `87ffd4b71a20ebcb74d5ef6dd28cca56afc7c777018a9fb985204dbe15e0066f`.
- Sarafan draft неизменен: `01bf5357649b306e03cd03e21d9ee458f4c21e353276489ce24cacb89c00aa42`; draft-assets: `37`.
- Удалённые branch names, commit SHA и общий tree SHA сохранены в ExecPlan. `git gc`, reflog cleanup и удаление job-файлов не выполнялись.
- Live Admin и live store во время этапа не запускались и не изменялись.

## Verification

- Перед удалением: отсутствуют связанные remote branches, PR и worktree.
- После удаления: три local refs отсутствуют; commits остаются восстановимыми unreachable objects.
- Live manifest comparison: `237/237`, changed files `0`.

## Stop-lines

- Live store не записывать: без bootstrap, reset, import/export и live acceptance во время разработки.
- Публикацию «Сараффан.Радио», merge, deploy и установку Admin не выполнять.
- Merge/deploy/install требуют отдельного подтверждения exact SHA.
- Остановиться при изменении live manifest, production SHA, content/schema contract или неожиданной remote branch/PR.
- Protected untracked и `USERSPACE/**` не читать и не трогать.

## Next action

Milestone 2: добавить failing-first тесты классификации, затем типизированные ошибки локальной сессии, безопасную command-диагностику и раздельные Commit / Push / Pull Request stages. Все проверки — только с временным sandbox support-root.

## Pointers

- ExecPlan: `docs/exec-plans/admin-publish-reliability.md`.
- Admin contract: `tools/des-art-admin/SPEC.md`.
- Publish worker: `tools/des-art-admin/publish-worker.mjs`.
- Human errors: `tools/des-art-admin/human-errors.mjs`.
- Server/API: `tools/des-art-admin/server.mjs`.
