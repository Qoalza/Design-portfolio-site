# Надёжная публикация Des-art Admin

Status: `ACTIVE`
Started: 2026-09-03
Branch: `codex/admin-publish-reliability`
Base: `baf7729d2568821abe304b749e029e6fb9f1a599`

## Outcome

Des-art Admin точно классифицирует сбои публикации, сохраняет приватную очищенную диагностику и возобновляет один и тот же job без новых веток и commits. Packaged Admin запускается из Spotlight одной индексируемой копией и со своим Node runtime. Ремонт не изменяет live drafts, assets, snapshots, jobs или архивы.

## Scope

- `ADMIN`: типизированные ошибки локальной HTTP-сессии, безопасная диагностика команд, раздельные этапы Commit / Push / Pull Request и resume API/UI.
- `SHARED`: только проверки неизменности content/assets boundary; schema и project contract не меняются.
- `OPS`: readiness GitHub/Git, идемпотентные remote branch/PR операции и self-contained signed app bundle.

Размер `LARGE`, риск `HIGH`, режим `FULL`.

## Non-scope и stop-lines

- Не публиковать «Сараффан.Радио» и не переносить его draft в canonical content.
- Не менять визуал, Figma, проектный контент, `ProjectDocument` schema или ownership.
- Не выполнять bootstrap, reset, import/export и не записывать в live store во время разработки.
- Не удалять live jobs, snapshots, archives, recovery backups или draft-assets.
- Не выполнять merge, deploy или установку новой live Admin без отдельного подтверждения exact SHA.
- Остановиться при изменении live-манифеста, неожиданной remote branch/PR, изменении production SHA или необходимости менять shared contract.

## Защищённый baseline

- Exact `origin/main`: `baf7729d2568821abe304b749e029e6fb9f1a599`.
- До удаления ложных refs сохранён приватный read-only SHA-256 manifest: `/private/tmp/des-art-admin-live-manifest-before-branch-deletion.json`, mode `0600`.
- После удаления сохранён второй приватный manifest: `/private/tmp/des-art-admin-live-manifest-after-branch-deletion.json`, mode `0600`; побайтовое сравнение всех записей идентично baseline.
- Manifest SHA-256: `87ffd4b71a20ebcb74d5ef6dd28cca56afc7c777018a9fb985204dbe15e0066f`, всего `237` файлов.
- Live draft `drafts/sarafan-radio.json`: `01bf5357649b306e03cd03e21d9ee458f4c21e353276489ce24cacb89c00aa42`.
- Зафиксированы: `1` draft, `37` draft-assets, `3` published snapshots, `141` sandbox archive files, `2` recovery files, `6` repair-backup files, `27` v3-migration backup files, `16` app backup files и `4` job files.
- Все implementation и acceptance tests используют только новый sandbox support-root.

## Ложные локальные ветки

До удаления повторно подтверждено: ветки отсутствуют на `origin`, для них нет PR и отдельных worktree. Все три commits имеют parent `baf7729d2568821abe304b749e029e6fb9f1a599` и общий tree `729eb3d24e39b6a2435ee129e67e0b7380b0f387`.

| Локальная ветка | Commit | Tree |
| --- | --- | --- |
| `codex/content-publish-20260903-124215` | `108c82363944c393dd963c81bbef3cd1f6650c08` | `729eb3d24e39b6a2435ee129e67e0b7380b0f387` |
| `codex/content-publish-20260903-124310` | `5c22e9a54726be86f7538a9c4fce466497408018` | `729eb3d24e39b6a2435ee129e67e0b7380b0f387` |
| `codex/content-publish-20260903-131135` | `4326a2e5c9f15b455efb300cb28f3b55a9633af9` | `729eb3d24e39b6a2435ee129e67e0b7380b0f387` |

Refs удаляются без bundle по прямому решению пользователя. Reflog, `git gc` и job files остаются нетронутыми.

## Milestones

1. **Isolation and evidence** — isolated worktree, durable plan, before/after live manifests and removal of only the three false local refs.
2. **Typed diagnostics** — failing-first classification tests, typed local-session and publish-command errors, sanitized `0600` diagnostics and truthful Commit / Push / Pull Request stages.
3. **Resume workflow** — failing-first fault injection and idempotent resume after commit, push and PR with remote/PR conflict guards and one bounded network retry.
4. **Readiness and packaging** — explicit GitHub/repository/push/credential checks, upload-not-yet-proven state, bundled Node runtime, build SHA and ad-hoc signing.
5. **Full verification and review** — focused and full Admin/Shared tests, lint, build, candidate sandbox, LaunchServices/Spotlight check, data-manifest comparison and staged provenance audit.
6. **Delivery** — separate reviewed commits, push and repair PR. Merge/deploy/install remain gated by exact-SHA confirmation.

Каждый milestone начинается с failing-first проверки, завершается ближайшей достаточной проверкой и отдельным commit. Изменения не переносятся в текущий пользовательский checkout.

## Acceptance criteria

- Любая ошибка команды `git push ... origin ...` не может классифицироваться как устаревший сеанс только из-за слова `origin`.
- Job хранит безопасные `failedOperation`, `failureCode`, `exitCode`, `retryable`, `attempt`, `diagnosticId`; приватный журнал имеет mode `0600` и не содержит credentials.
- Resume использует тот же `jobId`, branch и `contentCommit`; завершённые install/lint/build не повторяются при неизменных входах.
- Remote branch и PR переиспользуются только при однозначном совпадении; конфликт останавливает workflow.
- Автоповтор ограничен одной распознанной сетевой ошибкой; подтверждённый HTTP/2/RPC reset повторяется через HTTP/1.1 с тем же SHA.
- В готовности различаются configured access и фактически не проверенная загрузка Git-пакета.
- Generated app не зависит от LaunchServices `PATH`, содержит build/version SHA и проходит ad-hoc signing.
- До/после SHA live draft, всех 37 assets, snapshots, jobs и архивов совпадают.
- PR diff не содержит drafts, jobs, preview, snapshots, archives или пользовательский контент.

## Verified command contracts

- Exact commit push uses the documented Git refspec form `<src>:<dst>`; Git permits an arbitrary object expression as `<src>` and a full destination ref: https://git-scm.com/docs/git-push.
- PR reconciliation uses documented `gh pr list --state all --head ... --json state,url,mergedAt` fields: https://cli.github.com/manual/gh_pr_list.

## Progress log

- 2026-09-03: fresh `origin/main` confirmed at `baf7729d2568821abe304b749e029e6fb9f1a599`; isolated worktree created.
- 2026-09-03: GitHub check found no remote branch or PR for the three false refs; managed repository has no associated worktree.
- 2026-09-03: pre-operation live manifest recorded with unchanged Sarafan draft SHA `01bf5357…aa42` and `37` draft-assets.
- 2026-09-03: удалены только три перечисленных local refs; commits сохранены как unreachable Git objects, без `gc` и очистки reflog.
- 2026-09-03: post-operation manifest совпал: `237/237` файлов, manifest SHA `87ffd4b71a20ebcb74d5ef6dd28cca56afc7c777018a9fb985204dbe15e0066f`, изменений `0`.
- 2026-09-03: milestone 2 implemented. Broad `Host|Origin|CSRF` text matching removed; local request failures are typed, publish commands persist safe failure metadata and private sanitized diagnostics, and UI exposes separate Commit / Push / Pull Request stages.
- 2026-09-03: milestone 2 verification: focused Admin core/publish/boundary suite `53/53`, Admin bundle rebuilt, `npm run lint` and `git diff --check` green.
- 2026-09-03: milestone 3 implemented. `POST /api/publish/resume` accepts only an exact failed job identity, reuses its branch/worktree/contentCommit and skips completed stages. Push reconciles the exact remote SHA, retries one recognized network failure (HTTP/2/RPC through HTTP/1.1), and PR reconciliation reuses one open/merged PR while blocking closed-unmerged or ambiguous matches.
- 2026-09-03: milestone 3 verification: fault-injection and Admin boundary/core suite `59/59`, Admin bundle rebuilt, `npm run lint` and `git diff --check` green. No live command or live store write was executed.
