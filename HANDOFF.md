# HANDOFF

Обновлено: 2026-09-01.

## Checkout

- Репозиторий: `/Users/designer/Documents/GitHub/Design-portfolio-site`.
- Ветка: `codex/admin-slot-contract`, base `e9aa5b9baa377c2872b56908284263b88468470b`.
- Завершённый workstream: `docs/exec-plans/admin-portfolio-slot-contract.md`.
- Реализация: `437c9ca`; reversible migration: `cec1d79`; финальная документация — текущий docs commit.
- Protected untracked и `USERSPACE/**` не затронуты.

## Current checkpoint

- Goal `Admin edits data, Portfolio owns visual` локально завершена; восстанавливается прежний live workflow Admin после ошибочного sandbox-only отключения.
- Portfolio и Admin используют ProjectDocument schema v3 и общий registry утверждённых templates/slots.
- Card, hero и section visuals заменяются одним read-only Figma Frame URL. Admin автоматически раскладывает Frame по скрытым slots и показывает bounded root preview; template пользователь не выбирает.
- Generic public/Admin Frame renderer удалён. Legacy v2 читается только отдельным migrator.
- Canonical Boff, Corvo и Sarafan переведены на v3. Corvo остаётся baseline; Sarafan использует code-owned catalog/home/hero и три dotted canvas templates.
- Реальный локальный Sarafan draft мигрирован на v3, повторно импортирован из пяти утверждённых Figma nodes и не опубликован.
- Gallery device slots используют независимые диапазоны ширины и высоты: Desktop `1480–2960 × 1024–2048 px`, Tablet `800–1600 × 1132–2266 px`, Mobile `360–1080 × 640–1920 px`. Первый файл фиксирует точные `Ш×В` своего пула; Portfolio вписывает его через `contain` в неизменную code-owned рамку.
- Gallery frame больше не наследует first-item исключение Corvo: clipping, radius и stroke применяются ко всем изображениям; variable-ratio media центрируется по собственным границам внутри фиксированного device slot без окрашенной letterbox-подложки.

## Verification

- Focused live bootstrap/publish/boundary tests: `30/30`.
- Full repository tests: `236/236`; `npm run lint`: green; production build: green.
- Admin bundle source/package parity: green.
- Integration-only provenance `origin/main → candidate`: green; only the declared Boff, Corvo and Sarafan v2→v3 migrations changed canonical content, with unchanged asset bytes.

## Stop-lines

- Push, PR, merge, deploy, production mutation и публикация Sarafan не выполнялись.
- Без valid local `live-publish.json` Admin остаётся sandbox. Первый valid live launch требует совпадения public `data-build-sha` с `origin/main`, единожды архивирует изолированный тестовый store и записывает v4 marker. После этого прежняя «Опубликовать» выполняет семь live-этапов; Codex не запускает её без отдельной команды.
- Figma использовалась только read-only; token остаётся в macOS Keychain и не попадает в draft/Git/backup.
- Первый запуск новой packaged Admin с valid `live-publish.json` запрещён до отдельной команды пользователя после deploy exact SHA: он архивирует реальные локальные тестовые данные и включает live.
- Protected untracked (`.des-art-admin-runtime-human-errors/`, `codex-context-transfer-2026-08-15/`, `codex-context-transfer-2026-08-15.zip`) и `USERSPACE/**` не читать и не трогать.

## Next action

Завершить two-review candidate verification и показать результат. Любые push/PR/merge/deploy/production действия требуют отдельного прямого запроса.

## Pointers

- ExecPlan: `docs/exec-plans/admin-portfolio-slot-contract.md`.
- Admin contract: `tools/des-art-admin/SPEC.md`.
- Shared contract: `docs/shared/PROJECT_CONTENT.md`.
- Portfolio runtime: `docs/portfolio/RUNTIME.md`.
- Visual contract: `DESIGN_SYSTEM.md`.
