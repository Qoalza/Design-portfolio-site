# HANDOFF

2026-10-05. Checkout codex/cms-integration,
/Users/designer/.codex/worktrees/payload-1939/Design-portfolio-site.
Baseline cebbad39a4a3a5bc703facd8abe619b5f81a037f; next checkpoint: online assets.

## Current target

Пользователь прямо исправил цель: ОНЛАЙН Payload — открыл в браузере, изменил,
применил, сайт обновился БЕЗ сборки/архива/deploy при каждой content правке.
Старый local CMS + archive publication workflow был ошибочным выбором агента.
Не продолжать его worker/deploy/UI/recovery. Plan version2.0:
docs/exec-plans/payload-site-integration.md.

## Preserve

Native custom editor, immutable materials/packages, drafts/versions, validators
и обе готовые Hero переиспользовать. Public ProjectDocument schema/design/Hero
geometry/physics/adaptives сохраняются. Портфолио desktop-only.
Личный .local/USERSPACE и old Des-art Admin logic/data не читать/не использовать.
Disposable fixtures не публиковать. Old worktrees не удалять.

## Current implementation / next action

Единый Next/Payload содержит public catchall + committed published DTO reader,
escaped runtime JSON для прежнего renderer и dynamic metadata/routes/sitemap.
Native Publish → actual public HTML/title/data без изменения compiled JS/BUILD_ID
проверено через HTTP для обоих templates; черновики private. Full native tests,
typecheck/lint/build, root runtime tests, renderer lint/build PASS; two reviews.
Obsolete archive publication APIs/worker/helpers removed; old endpoints404.
Pure code release tooling сохранено. Hero/design implementation не менялись.

Published assets теперь читаются только из committed native bindings, с проверкой
bytes/closure/dimensions. BeforeChange отвергает неполный publish до commit;
incomplete draft разрешён. Static shell выдаётся без DB read; stale bundled
project resources не являются fallback. HTTP upload → private draft → native
publish → public exact image/HEAD/ETag, полный asset closure и сохранность сайта
при rejected publish PASS; BUILD_ID unchanged, fixture restored. Slug alias PASS.
Native full suite, typecheck/lint/build, renderer build, root host tests PASS.
Две последовательные selfreviews: completeness и regression/access/risk; без
изменения Hero. Тестовый HTTP server остановлен.
Следующее: no-build private preview, затем server config/storage/HTTPS/bootstrap/
backup и фактический online deployment. Local sandbox не является online release.
Не новый Apply/deploy job: используется штатная native publication.

## Evidence / access

Готовые native editor/material/preview/export проверки — в historical checkpoints.
06bd7f7 preparation API group сохранена, но obsolete. Actual HTTP new prepare
после commit завершился PREPARATION_FAILED; разбор остановлен из-за новой цели.
Собственный fixture server41741 остановлен. Root pointer
/private/tmp/payload-editor-test-root.txt; personal state/production untouched.
Прежний VPS control socket /private/tmp/art-des-vps-session-G4pLXP/connection
отсутствует (fresh read-only check). Независимая online implementation продолжается.
Browser action ранее denied auto-review: не повторять/не обходить.
Перед live запуском нужны exact code + production source + access/rollback checks;
пользователь разрешил автономную работу, вопросы только при критическом препятствии.
