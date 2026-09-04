# Production Deploy Runbook

## Scope

Current production release/rollback contract for `https://art-des.ru`.

Этот документ не содержит secrets, private keys, host credentials, historical smoke logs или автоматически достаточного разрешения на deploy.

## Approval boundary

Отдельный exact approval обязателен перед:

- merge в `main`;
- upload/publish exact SHA;
- production/service/Nginx/firewall/DNS/SSL mutation;
- migration real Admin data;
- rollback, если он меняет live state.

Read-only status/smoke можно выполнять в рамках diagnostic request.

Кнопка «Опубликовать» в уже переведённой в live Admin запускает пользовательскую публикацию контента и её семь отображаемых этапов. Она не является разрешением на выпуск кода Admin, на первый live bootstrap или на произвольные production-действия. Codex не нажимает её без отдельной прямой команды пользователя.

## Canonical sources

- Release выполняется OPS-оператором по exact SHA. После одноразового valid live bootstrap `tools/des-art-admin/publish-worker.mjs` также выполняет прежний пользовательский live workflow из Admin: exact worktree → checks → PR → merge → upload/deploy → public SHA/routes verification. Sandbox mode этого пути не имеет.
- Restricted server command: `tools/des-art-admin/server/art-des-publish`.
- Canonical Git base: fresh `origin/main`.
- Production release identity: full 40-character merged SHA.
- Для Admin/Shared release действует односторонняя граница данных: **`production → новая локальная Admin`; никогда `sandbox → production`.** Local drafts, draft-assets, preview overlays, jobs, snapshots, migration backups и sandbox imports не являются release input.

Если runbook конфликтует с current code/config/live read-only state, остановиться и выяснить причину.

## Release model

- Перед release operator подтверждает fresh `origin/main`, exact target SHA, required checks и read-only provenance report; sandbox data не является release input.
- Merge, push и deploy остаются отдельными explicit approvals и не запускаются Admin.
- Deploy v2 локально собирает Next standalone runtime и архивирует только standalone server, `.next/static`, `public`, `DEPLOY_SHA` и SHA-256 manifest. Исходники, docs, tests, Admin и local data в архив не входят; VPS больше не выполняет `npm ci` или `next build`.
- Ограниченный SSH key принимает `status`, `upload-v2`, `start-v2`, `status-v2`; старые `upload`/`publish` временно остаются только для совместимости rollback.
- После `start-v2` отдельный systemd job на VPS проверяет artifact, атомарно переключает `/var/www/art-des/current`, перезапускает `art-des.service`, выполняет readiness и сохраняет current + два rollback-релиза. Отключение Mac/VPN не останавливает принятую сервером операцию.
- При readiness failure предыдущий release symlink восстанавливается.

## Admin: выпуск кода и перевод в live

Это обязательный порядок для каждого release, который затрагивает Admin, Shared contract или миграции Admin. Он разделяет три разных действия, которые нельзя объединять одной командой или считать следствиями друг друга:

1. **Выпуск кода Admin** — merge и deploy exact Git SHA.
2. **Первый перевод Admin в live** — одноразовый локальный bootstrap после successful deploy этого SHA.
3. **Обычная публикация контента** — пользователь нажимает «Опубликовать» уже в live Admin.

Если перед первым live bootstrap существует test/sandbox state, запрос «перевести Admin в live» недостаточен: до любых перемещений данных оператор обязан спросить пользователя, какой из двух путей выбрать. Выбор не выводится из предыдущих действий и не выбирается автоматически.

- **Путь 1 — чистый production baseline.** Sandbox state архивируется только локально, а новая live Admin начинается исключительно с exact deployed production content/assets.
- **Путь 2 — перенести sandbox-черновики.** Production остаётся baseline, а каждый присутствующий sandbox project-authoring value побеждает production, включая пустые значения, visibility, удаление, порядок и placement. Переносятся только drafts и referenced draft-assets; jobs, preview, snapshots и runtime state остаются в archive. Это не publish: Git, canonical data/assets, deploy и production не меняются.

Путь 2 не делает manual review или conflict selection. Request `overlay` привязан к full target SHA; изменение SHA останавливает transition. Результат может быть publish-invalid draft и исправляется уже в live Admin. Только отдельная обычная кнопка «Опубликовать» позже способна выпустить эти данные.

### Непересекающиеся данные

До и во время первого bootstrap действует правило: **`production → новая локальная Admin`; никогда `sandbox → Git/main/canonical content/assets/publish/production`.**

- Production baseline — canonical `content/projects` и `public/assets` из exact deployed SHA.
- Sandbox state — `drafts`, `preview-drafts`, `draft-assets`, `published-snapshots`, `jobs`, previews, backups, локальные импорты и результаты приёмки.
- Sandbox state не добавляется в commit, PR, release archive, deploy upload, provenance evidence или canonical source.
- Наличие одинакового текста или изображений в sandbox не делает его production source. Источник подтверждается только Git SHA опубликованного Portfolio.

### A. Подготовить и проверить code candidate

До merge выполнить на exact candidate SHA:

1. Проверить `git status`, index и ownership всех tracked/untracked изменений. Не трогать чужие или protected local files.
2. Убедиться, что staged diff не содержит sandbox state, `live-publish.json`, secrets, runtime state или macOS metadata.
3. Запустить релевантные Admin/Shared tests; для изменённой логики — lint; для routes, packaging, contract или release path — production build.
4. Пересобрать Admin bundle и проверить, что packaged Admin runtime resources совпадают с source allowlist, а canonical content/assets, local store и `node_modules` отсутствуют.
5. Для initial v2→v3 integration выполнить read-only provenance `main → candidate`. Для последующих намеренных content releases этот verifier не запрещает пользовательские изменения, но provenance изменённых canonical content/assets всё равно обязателен.
6. Провести два review: сначала data boundary/rollback/bootstrap, затем полный candidate, diff, index, package и release path.

Для пользовательской проверки candidate до merge использовать только `run-candidate-sandbox.mjs` с новым пустым support-root внутри системной temporary directory. Он принудительно запускает sandbox mode и не получает доступ к normal App Support, live config или production state.

Если невозможно доказать, что changed canonical content/assets происходят из production source или осознанной live-публикации, остановиться: merge и deploy запрещены.

### B. Выпустить exact code SHA

Каждая строка ниже требует отдельного user approval; завершение предыдущей строки не даёт разрешения на следующую:

1. Fast-forward merge точной ветки candidate в `main`.
2. Push exact resulting `main` SHA.
3. Deploy этого exact SHA после fresh read-only preflight.
4. Read-only public verification: `/` возвращает полный `data-build-sha`, равный exact deployed SHA; `/projects` и затронутые routes доступны; affected flow проходит focused smoke.

Первый запуск новой packaged Admin **не** выполняется до успешного deploy и public SHA verification. Если public SHA отсутствует, короче 40 hex-символов, сайт недоступен или SHA не совпадает с fresh `origin/main`, live transition не выполняется.

### C. Однократно перевести packaged Admin в live

Этот шаг локальный, но затрагивает реальные local data, поэтому требует отдельной команды пользователя после пункта B.

Если существует test/sandbox state, Codex сначала обязан спросить и получить выбранный пользователем путь 1 или путь 2 из раздела выше, затем сохранить одноразовый local request operator-командой. Без выбора нельзя архивировать или переносить данные; Admin UI не является способом зафиксировать этот выбор. Описанная ниже последовательность — путь 1; путь 2 накладывает все присутствующие sandbox project-authoring значения из созданного local archive на production baseline и создаёт только новые live drafts. Он никогда не заменяет canonical production.

Входные условия:

- valid local `live-publish.json` с `mode: "live"`; файл остаётся только на Mac и не попадает в Git, архивы или логи;
- managed checkout чистый и указывает на fresh `origin/main`;
- `origin/main` и public `data-build-sha` совпадают полным SHA;
- managed checkout содержит canonical production projects;
- launcher и bundle соответствуют уже deployed exact SHA.

При первом подтверждённом запуске launcher выполняет строго следующую последовательность:

1. Останавливает только собственные локальные Admin/preview processes.
2. Транзакционно переносит существующее test/sandbox state (`drafts`, `preview-drafts`, `draft-assets`, `published-snapshots`, `jobs`) в новый local archive `sandbox-archive/before-production-…`.
3. При ошибке переноса возвращает уже перенесённые каталоги на прежние места; marker не создаётся.
4. Собирает отдельный generation store, затем одной атомарной записью `production-data-baseline.json` v5 переключает active store: source, exact `sourceSha`, transition ID и путь к archive.
5. Запускает Admin в mode `live`; она читает canonical исходное состояние и local drafts из active generation, а не из архива.

Архив создаётся ровно один раз. При следующих корректных live starts тот же SHA не переписывает marker и не архивирует рабочие live drafts. Новый observed production SHA обновляет только `lastObservedAt`/`sourceSha`; он не является поводом перезаписывать live drafts.

Если marker не удалось записать после успешного archive, не удалять archive. Journal сохраняет transition и generation; повторный launcher после SHA-gate продолжает только эту проверенную generation и не создаёт второй archive. Если generation не проходит проверку, launcher останавливается до ручной диагностики.

### C.1 Existing production-live baseline

Valid marker v4/v5 с `source: "production-live"` обозначает уже существующую live Admin и не является первым bootstrap. Launcher подтверждает полный public `data-build-sha`, fetch-ит fresh `origin/main` для будущего publish workflow, но закрепляет managed checkout на exact deployed SHA. `origin/main` может быть новее production; Admin runtime при этом запускается из подписанного app bundle. Marker v4 повышается только до v5 `legacy-live`:

1. Сохраняет active store root `.`, existing archive, drafts, draft-assets, previews, snapshots и jobs без перемещений или изменений.
2. Записывает подтверждённый current deployed SHA в `sourceSha` и обновляет `lastObservedAt`.
3. Не создаёт `clean|overlay` request, archive, transfer, generation или publish job.
4. Запускает только live server.

При ошибке live config, public SHA-gate, managed checkout или baseline validation launcher останавливается до старта server. Он не меняет marker/local store и не делает fallback в sandbox. Для existing v4 пути `clean` и `overlay` не спрашиваются и не допускаются.

### D. Обычная работа после live bootstrap

После marker v5 Admin связана с опубликованным Portfolio:

- пользователь редактирует реальные локальные live drafts поверх production baseline;
- обычная кнопка «Опубликовать» остаётся единственным UI-путём content release и показывает real-time этапы: `Проверка → Подготовка файлов → Lint, build и tests → Commit → Push → Pull Request → Merge → Deploy → Публичная проверка`;
- live worker использует disposable worktree от fresh `origin/main`, сохраняет `catalogOrder` и `homePlacement` при project-only publish, создаёт PR, а перед Deploy повторно выбирает fresh `origin/main` и доказывает ancestry content/merge/production SHA; сохранённый старый merge SHA не может откатить production;
- один job имеет атомарную worker lease с heartbeat; повторный Resume не создаёт второй upload. После перезапуска Admin восстанавливает `serverOperationId` и продолжает status polling той же VPS-операции;
- sandbox mode не имеет Git/PR/SSH/deploy path;
- для изменённого production-проекта доступен локальный reset только этого проекта до exact published baseline; он не публикует и не затрагивает другие drafts;
- Cmd+Z и Shift+Cmd+Z возвращают или повторяют до пяти последних текстовых действий текущего проекта; изображения, Figma, структуры и action buttons в эту историю не входят;
- Codex не запускает кнопку, не читает ключи и не выполняет content release без отдельной прямой команды пользователя.

### Stop conditions и evidence

Остановиться без merge, deploy или bootstrap при любом из условий:

- неполный/несовпадающий public SHA;
- dirty managed checkout или неясное local state;
- sandbox-derived data в candidate/release input;
- failure checks, bundle parity, provenance или public verification;
- непредвиденная schema/data migration;
- archive transaction/marker error.

Для каждого завершённого Admin release сохранить только безопасное evidence: candidate SHA, merged SHA, deployed SHA, проверки, public SHA verification и путь к local archive (без содержимого drafts/assets, секретов или host credentials). Текущий operational checkpoint — в `HANDOFF.md`; долговечный порядок — в этом разделе.

## Preflight

До mutation подтвердить:

1. explicit approved scope и exact target;
2. clean/owned worktree или worker-owned disposable worktree;
3. fresh `origin/main` и full target SHA;
4. successful required checks из exact source;
5. Admin baseline, если он требуется после release, будет подтверждён public `data-build-sha`, совпадающим с deployed SHA;
6. подтверждённый provenance каждого изменённого canonical content/assets: production source, без sandbox-derived data;
7. `gh auth status` без вывода secrets;
8. restricted SSH `status`;
9. previous release/rollback boundary;
10. отсутствие непредвиденных data/config migrations.

При любом несоответствии остановиться до merge/deploy.

## Readiness и verification

Server readiness требует:

- `art-des.service` active;
- local `127.0.0.1:3000/` отвечает;
- served homepage содержит exact full SHA.

После deploy проверить минимум:

- restricted `status` возвращает expected release SHA;
- `/`, `/projects` и релевантный `/projects/<slug>` возвращают expected successful status;
- homepage served build SHA совпадает с deployed SHA;
- affected user behavior проходит focused browser smoke;
- unexpected console/hydration errors отсутствуют для затронутого flow.

Широкий visual matrix запускается только если blast radius этого требует.

## Service diagnostics

Текущая документированная модель:

- release root: `/var/www/art-des`;
- current symlink: `/var/www/art-des/current`;
- service: `art-des.service`;
- application listens only on `127.0.0.1:3000` behind Nginx.

Read-only diagnostics:

```text
systemctl status art-des.service
journalctl -u art-des.service -n 100 --no-pager
```

Nginx reload допустим только после config test и отдельного approved mutation:

```text
nginx -t
systemctl reload nginx
```

## Rollback

Первый rollback path — вернуть `/var/www/art-des/current` на предыдущий сохранённый release и перезапустить service. Не удалять failed/new/previous releases, logs или config во время первичного восстановления.

Если проблема находится в Nginx/SSL/DNS, использовать соответствующий заранее подтверждённый rollback boundary; не импровизировать destructive cleanup.

После rollback повторно проверить service, served SHA и public routes; сохранить краткий incident outcome в `PROJECT_HISTORY.md`, если причина/решение важно для будущей диагностики.

## Volatile state

Не хранить здесь как постоянную истину:

- текущий certificate expiration;
- текущие Node/npm/Nginx patch versions;
- последний smoke timestamp;
- current release SHA;
- временные branch/PR URLs.

Эти данные получать fresh read-only preflight и при необходимости кратко указывать в `HANDOFF.md` или конкретном ExecPlan.
