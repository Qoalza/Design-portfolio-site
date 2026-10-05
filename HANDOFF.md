# HANDOFF

2026-10-05. Работа завершена после пользовательской операционной приёмки.
Worktree /Users/designer/.codex/worktrees/payload-1939/Design-portfolio-site;
branch codex/cms-integration. Deployed code7faa2b8f9709262cc2849de26479bb534a0268dd;
последующие commits — документация. Один writer, production code/data не менялись
при финальном архивировании. Пользователь переделывает дизайн отдельно: не править.

## Действующий сайт

https://art-des.ru/ и https://art-des.ru/admin: один online Next/Payload runtime.
Native draft/preview/Publish/versions и материалы проверены; public baseline
возвращён. Контент применяется без archive/build/deploy. Old Des-art Admin,
личный .local, USERSPACE и fixture data не переносились. Hero не переделывались.
art-des-payload.service active/enabled, loopback3001; persistent data private
/var/lib/art-des-payload/data. Повторный bootstrap запрещён. Actual Nginx —
/etc/nginx/sites-enabled/art-des regular file, proxy3001. Secret/credentials
не читать или выводить. SMTP не настроен, console recovery описан в PAYLOAD.md.

## Архив и откат

User прямо разрешил archive и завершение. Проверенный приватный архив:
/var/backups/art-des/archived-static-20261005T133522Z/static-runtime.tar.gz,
SHA256 b71e9788496889f924a67f26f2fa1bd610c12aa3c2f29d8367ce782bb1095a65,
207197016bytes,0600; directory0700. Сохранены3 static releases/unit/current и
pre-redesign/pre-payload backups. gzip/tar compare/checksum PASS.
Old art-des.service inactive/disabled, original releases сохранены. Для rollback
сначала enable --now old service и readiness3000, затем actual proxy backup;
RESTORE.txt в архиве и docs/ops/PAYLOAD.md. Payload data сохраняются.
Final actual TLS main/Corvo/Sarafan/admin-login200; public projects unchanged.

## Текущая небольшая правка UI Payload

По запросу пользователя скрыты только технические списки: ProjectFiles admin.group:false
убирает коллекцию из nav/dashboard с сохранением routes; releaseAssets admin.hidden:true
убирает read-only bindings из project editor. Schema/access/storage/ingest/Hero не менялись.
Native typecheck/lint и fixture build PASS. Два review: покрытие обоих UI мест;
сохранность fields/hooks/routes и отсутствие data/schema changes. На production пока7faa.
SSH control session истекла, BatchMode denied; нужен пользовательский вход для
Linux exact build и code switch. No bootstrap/migration/content edit.
Предыдущая большая задача завершена. Дизайн — отдельная пользовательская задача.
Visual/animation evidence частично: не заявлять полный visual PASS. Actual DB
restore не выполнялся, fixture restore PASS. Worktrees не удалять автоматически.
Plan: docs/exec-plans/payload-site-integration.md COMPLETE.
Evidence: docs/ops/PAYLOAD_ACCEPTANCE.md; operations: docs/ops/PAYLOAD.md.
