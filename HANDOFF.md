# HANDOFF

Обновлено: 2026-09-04.

## Checkout

- Production работает на hardening merge `b499b7683f6f124b18cc790e46fe9b6e616f78cc` из PR #40; установленная Admin — на follow-up merge `fc04475955839f1d83bca93e83b20dc0efcac834` из PR #41.
- Current follow-up branch: `codex/admin-figma-hero-canvas-fix`, isolated worktree `/private/tmp/design-portfolio-admin-deploy-rollout`.
- Пользовательский checkout и `USERSPACE/**` не затронуты.

## Current checkpoint

- Deploy v2 rollout завершён; production/public/Admin smoke зелёные, `/api/changes` возвращает `0`.
- Первый post-rollout follow-up исправил stale preview и заменил raw image fills на rendered child exports, но реальный B.Off Frame показал оставшийся дефект: tight child bounds не совпадают с полным canvas hero.
- Текущий follow-up размещает только два слоя `hero.corvo-browser` на полном прозрачном root canvas с их Frame-relative координатами. Остальные child-шаблоны, включая пятислойный Sarafan hero, не меняются.

## Verification

- Failing-first test воспроизвёл ошибку `incompatible proportion` для двух tight child exports разных размеров.
- Focused Figma regression: `10/10`; full repository suite: `354/354`; lint and production build pass.
- Generated Admin bundle remains byte-identical to its allowlist. Live drafts/assets/jobs/snapshots/backups were not read or changed by the implementation tests.

## Stop-lines

- Не запускать publish/resume и не деплоить Portfolio.
- Не изменять live drafts/assets/jobs/snapshots/archives и не выполнять bootstrap/reset/import/export.
- Merge и установка нового exact Admin candidate требуют отдельного подтверждения exact SHA.

## Next action

Создать проверенный follow-up commit/PR, затем запросить exact-SHA approval перед merge и установкой новой Admin. После установки повторить импорт реального B.Off Frame. Portfolio deploy не требуется.

## Pointers

- ExecPlan: `docs/exec-plans/admin-deploy-pipeline-hardening.md`.
- Figma importer: `tools/des-art-admin/figma-template-import.mjs`.
- Preview window: `tools/des-art-admin/src/preview-window.mjs`.
