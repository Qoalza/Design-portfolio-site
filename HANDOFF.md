# HANDOFF

Обновлено: 2026-08-30

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

- Карточные Figma Frame-композиции используют корневой Fill как явную границу clipping: без видимого Fill содержимое и внешние тени не обрезаются, с любым видимым Fill сохраняются фон, радиус и обрезание по Frame. Hero/главное изображение страницы сохраняет прежнюю семантику `clip content`. Новые manifests записывают `hasVisualFill`; старые snapshots совместимо определяются по `background`. Изменение ограничено кодом и admin bundle; project JSON, sandbox drafts и пользовательские ассеты в Git-группу не входят.
- В ветке `codex/frame-validation-human-errors` исправлен локальный контракт импортированных Figma Frame: дочерние слои могут иметь отрицательные координаты и выходить за фиксированную границу корневого Frame; `clip content` по-прежнему обрезает их, не увеличивая Frame. Реальный draft `sarafan-radio` с `x=-262`, `y=-311` компилируется.
- Ошибки локальной админки переведены на единый пользовательский контракт: конкретный заголовок «что произошло», известная причина и действие для исправления. Технические пути и внутренние сообщения не выводятся; если причина действительно неизвестна, интерфейс честно сообщает о необходимости ручной диагностики разработчиком. Focused tests `41/41`, lint, admin bundle и production build успешны; локально доказана ошибка некорректной Figma-ссылки с понятным объяснением. Merge и deploy этой ветки не выполнялись.
- Goal `codex/figma-frame-admin-assets` merged через PR #24; feature merge SHA — `27679a0a8f8856037aefd48c79586b0b46be0704`. Production разворачивается только из точного tracked-содержимого актуального `origin/main`.
- Односторонняя граница данных активна: при первом live-запуске прежние sandbox drafts/assets/snapshots/jobs перемещены в локальный `sandbox-archive`, рабочая база создана заново из канонического `main`, а baseline подтверждает source SHA `27679a0a8f8856037aefd48c79586b0b46be0704`. Тестовые данные и тестовые состояния публикации не являются источником production-контента.
- Production deploy Goal выполнен атомарно 2026-08-30. Ограниченный SSH status и публичные `/`, `/projects`, `/projects/corvo` подтверждают точный release SHA; все маршруты отвечают `200`, известные тестовые проекты и тексты отсутствуют.
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
- В ветке `codex/local-project-admin-publisher` реализована schema v2 и изолированная локальная CMS. Черновики и draft-ассеты находятся в `Application Support`; неполные формы сохраняются, а строгая компиляция выполняется перед preview/publish. Preview использует отдельный overlay и отдельный `.next-admin-preview-<port>`, не пишет в Git и не конфликтует с обычным dev-сервером.
- Предыдущий статус готовности локальной админки был снят как недоказанный (`NOT_READY`). Экран тестовой публикации дополнительно исправлен после пользовательской приёмки: Radix-подписи больше не наследуют геометрию круглых маркеров, семь этапов не сжимаются и не обрезаются, активное и завершённое состояния проверены в браузере на `1280×720`. Текущий статус — `READY_FOR_USER_REVIEW`, но не `CLOSED`.
- Admin UI теперь использует светлую трёхзонную сетку: расширенный список проектов, центральный редактор `Карточка / Страница проекта` и устойчивую правую панель настроек. Убраны несмысловые вложенные рамки; tab labels не сжимаются и не переносятся; формы, asset actions, section controls, ошибки, home dialog и publication overlay проверены в готовом интерфейсе. Radix остаётся только внутри `tools/des-art-admin`.
- Настройки `Примечание` и `Интерактивный экран` находятся непосредственно внутри каждой секции и сохраняются независимо по `adminId`; правая панель больше не маскирует их как одну общую настройку. Описание секции редактируется настоящим визуальным rich-text полем: Markdown/HTML-маркеры пользователю не показываются, абзацы, подзаголовок, форматирование, ссылки и списки сохраняются структурированно и воспроизводятся в preview. Активный режим toolbar, autosave/reload и совпадение списка с preview проверены в браузере.
- Создание принимает свободное название и формирует системный уникальный slug. Slash-теги сохраняются через blur/restart. Structured validation показывает все конкретные проблемы и переводит к нужному полю; generic error и browser-native dialog отсутствуют. Card/page preview читают draft overlay и не пишут в канонический контент.
- Publish worker имеет server-owned режимы. Sandbox по умолчанию создаёт только локальный snapshot. Live включается отдельным `Application Support/live-publish.json`, берёт свежий `origin/main` во временный worktree, запускает проверки, создаёт PR/merge, передаёт exact SHA через ограниченный SSH-канал и использует атомарный VPS release с rollback по readiness. Тестовые `/private/tmp` stores не могут запускать live publish.
- В ветке `codex/figma-frame-admin-assets` `ProjectFrameComposition` переведён на согласованную упрощённую модель: корневой Figma Frame остаётся адаптивным DOM/CSS-контейнером, а каждый его непосредственный видимый ребёнок сохраняется отдельным PNG `2×`. Если ребёнок уже является готовым image fill, импортёр забирает исходный PNG без повторного Figma-export, показывает его целиком (`contain`) и не накладывает поверх CSS-обводку; отдельно сохраняются только тени. Дочерние элементы не объединяются в общий растр; их root-level geometry и constraints, а также фон/radius/clipping корня остаются данными композиции. Импорт атомарно сохраняет last-good snapshot, production Figma не опрашивает. Cover/hero/interactive подключены без автоматической миграции legacy managed-композиций.
- Живой импорт пользовательского hero Frame выявил два общих дефекта renderer: `CENTER` constraints вычислялись относительно дочернего слоя, а вертикальные процентные `padding` в CSS ошибочно зависели от ширины контейнера. Расчёт исправлен одновременно в admin/public renderer через единицы корневого Frame. Для непосредственных PNG-слоёв больше нет универсального масштабирования: `MIN/MAX/CENTER` сохраняют исходный размер слоя в едином масштабе preview и меняют только его привязку; размер по оси меняется только при заданном в Figma `STRETCH` или `SCALE`. Cover-preview занимает квадратный слот `320×320`, сохраняет clipping и не получает отдельный увеличенный радиус; обычные input/action controls используют Radix `size="3"` (`40 px`) и системный `medium` radius. Соседние ghost icon-actions имеют стабильный `8 px` gap. Outline-кнопки имеют белый base, серую обводку и различимые hover/pressed/focus/disabled состояния; destructive ghost-кнопки прозрачны в base и получают лёгкую заливку на hover. Повторяющиеся заголовки секций получают уникальные DOM id, поэтому duplicate-key overlay больше не возникает. Импорт сразу показывает spinner и текущий этап, повторный клик блокируется, а обложка карточки расположена первой на вкладке `Карточка`.
- Отдельный визуальный дефект Frame-preview остаётся незакрытым и сознательно вынесен из текущего этапа по решению пользователя: hero-композиция всё ещё не совпадает с исходным Figma Frame в верхней обводке/угловых деталях. Проведённые геометрические и автоматические проверки не являются доказательством исправления этого дефекта; разбирать его нужно отдельной задачей через прямое визуальное сравнение исходника и runtime.
- Локальный focused-срез после упрощения: cover-preview использует квадратный слот без растягивания самой композиции; готовые PNG не обрезаются через `cover`; каталог `/projects` повторяет цикл `wide → две compact → wide` с разделительным перекрестием перед каждой следующей широкой карточкой. Production не изменён, merge/deploy остаются заблокированы до пользовательской приёмки.
- Публичный список проектов больше не показывает подписи `Файл пока недоступен` или `У проекта нет отдельного файла`: состояние файла остаётся только внутри открытого проекта. Ошибки повреждённого импортированного Frame переводятся из внутренних contract paths в пользовательские названия ассета и конкретное действие восстановления.
- Исправлены оба preview-пути SVG-логотипа: draft asset route отдаёт `image/svg+xml`, а `/projects` и `/projects/[slug]` переписывают URL на env-gated preview asset. Реальным локальным HTTP-контуром подтверждены `200`, MIME и наличие одного и того же SVG URL в card/page HTML.
- Asset UX использует outline `Заменить`, ghost-корзины, lightbox для всех preview, исправленные gallery/section arrows, неудаляемую первую секцию и нижнюю кнопку добавления. False dirty считается по нормализованному пользовательскому payload, а conditional validation не требует Figma URL при состоянии `Файл отсутствует` или недоступной странице.
- Автопроверки Goal: focused Frame tests, `npm run admin:build`, lint и production build успешны; в публичных Next chunks Radix не найден. Figma PAT подключён через macOS Keychain; живой повторный импорт Frame успешно завершён без ошибки. Пользовательская локальная приёмка получена; PR #24 merged и точный merge SHA развёрнут на production.

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
3. После успешного предмерджевого data-boundary gate обновить Draft PR веткой `codex/figma-frame-admin-assets` и запросить отдельное разрешение точного merge SHA. Merge и production deploy до этого запрещены.
