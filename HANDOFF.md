# HANDOFF

2026-10-05. Checkout: codex/cms-integration,
/Users/designer/.codex/worktrees/payload-1939/Design-portfolio-site.

## Checkpoint

Пользователь разрешил планирование и реализацию полного Payload/site integration;
автономно продолжаем. Base b0ec4de; production b44946021d55fb1cc8a4430c3bafd62e342714c9.
Новый full plan docs/exec-plans/payload-site-integration.md version1.0.
Готовые native export/snapshot/renderer/releases переиспользовать; native editor,
materials ingest, same-renderer authenticated preview, explicit CMS release,
publication operations и clean bootstrap ещё реализовать/проверить.

## Next

Первая проверенная часть группы1: native custom Field, immutable authoring helpers,
Hero choice с native-version cache, draft/public export mapping. Tests/lint/typecheck/
build и browser save/reopen/failure PASS, подробности в ExecPlan checkpoint.
Группа2: pure image quality helper и6 real image tests/typecheck/lint PASS.
Authenticated image ingest/bindings/upload controls/export closure реализованы;
HTTP/native persistence/export/full tests/typecheck/lint/build PASS. Payload WebP
re-encoding отключён; original/prepared bytes сохраняются как есть. Browser upload
не завершился, UI evidence для этого шага ещё требуется.
Copy CRUD/marks/optional fields готовы; оба templates native save/reopen и
full tests/typecheck/lint/build PASS. Browser read denied by auto-review; не повторять
и не обходить; UI acceptance остаётся pending, API/CLI работу продолжать.
Native project-files downloads защищены attachment/CSP sandbox; real HTTP
GET/HEAD/encoded path/auth/bytes и full tests/typecheck/lint/build PASS.
Layout package endpoint/Field/immutable manifest/bindings готовы: actual Corvo
package, JPEG с историческим PNG extension, HTTP save/reopen/export/deletion guards
и native full tests/typecheck/lint/build PASS. Private packages сохраняются в versions.
Далее same-renderer authenticated preview (группа3), затем CMS builds/publication/
bootstrap; browser acceptance остаётся pending без повторных browser запросов.
Disposable fixture pointer /private/tmp/payload-editor-test-root.txt; dev остановлен.

## Stop-lines

Сохранить public design/Hero geometry/physics/scenes и desktop-only portfolio.
Не использовать old Des-art Admin logic/data. Не читать личный .local/USERSPACE.
Temporary fixtures не публиковать. Real bootstrap/migrations/access/content publish
требуют конкретного решения; previous archive ждёт пользовательской приёмки.
