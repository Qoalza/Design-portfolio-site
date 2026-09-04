# Восстановление production и hardening Deploy в Des-art Admin

Status: `IN_PROGRESS`
Started: 2026-09-04
Branch: `codex/admin-deploy-pipeline-hardening`
Base recovery target: `33024ec666663e97b8324d154027ea298805d04f`
Current deployed hardening release: `b499b7683f6f124b18cc790e46fe9b6e616f78cc`

## Outcome

Сначала production безопасно выравнивается на уже существующий `main` SHA `33024ec666663e97b8324d154027ea298805d04f`. Затем publish/deploy pipeline переводится на компактный runtime release, один атомарно захваченный worker и автономную server-side активацию, которая продолжается после отключения Mac или VPN.

Live drafts, draft-assets, snapshots, jobs, recovery backups и пользовательский контент не являются release input ремонта и не изменяются.

## Scope и risk

- `ADMIN + OPS`; размер `LARGE`, риск `HIGH`, режим `FULL`.
- In scope: recovery deploy exact `33024ec…`, runtime-only release artifact, Deploy v2, worker lease/heartbeat, anti-rollback, progress UI, public verification и current + 2 release retention.
- Non-scope: изменение «Сарафана», Figma source/visual design, content ownership, bootstrap/import/export/reset live store и автоматический content publish после установки ремонта. 2026-09-04 пользователь отдельно подтвердил восстановление прежнего whole-Frame contract и необходимые для этого optional `catalogFrame`/`heroFrame` поля schema v3; canonical content и live store этим изменением не мигрируются.
- Stop-lines: изменение protected manifest, неожиданный `origin/main`/production SHA, active deploy, недоказанный provenance, contract/schema expansion или sandbox/live data в Git/release input.

## User approval record

4 сентября 2026 года пользователь явно подтвердил preflight, upload, production switch, public verification и восстановление связи Admin для exact SHA `33024ec666663e97b8324d154027ea298805d04f`.

- Этот SHA уже содержит опубликованный «Сарафан» и не вносит новых изменений в его контент.
- Approval действительно только пока fresh `origin/main` равен exact target, production до операции равен ожидаемому `a54611121e2fbb010017d32ec5bfabf752541e65`, проверки проходят и protected live manifest совпадает.
- Любое расхождение останавливает recovery deploy.
- Approval не распространяется на будущий merge, server protocol/service install, packaged Admin install или deploy repair candidate: они требуют отдельного exact-SHA gate после появления проверенного candidate.
- Для Deploy v2 пользователь выбрал durable server-side operation: после принятой загрузки VPS завершает активацию независимо от Mac/VPN, а Admin восстанавливает статус того же operation.

## Protected live baseline

Зафиксировано до recovery deploy read-only проверками:

- draft `sarafan-radio`: `01bf5357649b306e03cd03e21d9ee458f4c21e353276489ce24cacb89c00aa42`;
- `draft-assets/sarafan-radio`: `37` файлов, aggregate `ce23ea5af140612cbf81953a25c766ac582e948f7e87b9215ef29fc3c53caf73`;
- `published-snapshots`: `3` файла, aggregate `30b0e5a5b8dae6b4d97dcff81c311cde6e68ea19c006c2ca9df98ff5d126fd21`;
- `jobs`: `16` файлов, aggregate `6760d8630d7771018063e2174e84eca4f5f4a71134c8db73fac1448d24315186`;
- `recovery-backups`: `2` файла, aggregate `1c66bb26a7d90af95e18020e50d4f497af245b9072711ac7615b59c549b5a5e0`;
- `jobs/recovery-backups`: `1` файл, aggregate `6a94641e25d7e9a917dab77abc7bab3c665255f6279e8c69af37b66308470700`.

Aggregates вычислены из отсортированных absolute path + SHA-256 записей. Содержимое файлов и credentials не записываются в Git или evidence.

## Confirmed recovery preflight

- Fresh GitHub `refs/heads/main`: `33024ec666663e97b8324d154027ea298805d04f`.
- Restricted production status: `a54611121e2fbb010017d32ec5bfabf752541e65`.
- `a546111…` является предком `33024ec…`.
- Public `/` и `/projects`: `200`; `/projects/sarafan-radio` возвращает title `Сараффан.Радио — Artur Designer`.
- Public homepage advertises exact current production SHA `a546111…`.
- Live config имеет mode `live`, restricted key существует. Secret values не фиксируются.

## Milestones

1. **Recovery safety** — isolated exact worktree, durable approval/evidence, protected manifests, fresh GitHub/production/public preflight and exact target build.
2. **Approved recovery deploy** — one operator-owned upload/publish outside Admin Resume, no concurrent retry, exact status/public verification and protected-manifest parity.
3. **Contract and RED tests** — versioned Deploy v2 contract, job lease/progress fields and failing-first concurrency, orphan, transport, anti-rollback, rollback, retention and public-verification tests.
4. **Compact runtime release** — Next standalone artifact with explicit allowlist, `RELEASE_MANIFEST.json`, byte count and SHA-256; no source/docs/design evidence/Admin/live data and no server `npm ci`/build.
5. **Durable Deploy v2** — restricted `upload-v2`, `start-v2`, `status-v2`; exact partial-upload validation, idempotent server operation, systemd-owned activation, readiness rollback and current + 2 retention. V1 remains temporarily rollback-compatible.
6. **Worker and UI hardening** — atomic job lease, 5-second heartbeat, 30-second orphan reconciliation, bounded timeouts, fresh-main anti-rollback and byte/phase/elapsed progress with post-success changes refresh.
7. **Verification and delivery** — full Admin/Shared tests, lint, build, shell and sandbox VPS simulation, packaged Admin sandbox, data-boundary and quality reviews, separate commits, push and PR.
8. **Gated rollout** — exact candidate merge approval, separate server protocol/service install approval, packaged Admin install without bootstrap/live-store mutation, and read-only readiness. No automatic content publication.

## Interface contract

- `POST /api/publish/resume` keeps the existing `jobId` contract and atomically claims one worker lease; duplicate calls return the same job and cannot spawn another upload.
- Job state adds `deployTargetSha`, `serverOperationId`, `deployPhase`, byte totals, elapsed timestamps and worker `{ ownerId, pid, claimedAt, heartbeatAt }` metadata. Diagnostics remain sanitized and mode `0600`.
- `upload-v2 <sha> <artifact-sha256> <bytes>` accepts one bounded archive into a unique `.part`, validates count/hash/manifest/tar safety and atomically promotes it.
- `start-v2 <sha> <artifact-sha256>` idempotently starts or returns the same durable server operation.
- `status-v2 <operation-id>` returns machine-readable queued/running/complete/failed state, safe phase, timestamps, deployed SHA and safe error code.
- Compatibility: existing `status`, `upload` and `publish` remain during rollout; old and standalone releases remain runnable for rollback.

## Acceptance

- Two simultaneous Resume requests produce one worker, archive, upload and server operation.
- Lost local worker is reconciled within 30 seconds; no job remains indefinitely `running`.
- After accepted upload/start, disconnecting VPN/Mac does not cancel activation; reconnect resumes polling the same operation.
- Deploy cannot select a saved SHA older than fresh `origin/main` and cannot move production backwards or across divergent history.
- Runtime archive is at most 75 MiB and at least 40% smaller than the 110 MiB baseline; server does not install dependencies or build source.
- Upload no-progress timeout is 90 seconds, upload hard timeout 15 minutes, server activation limit 10 minutes.
- Readiness failure restores the previous release; successful rotation preserves current + two verified rollback releases.
- Custom 404 responses are not accepted as successful project verification.
- Successful publish refreshes `/api/changes`; no stale «Есть изменения» badge remains.
- Before/after protected manifests are identical, and repair Git diff contains no content, assets, drafts, jobs, snapshots, archives, credentials or `USERSPACE/**`.

## Progress log

- 2026-09-04: isolated worktree created at exact target `33024ec…`; user checkout and protected untracked files untouched.
- 2026-09-04: protected baseline recorded; Sarafan draft is exact expected SHA and all 37 draft-assets are present.
- 2026-09-04: fresh GitHub main, restricted production status, ancestry and public routes match the approved recovery boundary.
- 2026-09-04: exact-target lint and production build passed; full suite stopped recovery deploy at `339/341` because two stale MLIR-4 expectations still described Sarafan as unpublished. Production remained on `a546111…`; no upload or switch was attempted.
- 2026-09-04: stale expectations were corrected to the already-published canonical state. Focused regression suite now passes `14/14`.
- 2026-09-04: compact standalone archive, signed release manifest, atomic publish-worker lease, 30-second orphan reconciliation and the restricted `upload-v2`/`start-v2`/`status-v2` server protocol have initial implementations. Integration, sandbox activation, UI progress and full verification remain open.
- 2026-09-04: worker and Deploy v2 are integrated. Resume reuses an accepted `serverOperationId`; merge/build and pre-start checks select fresh `origin/main`; UI shows phase and transferred bytes; successful completion refreshes projects and `/api/changes`.
- 2026-09-04: sandbox server simulation proves exact upload rejection, idempotent start, atomic activation, readiness and current + two rollback retention. Full suite passes `351/351`; lint, shell validation and production build pass.
- 2026-09-04: real standalone archive is `46,453,751` bytes (`44.3 MiB`), about 60% below the `110 MiB` baseline and below the `75 MiB` ceiling. Its SHA-256 in temporary local evidence was `bdd65b1cfb8579b75d0fa9ffec190afc36f7c431ae0b5b13340cc7cc4c3820c8`.
- 2026-09-04: no recovery deploy was executed after the exact `33024ec…` stop-line. The repair candidate is committed locally; push/PR is the next allowed action. Merge, server protocol/service installation, packaged Admin installation and production deploy remain separately gated by the future exact candidate SHA.
- 2026-09-04: second adversarial review closed two verification gaps before push: public checks now read the exact project document from the publish worktree and verify every referenced public asset; `start-v2` also serializes server-side starts with an exact operation lock. Focused checks pass `49/49`, full repository tests pass `352/352`, lint and server shell validation pass. No push or production action was performed before these fixes.
- 2026-09-04: PR #40 merged as `b499b7683f6f124b18cc790e46fe9b6e616f78cc`; Deploy v2 operation completed, public SHA/routes/assets were verified and packaged Admin exact merge SHA was installed without bootstrap or live-store mutation. Protected live manifests remained byte-identical and `/api/changes` returned zero.
- 2026-09-04: post-rollout acceptance found two Admin defects: image-filled Figma children were imported from uncropped source fills, and a failed preview request left the previous project visible in a reused window. Follow-up PR #41 merged as `fc04475955839f1d83bca93e83b20dc0efcac834` and packaged Admin exact merge SHA was installed without bootstrap or live-store mutation.
- 2026-09-04: real B.Off acceptance on `fc044759…` still failed because rendered Corvo hero children were saved at their tight individual bounds. The contract requires each Corvo hero slot to retain the full root Frame canvas and its relative placement. A new failing-first regression covers different child proportions and transparent offsets; the scoped implementation applies only to the two-slot `hero.corvo-browser`, leaving the five-slot Sarafan hero and other child templates unchanged. Focused tests pass `10/10`, full suite `354/354`, lint and production build pass. Commit/PR/merge/install and real-Frame re-acceptance remain pending.
- 2026-09-04: real B.Off acceptance exposed the deeper regression introduced by `437c9ca`: the former whole-Frame importer had been replaced with fixed template child counts. User reconfirmed the original contract: arbitrary raster count, user Frame fill, Figma constraints and CSS shadows. Branch `codex/admin-restore-figma-frame-contract` restores this behavior for catalog/hero while retaining template fallback and section templates. Focused regression tests, the full test suite, lint and production build pass. Commit, exact-SHA merge/install gates and real B.Off acceptance remain pending.
- 2026-09-04: PR #43 merged as `7e6a027bcc2256cb6422c8aadf4dd5ed484d9b8a`. First packaged install was rolled back before data mutation because preview fingerprinting incorrectly required the new Admin-only `figma-frame.mjs` inside the production-pinned managed repository. Previous Admin `2060590081…` was restored, routes returned 200 and all protected live hashes remained byte-identical. Follow-up removes only that invalid preview dependency and adds a regression check; no production deploy or data migration is involved.
- 2026-09-04: install-compat PR #44 merged as `728bcdcf5afb7b65253a56eda1e173e7d829bf1e`; packaged Admin exact merge SHA was installed and real B.Off whole-Frame import succeeded with protected live hashes unchanged.
- 2026-09-04: B.Off project-page preview then exposed a separate runtime split: Admin accepted `catalogFrame`/`heroFrame`, but Next preview still ran from the production-pinned checkout and returned HTTP 500 on those fields. The scoped follow-up gives preview an isolated checkout at the installed Admin SHA while leaving the production checkout, canonical baseline and live store untouched. Failing-first checkout coverage, focused preview tests, full `360/360` tests, lint and production build pass; commit/merge/install and real preview acceptance remain pending.
- 2026-09-04: current-runtime PR #45 merged as `da85c876e88e895eefd12136dcb237f7e1c7e7db`, but packaged acceptance found Next 16.2.10 Turbopack rejects the preview checkout's verified external `node_modules` symlink. The install was immediately rolled back to `728bcdcf…`; production stayed `b499b768…`, and the before/after aggregate of all 68 protected live files remained `eb37caefa4128b71cb0f44fc2affd2ebb4f9a9763790f562ce503007d5c43c03`.
- 2026-09-04: an isolated proof from the exact preview checkout established that Next's supported webpack dev mode works with the same dependencies and returns HTTP 200 for B.Off `/projects/boff`. The narrow follow-up explicitly selects `--webpack`; it does not copy dependencies or broaden Turbopack's filesystem root across the live support directory. Failing-first and focused `38/38` checks pass; serial full suite passes `360/360`, lint and production build pass. A first parallel full-test/build run produced one generated-bundle race, so the authoritative verification was repeated sequentially. Commit and new exact-SHA rollout gates remain pending.
