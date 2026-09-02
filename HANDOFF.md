# HANDOFF

Обновлено: 2026-09-02.

## Checkout

- Репозиторий: `/Users/designer/Documents/GitHub/Design-portfolio-site`.
- Ветка: `codex/auto-hero-activation`; base `origin/main` — `2d83e87f90624d08e6923bdfc26ba97a54c62474`.
- Текущая Git-группа: безопасный перенос неопубликованной разницы sandbox → local live drafts.
- Protected untracked и `USERSPACE/**` не затронуты.

## Current checkpoint

- Semantic transfer сравнивает отдельные поля, visual surfaces, sections и gallery с immutable origin и current production. Конфликт, удалённый production unit или неоднозначная секция останавливают переход до archive/staging. Страница проекта теперь неделима: `detailAvailable` и hero переносятся только вместе; неполная страница не предлагается.
- Request первого перехода не доступен в Admin UI или HTTP API. Codex сначала получает явный выбор пользователя, затем отдельная локальная operator-команда сохраняет одноразовый request; сама команда не запускает Admin, archive или publish.
- Для проверки ещё не влитого candidate добавлен отдельный sandbox runner: только новый пустой support-root внутри системной temporary directory и принудительный sandbox mode. Обычный App Support, live config и production не используются.
- Launcher проверяет оба пути до archive, не запускает fallback sandbox после начала transition, а пакет Admin пересобран из актуальных исходников.
- Read-only provenance для кандидата без canonical-изменений фиксирует `noCanonicalChanges: true`; assets и неизвестные project JSON по-прежнему отклоняются.
- Правило данных неизменно: `production → local Admin`; local drafts не попадают в Git, canonical content/assets, publish или production.
- **RESOLVED candidate/runtime issue:** launcher намеренно переключает managed repository на `origin/main`; candidate теперь принимается только отдельным isolated sandbox runner, а не обычной packaged Admin. Кнопка перехода и raw transfer units удалены из Admin UI.
- Audit `origin/main..034d06a`: диапазон линейный, без merge-узлов и без изменений canonical `content/projects`/`public/assets/projects`; Hot Fix `efb1f6c` обязателен и совместим с preview-runtime.
- Первый self-review data boundary пройден: UI/server не сохраняют transition request, выбор `clean|delta` обязателен в operator-команде, и page unit не бывает частичной. Второй self-review candidate/diff/package пройден; exact read-only provenance `origin/main → candidate` подтвердил `noCanonicalChanges: true`.

## Verification

- Focused transfer/operator/boundary tests: `53/53`.
- Full repository tests: `290/290`; `npm run lint`: green; production build: green.
- Admin bundle source/package parity: green.
- Production build exact `034d06ae6f5d4e4afa70f9cd4be70cb8ac3fc1b0`: green.
- Read-only provenance `origin/main → 034d06ae6f5d4e4afa70f9cd4be70cb8ac3fc1b0`: `noCanonicalChanges: true`.

## Stop-lines

- Push, PR, merge, deploy, production mutation и публикация Sarafan не выполнялись.
- Первый запуск packaged Admin с valid `live-publish.json` всё ещё требует отдельной команды пользователя после deploy exact SHA: он работает с реальным локальным store.
- Protected untracked (`.des-art-admin-runtime-human-errors/`, `codex-context-transfer-2026-08-15/`, `codex-context-transfer-2026-08-15.zip`) и `USERSPACE/**` не читать и не трогать.

## Next action

Показать пользователю результат проверенной Git-группы и ждать отдельного решения по следующему этапу. Любые merge/push/deploy/production действия требуют отдельного прямого запроса.

## Pointers

- Admin contract: `tools/des-art-admin/SPEC.md`.
- Deploy/lifecycle: `docs/ops/DEPLOY.md`.
- Shared rule: `AGENTS.md`.
