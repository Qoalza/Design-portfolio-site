# HANDOFF

2026-10-06. Единственная актуальная Admin — Payload в tools/payload-admin.
Worktree: /Users/designer/.codex/worktrees/payload-admin/Design-portfolio-site.
Ветка: codex/cms-integration. Название payload-1939 заменено на payload-admin.
Другого writer при синхронизации не обнаружено.

## Checkpoint

По прямому запросу пользователя интегрирован exact production c735f3151a297eccb2885e69c0a215143c2dfe2f. Свежая серверная проверка подтвердила SHA и active art-des-payload.service/WorkingDirectory. Исполняемый код синхронизирован с production; локальная документация SSH сохранена. Соседние ветки/worktree не изменялись. Синхронизация не меняла сервер, CMS данные или secret.

Сайт и /admin пока обслуживаются одним Next/Payload runtime, backend3001. Native draft/preview/Publish/versions и persistent data сохраняются. Experience smoothing/stopper/reentry, compact layout, Corvo hatch, Bg-main#17191A, pinned-only home header line и custom404 входят в базу.
Текущая published версия c735; последующие локальные коммиты не означают нового deploy.
Old Des-art Admin и redesign-admin-integration не являются актуальной Admin или источником работы.

## Текущий запрос и границы

Пользователь запросил фиксацию требований к разделению сайта и Admin, без планирования и реализации. Draft: docs/requirements/portfolio-payload-separation.md. Код не переделывать и не выпускать на прод по этому запросу.
Схемы, DB, drafts/versions/accounts, материалы, secret и доступы не менять. Повторный bootstrap запрещён; USERSPACE и sandbox не читать/переносить.
Операции: docs/ops/PAYLOAD.md и DEPLOY.md. Production evidence c735 находится в линии Portfolio, design-reference/payload-portfolio-fixes-2026-10-06/REPORT.md.
Постоянный SSH alias art-des-ops сохранён; private key/credentials не читать. Реальный DB restore не выполнялся; fixture restore ранее PASS. Future Admin redesign и разделение — ещё не реализованы.
