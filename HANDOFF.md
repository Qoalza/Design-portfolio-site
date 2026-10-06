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

G2: Node public host, builds public/preview без CMS/data и Git fallback.
Полный план/acceptance/checkpoint: docs/exec-plans/portfolio-payload-separation.md.
G3–G7 пока не выполнены; текущий сайт/Admin ещё работают по прежней combined схеме.
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
