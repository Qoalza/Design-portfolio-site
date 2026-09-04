# HANDOFF

Обновлено: 2026-09-04.

## Checkout

- Production работает на hardening merge `b499b7683f6f124b18cc790e46fe9b6e616f78cc` из PR #40; установленная Admin — на whole-Frame install-compat merge `728bcdcf5afb7b65253a56eda1e173e7d829bf1e` из PR #44.
- Current follow-up branch: `codex/admin-preview-webpack`, isolated worktree `/private/tmp/design-portfolio-admin-deploy-rollout`.
- Пользовательский checkout и `USERSPACE/**` не затронуты.

## Current checkpoint

- Deploy v2 rollout завершён; production/public/Admin smoke зелёные, `/api/changes` возвращает `0`.
- Whole-Frame import восстановлен и принят на реальном B.Off Frame: произвольное число raster-элементов, root fill, constraints и CSS shadows сохраняются.
- Первый установленный current-runtime candidate `da85c876…` был откатан до приёмки: Next 16.2.10 Turbopack отклонил проверенный `node_modules`-симлинк за пределами preview checkout. Установленная Admin снова на рабочем `728bcdcf…`; production остаётся `b499b768…`; aggregate hash всех 68 защищённых live-файлов совпал до и после установки.
- Current follow-up сохраняет отдельный preview checkout на installed Admin SHA и запускает только локальный preview через поддерживаемый Next webpack dev bundler. Это не дублирует зависимости и не расширяет filesystem root Turbopack на support-каталог с live-данными.

## Verification

- Failing-first regression доказал, что preview launch обязан явно выбирать `--webpack`.
- Изолированный runtime proof с тем же внешним dependency symlink запустился за 259 ms и вернул HTTP 200 с title `B.Off — Artur Designer` для `/projects/boff`.
- Focused preview/managed-repository/boundary tests: `38/38`; serial full repository suite: `360/360`; lint and production build pass. Первый параллельный full-test/build запуск дал один bundle-race failure; последовательный контрольный прогон полностью зелёный.
- Live drafts/assets/jobs/snapshots/backups не изменены; failed app сохранён в `/private/tmp`, рабочий rollback Admin активен.

## Stop-lines

- Не запускать publish/resume и не деплоить Portfolio.
- Не изменять live drafts/assets/jobs/snapshots/archives и не выполнять bootstrap/reset/import/export.
- Merge и установка нового exact Admin candidate требуют отдельного подтверждения exact SHA.

## Next action

Завершить tests/build и commit webpack follow-up, затем пройти exact-SHA push/PR/merge/install gates. После успешной установки открыть project-page preview B.Off и убедиться, что маршрут возвращает 200. Portfolio deploy автоматически не запускать.

## Pointers

- ExecPlan: `docs/exec-plans/admin-deploy-pipeline-hardening.md`.
- Figma importer: `tools/des-art-admin/figma-template-import.mjs`.
- Preview window: `tools/des-art-admin/src/preview-window.mjs`.
