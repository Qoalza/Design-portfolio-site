# HANDOFF

2026-10-05. Работа завершена после пользовательской операционной приёмки.
Worktree /Users/designer/.codex/worktrees/payload-1939/Design-portfolio-site;
branch codex/cms-integration. Deployed codec61d0609ec09438958526ca7b8c55238de218c03;
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

## Последняя UI-правка завершена

По запросу пользователя скрыты только технические списки: ProjectFiles admin.group:false
убирает коллекцию из nav/dashboard с сохранением routes; releaseAssets admin.hidden:true
убирает read-only bindings из project editor. Schema/access/storage/ingest/Hero не менялись.
Native typecheck/lint, fixture build и exact clean Linux build PASS.
Browser на отдельной fixture DB: Files отсутствуют в dashboard/nav, raw assets
и SVG rows отсутствуют в project editor, controls Верстка/Сцены/Адаптивы сохранены.
Actual production: c61d060, published projects до/после равны, main/оба кейса/admin200,
anonymous project-files403, service active/enabled. Перед сменой кода сделан
verified private data/unit backup /var/backups/art-des/payload-before-ui-c61d060.
Temporary build swap выключен/удалён. Prod browser session истекла; credentials
не читались, нового owner/login/password change не делали.
Linux clone должен отдельно получить approved-source258e95b Git ref: это не ancestor
рабочего HEAD. Без него exporter не найдёт accepted sources; файлы не менять ради этого.
Постоянный SSH-доступ установлен с явного разрешения пользователя.
Host alias art-des-ops → root@185.219.41.147; отдельный keypair
/Users/designer/.ssh/id_ed25519_art_des_ops, private0600; config0600.
Новый прямой key-only вход (password/kbd-interactive/control socket отключены)
и отдельный вход через alias PASS; CMS service active. Старые keys/config сохранены.
Server authorized_keys содержит restrict для нового ключа: forwarding/PTY/user rc
запрещены, права команд остаются root. Не читать/выводить private key.
Обычные OPS команды: ssh art-des-ops '<command>'; временный password socket не нужен.
Отзыв — удалить только строку с комментарием art-des-ops-designer-mac из root
/root/.ssh/authorized_keys, как описано в docs/ops/PAYLOAD.md.
Предыдущая большая Goal завершена. Дизайн — отдельная пользовательская задача.
Visual/animation evidence частично: не заявлять полный visual PASS. Actual DB
restore не выполнялся, fixture restore PASS. Worktrees не удалять автоматически.
Plan: docs/exec-plans/payload-site-integration.md COMPLETE.
Evidence: docs/ops/PAYLOAD_ACCEPTANCE.md; operations: docs/ops/PAYLOAD.md.
