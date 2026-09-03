# Надёжная публикация Des-art Admin

Status: `COMPLETE`
Started: 2026-09-03
Branch: `codex/admin-publish-reliability`
Base: `baf7729d2568821abe304b749e029e6fb9f1a599`
Hotfix branch: `codex/admin-push-chunked-fallback`
Merge recovery branch: `codex/admin-merge-partial-success`
Runtime decoupling branch: `codex/admin-runtime-decoupling`

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

## Reopened incident: Merge partial success

### Confirmed state

- Job `1788455178086-sarafan-radio` completed `validate`, `prepare`, `checks`, `commit`, `push` and `pr`; these stages must not run again.
- Content commit `8a72ebdba1edf384f3cc444725788b9a47320a4c` is the exact head of PR #35 and remote branch `codex/content-publish-20260903-170618`.
- PR #35 is already merged into `main`; merge commit and current `origin/main` are `a54611121e2fbb010017d32ec5bfabf752541e65`.
- `gh pr merge --merge --delete-branch` returned exit 1 only after GitHub had merged the PR: `--delete-branch` also tries to delete the local branch, but local `main` is checked out in the managed repository.
- Job therefore incorrectly remains failed at `merge`, without `publishedSha`, while production remains `0cd02a9ab05bb46b862cc505e81af67382059bd4` and public `/projects/sarafan-radio` returns `404`.
- Protected manifest `/private/tmp/des-art-admin-pre-merge-audit.json` contains `245` files, aggregate SHA-256 `7e282ffaac7a703028e4eeb33d913284221228058f76ea69e9d42472fb14cf2a`; live draft remains `01bf5357649b306e03cd03e21d9ee458f4c21e353276489ce24cacb89c00aa42` with `37` draft-assets.

### Recovery milestones

7. **Merge reconciliation** — failing-first tests for an already-merged PR and a merge command that returns non-zero after GitHub success; validate exact PR base/head identity, use `--match-head-commit`, remove local/remote deletion from the merge command, fetch `origin/main`, prove content ancestry and persist both merge commit and deploy candidate SHA.
8. **Resume and deploy reconciliation** — resume against `contentCommit` before Merge and against `publishedSha` after Merge; skip Deploy when restricted `status` already reports the exact SHA; after publish success or transport failure reconcile `status` before deciding the job failed; cleanup remote/local publish refs is post-verification best effort and cannot turn a published job into a false failure.
9. **End-to-end verification** — fault-injection for Merge/Deploy/Verify partial failures, focused and full tests, lint, production build, packaged Admin parity/signing, isolated candidate sandbox, staged provenance audit and two reviews (data boundary plus full diff). Live job/resume, content deploy and public Sarafan publication remain forbidden during repair.
10. **Delivery gates** — separate commits and repair PR may proceed after verification. Merge repair code requires exact head approval. Deploy is blocked independently because current `main` already contains merged Sarafan content; no release containing that content may be deployed without a separate direct user command.
11. **Admin runtime decoupling** — package the Admin server/worker/UI and its exact shared validation modules inside the signed `.app`; for an existing live baseline keep the managed repository detached at the exact confirmed production SHA while the app executes its bundled Admin code. The first live transition keeps the stricter production-equals-`origin/main` gate. No schema/content semantics, live store, canonical content, production release or Sarafan job changes are allowed.
12. **Decoupling acceptance** — failing-first policy/package tests, a clean packaged launch against an existing live baseline whose production SHA trails `origin/main`, preview smoke verification against that production checkout, package/signature audit, full relevant tests/lint/build, live manifest parity and staged provenance review. Installation and launch of the exact merged candidate remain separately gated.

### Acceptance additions

- A non-zero `gh pr merge` cannot be treated as failure until PR state is re-read; a merged PR with exact `headRefOid` is accepted exactly once.
- Resume of the current job starts at `merge`; after reconciliation it starts at `deploy` and never repeats checks, commit, push, PR or Merge.
- `gh pr merge` never receives `--delete-branch`; it receives `--match-head-commit <contentCommit>`.
- A mismatched PR base, head branch or head SHA blocks before merge/deploy.
- Resume after a Deploy or Verify failure accepts the exact `publishedSha` checkout instead of requiring the pre-merge content commit.
- Deploy checks restricted `status` before work and after every publish outcome; an already-active exact SHA is success, while any different SHA keeps the job failed and preserves evidence.
- Draft/snapshot mutation occurs only after public verification succeeds; no repair test or candidate run uses the live support root.

Каждый milestone начинается с failing-first проверки, завершается ближайшей достаточной проверкой и отдельным commit. Изменения не переносятся в текущий пользовательский checkout.

## Acceptance criteria

- Любая ошибка команды `git push ... origin ...` не может классифицироваться как устаревший сеанс только из-за слова `origin`.
- Job хранит безопасные `failedOperation`, `failureCode`, `exitCode`, `retryable`, `attempt`, `diagnosticId`; приватный журнал имеет mode `0600` и не содержит credentials.
- Resume использует тот же `jobId`, branch и `contentCommit`; завершённые install/lint/build не повторяются при неизменных входах.
- Повторный Start с тем же SHA-256 fingerprint черновиков и копируемых assets возвращает незавершённый job вместо создания второго commit. До доказанного Merge Resume отклоняется, если fingerprint изменился; после доказанного включения exact content commit в merge SHA он продолжает сохранённый release, но не перезаписывает более новый live draft.
- Remote branch и PR переиспользуются только при однозначном совпадении; конфликт останавливает workflow.
- Автоповтор ограничен одной распознанной сетевой ошибкой; подтверждённый HTTP/2/RPC reset повторяется через HTTP/1.1 с тем же SHA.
- После каждой попытки Push Admin сверяет exact remote SHA; транспортный non-zero после фактически принятого commit не становится ложным отказом.
- Повтор после подтверждённого HTTP/RPC reset отключает chunked transfer только для bounded fallback-attempt; обычные Push не получают повышенный буфер.
- В готовности различаются configured access и фактически не проверенная загрузка Git-пакета.
- Generated app не зависит от LaunchServices `PATH`, содержит build/version SHA и проходит ad-hoc signing.
- До/после SHA live draft, всех 37 assets, snapshots, jobs и архивов совпадают.
- PR diff не содержит drafts, jobs, preview, snapshots, archives или пользовательский контент.
- Existing live Admin remains usable when `origin/main` is ahead of production: its managed repository stays at the confirmed deployed SHA while the Admin server and publish worker run from the signed application bundle.
- The application bundle contains only an explicit Admin runtime allowlist and required shared validators; it contains no canonical content, assets, drafts, jobs, snapshots, archives, credentials or `node_modules`.

## Verified command contracts

- Exact commit push uses the documented Git refspec form `<src>:<dst>`; Git permits an arbitrary object expression as `<src>` and a full destination ref: https://git-scm.com/docs/git-push.
- `http.postBuffer` выше размера POST отключает chunked transfer; Git отдельно предупреждает применять это только для подтверждённо несовместимого transport path: https://git-scm.com/docs/git-config#Documentation/git-config.txt-httppostBuffer.
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
- 2026-09-03: milestone 4 implemented. Readiness distinguishes configured access from unverified pack upload and checks GitHub identity, exact repository, write permission, `ls-remote`, host credential helper and SSH status. Generated `.app` embeds a thin native Node runtime, full build SHA and ad-hoc signature; its executable no longer reads `PATH`.
- 2026-09-03: milestone 4 focused verification: `41/41`, including execution of the embedded runtime and strict codesign verification; Admin bundle rebuilt, lint and diff check green. Installed apps and live store were not touched.
- 2026-09-03: milestone 5 full verification: complete suite `309/309`, `npm run lint`, production `npm run build` and `git diff --check` green. The generated app contains an executable embedded runtime and passes strict ad-hoc signature verification.
- 2026-09-03: candidate Admin started on isolated ports `42731/42732` with a new empty temporary support root. The page, canonical project API and readiness API responded successfully; readiness truthfully returned `configured: true`, `uploadVerified: false`, and sandbox mode. The candidate was then stopped through its authenticated local shutdown endpoint.
- 2026-09-03: post-candidate live audit matched the protected baseline by exact path, size and SHA-256 for all `237/237` files; changed, added and missing files: `0`. Sarafan draft remains `01bf5357…aa42`; draft-assets remain `37`.
- 2026-09-03: read-only application inventory found exactly one installed `/Applications/Des-art Admin.app`. Spotlight currently returns no indexed duplicate for the bundle identifier or app name; replacing/installing the candidate remains behind the exact-SHA gate.
- 2026-09-03: branch provenance audit found no canonical `content/projects`, public assets, drafts, jobs, snapshots, archives or `USERSPACE/**` in the repair diff.
- 2026-09-03: exact tested commit `d0658e8edb5f5523794ccd5c67f58cb9701a3f8b` pushed to `codex/admin-publish-reliability`; the remote ref was read back and matched exactly.
- 2026-09-03: repair PR #32 opened against `main`: https://github.com/Qoalza/Design-portfolio-site/pull/32. GitHub reports it open, non-draft, mergeable and `CLEAN`; no repository CI checks are configured for the PR.
- 2026-09-03: implementation and delivery milestones are complete. Merge, deploy and installation remain separate exact-SHA gates; `Сараффан.Радио` remains unpublished.
- 2026-09-03: post-deploy incident reopened the plan. Jobs `1788447070960-sarafan-radio` and `1788447202341-sarafan-radio` both failed the 16,758,448-byte pack at Push: attempt 1 returned `HTTP 400` / HTTP-RPC disconnect, and the HTTP/1.1 attempt 2 again ended with sideband disconnect. Neither remote branch exists; production remained unchanged.
- 2026-09-03: both failed commits have the same tree `55dcc8111034d39f7f8d6b0a90286f61cd562377` and parent `ac0a50d74c325247bdecdf5e45a16c6b1c535850`; the repeated Start created a second equivalent job rather than resuming the first. Live draft remains `01bf5357…aa42` and draft-assets remain `37`.
- 2026-09-03: hotfix RED reproduced three gaps: HTTP/1.1 sideband disconnect was classified as non-retryable `COMMAND_FAILED`, the RPC fallback retained chunked transfer, and a failed transport was not followed by exact remote-SHA reconciliation.
- 2026-09-03: hotfix implements one bounded HTTP/1.1/non-chunked retry plus exact remote-SHA reconciliation after successful and failed transport outcomes. Focused Admin publish/boundary suite `47/47`, full suite `315/315`, lint, production build and diff check are green.
- 2026-09-03: post-hotfix read-only live audit matched the protected baseline for all `233/233` non-job files. Sarafan draft is still `01bf5357…aa42`, draft-assets are still `37`; jobs and their diagnostics were preserved.
- 2026-09-03: удалены только локальные worktree и refs двух повторных failed jobs: `1f76733f65f827be328f55d40976c0007e52c0b1` и `0977c7677967833c4ed30ecba231d3ee6a248f1c`. На GitHub нет ни одной `codex/content-publish-*` ветки или PR; все пять job/diagnostic evidence сохранены. Повторная проверка `233/233` non-job файлов, live draft и `37` assets совпала.
- 2026-09-03: системная защита от дубликатов добавляет SHA-256 fingerprint exact draft/assets input. Повторный Start возвращает тот же queued/running/failed job, а Resume блокируется после изменения входных данных; новый commit создаётся только для действительно нового состояния черновика.
- 2026-09-03: incident diagnostic `5a506200-5212-4059-be70-6a1587b3c6e8` proved that `gh pr merge --merge --delete-branch` merged PR #35 and then failed while deleting the local branch because `main` is checked out in the managed repository. GitHub state is `MERGED`; exact merge/main SHA is `a54611121e2fbb010017d32ec5bfabf752541e65`.
- 2026-09-03: repair worktree `codex/admin-merge-partial-success` created from actual `origin/main` `a54611121e2fbb010017d32ec5bfabf752541e65`. Production remains `0cd02a9ab05bb46b862cc505e81af67382059bd4`, public Sarafan route remains `404`, and no live resume/deploy was run.
- 2026-09-03: milestone 7 implemented. Merge rereads and validates exact PR state after command success or failure, removes `--delete-branch`, uses `--match-head-commit`, proves content→merge→current-main ancestry and pins the release to the PR merge SHA. A clean service worktree can be realigned after partial success; a dirty one blocks. Checkout/install/lint/build checkpoints are stored per exact merge SHA, so Resume does not repeat successful work.
- 2026-09-03: milestone 8 implemented. Deploy requires exact restricted status before and after publish, reconciles transport errors, and skips an already-active SHA. Staging is isolated per job. Finalization snapshots the exact verified checkout and preserves any newer local draft instead of overwriting it; cleanup is exact-ref, post-success and best effort.
- 2026-09-03: focused Merge/Resume/Deploy/finalization suite `35/35`, Admin boundary suite `28/28`, `npm run lint`, production `npm run build`, strict app bundle verification and `git diff --check` are green. Candidate Admin started on isolated ports `42731/42732` with a new temporary support root; page, project API and sandbox readiness succeeded, then the candidate was stopped.
- 2026-09-03: full repository suite is `329/331`; the only two failures are pre-existing availability assertions that require Sarafan to be unavailable, while already-merged PR #35 makes it available in current `main`. The repair diff does not change those tests or project content. Production is still `0cd02a9…`, and no content deploy was performed.
- 2026-09-03: live safety comparison after implementation found `0/245` changed protected files; Sarafan draft remains `01bf5357…aa42` with `37` draft-assets. No live job, snapshot, archive or recovery data was modified.
- 2026-09-03: repair implementation commit `4e95088b4ea7c823156aaede481e4d15103f18d8` was pushed with exact remote-ref parity. PR #36 opened against exact base `a54611121e2fbb010017d32ec5bfabf752541e65`: https://github.com/Qoalza/Design-portfolio-site/pull/36. GitHub reports it open, non-draft and mergeable; no repository checks are configured.
- 2026-09-03: merge of PR #36 remains gated by its final exact head SHA. Deploy remains a separate blocked gate because base `main` already contains Sarafan from PR #35; no production or live Admin state was changed by delivery.
- 2026-09-03: after PR #36 was merged and exact build `0bdba1638b67d36454446104b4b7ee838ce450fd` installed, the launcher correctly refused to advance the managed repository because production remains `0cd02a9ab05bb46b862cc505e81af67382059bd4` while `origin/main` contains unpublished Sarafan. This exposed an architectural coupling: the packaged launcher still executed Admin code from the production checkout. The user explicitly approved runtime decoupling without deploying Portfolio or publishing/resuming Sarafan.
- 2026-09-03: milestone 11 implemented. Existing live policy pins the managed checkout to confirmed production in detached state while keeping fresh `origin/main` for future publish worktrees; first live transition retains the equality gate. The signed app executes an explicit bundled server/worker/UI/shared-validator allowlist and resolves native image processing from the managed dependency installation.
- 2026-09-03: decoupling verification is green: real local Git mismatch tests, exact bundle allowlist/byte-parity, native dependency loading, strict codesign and isolated bundled-server smoke. Admin/Shared suite `163/163`, focused package/policy suite `36/36`, lint and production build pass. Full suite is `337/339`; only the two already-known stale Sarafan availability assertions fail after content PR #35, outside this repair diff.
- 2026-09-03: production remains exact `0cd02a9ab05bb46b862cc505e81af67382059bd4`. Protected live comparison remains `245/245` with `0` changes; Sarafan draft is `01bf5357…aa42` and all `37` draft-assets are unchanged. No live publish/resume, content deploy, bootstrap, reset, import or export ran.
- 2026-09-03: implementation commit `88a6793` and operational documentation commit `4d1adf4` were pushed after exact remote-branch/PR absence checks. PR #37 opened against base `0bdba1638b67d36454446104b4b7ee838ce450fd`: https://github.com/Qoalza/Design-portfolio-site/pull/37. GitHub reports `OPEN`, `MERGEABLE`, `CLEAN`; merge and installation remain exact-head gates, and Portfolio deploy remains forbidden.
- 2026-09-03: after exact-head approval, PR #37 merged successfully. GitHub, fetched `origin/main` and ancestry checks agree on merge SHA `6393268ee561c8301d36acf14741600cb05d2e2a` containing exact approved head `45484ff9bdbc00a48275d624c65d7e2d8efdbaa3`.
- 2026-09-03: exact merge checkout passed production build, focused package/policy suite `36/36`, lint, bundle byte-parity and strict ad-hoc signature verification. `/Applications/Des-art Admin.app` was installed from that exact checkout; previous build `0bdba163…` remains byte-preserved as hidden backup.
- 2026-09-03: installed live Admin serves from bundled path `/Applications/Des-art Admin.app/Contents/Resources/source/tools/des-art-admin/server.mjs`. Managed repository is clean and detached at deployed production `0cd02a9ab05bb46b862cc505e81af67382059bd4`, while its `origin/main` is `6393268ee561c8301d36acf14741600cb05d2e2a`.
- 2026-09-03: isolated installed-bundle preview smoke used ports `42751/42752` and a temporary support root against the same production checkout. Preview health reported exact SHA `0cd02a9…`, and `/projects/corvo?admin-preview=1&draft=corvo` returned `200`. Temporary processes stopped; the two Next-generated test-port entries in managed `tsconfig.json` were identified exactly and restored to `HEAD`, leaving the checkout clean.
- 2026-09-03: final installed-state audit confirms production remains `0cd02a9…`; live Admin exposes the preserved Sarafan draft with 8 content sections. Protected manifest remains `245/245`, changed `0`; draft SHA `01bf5357…aa42`, draft-assets `37`. No Sarafan publish/resume or Portfolio deploy ran.
