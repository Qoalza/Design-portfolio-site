# HANDOFF

Обновлено: 2026-08-28

## Назначение

Короткая оперативная память проекта: только актуальное состояние, действующие решения, открытые ограничения и следующий шаг. Этот файл читается вместе с `AGENTS.md` перед каждой задачей.

- Подробная история завершённых этапов: `PROJECT_HISTORY.md` — читать только релевантные разделы по необходимости.
- Открытые визуальные дефекты: `DESIGN_QA.md` — читать при работе с соответствующим экраном или при формировании пакета визуальных исправлений.
- Постоянные правила Figma-компонентов, variables и соответствия коду: `DESIGN_SYSTEM.md` — читать при создании или изменении компонентов дизайн-системы.
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

- Рабочая ветка: `main`; принятая MLIR7 слита fast-forward и отправлена в `origin/main`.
- Актуальный production/source commit (`DEPLOY_SHA`) совпадает с полным SHA текущего `origin/main`; точное значение подтверждается после каждого deploy по отданному HTML и release-path. Проверенный MLIR7 runtime `CODE_SHA` до документационной приёмки — `a322cf7341ee351d50f1a98cdb9d857fe46dd956`.
- Desktop-раздел `Main chapter` повторно сверен блоками с актуальной Figma в ветке Goal: hero `be19432`, process `aa356c2`/`0175d5c`, `/projects` `73285a3`, breadcrumbs `bdcbb27`, Corvo top/preview `18eb4bc`, sticky/action bar `db3aeea`/`8e3e45b`/`99fb7b4`, content/footer `542e666`, проекты/AI/resume главной `3bfc8de`/`d742b23`/`01ce952`/`daf6e01`.
- Главная использует трёхшаговый process-блок только со стрелками; wheel/trackpad прокручивает страницу и не переключает этап. Поведение проверено в Chromium и Zen/Firefox.
- Corvo использует актуальный большой Figma-preview, сетку навигации и контента `200 + 1000 px`, нециклическую галерею и одну action bar с переходом `Full ↔ Adaptive`.
- Follow-up `MLIR2-CNT/PROC/PRJ/META/ABA/GAL` реализован отдельными логическими commits: восстановлен точный ритм пяти Corvo-секций, добавлены прозрачные versioned process-assets, intrinsic project-card rhythm и общий CTA `Скоро`, исправлены первый кадр action bar и полные device icon frames. Обнаруженная в Zen граница sticky stack исправлена отдельным navigation commit.
- Полная обязательная Zen `1.21.15b` (build `126.8.18`) matrix на `1280×720`, `1440×900`, `1440×999`, `1440×1200`, `1440×1356`, `1920×1080` прошла для текущего HEAD; focused tests, lint и production build также успешны.
- MLIR3 follow-up системно переводит весь видимый non-heading UI на Onest, закрепляет Figma→code icon contract, синхронизирует Footer с library node `124:4841`, сохраняет внешние тени прозрачных preview, устраняет first-paint flash и terminal overlap action bar, активирует последний короткий раздел по геометрии, делает Gallery overflow-aware и переносит lightbox в top layer. Chromium и Zen `1.21.15b` matrices прошли 6/6 для `fce9e2288c3a80a28da51479a5668fa33b22fb59`; evidence — `design-reference/main-layout-interaction-followup/README.md`.
- MLIR4 синхронизирует актуальные Body styles/TextButton Large, Hero/Codex/CV, доступность project routes и общий Tooltip; уточняет action bar, sticky navigation и Gallery; desktop/fine-pointer scroll работает через Lenis `1.3.25` и один общий RAF. Focused tests `95/95`, lint и production build успешны; Chromium и Zen `1.21.15b` matrices прошли 6/6 для текущего CODE_SHA. Evidence — `design-reference/main-layout-interaction-polish/README.md`.
- Изолированный action-bar initial-state fix подтвердил причину регрессии: bootstrap/initial resolver включал `Adaptive` при любом пересечении information layout с линией bar, а steady-state resolver требовал `200 px`. Все три пути теперь используют один geometry threshold. Chromium и Zen `1.21.15b` подтвердили direct URL, hard reload, client navigation, границы `199.5/200/200.5 px` и matrix `6/6` для `4a59f8cfd9c61ca710f9a39942303356d99bf5f3`; evidence — `design-reference/action-bar-initial-state-fix/README.md`. Внутренний visual layout остаётся отдельным непринятым backlog: frame `Обновлено…` восстанавливается из точного Figma component, Check в copy-Tooltip использует `Semantic/Element/invers`.
- MLIR6 завершает Gallery/root input arbitration через единый pre-mutation gate, DPR-aware lightbox и точные device frames; синхронизирует project CTA/tags/Update info, внутренний action bar и canonical Clipboard Share, AI/process и 404. Chromium `151.0.0.0` и Zen `1.21.15b` прошли fresh matrix из `cca7d77f3a6cc8e5af37a26bae2abfe89f796642`; focused tests `121/121`, lint и production build успешны. Evidence — `design-reference/gallery-project-error-reconciliation-mlir6/`.
- MLIR7 стабилизирует все Gallery movement paths, проверяет 15 lightbox frames, восстанавливает Tech typography со slashed zero, синхронизирует AI/Share feedback, интерактивные 404/500 controls и route metadata. Единственный browser favicon — точная копия пользовательского `Symbol.svg` по `/artur-designer-favicon.svg`; ICO/PNG browser fallbacks отсутствуют. Focused tests `142/142`, lint/build успешны; Chromium и Zen `1.21.15b` matrices прошли `22/22` из `a322cf7341ee351d50f1a98cdb9d857fe46dd956`. Evidence — `design-reference/gallery-tech-favicon-reconciliation-mlir7/`; пользовательская приёмка получена 2026-08-26.
- Базовый error-layout исправлен в `cf9e161` (`Fix error page viewport layout`); follow-up синхронизирует позиции с актуальными nodes `420:54056`/`420:54081` и отделяет clipping иллюстрации от тени сообщения.
- Общий механизм platform-иконок использует typed intrinsic-размеры и mask с Figma-цветом `#75848F`; error pages и иконки имеют статус `READY_FOR_REVIEW`.
- Строка характеристик открытого проекта использует Figma Hug-механику: ширина по содержимому, без desktop-переноса в доступных `1200 px` (`b6f461d`).
- Breadcrumbs строятся из фактического пути текущей history entry; прямой вход использует явно заданную для типа страницы каноническую цепочку.
- Незавершённый пакет `codex-context-transfer-2026-08-15/` и ZIP остаются отдельными untracked-артефактами; не добавлять и не удалять.
- MLIR7 развернута в production 2026-08-26 из точного `DEPLOY_SHA` `ebe50fb29942f6aa0aa60f86f7c2fae8c640f1a7`; внешний smoke-check пройден.
- Принятые Footer и process controls развернуты в production 2026-08-27 из точного `DEPLOY_SHA` `8f3c869ac6aa30cbc4c2c5f6422290db5aa45fa1`: Footer содержит `Разработка и Дизайн Артур А.`, кнопки Light имеют размер `32×32`, верхние/нижние переходы и оба слоя fade подтверждены в browser smoke.
- Layering process-блока исправлен и развернут 2026-08-28 из точного `DEPLOY_SHA` `4af476cab57c4ed248d04ce2907e0731e6669a36`: изолированный stacking context удерживает `track → fade → control` ниже fixed Header; scroll/hit-test и переходы всех этапов подтверждены в production.
- Единый social preview развернут 2026-08-28 из текущего `origin/main`: `/`, `/projects` и `/projects/corvo` используют `artur-designer-social-preview.png`, `og:title` `Артур А.`, `og:description` `PRODUCT DESIGNER` и абсолютные canonical OG URL; release-path и отданный build SHA совпали с полным SHA ветки.
- В ветке `codex/local-project-admin-publisher` локальная админка получила отдельный React + Radix Themes UI-контур: список проектов, вкладки `Карточка` / `Страница проекта` / `Медиа` и постоянная панель публикации. Radix подключён только внутри `tools/des-art-admin`, публичный App Router и портфельная дизайн-система его не импортируют. Файловое хранилище, локальная безопасность и preview-контракт не менялись.

## Production

- URL: `https://art-des.ru`; `http://art-des.ru` и оба варианта `www` перенаправляются на canonical HTTPS host.
- VPS: Ubuntu 24.04 LTS; Node.js `22.23.2`; npm `10.9.8`; Nginx `1.24.0`; Certbot `5.7.0`.
- Release: `/var/www/art-des/current` указывает на каталог полного SHA текущего `origin/main`; предыдущий успешный release сохраняется как rollback boundary.
- Next.js работает от системного пользователя `portfolio` через `art-des.service`: сервис `active`, `enabled`, restart проверен.
- Next.js слушает только `127.0.0.1:3000`; UFW разрешает снаружи только OpenSSH и `80/443`. Пять независимых внешних probe-nodes получили timeout на `:3000`.
- Let's Encrypt покрывает `art-des.ru` и `www.art-des.ru`, срок действия до `2026-11-13`; `snap.certbot.renew.timer` активен, `certbot renew --dry-run --no-random-sleep-on-renew` прошёл.
- External smoke 2026-08-26: `/`, `/projects`, `/projects/corvo` — `200`; фиксированный неизвестный маршрут — `404`; `/error-test?trigger=500` — ожидаемый `500`; route titles, canonical redirects, favicon MIME и 40 homepage assets проверены без неожиданных отказов.
- Browser smoke при `1440×900`: переходы `/` → `/projects` → `/projects/corvo`, Gallery arrow/trackpad step, lightbox, action bar `Adaptive`/`Full`, Share feedback, 404/500 controls и отсутствие horizontal overflow проверены; чистая навигационная сессия не содержит console/hydration ошибок.
- Production HTML и server-side `REVISION` подтверждают полный `DEPLOY_SHA`; `art-des.service` остаётся `active` и `enabled`.
- External/browser smoke 2026-08-27: `/` — `HTTP/2 200`; полный build SHA, Footer, Light-контролы `32×32`, fade и переходы `1→2→3→2→1` подтверждены; console/hydration warnings отсутствуют.
- External/browser smoke 2026-08-28: `/` — `HTTP/2 200`; полный build SHA подтверждён, Header перекрывает process viewport в реальной scroll-позиции, внутренние z-уровни `track=0`, `fade=2`, `control=3` сохранены, переходы `1→2→3→2→1` работают; console/hydration warnings отсутствуют.
- External metadata smoke 2026-08-28: `/`, `/projects`, `/projects/corvo` — `200`; один `https://art-des.ru/artur-designer-social-preview.png`, точные OG title/description/url и полный build SHA подтверждены; PNG отвечает `HTTP/2 200` с `content-type: image/png`.
- Certbot зарегистрирован без email; email пользователя не придумывался и не сохранялся.

### Диагностика и rollback

- Статус: `systemctl status art-des.service`; логи: `journalctl -u art-des.service -n 100 --no-pager`.
- Restart: `systemctl restart art-des.service`; Nginx: `nginx -t && systemctl reload nginx`.
- Первый rollback: отключить `/etc/nginx/sites-enabled/art-des`, вернуть symlink на `/etc/nginx/sites-available/default`, выполнить `nginx -t` и reload, затем остановить `art-des.service`. Приложение, сертификаты, логи и конфигурации не удалять.
- Backup исходного Nginx-site: `/etc/nginx/sites-available/default.pre-art-des`; HTTP-конфиг до SSL: `/etc/nginx/sites-available/art-des.pre-ssl`.

## Источники дизайна

- Figma file: `5ZzspE0OrqesDcTP0RRPHr`.
- Главная: node `510:28120`, контрольный viewport `1440 px`.
- Corvo: node `373:47103`.
- «Все работы»: node `373:50236`.
- 404/500: актуальные nodes `420:54056` и `420:54081`.
- Общий footer: node `378:50597`.
- Header motion: section `373:48009`.
- Project action bar: current component set `550:2868`, Adaptive `528:1540`, Full `576:33195`; reference screens `553:3314` и `553:3036`. Удалённый старый node `373:50562` не использовать как источник.

## Действующие решения

- Desktop-shell: `1280 px`, центрирован; внутренние колонки и отступы следуют актуальным Figma-экземплярам.
- Адаптив ниже `1280 px` пока не реализован, но будущая архитектура не должна его блокировать.
- Новый pathname без hash открывается с `scrollY = 0`; hash-навигация сохраняется.
- Контекстная цепочка хранится в `history.state` конкретной записи с сохранением внутренних полей Next.js; reload и Back/Forward восстанавливают соответствующий путь без query-параметров.
- Общий слой `ControlButton` / `TextButton` / `NavigationTab` реализует актуальные Figma-состояния Default, Hover, Pressed и Disabled без переходной анимации; Header, breadcrumbs, проектные действия, галереи и process-stepper используют этот контракт.
- Общий `MainProjectCard` применяется на главной и `/projects`; актуальный Footer содержит только авторский блок и год из компонентной базы.
- Corvo использует актуальные нециклические кнопки галереи, только правый edge-fade при наличии следующего item, top-layer lightbox и варианты action bar `Full` / `Adaptive`; terminal region постоянно резервирует `48 px + 88 px` и не меняет scrollHeight при docking.
- Desktop/fine-pointer прокрутка использует Lenis `1.3.25` с лёгкой микроинерцией и единым `ScrollFrameCoordinator`; touch/coarse input и reduced-motion сохраняют native scroll. Route reset, hash-навигация, sticky navigation и Gallery подключены к общему controller contract.
- Общий `SiteHeader` имеет flow/fixed состояния; project header включает breadcrumbs.
- Общая project action bar имеет варианты `Full` / `Adaptive`, привязанные к измеренным границам header stack, information sentinel, content column и footer.
- Проекты хранятся в MDX; backend для текущего этапа не нужен.
- Повторная same-page hash-навигация (`Мои работы`, Back/Forward) централизована в `ContextLink` и `NavigationScrollController`; поля `history.state` Next.js сохраняются.
- Актуальные контентные ссылки:
  - кнопки связи ведут на `https://t.me/Coco_soul`;
  - обе ссылки `CV` и `Скачать полное CV` ведут на `https://disk.yandex.ru/i/iZ1UWgbO1LAOPw`.
  - кнопка `Figma` у проекта Corvo ведёт на `https://www.figma.com/design/5vYeOVxLE28VNXEMOnopno/Corvo---Readme?node-id=0-1&t=aF2DFRqTKZaBO9Ig-1`.

## Текущий рабочий процесс

Перед каждым новым промптом пользовательского исполнения:

1. классифицировать размер задачи: малый / средний / большой;
2. классифицировать риск: низкий / повышенный / высокий;
3. предложить режим: `OPTIMIZED` или `FULL` и кратко объяснить причину;
4. определить границу Git-группы: что входит в будущий commit и что не входит;
5. получить подтверждение пользователя;
6. только после подтверждения выдать финальный промпт.

По умолчанию реализация делится на согласованные логические Git-группы: после каждой группы исполнитель выполняет целевую проверку, создаёт commit, показывает результат и ждёт пользовательского подтверждения. Если пользователь явно пишет `автономно`, те же группы выполняются последовательно без промежуточного ожидания; проверки, commits, evidence и stop-lines сохраняются.

Production, VPS, DNS, SSL, секреты, доступы, миграции и потенциально необратимые операции всегда используют `FULL`, независимо от размера diff.

Подробные правила режимов, проверок и Git находятся в `AGENTS.md`.

## Открытые ограничения

- Preloaders и loading states вынесены в отдельный неблокирующий backlog; они не входят в принятую MLIR7 и текущую merge/deploy Goal.

- `MLIR2-*` runtime и visual/behavioral evidence подтверждены для `69dc9b7823cebc839482a037e6dbb9abaa6ca182`: Chromium и Zen matrices прошли `6/6` со свежими screenshots. До пользовательской приёмки пакет имеет статус `READY_FOR_REVIEW`, не `CLOSED`.
- Исправления 404/500 и platform-иконок имеют статус `READY_FOR_REVIEW` в `DESIGN_QA.md`; `CLOSED` ставить только после пользовательской проверки.
- SSH-доступ и read-only аудит VPS подтверждены; сервер до deploy был пустым, неизвестных сайтов и приложений не обнаружено.
- Локальный `main` и `origin/main` синхронизированы; context-transfer артефакты остаются отдельными untracked-файлами.
- При конфликте WCAG с утверждённой Figma реализуется Figma, а исключение фиксируется в `ACCESSIBILITY_EXCEPTIONS.md`.

## Следующий шаг

1. Social preview production deploy завершён; production наблюдать штатными health/smoke-проверками без повторного deploy.
2. Preloaders/loading states оставить для отдельного будущего Work Packet после новой классификации и пользовательского подтверждения.
3. Новый интерфейс локальной админки готов к пользовательской проверке из рабочей ветки; merge/deploy в рамках этой Git-группы не выполнялись.
