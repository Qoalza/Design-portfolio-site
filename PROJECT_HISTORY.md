# PROJECT HISTORY

## Назначение

Датированный архив важных завершённых этапов, системных root causes, migrations и release outcomes.

Не является current state, plan, backlog или runbook. Текущий checkout находится в `HANDOFF.md`; current rules — в `AGENTS.md`; active visual findings — в `DESIGN_QA.md`.

Читать только релевантные разделы. Не добавлять каждый commit, screenshot matrix или промежуточный status.

## 2026-08-11 — первая homepage implementation и QA baseline

- Главная была собрана по тогдашнему Figma source, после пользовательского отклонения проведена секционная rebuild-инвентаризация.
- Старый общий PASS был аннулирован; visual results получили пользовательский review gate.
- Performance/accessibility/SEO snapshot сохранён как evidence 2026-08-11, а не current audit.
- Подтверждённые Figma/WCAG conflicts были вынесены в `ACCESSIBILITY_EXCEPTIONS.md`.

Evidence: `design-reference/homepage-qa-rebuild/`.

## 2026-08-12 — Corvo project route

- Реализован переиспользуемый project shell, Corvo content и доступный media lightbox.
- Header/breadcrumb/platform source и process asset были повторно синхронизированы с тогдашним Figma node.
- Historical Corvo QA сохранён в `design-reference/corvo-fresh/`.
- Corvo был первым кейсом, добавленным до текущего Admin-driven project-content workflow; позднее он был приведён к общему schema-v2 JSON contract.

Исторический Corvo content brief после миграции хранится в `docs/archive/content/CORVO_LEGACY.md` и не участвует в обычном routing.

## 2026-08-14 — site refresh, header/action bar и Goal 3

- Главная, Corvo и общий Footer были синхронизированы с обновлёнными Figma sources.
- Добавлены общий flow/fixed Header, project action bar, `/projects`, 404/500.
- Regression hero overlap был вызван непрозрачным raster background; его заменили source SVG layers.
- Platform icon regression был вызван принудительным `20×20` для разных intrinsic frames и hard-coded fill.

Долговечный platform-icon contract:

- typed intrinsic sizes;
- full-frame icon/mask;
- semantic/currentColor rendering;
- отсутствие generic forced `20×20`.

Механика принята; visual fidelity конкретных current icons проверяется отдельно через active QA.

Evidence: `design-reference/site-refresh-v2*/`, `design-reference/goal3-regression-fixes/`.

## 2026-08-24–2026-08-26 — Main Layout & Interaction Reconciliation MLIR2–MLIR7

- Последовательные MLIR2–MLIR7 packets уточнили typography, icon provenance, Footer, navigation trail, process controls, action-bar geometry, Gallery input/motion/lightbox, error controls и metadata.
- Root scroll и Gallery controllers были сведены к общему ordered frame coordination; action bar initial/steady-state получили единый geometry threshold.
- В MLIR6 error-page stage получил детерминированное масштабирование от доступной высоты viewport за вычетом Footer; в MLIR7 home/full-reload controls сохранили общий `ControlButton` contract. Пользователь подтвердил дизайн и реализацию 404/500 как завершённые.
- Каждый этап создавал fresh SHA-bound Chromium/Zen evidence; старый runtime evidence не использовался как доказательство нового.
- MLIR7 получил явную пользовательскую приёмку 2026-08-26.

Архивные plans находятся в `docs/archive/work-packets/`. Evidence остаётся в соответствующих `design-reference/**` каталогах.

## 2026-08-26 — MLIR7 production deploy

- Принятая MLIR7 branch была слита в `main` и атомарно развернута из exact SHA.
- Readiness failure первого раннего probe безопасно вернул предыдущий release; повторное переключение с readiness loop прошло успешно.
- Public routes, canonical redirects, favicon, assets и основные browser interactions прошли smoke.

## 2026-08-27–2026-08-28 — Footer/process/metadata follow-ups

- Принятые Footer и process controls были опубликованы отдельными exact-SHA releases.
- Process stacking context был исправлен так, чтобы Header сохранял правильный top layer.
- Общий social preview и canonical metadata были подключены к публичным routes.

## 2026-08-29–2026-08-30 — Local Admin и Shared project contract

- Канонический проектный контент мигрирован на schema-v2 JSON в `content/projects/*.json`.
- `src/lib/project-contract.ts` стал исполняемым Shared validator для Portfolio и Admin.
- Local Admin получил draft storage, strict compiler, isolated preview overlay, Radix-only Admin bundle и sandbox publish.
- Live publish model использует свежий `origin/main`, disposable worktree, checks, PR/merge, exact SHA upload и atomic release/rollback.
- Figma Frame import сохраняет root container и отдельные immediate-child raster units/geometry; production использует local snapshot, а не live Figma.
- Production data baseline отделил canonical main content от sandbox/test drafts.

Admin current contract: `tools/des-art-admin/SPEC.md`.
Shared map: `docs/shared/PROJECT_CONTENT.md`.

## 2026-08-31 — project/Admin fixes и release archive hardening

- Исправлены Admin project-page editor, pending gallery devices, media/frame import, upload collisions и human-facing validation errors.
- Публичная project page получила согласованные Gallery boundaries, terminal Frame spacing и lightbox geometry.
- Production baseline v2 повторно защищает canonical content от sandbox state.
- Release archive исключает macOS metadata и локальные Admin/runtime artifacts.
- Git history содержит завершённые PR #29–#31; оперативные ветки/stop-lines этих этапов не должны оставаться current handoff.

## 2026-08-31 — причина пересмотра документации

- `HANDOFF.md` снова накопил историю, runbook и уже завершённые branches.
- `DESIGN_QA.md` сохранил closed/superseded MLIR entries.
- `AGENTS.md` и несколько исторических docs продолжили описывать MDX как current project storage.
- Принято перейти к selective documentation routing, короткому handoff, active-only QA и архиву legacy plans/evidence.
