# HANDOFF

Обновлено: 2026-09-01.

## Checkout

- Репозиторий: `/Users/designer/Documents/GitHub/Design-portfolio-site`.
- Активная ветка: `codex/admin-slot-contract`, создана от `e9aa5b9baa377c2872b56908284263b88468470b`.
- Активный workstream: `docs/exec-plans/admin-portfolio-slot-contract.md`.
- Packaged Admin использует отдельный managed checkout на `96cabb7f80ad3f20afd07c5d54ad245a09495142`; после миграции реального draft его не запускать до merge.
- Перед действием перепроверять exact `HEAD`, branch и status.
- Protected untracked, не читать и не трогать:
  - `.des-art-admin-runtime-human-errors/`;
  - `codex-context-transfer-2026-08-15/`;
  - `codex-context-transfer-2026-08-15.zip`.
- `USERSPACE/**` не читать и не трогать без прямого точечного запроса пользователя.

## Current checkpoint

- Investigation подтверждает две visual-authority модели: Portfolio-owned canonical компоненты и generic Frame authority в Admin.
- Read-only Figma sources зафиксированы в ExecPlan: Sarafan catalog, hero и три canvas nodes.
- Реальный локальный Sarafan draft пока schema v2, не опубликован; публичный `/projects/sarafan-radio` возвращал 404 на проверенном runtime.
- Следующий проверяемый срез: failing tests для schema v3, registry и v2→v3 migration, затем реализация контракта.

## Scope и режим

- Области: `ADMIN + SHARED + PORTFOLIO`.
- Размер: `LARGE`; риск: `HIGH`; режим: `FULL`.
- Работа автономна до локальной приёмки с отдельными commits и тремя саморевью.

## Stop-lines

- Только read-only Figma; никаких Figma writes.
- Не выполнять push, PR, merge, deploy или production mutation.
- Не включать secrets, live-config или production data в backup/evidence.
- Не менять реальный Admin store до проверенных dry-run, backup, rollback и review.
- После schema-v3 migration реального draft запускать только Admin из текущей workspace-ветки в sandbox mode.
- Legacy renderer удалять только после доказанного нулевого использования.

## Next action

Добавить contract/migration tests, типизированный template registry и v2→v3 migrator; затем перевести canonical Portfolio consumers на v3.

## Pointers

- ExecPlan: `docs/exec-plans/admin-portfolio-slot-contract.md`.
- Admin contract: `tools/des-art-admin/SPEC.md`.
- Shared contract: `docs/shared/PROJECT_CONTENT.md`.
- Portfolio runtime: `docs/portfolio/RUNTIME.md`.
- Visual contract: `DESIGN_SYSTEM.md`.
- Deploy boundary: `docs/ops/DEPLOY.md`.
