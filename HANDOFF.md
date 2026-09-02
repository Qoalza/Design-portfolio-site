# HANDOFF

Обновлено: 2026-09-02.

## Checkout

- Репозиторий: `/Users/designer/Documents/GitHub/Design-portfolio-site`.
- Ветка: `codex/auto-hero-activation`; base `origin/main` — `2d83e87f90624d08e6923bdfc26ba97a54c62474`.
- Текущая Git-группа: стабилизация deterministic `clean|overlay` live-transition, reset и текстовой истории.
- Protected untracked и `USERSPACE/**` не затронуты.

## Current checkpoint

- Request первого перехода не доступен в Admin UI или HTTP API. Codex сначала получает явный выбор пользователя, затем отдельная локальная operator-команда сохраняет одноразовый request `clean|overlay`, привязанный к full production SHA; сама команда не запускает Admin, archive или publish.
- При `overlay` production остаётся baseline, а все присутствующие sandbox project-authoring values побеждают в local live draft, включая пустые значения, удаление, visibility, порядок и placement. Jobs, previews, snapshots и runtime state остаются только в archive. Это не publish.
- Новый live store изолирован в generation. Lock защищает от одновременного запуска; после archive journal позволяет повторно активировать только ту же проверенную generation без второго archive.
- Reset виден только у изменённого production-проекта в verified live, имеет отдельное confirmation и затрагивает только его local state. В sandbox и у draft-only проекта кнопки нет.
- Cmd+Z/Shift+Cmd+Z хранят до пяти текстовых операций текущего проекта; media, Figma, структуры и action buttons не входят в историю.
- Для проверки ещё не влитого candidate добавлен отдельный sandbox runner: только новый пустой support-root внутри системной temporary directory и принудительный sandbox mode. Обычный App Support, live config и production не используются.
- Launcher проверяет выбранный путь и SHA до archive, не запускает fallback sandbox после начала transition, а пакет Admin пересобран из актуальных исходников.
- Read-only provenance для кандидата без canonical-изменений фиксирует `noCanonicalChanges: true`; assets и неизвестные project JSON по-прежнему отклоняются.
- Правило данных неизменно: `production → local Admin`; local drafts не попадают в Git, canonical content/assets, publish или production.
- UI transition и ручной field-review отсутствуют. Известная отдельная UI-проблема raw-labels `detailAvailable`/`hero` записана как `OPEN` в `DESIGN_QA.md` и не исправлялась в этой Git-группе.
- Два self-review пройдены: data/state safety выявил и устранил recovery marker/generation и stale-lock gaps; UX/candidate/docs выявил и обновил устаревший boundary-test, ожидавший удалённый manual-review flow.

## Verification

- Focused transfer/operator/core/boundary tests: green.
- Full repository tests: `290/290`; `npm run lint`: green; production build: green.
- Admin bundle source/package parity: green.
- Exact candidate SHA intentionally не записывается в self-referential handoff commit; он сообщается в финальном отчёте.

## Stop-lines

- Push, PR, merge, deploy, production mutation и публикация Sarafan не выполнялись.
- Первый запуск packaged Admin с valid `live-publish.json` всё ещё требует отдельной команды пользователя после deploy exact SHA: он работает с реальным локальным store.
- Protected untracked (`.des-art-admin-runtime-human-errors/`, `codex-context-transfer-2026-08-15/`, `codex-context-transfer-2026-08-15.zip`) и `USERSPACE/**` не читать и не трогать.

## Next action

Показать пользователю результат проверенной Git-группы и ждать отдельного решения по merge exact branch → main. Любые merge/push/deploy/production действия требуют отдельного прямого запроса.

## Pointers

- Admin contract: `tools/des-art-admin/SPEC.md`.
- Deploy/lifecycle: `docs/ops/DEPLOY.md`.
- Shared rule: `AGENTS.md`.
