# HANDOFF

Обновлено: 2026-09-02.

## Checkout

- Репозиторий: `/Users/designer/Documents/GitHub/Design-portfolio-site`.
- Ветка: `codex/auto-hero-activation`; base `origin/main` — `2d83e87f90624d08e6923bdfc26ba97a54c62474`.
- Текущая Git-группа: безопасный перенос неопубликованной разницы sandbox → local live drafts.
- Protected untracked и `USERSPACE/**` не затронуты.

## Current checkpoint

- Semantic transfer сравнивает отдельные поля, visual surfaces, sections и gallery с immutable origin и current production. Конфликт, удалённый production unit или неоднозначная секция останавливают переход до archive/staging.
- Legacy sandbox без origin показывает локальную проверку; выбранный unit связан с hash exact production-цели. Изменение цели до live bootstrap также останавливает переход до archive.
- Launcher проверяет оба пути до archive, не запускает fallback sandbox после начала transition, а пакет Admin пересобран из актуальных исходников.
- Правило данных неизменно: `production → local Admin`; local drafts не попадают в Git, canonical content/assets, publish или production.

## Verification

- Focused transfer/bootstrap/boundary tests: `50/50`.
- Full repository tests: `279/279`; `npm run lint`: green.
- Admin bundle source/package parity: green.

## Stop-lines

- Push, PR, merge, deploy, production mutation и публикация Sarafan не выполнялись.
- Первый запуск packaged Admin с valid `live-publish.json` всё ещё требует отдельной команды пользователя после deploy exact SHA: он работает с реальным локальным store.
- Protected untracked (`.des-art-admin-runtime-human-errors/`, `codex-context-transfer-2026-08-15/`, `codex-context-transfer-2026-08-15.zip`) и `USERSPACE/**` не читать и не трогать.

## Next action

Выполнить второй self-review, создать локальный commit, затем production build exact commit SHA. Любые merge/push/deploy/production действия требуют отдельного прямого запроса.

## Pointers

- Admin contract: `tools/des-art-admin/SPEC.md`.
- Deploy/lifecycle: `docs/ops/DEPLOY.md`.
- Shared rule: `AGENTS.md`.
