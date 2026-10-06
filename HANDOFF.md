# HANDOFF

2026-10-06. Workstream: независимый выпуск Portfolio и Payload.
Worktree: /Users/designer/.codex/worktrees/payload-admin/Design-portfolio-site.
Ветка: codex/cms-integration. Исходный HEAD: ce3e80fd4c45d1f16c808f80c1f3e1686702e99c.

## Checkpoint

Пользователь прямо разрешил реализацию приложенного плана в payload-admin.
G0 проверен: база плана совпала, worktree был чистым, другого active writer не обнаружено.
G1 реализован: public-delivery-v1, canonical digest, metadata/byte MIME/closure validation,
empty/no-detail generation, scoped resource mapping и typed reader/DTO interfaces.
Reader не импортирует Payload, не читает SQLite/secret и удерживает проверенный last-good;
readiness проверяется строго, старые request handles сохраняют generation и resources.
Existing snapshot v1 policy не ослаблена; shared package dependency checker извлечён без изменения поведения.

Проверки: 21 focused/regression tests PASS, root lint PASS, strict declarations TypeScript PASS,
standalone reader bundle/import PASS. Два review выполнены с исправлениями mapping,
MIME/strict readiness, повторных resource reads и завершения конкурентных requests.
Fixture bytes синтетические: transport MIME proof не заменяет CMS decoder/dimension tests G3/G6.

## Следующее действие

G2 завершён: отдельный Node public host, builds public/preview без CMS/data и Git fallback.
Root build/start/package направлены на tools/portfolio-runtime. Public artifact содержит
site/, preview/, server.mjs и release-manifest.json; CMS build пока остаётся combined до G4.
HTTP capture одного descriptor/generation, resource history требует public activation receipts,
private candidate probe доступен только loopback (proxy deny вводится на G7).
Распакованный artifact стартовал отдельным plain Node process без checkout/CMS/compiler.
230 renderer tests PASS, renderer/root lint и CMS typecheck без incremental writes PASS.
Browser preliminary proof: главная, Corvo, Sarafan и 404 на approved-Git fixture;
source 258e95b2a7720499c7a74ec7602c8608b8c58200, не production data baseline.
Обнаруженный JPEG под avatar.png сохраняется без перекодирования; delivery MIME actual.
Финальный G2 build PASS; 26/26 focused/regression checks + 1/1 artifact proof PASS.
G3a реализован отдельно: target-only coordinator core + durable journal/state/history, idempotency,
loopback reader probes, shared lock/CAS, rollback с монотонной sequence. Native/UI ещё не подключены.
29 core/HTTP checks + 11 coordinator/probe checks (overlap), lint/type declarations/public build PASS.
Fresh doubt review: receipt recovery, dead-owner race, retry rollback и lock release исправлены;
последний проход без новых substantive findings. Dead recovery claim требует lifecycle maintenance G4.
G3b: actual native adapter, revision/digest/historical selection, immediate short SQLite transaction,
precommit durable checkpoint + postcommit fresh exact DB proof. Guards пока подключены только в fixture.
Native fixture PASS с настоящими generated PNG/AVIF, checkpoint disk rollback, lost native commit response,
no duplicate versions, target-only retry, restore/draft restore, bypass/bulk и incomplete Unpublish/Delete.
30 shared/public checks, CMS/root lint/typecheck/declarations/public build PASS.
Two native reviews: draft=true published bypass исправлен, финальный checkpoint/risk без findings.
Следующее действие — G3c: API/UI/native affordance bridges и включение guards в действующую CMS.
G2 временный browser fixture процесс корректно завершён; дальнейший browser proof создать заново.
Полный план/acceptance/checkpoint: docs/exec-plans/portfolio-payload-separation.md.
G3 целиком и G4–G7 пока не выполнены; текущий сайт/Admin ещё работают по прежней combined схеме.
Свежий production preflight не выполнялся. Исторический deployed SHA c735f3151a297eccb2885e69c0a215143c2dfe2f не считать свежим подтверждением.

## Stop-lines

Не читать USERSPACE, .local или redesign-admin-integration. Не переносить sandbox данные.
Не делать bootstrap, schema/DB migration, merge или production switch без exact gate из плана.
G7 требует exact artifacts, service/proxy delta, fresh parity/backup и отдельное разрешение на concrete transition.

## Pointers

- docs/exec-plans/portfolio-payload-separation.md
- docs/requirements/portfolio-payload-separation.md
- docs/ops/PAYLOAD.md
- tools/portfolio-delivery/

G3c checkpoint: native controls/API/REST bridges и collection guards подключены.
Exact draft capture протестирован с authentication/Origin/двумя сохранениями; новые native
replay/owner checks и historical draft restore PASS. 31 delivery/runtime regressions, full
CMS suite, typecheck, root/CMS lint и public build PASS. Два review с исправлениями retry
и uncertain commit wording закрыты. Actual CMS two-process/browser acceptance ещё не выполнена.
Next: G4 independent CMS build/runtime + active public generation/renderer preview; перед
API runtime требуется lifecycle PAYLOAD_WRITER_TOKEN, не создавать lock из HTTP handler.
G5 artifacts/code release, G6 full acceptance и gated G7 остаются.
