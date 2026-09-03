# HANDOFF

Обновлено: 2026-09-03.

## Checkout

- Admin runtime decoupling merged into `main` at `6393268ee561c8301d36acf14741600cb05d2e2a` via PR #37.
- Protected пользовательский checkout и `USERSPACE/**` не затронуты.

## Current checkpoint

- FULL ExecPlan `docs/exec-plans/admin-publish-reliability.md` завершён.
- Root cause после установки repair Admin: launcher исполнял server из managed Portfolio checkout и требовал production SHA == `origin/main`; после merge repair это невозможно без запрещённого deploy Сарафана.
- Исправление разделяет runtime и data baseline: signed `.app` содержит allowlisted Admin server/worker/UI/shared validators, а existing live managed repository остаётся detached на exact deployed production SHA.
- Первый live transition по-прежнему требует production SHA == `origin/main`; schema/content contract не менялся.
- `/Applications/Des-art Admin.app` установлен из exact merge SHA `6393268ee561c8301d36acf14741600cb05d2e2a` и запускает bundled server. Managed repository чистый и detached на production `0cd02a9ab05bb46b862cc505e81af67382059bd4`; Сарафан не деплоился.
- Protected live manifest: `245/245`, changed `0`; Sarafan draft `01bf5357649b306e03cd03e21d9ee458f4c21e353276489ce24cacb89c00aa42`, draft-assets `37`.

## Verification

- Failing-first policy/package checks reproduced missing runtime decoupling.
- Existing-live integration uses a real local Git remote: production checkout remains at the older SHA while fetched `origin/main` advances; first live transition rejects the same mismatch.
- Bundled runtime starts from generated `.app` in an isolated temporary support root and serves page/projects/readiness; native image processor resolves successfully.
- Bundle source is byte-identical to its explicit 18-file runtime/shared allowlist plus metadata and contains no canonical content/assets, local store or full `node_modules`.
- Admin/Shared focused suite: `163/163`; decoupling/package suite: `36/36`; lint, production build, strict ad-hoc codesign and diff check pass.
- Full repository suite: `337/339`; only the two pre-existing `mlir4-project-availability` assertions fail because merged PR #35 made canonical Sarafan available. Repair diff does not change those tests or content.

## Stop-lines

- Не запускать publish/resume job Сарафана и не деплоить Portfolio.
- Не изменять live drafts/assets/jobs/snapshots/archives и не выполнять bootstrap/reset/import/export.
- Merge и установка exact candidate требуют отдельного подтверждения exact SHA.
- Остановиться при изменении live manifest, production SHA, schema/content contract или неожиданной branch/PR.

## Next action

Ремонт завершён. Публикацию/возобновление job «Сараффан.Радио» запускает только пользователь отдельным действием; Codex её не выполнял.

## Pointers

- ExecPlan: `docs/exec-plans/admin-publish-reliability.md`.
- Launcher policy: `tools/des-art-admin/launcher-policy.mjs`.
- Managed checkout: `tools/des-art-admin/managed-repository.mjs`.
- Packager: `tools/des-art-admin/build.mjs`.
