# HANDOFF

Обновлено: 2026-09-04.

## Checkout

- Production работает на hardening merge `b499b7683f6f124b18cc790e46fe9b6e616f78cc` из PR #40; установленная Admin — на whole-Frame install-compat merge `728bcdcf5afb7b65253a56eda1e173e7d829bf1e` из PR #44.
- Current follow-up branch: `codex/admin-preview-current-runtime`, isolated worktree `/private/tmp/design-portfolio-admin-deploy-rollout`.
- Пользовательский checkout и `USERSPACE/**` не затронуты.

## Current checkpoint

- Deploy v2 rollout завершён; production/public/Admin smoke зелёные, `/api/changes` возвращает `0`.
- Whole-Frame import восстановлен и принят на реальном B.Off Frame: произвольное число raster-элементов, root fill, constraints и CSS shadows сохраняются.
- Project-page preview возвращает HTTP 500: production-прикреплённая локальная копия Portfolio не знает новых полей `catalogFrame`/`heroFrame`, хотя установленная Admin уже корректно их создаёт.
- В `codex/admin-preview-current-runtime` preview получает отдельную generated Git worktree на exact build SHA установленной Admin. Production checkout остаётся закреплён на production SHA; draft store, assets и baseline не перемещаются.

## Verification

- Failing-first test доказал отсутствие отдельного preview checkout на installed Admin SHA.
- Focused managed-repository/preview/boundary tests: `38/38`; full repository suite: `360/360`; lint and production build pass.
- Generated Admin bundle remains byte-identical to its allowlist. Live drafts/assets/jobs/snapshots/backups were not read or changed by the implementation tests.

## Stop-lines

- Не запускать publish/resume и не деплоить Portfolio.
- Не изменять live drafts/assets/jobs/snapshots/archives и не выполнять bootstrap/reset/import/export.
- Merge и установка нового exact Admin candidate требуют отдельного подтверждения exact SHA.

## Next action

Зафиксировать preview-runtime follow-up, затем пройти exact-SHA push/PR/merge/install gates. После успешной установки открыть project-page preview B.Off и убедиться, что маршрут возвращает 200. Portfolio deploy автоматически не запускать.

## Pointers

- ExecPlan: `docs/exec-plans/admin-deploy-pipeline-hardening.md`.
- Figma importer: `tools/des-art-admin/figma-template-import.mjs`.
- Preview window: `tools/des-art-admin/src/preview-window.mjs`.
