# Онлайн-Payload: граница запуска

Статус 2026-10-05: код проверен в isolated online-mode runtime; live activation
ещё не выполнена. Этот документ относится к новой Payload CMS. Процедуры старой
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
backend доступен только на127.0.0.1. TLS на actual VPS ещё предстоит проверить.
Auth cookies Secure/HttpOnly/SameSite=Lax; CSRF/CORS ограничены approved origin.
Native mutation endpoints дополнительно проверяют Origin/Host. Anonymous users,
raw uploads и drafts приватны; `/api/site-content` содержит только public DTO.
First-register в online mode закрыт: initial owner создаётся оператором до exposure.
HTML packages и public SVG documents получают sandbox CSP. Preview frames не
получают CMS cookies/tokens; capability истекает через30минут, ответы no-store.

SMTP сейчас не настроен; password recovery доступен через защищённую console
команду `account:recover`, с hidden input/backup/session revocation.

## Следующий обязательный OPS-этап

1. Восстановить административный SSH доступ и получить fresh read-only preflight:
   actual deployed SHA/source snapshot/assets, service/proxy, Node/CPU/OS/RAM/disk,
   permanent storage/permissions и свободный backend port.
2. Подготовить Linux candidate exact clean HEAD. Payload использует native
   Sharp/libSQL: текущая macOS fixture сборка не доказывает Linux runtime readiness.
   Не применять прежний platform-neutral packaging, удаляющий native dependencies.
3. Создать новую пустую permanent CMS state, schema и initial owner. Наполнить
   только exact deployed approved Portfolio content/assets после проверки digest.
   Личный `.local`, fixture databases/uploads/users и old Admin state не переносить.
   Отдельно проверить DTO/asset parity, вход, preview, native apply и restart.
4. До переключения сохранить рабочий код и proxy/service configuration; проверить
   быстрый возврат. Не удалять/архивировать прежний рабочий сайт до пользовательской
   приёмки нового online runtime.
5. Применить готовую проверенную конфигурацию в рамках существующей авторизации,
   затем actual HTTPS public/admin/API smoke и проверки приватности. Browser
   acceptance остаётся отдельным непроверенным пунктом; прежний denied browser
   action не повторять и не обходить.

Server install/production baseline bootstrap/Linux candidate/actual TLS/rollback
activation не считать выполненными по результатам loopback fixture tests.

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

Подтверждено только на собственном disposable fixture: оба проекта, все 163 ресурса,
повторное открытие БД, отказ неверному identity/непустому upload store/повторному
импорту. Actual production bootstrap, initial owner и Linux installation ещё
не выполнялись. VPS source snapshot должен быть проверен заново при наличии SSH.
