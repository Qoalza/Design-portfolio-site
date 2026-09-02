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
- Read-only provenance для кандидата без canonical-изменений фиксирует `noCanonicalChanges: true`; assets и неизвестные project JSON по-прежнему отклоняются.
- Правило данных неизменно: `production → local Admin`; local drafts не попадают в Git, canonical content/assets, publish или production.
- **OPEN runtime issue:** launcher намеренно переключает managed repository на `origin/main`; поэтому packaged Admin показывает raw labels `detailAvailable` и `hero` из уже опубликованного main, а не подписи из unmerged candidate. Это mismatch candidate/runtime, не ошибка данных. Не выбирать units в этом UI до отдельного кандидатского runtime-path или выпуска кода; никакие данные, архивы, publish или live transition из-за этого не выполнялись.
- Audit `origin/main..034d06a`: диапазон линейный, без merge-узлов и без изменений canonical `content/projects`/`public/assets/projects`; Hot Fix `efb1f6c` обязателен и совместим с preview-runtime.
- **OPEN release gates:** UI сохраняет transfer request напрямую, хотя действующее правило требует сначала явного выбора пути через Codex; `detailAvailable` и `hero` показаны/переносятся независимыми units, хотя составляют одну страницу проекта. Это fail-closed для production, но путь переноса delta не готов к использованию до отдельного исправления.

## Verification

- Focused transfer/bootstrap/boundary tests: `50/50`.
- Full repository tests: `282/282`; `npm run lint`: green.
- Admin bundle source/package parity: green.
- Production build exact `034d06ae6f5d4e4afa70f9cd4be70cb8ac3fc1b0`: green.
- Read-only provenance `origin/main → 034d06ae6f5d4e4afa70f9cd4be70cb8ac3fc1b0`: `noCanonicalChanges: true`.

## Stop-lines

- Push, PR, merge, deploy, production mutation и публикация Sarafan не выполнялись.
- Первый запуск packaged Admin с valid `live-publish.json` всё ещё требует отдельной команды пользователя после deploy exact SHA: он работает с реальным локальным store.
- Protected untracked (`.des-art-admin-runtime-human-errors/`, `codex-context-transfer-2026-08-15/`, `codex-context-transfer-2026-08-15.zip`) и `USERSPACE/**` не читать и не трогать.

## Next action

До merge решить и реализовать candidate runtime-path и единственный approved способ сохранить путь перехода; затем повторить exact-candidate проверки. Любые merge/push/deploy/production действия требуют отдельного прямого запроса.

## Pointers

- Admin contract: `tools/des-art-admin/SPEC.md`.
- Deploy/lifecycle: `docs/ops/DEPLOY.md`.
- Shared rule: `AGENTS.md`.
