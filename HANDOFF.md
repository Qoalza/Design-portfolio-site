# HANDOFF

Обновлено: 2026-09-01.

## Checkout

- Репозиторий: `/Users/designer/Documents/GitHub/Design-portfolio-site`.
- Ветка: `codex/admin-slot-contract`, base `e9aa5b9baa377c2872b56908284263b88468470b`.
- Завершённый workstream: `docs/exec-plans/admin-portfolio-slot-contract.md`.
- Реализация: `437c9ca`; reversible migration: `cec1d79`; финальная документация — текущий docs commit.
- Protected untracked и `USERSPACE/**` не затронуты.

## Current checkpoint

- Goal `Admin edits data, Portfolio owns visual` локально завершена и прошла три саморевью.
- Portfolio и Admin используют ProjectDocument schema v3 и общий registry утверждённых templates/slots.
- Card, hero и section visuals заменяются одним read-only Figma Frame URL. Admin автоматически раскладывает Frame по скрытым slots и показывает bounded root preview; template пользователь не выбирает.
- Generic public/Admin Frame renderer удалён. Legacy v2 читается только отдельным migrator.
- Canonical Boff, Corvo и Sarafan переведены на v3. Corvo остаётся baseline; Sarafan использует code-owned catalog/home/hero и три dotted canvas templates.
- Реальный локальный Sarafan draft мигрирован на v3, повторно импортирован из пяти утверждённых Figma nodes и не опубликован.
- Gallery device slots больше не требуют exact ratio: Desktop принимает отношение ширины к высоте `1–2.5`, Tablet `0.5–1`, Mobile `0.4–0.75`; Portfolio вписывает отличающиеся пропорции через `contain` в неизменную code-owned рамку.

## Verification

- Focused contract/Admin/migration tests: `62/62`.
- Full repository tests: `221/221`.
- `npm run lint`: green.
- `npm run build`: green.
- Gallery ratio-range regression checks, Admin bundle/lint и реальный Corvo/Admin visual smoke: green.
- Реальные preview routes проверены: `/`, `/projects`, `/projects/corvo`, `/projects/sarafan-radio`.
- Temporary-store backup → apply → rollback → apply: green.
- Real backup: `/Users/designer/Library/Application Support/Des-art Admin/v3-migration-backups/20260901T121213552Z`.

## Stop-lines

- Push, PR, merge, deploy, production mutation и публикация Sarafan не выполнялись.
- Figma использовалась только read-only; token остаётся в macOS Keychain и не попадает в draft/Git/backup.
- Packaged Admin использует старый managed checkout `96cabb7f80ad3f20afd07c5d54ad245a09495142`. Его нельзя запускать после schema-v3 migration реального draft до merge v3-кода. Для локальной работы использовать Admin из этой workspace-ветки в sandbox mode.
- Protected untracked (`.des-art-admin-runtime-human-errors/`, `codex-context-transfer-2026-08-15/`, `codex-context-transfer-2026-08-15.zip`) и `USERSPACE/**` не читать и не трогать.

## Next action

Пользовательская локальная приёмка текущей ветки. Любые push/PR/merge/deploy/production действия требуют отдельного прямого запроса.

## Pointers

- ExecPlan: `docs/exec-plans/admin-portfolio-slot-contract.md`.
- Admin contract: `tools/des-art-admin/SPEC.md`.
- Shared contract: `docs/shared/PROJECT_CONTENT.md`.
- Portfolio runtime: `docs/portfolio/RUNTIME.md`.
- Visual contract: `DESIGN_SYSTEM.md`.
