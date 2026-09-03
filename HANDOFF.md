# HANDOFF

Обновлено: 2026-09-03.

## Checkout

- Репозиторий: `/Users/designer/Documents/GitHub/Design-portfolio-site`.
- Изолированный worktree: `/private/tmp/design-portfolio-admin-publish-reliability`.
- Ветка: `codex/admin-publish-reliability`; base `origin/main` — `baf7729d2568821abe304b749e029e6fb9f1a599`.
- Текущий пользовательский checkout, protected untracked и `USERSPACE/**` не затронуты.

## Current checkpoint

- Активный FULL ExecPlan: `docs/exec-plans/admin-publish-reliability.md`.
- Milestones 1–4 завершены: защитные manifests/refs, диагностика, resume workflow, truthful readiness и self-contained signed app bundle.
- Before/after manifest идентичен: `237` файлов, SHA `87ffd4b71a20ebcb74d5ef6dd28cca56afc7c777018a9fb985204dbe15e0066f`.
- Sarafan draft неизменен: `01bf5357649b306e03cd03e21d9ee458f4c21e353276489ce24cacb89c00aa42`; draft-assets: `37`.
- Удалённые branch names, commit SHA и общий tree SHA сохранены в ExecPlan. `git gc`, reflog cleanup и удаление job-файлов не выполнялись.
- Live Admin и live store во время этапа не запускались и не изменялись.
- Broad text-regex больше не принимает слово `origin` в `git push` за ошибку сессии; Host/Origin/CSRF представлены отдельным типом.
- Publish command failures сохраняют только безопасные поля и diagnostic ID; очищенный журнал создаётся с mode `0600`.
- UI показывает отдельные этапы Commit, Push и Pull Request.
- `POST /api/publish/resume` продолжает exact failed job после commit; завершённые checks/commit/push пропускаются.
- Remote branch сверяется с exact content SHA; один HTTP/2/RPC reset повторяется через HTTP/1.1. Совпадающий PR переиспользуется, конфликтующие branch/PR останавливают workflow.
- Readiness проверяет identity/repository/push/ls-remote/credential helper/SSH и не заявляет успешную загрузку до реального Push.
- Generated `.app` содержит собственный thin Node runtime, build SHA и ad-hoc signature; launcher не зависит от LaunchServices `PATH`.

## Verification

- Перед удалением: отсутствуют связанные remote branches, PR и worktree.
- После удаления: три local refs отсутствуют; commits остаются восстановимыми unreachable objects.
- Live manifest comparison: `237/237`, changed files `0`.
- Milestone 2 focused Admin core/publish/boundary tests: `53/53`; Admin bundle rebuilt; lint and diff check green.
- Milestone 3 fault-injection plus Admin core/publish/boundary tests: `59/59`; Admin bundle rebuilt; lint and diff check green.
- Milestone 4 focused readiness/package suite: `41/41`; embedded runtime executed, strict codesign verification green.

## Stop-lines

- Live store не записывать: без bootstrap, reset, import/export и live acceptance во время разработки.
- Публикацию «Сараффан.Радио», merge, deploy и установку Admin не выполнять.
- Merge/deploy/install требуют отдельного подтверждения exact SHA.
- Остановиться при изменении live manifest, production SHA, content/schema contract или неожиданной remote branch/PR.
- Protected untracked и `USERSPACE/**` не читать и не трогать.

## Next action

Milestone 5: полный Admin/Shared regression, production build, candidate sandbox/LaunchServices acceptance, live before/after manifest audit и staged provenance review. Никакой установки в `/Applications` до exact-SHA gate.

## Pointers

- ExecPlan: `docs/exec-plans/admin-publish-reliability.md`.
- Admin contract: `tools/des-art-admin/SPEC.md`.
- Publish worker: `tools/des-art-admin/publish-worker.mjs`.
- Human errors: `tools/des-art-admin/human-errors.mjs`.
- Publish diagnostics: `tools/des-art-admin/publish-diagnostics.mjs`.
- Server/API: `tools/des-art-admin/server.mjs`.
