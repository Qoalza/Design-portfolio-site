# HANDOFF

Обновлено: 2026-08-31.

## Назначение

Короткий текущий checkpoint. Фактический Git/runtime всегда перепроверяется перед действием.

## Checkout

- Репозиторий: `/Users/designer/Documents/GitHub/Design-portfolio-site`.
- Ветка документационной миграции: `codex/documentation-migration`, создана от проверенного `origin/main` (`96cabb7f80ad3f20afd07c5d54ad245a09495142`).
- Exact `HEAD`, ahead/behind и рабочее состояние всегда получать свежей Git-проверкой: этот файл не является реестром изменяющихся SHA.
- Protected untracked, не трогать без отдельного решения:
  - `.des-art-admin-runtime-human-errors/`;
  - `codex-context-transfer-2026-08-15/`;
  - `codex-context-transfer-2026-08-15.zip`.
- `USERSPACE/` — локальная user-only папка, исключённая через `.git/info/exclude`; не читать и не трогать без прямого точечного запроса пользователя.

## Текущее подтверждённое устройство

- Публичные проекты используют schema-v2 JSON в `content/projects/*.json`.
- Shared validator находится в `src/lib/project-contract.ts`.
- Local Admin находится в `tools/des-art-admin`; current durable Admin contract — `tools/des-art-admin/SPEC.md`.
- Все проекты, включая Corvo, работают через общий project-content contract.
- Исторический Corvo brief не является active routing/source для обычной разработки.
- Documentation migration разделила policy, оперативный checkpoint, active QA, долговечные contracts, runbooks, историю и evidence; legacy materials перенесены в `docs/archive/**` и `design-reference/**`.
- Миграция не меняет code/runtime/Figma/canonical project JSON/Admin local data/production.

## Открытые элементы

- В `DESIGN_QA.md` открыт только вопрос visual/source fidelity конкретных current platform icons; сама механика `full frame + intrinsic size + mask/currentColor` принята.
- Старый checkpoint по Admin Figma Frame preview не доказан на current source/runtime. Сначала нужна повторная проверка; до воспроизведения это не active QA finding.
- Accessibility exceptions со старых Figma source требуют отдельной read-only revalidation до нового заявления о current compliance.
- Preloaders/loading states остаются отдельным будущим backlog и не являются автоматически записью visual QA.

## Stop-lines

- Не менять Figma без отдельного точного подтверждения.
- Не трогать protected untracked artifacts в общей document cleanup.
- Не читать/трогать `USERSPACE/**` без прямого точечного запроса пользователя.
- Не выполнять merge/deploy/production action без отдельного exact approval.
- Не менять code/runtime/canonical JSON/Admin local data в documentation migration.

## Следующий шаг

Проверить три локальных документационных коммита и их итоговый diff. Push, PR и merge возможны только после отдельного явного разрешения; deploy в эту миграцию не входит.

## Указатели

- Agent policy: `AGENTS.md`.
- Admin contract: `tools/des-art-admin/SPEC.md`.
- Shared contract map: `docs/shared/PROJECT_CONTENT.md`.
- Portfolio runtime invariants: `docs/portfolio/RUNTIME.md`.
- Deploy runbook: `docs/ops/DEPLOY.md`.
- Visual contract: `DESIGN_SYSTEM.md`.
- Active visual QA: `DESIGN_QA.md`.
- Historical context: targeted search in `PROJECT_HISTORY.md`, `docs/archive/**` and `design-reference/**`.
