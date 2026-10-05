# Онлайн-Payload: граница запуска

Статус 2026-10-05: онлайн Payload активирован на actual VPS; actual HTTPS
public/admin/auth/assets/private preview и native editor/material проверки PASS.
Операционная приёмка завершена пользователем; переделка дизайна выделена отдельно. Этот документ относится к новой Payload CMS. Процедуры старой
Des-art Admin не являются источником логики или публикации контента.

## Рабочий процесс

Один runtime обслуживает public Portfolio, `/admin`, приватные native API и
предпросмотр. Штатная публикация Payload применяет контент в БД. Публичный сайт
читает committed published revisions и их verified assets. Черновики приватны.
Code deployment нужен только при изменении кода; он не является частью обычного
редактирования контента. Prepared archives/export не являются пользовательским
способом публикации в этой CMS.

## Постоянные данные

Server mode задаётся явно:

```text
PAYLOAD_RUNTIME_MODE=server
PAYLOAD_PUBLIC_URL=https://art-des.ru
PAYLOAD_DATA_ROOT=/var/lib/art-des-payload/data
PAYLOAD_PORT=<проверенный свободный loopback порт>
```

Контейнер `/var/lib/art-des-payload` должен принадлежать service user и иметь
private permissions. Внутри находятся `data` и его siblings `data-backups`,
`data-lock`, `data-restore.json`. Они остаются вне checkout/release и web root.
Service user должен иметь право создавать эти siblings. Runtime один: текущий
SQLite adapter не используется одновременно несколькими writers/replicas.

Authentication secret сохраняется в `data/secret`; wrapper передаёт его процессу.
Code build не использует пользовательский secret. Не менять secret при обычном
code deployment: это влияет на вход и сессии. Backup включает его вместе с БД и
native файлами, поэтому backup также приватен и не входит в code release.

Native media/project-files storage, publish validator и public/preview readers
используют один runtime root contract. Server mode отвергает local sandbox root,
root внутри кода/public и небезопасные SQLite URI characters. Схема автоматически
не пересоздаётся в server mode; перед стартом проверяется migration/schema contract.

## HTTPS и доступ

Nginx передаёт approved Host `art-des.ru`, Origin запроса и исходную схему;
backend доступен только на127.0.0.1:3001. Actual TLS certificate verification и
HTTPS proof PASS на сервере. Независимый direct HTTPS с Mac (`--noproxy *`,
verified IP/Host и штатная certificate validation): главная/admin/login/public DTO/
оба кейса/projects redirect/404 PASS на05; на7faa Corvo HTML/code marker и
ранее missing shell SVG PASS. Серверный proof7faa покрывает routes/assets/auth. Предыдущий запрос
через локальный proxy завершился SSL error. HTTP proof не заменяет browser acceptance.
Auth cookies Secure/HttpOnly/SameSite=Lax; CSRF/CORS ограничены approved origin.
Native mutation endpoints дополнительно проверяют Origin/Host. Anonymous users,
raw uploads и drafts приватны; `/api/site-content` содержит только public DTO.
First-register в online mode закрыт: initial owner создаётся оператором до exposure.
HTML packages и public SVG documents получают sandbox CSP. Preview frames не
получают CMS cookies/tokens; capability истекает через30минут, ответы no-store.

SMTP сейчас не настроен; password recovery доступен через защищённую console
команду `account:recover`, с hidden input/backup/session revocation.

## Активный production runtime

Exact code SHA: `c735f3151a297eccb2885e69c0a215143c2dfe2f` (2026-10-06).
Current evidence: ../../design-reference/payload-portfolio-fixes-2026-10-06/REPORT.md. Historical receipts below retain their original SHA.
Linux source/build находится в `/opt/art-des-payload/releases/<SHA>`;
`art-des-payload.service` работает от portfolio, active/enabled, backend3001.
Native Sharp/libSQL установлены и проверены на Linux, не перенесены с Mac.
Server data root `/var/lib/art-des-payload/data` private0700, его siblings также
доступны service user. Secret сохраняется между code releases.
Native initial owner `owner@art-des.ru`; credential file
`/var/lib/art-des-payload/initial-owner.json`0600 доступен только приватно на VPS.
Не выводить его содержимое в tool outputs/docs/Git/chat. SMTP не настроен.

Actual Nginx routing: `/etc/nginx/sites-enabled/art-des` — отдельный regular file,
НЕ symlink на sites-available. Он proxy3001, upload25m/read-send120s. Existing
TLS/http2/http→HTTPS/www redirects сохранены. Непосредственно перед mutation
проверять `nginx -T` и backup именно actual included file. Sites-available сейчас
неактивен и не является source of truth.

Первое переключение available-файла не меняло active route и было автоматически
отменено. После discovery enabled-файла его exact backup сохранён; исправленная
активация прошла весь actual HTTPS proof. Proof receipt:
`/var/lib/art-des-payload/acceptance-live.json`, safe metadata only.

Проверено: главная/оба кейса/404/temporary projects redirect, exact code marker,
all163 asset bytes/DTO, native owner login и secure cookies, private APIs/files,
closed first-register и обе published private previews. Build stamps не менялись.
Graceful native restart и consistent actual backup verification PASS. Restore,
native draft→Publish→public/failure checks выполнены на isolated Linux fixtures;
actual production DB не test-restored. Последующие native browser content
проверки и восстановление approved baseline описаны ниже.
Native browser acceptance завершена после входа пользователя: draft/reopen/
private preview/Publish/public update, загрузки PNG/JPEG/WebP и HTML-папки,
HTTPS source, raster order/count rejection, slug/routes/sitemap/assets,
оболочки/adaptives и native version restore/revert. Public projects возвращены
к точному approved baseline; тестовые versions/materials приватны. JPEG проверен
как private draft, не как опубликованная карточка. Подробное evidence и различия
actual/fixture: PAYLOAD_ACCEPTANCE.md. Не повторять ранние pending checkpoints
как текущий статус. Пользователь принял работоспособность, дизайн переделывает отдельно.

Current7faa host отдельно разрешает23 exact code-owned Corvo shell SVG из verified
build files; CMS assets и unknown/draft resources не получают static fallback.
Actual HTTPS receipt10:37:03Z использует loopback-nginx, art-des.ru Host/SNI,
обычную certificate validation. Independent external Mac code/SVG PASS.
First switch timeout автоматически восстановил05 unit, second switch7faa PASS.
Previous online05 unit сохранён в
`/var/backups/art-des/payload-before-corvo-fix-7faa2b8/art-des-payload.service`.

## Временные ресурсы и доступ

Temporary2GB `/var/lib/art-des-payload-build.swap` после Linux build7faa safely
swapoff/remove, memory guard available1316180KiB > used125732KiB +524288KiB; receipt verified,
CMS service active. Original `/swapfile` сохранён, fstab не менялся. Root SSH
ранее восстановлен пользователем, текущий канал истёк; UI Terminal capability не использовалась для обхода
отказа. Routine credentials/content в чат и Git не выводить.

## Сохранённый предыдущий runtime и быстрый откат

Old `art-des.service` после приёмки остановлен и disabled; сохранённый release SHA
`b44946021d55fb1cc8a4430c3bafd62e342714c9`. `/var/www/art-des/current` и restricted
static status отражают standby runtime, а не новый public CMS code identity.
Старый код архивирован по прямому разрешению пользователя; исходные releases сохранены.
Архив /var/backups/art-des/archived-static-20261005T133522Z, gzip/tar/checksum PASS.
Перед rollback: systemctl enable --now art-des.service, затем readiness3000.
RESTORE.txt в архиве содержит процедуру восстановления.
Private runtime/config backup: `/var/backups/art-des/pre-payload-0882f79`.
Actual rollback proxy source: `nginx-art-des-enabled`; `nginx-art-des` относится
к неактивному sites-available. При разрешённом rollback:

```sh
install -m 0644 /var/backups/art-des/pre-payload-0882f79/nginx-art-des-enabled /etc/nginx/sites-enabled/art-des.rollback
mv -f /etc/nginx/sites-enabled/art-des.rollback /etc/nginx/sites-enabled/art-des
nginx -t && systemctl reload nginx
```

Предварительно подтвердить old3000 readiness. CMS data не удаляются. Возврат
прокси не откатывает БД. Для code upgrade отдельно offline consistent backup,
explicit migrations, exact Linux build/proxy smoke; не применять static publisher
или старые Des-art Admin publication правила к онлайн Payload.
Actual verified CMS backup:
`/var/lib/art-des-payload/data-backups/backup-18826003-328c-49d2-8357-0c2001b43efd`.
Проверен backup digest/closure; actual DB restore не проводился. Этот backup
создан до последующих native browser checks и не включает их private test
versions/materials. Возврат версии проекта выполнять штатными Versions/Revert,
не восстановлением всей БД ради удаления тестового черновика.

Sources: установленный Payload3.89.0 auth/config code и официальные docs:
https://payloadcms.com/docs/authentication/cookies,
https://payloadcms.com/docs/production/deployment.

## Первый импорт опубликованных материалов

Приватный OPS helper `tools/payload-admin/scripts/bootstrap-content.ts` работает
только при остановленном runtime и принадлежащей процессу maintenance lock.
Схема и первоначальный owner должны быть подготовлены заранее. На вход передаются
проверенная actual release directory, deployed SHA и snapshot SHA-256 из свежей
серверной сверки; HTTP build marker сам по себе не подтверждает все ресурсы.
Read-only `production-baseline.mjs` отвергает dirty source, несовпадающие identity/
provenance/digests, изменённые файлы и символические ссылки внутри снимка.

Целевая БД не содержит projects, versions, media или project-files; физические
upload directories также пусты. Helper сохраняет native bindings и опубликованные
проекты, затем проверяет точное совпадение DTO и всех asset bytes. Повторный импорт
в наполненное хранилище запрещён. При ошибке частичное staging state остаётся
закрытым; его нельзя активировать или повторно наполнять. Не очищать существующую
CMS ради повторного запуска. Этот helper не является публичным endpoint или
пользовательской кнопкой публикации; обычная работа остаётся native Payload.

Disposable fixture подтверждает оба проекта/163 ресурса, reopen, отказ wrong
identity/nonempty upload store/retry. Actual production bootstrap также выполнен:
2 проекта/163 aliases/156 native files, exact DTO/bytes parity, private receipt
bootstrap-receipt.json. Helper в наполненную permanent CMS повторно не запускать.

Fresh VPS discovery: Node22.23.2/Linux x86_64, 22GB free, existing portfolio service
active on127.0.0.1:3000. Deployed b44946021d55fb1cc8a4430c3bafd62e342714c9
manifest has approved Git provenance but no snapshot/digest. Private legacy reader
therefore reconstructs DTO only from exact approved Git source and requires full
provenance equality plus byte/hash equality for every production asset. It never
reads sandbox input or changes the deployed directory. Legacy compatibility
fixture/types/lint PASS; actual production parity и exact clean Linux candidate
05abd7c build PASS. Content hash verified:
23d7de746136d591ce350f60c1bd241bce35836d4b710b32fe9d9e2f2ebf29c2.
