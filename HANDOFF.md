# HANDOFF

Обновлено: 2026-09-04.

## Checkout

- Production работает на hardening merge `b499b7683f6f124b18cc790e46fe9b6e616f78cc` из PR #40; установленная Admin — на follow-up merge `fc04475955839f1d83bca93e83b20dc0efcac834` из PR #41.
- Current follow-up branch: `codex/admin-figma-hero-canvas-fix`, isolated worktree `/private/tmp/design-portfolio-admin-deploy-rollout`.
- Пользовательский checkout и `USERSPACE/**` не затронуты.

## Current checkpoint

- Deploy v2 rollout завершён; production/public/Admin smoke зелёные, `/api/changes` возвращает `0`.
- Реальный B.Off Frame выявил корневую регрессию: фиксированный template importer, введённый `437c9ca`, заменил прежний whole-Frame contract и стал отвергать Frame по числу верхнеуровневых элементов.
- В ветке `codex/admin-restore-figma-frame-contract` восстанавливается исходная модель для catalog/hero: целый Frame, произвольное число raster-элементов, root fill, constraints и CSS shadows. Section templates остаются без изменений.

## Verification

- Failing-first test воспроизвёл ошибку `incompatible proportion` для двух tight child exports разных размеров.
- Focused Figma regression: `10/10`; full repository suite: `354/354`; lint and production build pass.
- Generated Admin bundle remains byte-identical to its allowlist. Live drafts/assets/jobs/snapshots/backups were not read or changed by the implementation tests.

## Stop-lines

- Не запускать publish/resume и не деплоить Portfolio.
- Не изменять live drafts/assets/jobs/snapshots/archives и не выполнять bootstrap/reset/import/export.
- Merge и установка нового exact Admin candidate требуют отдельного подтверждения exact SHA.

## Next action

Завершить полную проверку и commit, затем запросить exact-SHA approval перед push/PR/merge и установкой новой Admin. После установки повторить импорт реального B.Off Frame. Portfolio deploy автоматически не запускать.

## Pointers

- ExecPlan: `docs/exec-plans/admin-deploy-pipeline-hardening.md`.
- Figma importer: `tools/des-art-admin/figma-template-import.mjs`.
- Preview window: `tools/des-art-admin/src/preview-window.mjs`.
