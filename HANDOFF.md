# HANDOFF

Обновлено: 2026-09-04.

## Checkout

- Production и установленная Admin работают на hardening merge `b499b7683f6f124b18cc790e46fe9b6e616f78cc` из PR #40.
- Follow-up branch: `codex/admin-preview-figma-import-fix`, isolated worktree `/private/tmp/design-portfolio-admin-deploy-rollout`.
- Пользовательский checkout и `USERSPACE/**` не затронуты.

## Current checkpoint

- Deploy v2 rollout завершён; production/public/Admin smoke зелёные, `/api/changes` возвращает `0`.
- Post-rollout acceptance обнаружила два локальных Admin-дефекта: импорт image-fill игнорировал Figma crop, а failed preview оставлял старый проект в reused window.
- Локальный follow-up исправляет оба поведения без изменения schema, визуала, canonical content или live store.

## Verification

- Failing-first tests reproduced uncropped fill import and stale reused preview.
- Focused regression: `16/16`; full repository suite: `353/353`; lint and production build pass.
- Generated Admin bundle remains byte-identical to its allowlist. Live drafts/assets/jobs/snapshots/backups were not read or changed by the implementation tests.

## Stop-lines

- Не запускать publish/resume и не деплоить Portfolio.
- Не изменять live drafts/assets/jobs/snapshots/archives и не выполнять bootstrap/reset/import/export.
- Merge и установка нового exact Admin candidate требуют отдельного подтверждения exact SHA.

## Next action

Создать проверенный follow-up commit/PR, затем запросить exact-SHA approval перед merge и установкой новой Admin. Portfolio deploy не требуется.

## Pointers

- ExecPlan: `docs/exec-plans/admin-deploy-pipeline-hardening.md`.
- Figma importer: `tools/des-art-admin/figma-template-import.mjs`.
- Preview window: `tools/des-art-admin/src/preview-window.mjs`.
