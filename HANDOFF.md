# HANDOFF

Обновлено: 2026-08-15

## Назначение

Короткая оперативная память проекта: только актуальное состояние, действующие решения, открытые ограничения и следующий шаг. Этот файл читается вместе с `AGENTS.md` перед каждой задачей.

- Подробная история завершённых этапов: `PROJECT_HISTORY.md` — читать только релевантные разделы по необходимости.
- Открытые визуальные дефекты: `DESIGN_QA.md` — читать при работе с соответствующим экраном или при формировании пакета визуальных исправлений.
- Исключения доступности: `ACCESSIBILITY_EXCEPTIONS.md`.
- При расхождении документов с кодом, Git или проверенной средой доверять фактическому состоянию и актуализировать этот файл.
- Не записывать секреты.

## Проект

- Портфолио Product Designer на русском языке.
- Next.js App Router, TypeScript, npm, MDX.
- Без Tailwind, сторонних UI-библиотек, CMS, базы данных и авторизации без отдельного согласования.
- Figma имеет приоритет; не придумывать визуальные решения.
- Домен: `art-des.ru`; VPS: Ubuntu 24.04, `185.219.41.147`.

## Актуальное состояние

- Рабочая ветка: `codex/goal3-regression-fixes`, база: `codex/site-refresh-v2`.
- Актуальный production/source commit: `ae1c01c10cf87240212b91a9a6594e239eb4f01e` (`Add contextual breadcrumb navigation`).
- Базовый error-layout исправлен в `cf9e161` (`Fix error page viewport layout`); follow-up синхронизирует позиции с актуальными nodes `420:54056`/`420:54081` и отделяет clipping иллюстрации от тени сообщения.
- Общий механизм platform-иконок использует typed intrinsic-размеры и mask с Figma-цветом `#75848F`; error pages и иконки имеют статус `READY_FOR_REVIEW`.
- Строка характеристик открытого проекта использует Figma Hug-механику: ширина по содержимому, без desktop-переноса в доступных `1200 px` (`b6f461d`).
- Breadcrumbs строятся из фактического пути текущей history entry; прямой вход использует явно заданную для типа страницы каноническую цепочку.
- Незавершённый пакет `codex-context-transfer-2026-08-15/` и ZIP остаются отдельными untracked-артефактами; не добавлять и не удалять.
- Первый production-deploy выполнен из точного commit `ae1c01c10cf87240212b91a9a6594e239eb4f01e`; merge в `main` не выполнялся.

## Production

- URL: `https://art-des.ru`; `http://art-des.ru` и оба варианта `www` перенаправляются на canonical HTTPS host.
- VPS: Ubuntu 24.04 LTS; Node.js `22.23.2`; npm `10.9.8`; Nginx `1.24.0`; Certbot `5.7.0`.
- Release: `/var/www/art-des/releases/ae1c01c10cf87240212b91a9a6594e239eb4f01e`; `/var/www/art-des/current` указывает на него.
- Next.js работает от системного пользователя `portfolio` через `art-des.service`: сервис `active`, `enabled`, restart проверен.
- Next.js слушает только `127.0.0.1:3000`; UFW разрешает снаружи только OpenSSH и `80/443`. Пять независимых внешних probe-nodes получили timeout на `:3000`.
- Let's Encrypt покрывает `art-des.ru` и `www.art-des.ru`, срок действия до `2026-11-13`; `snap.certbot.renew.timer` активен, `certbot renew --dry-run --no-random-sleep-on-renew` прошёл.
- External smoke: `/`, `/projects`, `/projects/corvo` — `200`; неизвестный маршрут — `404`; CSS, JS, WOFF2, SVG и изображения загружаются без asset 404; console/hydration errors на основных страницах отсутствуют.
- Browser smoke при `1440 px`: навигация, Back/Forward, sticky header, project action bar, lightbox и отсутствие horizontal overflow проверены.
- Certbot зарегистрирован без email; email пользователя не придумывался и не сохранялся.

### Диагностика и rollback

- Статус: `systemctl status art-des.service`; логи: `journalctl -u art-des.service -n 100 --no-pager`.
- Restart: `systemctl restart art-des.service`; Nginx: `nginx -t && systemctl reload nginx`.
- Первый rollback: отключить `/etc/nginx/sites-enabled/art-des`, вернуть symlink на `/etc/nginx/sites-available/default`, выполнить `nginx -t` и reload, затем остановить `art-des.service`. Приложение, сертификаты, логи и конфигурации не удалять.
- Backup исходного Nginx-site: `/etc/nginx/sites-available/default.pre-art-des`; HTTP-конфиг до SSL: `/etc/nginx/sites-available/art-des.pre-ssl`.

## Источники дизайна

- Figma file: `5ZzspE0OrqesDcTP0RRPHr`.
- Главная: node `262:2382`, контрольный viewport `1440 px`.
- Corvo: node `373:47103`.
- «Все работы»: node `373:50236`.
- 404/500: актуальные nodes `420:54056` и `420:54081`.
- Общий footer: node `378:50597`.
- Header motion: section `373:48009`.
- Project action bar: sections `373:47102`, `373:50562`.

## Действующие решения

- Desktop-shell: `1280 px`, центрирован; внутренний header/main/footer: `1200 px`.
- Адаптив ниже `1280 px` пока не реализован, но будущая архитектура не должна его блокировать.
- Новый pathname без hash открывается с `scrollY = 0`; hash-навигация сохраняется.
- Контекстная цепочка хранится в `history.state` конкретной записи с сохранением внутренних полей Next.js; reload и Back/Forward восстанавливают соответствующий путь без query-параметров.
- Общий `SiteHeader` имеет flow/fixed состояния; project header включает breadcrumbs.
- Общая project action bar имеет floating/inline состояния и формируется из MDX/frontmatter.
- Проекты хранятся в MDX; backend для текущего этапа не нужен.
- Telegram URL и финальный CV PDF остаются `pending`.

## Текущий рабочий процесс

Перед каждым новым промптом пользовательского исполнения:

1. классифицировать размер задачи: малый / средний / большой;
2. классифицировать риск: низкий / повышенный / высокий;
3. предложить режим: `OPTIMIZED` или `FULL` и кратко объяснить причину;
4. определить границу Git-группы: что входит в будущий commit и что не входит;
5. получить подтверждение пользователя;
6. только после подтверждения выдать финальный промпт.

Production, VPS, DNS, SSL, секреты, доступы, миграции и потенциально необратимые операции всегда используют `FULL`, независимо от размера diff.

Подробные правила режимов, проверок и Git находятся в `AGENTS.md`.

## Открытые ограничения

- Исправления 404/500 и platform-иконок имеют статус `READY_FOR_REVIEW` в `DESIGN_QA.md`; `CLOSED` ставить только после пользовательской проверки.
- SSH-доступ и read-only аудит VPS подтверждены; сервер до deploy был пустым, неизвестных сайтов и приложений не обнаружено.
- В `main` находится старая версия; актуальная разработка ещё не слита.
- При конфликте WCAG с утверждённой Figma реализуется Figma, а исключение фиксируется в `ACCESSIBILITY_EXCEPTIONS.md`.

## Следующий шаг

1. Проверить строку характеристик Corvo и контекстные цепочки `Главная → Corvo` и `Главная → Работы → Corvo`.
2. Проверить preview 404, 500 и platform-иконок на `/projects`.
3. После принятия перевести соответствующие записи `DESIGN_QA.md` из `READY_FOR_REVIEW` в `CLOSED`.
4. Следующий deploy или merge выполнять только после отдельного явного разрешения пользователя.

Не выполнять merge или следующий deploy без отдельного явного разрешения пользователя.
