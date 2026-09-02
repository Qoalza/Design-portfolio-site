# Контракт Des-art Admin

## Роль Admin

Admin редактирует данные в заранее объявленных слотах, но не проектирует визуал. Геометрия, фон, паттерн, рамка, радиус, тень, clipping, позиционирование и responsive behavior принадлежат Portfolio-компонентам и общему registry `src/lib/project-visual-registry.ts`.

- Пользователь не выбирает и не создаёт визуальные шаблоны.
- `templateId` показывается read-only; другой профиль или шаблон назначается изменением кода.
- Для карточки, hero и интерактивного блока Admin принимает одну ссылку на утверждённый Figma Frame. Read-only importer раскладывает его содержимое по скрытым именованным слотам registry; пользователь не управляет этими частями отдельно.
- У закрытой страницы поле hero Frame доступно сразу. Admin автоматически распознаёт один утверждённый hero-вариант по структуре Frame и только после успешного импорта атомарно создаёт локальный hero и включает страницу. До этого preview и публикация остаются недоступны.
- Обычная загрузка изображения разрешена только галерее; логотип имеет отдельное SVG-поле. Неподходящий Frame или asset отклоняется до записи с русскоязычной ошибкой.
- Новые проекты получают безопасный `catalog-only-v1` и только `catalog.browser`.

## Локальная граница

Admin работает только на `127.0.0.1`, использует отдельный bundle Radix Themes и не импортируется публичным App Router. Черновики, draft-assets, preview overlays, jobs, snapshots и migration backups хранятся в `~/Library/Application Support/Des-art Admin`, а не в рабочем Git-дереве.

Packaged Admin может использовать другую checkout-версию. После schema migration реального store его нельзя запускать до попадания v3-кода в managed checkout; при локальной приёмке используется Admin из текущей workspace-ветки с sandbox publish mode.

### Одностороннее направление данных

До первого live bootstrap действует абсолютная граница: **`production → новая локальная Admin`; sandbox никогда не попадает в Git, canonical content/assets или production во время bootstrap.** Изолированная копия, включая local drafts, draft-assets, preview overlays, jobs, snapshots, backups и sandbox acceptance, не становится source для release. Первый valid live start требует exact deployed SHA, равный `origin/main`, и создаёт marker v5 с отдельным generation store. Только последующая обычная кнопка «Опубликовать» может выпустить live drafts через прежний защищённый workflow.

`verify-production-content-provenance.mjs` — read-only evidence только для начальной интеграции `main → Admin-v3 candidate`: он доказывает, что три v2→v3 migration не внесли sandbox-данные. Он не применяется как запрет на последующие намеренные content changes, опубликованные live Admin.

### Выбор пути при первом переходе в live

До первого live bootstrap Admin не выбирает путь самостоятельно и не показывает для этого кнопку или форму. По запросу пользователя Codex сначала спрашивает путь, затем через локальную operator-команду фиксирует одноразовый `live-transition-request-v2`: либо `clean` — чистый production baseline, либо `overlay` — перенос sandbox project-authoring state в local live drafts. Request привязан к full target SHA; сам request не запускает migration, не архивирует данные и не публикует сайт.

При `overlay` current production — основа, а каждое физически присутствующее sandbox-значение побеждает: включая пустые значения, visibility/deleted, секции, gallery, порядок, `catalogOrder` и `homePlacement`. Production-only проекты остаются canonical, sandbox-only проект становится local draft. Переносятся только draft JSON и реально referenced draft-assets; jobs, previews, snapshots и runtime state остаются в архиве. `sandbox-origin-v1` является evidence, но его отсутствие не блокирует overlay. Ручной выбор полей, semantic conflict screen и transition UI отсутствуют. Staging, archive и activation защищены lock/journal: marker переключает generation одной атомарной записью; при сбое retry продолжает ту же проверенную generation и не создаёт второй archive.

Существующий valid marker v4 с `source: "production-live"` не является первым bootstrap. После подтверждения полного public SHA, совпадающего с `origin/main`, launcher повышает только metadata до v5 `legacy-live`: сохраняет active store, archive и drafts, записывает подтверждённый current `sourceSha` и `lastObservedAt`. Для этого пути не создаются request `clean|overlay`, archive, transfer или generation. Ошибка live config, public SHA, managed checkout или marker останавливает запуск без sandbox fallback.

## Черновик и preview

- Изменение страхуется в `localStorage`, затем атомарно сохраняется локальным server process.
- Перед сменой проекта и preview выполняется flush.
- Неполный authoring draft разрешено сохранять; preview и publish компилируют его в строгий `ProjectDocument` v3.
- Preview открывает настоящие Portfolio routes: `/`, `/projects`, `/projects/[slug]`.
- Homepage и catalog читают merged canonical + partial draft overlay; коллекция валидируется после merge.
- Draft asset URL переписывается только в env-gated preview runtime. Canonical JSON/assets не перезаписываются.
- Каждый preview-порт использует отдельный `.next-admin-preview-<port>`.
- Для проверки ещё не влитого candidate используется только `run-candidate-sandbox.mjs`: новый пустой support-root внутри системной temporary directory и принудительный sandbox mode; обычный App Support, live config и production не используются.

## Интерфейс и контент

- Центр содержит вкладки `Карточка` и `Страница проекта`; публикация и global placement остаются в боковых панелях.
- Только в verified live у изменённого production-проекта рядом с публикацией есть ghost reset control с tooltip «Сбросить до опубликованной версии». Он скрыт для sandbox, совпадающего production и draft-only проектов; после подтверждения удаляет только draft, draft-assets, preview и локальную insurance copy этого slug.
- Текстовые fields, section headings, notice и rich text имеют только memory history текущего проекта: до пяти `Cmd+Z` и пяти `Shift+Cmd+Z`, с группировкой 700 ms. Media, Figma, структуры, switches, selects, visibility, placement, publish и reset не входят в историю; structural action очищает её.
- Визуальная поверхность показывает утверждённый шаблон read-only и одно поле ссылки на Figma Frame; внутренние content slots не выставляются пользователю отдельными файлами.
- После успешного импорта Admin показывает preview целого исходного Frame: карточка — в квадратном контейнере, hero и интерактивный блок — в собственной пропорции, уменьшенной до ширины редактора. Preview является только подтверждением выбранного source и не задаёт layout Portfolio.
- Секция редактирует заголовок, rich text, текст notice и может добавить один интерактивный блок из совместимых с профилем шаблонов. После вставки ссылки importer проверяет целый Frame, автоматически определяет допустимый section template по профилю и геометрии source и атомарно создаёт или обновляет `visual` block. Пользователь не выбирает template.
- Notice использует фиксированный `notice.info-v1`; ширина не редактируется.
- Rich text поддерживает только утверждённый подзаголовок `h3`; разрывы ритма хранятся как semantic `hardBreak`.
- Галерея одна. Admin управляет только устройством и изображениями (`add/remove/reorder`); рамка, иконка, подпись и размеры принадлежат `gallery.devices-v1`. Подпись до первого файла сохраняет ориентиры: Desktop `1480–2960 × 1024–2048 px`, Tablet `800–1600 × 1132–2266 px`, Mobile `360–1080 × 640–1920 px`. Это не верхний предел: файл может иметь большее разрешение при сохранении минимум `2×`, лимита 20 MB и 40 MP. Первый успешно принятый файл задаёт пропорцию device-пула, а следующие должны совпадать с ней в допуске `0.1%`. За один выбор можно добавить несколько PNG/WebP: Admin отправляет их по одному в порядке выбора, сохраняет допустимые до 20 и одним обновлением draft добавляет получившийся список. Portfolio задаёт фиксированную ширину устройства и рассчитывает высоту по пропорции первого изображения, поэтому accepted image заполняет frame без внутренних полей и crop.
- Главная имеет позиции `primary` и `secondary`. Admin может включить совместимое code-owned размещение, но не менять профиль: Corvo — primary, Sarafan — secondary.
- Каталожный reorder отклоняется, если template не поддерживает получившийся wide/compact slot.
- Generic Frame renderer и импорт произвольного layout отсутствуют. Figma URL остаётся только безопасным source-adapter: ссылка и `templateId` хранятся в Admin-only metadata, а публичный документ получает исключительно `{ templateId, assets }`.
- Figma token читается локально из macOS Keychain, имеет только read-доступ и никогда не попадает в draft, backup, Git или публичный runtime.

## Публикация

Project-only publish сохраняет canonical `catalogOrder` и `homePlacement`; эти глобальные поля меняются только публикацией всех изменений. Preflight проверяет schema/profile/templates/slots/assets, catalog layout, обе позиции главной и все потребляющие preview surfaces.

Без valid `live-publish.json` публикация sandbox-only и не имеет Git/PR/SSH/deploy-пути. С valid local config прежний live workflow доступен без изменения UX: одна кнопка «Опубликовать», confirmation dialog и polling каждые 600 ms для семи этапов. Live job создаёт disposable worktree от `origin/main`, сохраняет `catalogOrder` и `homePlacement` при project publish, создаёт PR, выполняет merge, upload, deploy и проверяет exact public SHA/routes. Codex не запускает этот workflow, merge, push, deploy или доступ к ключу без отдельной команды пользователя.

## Legacy migration

- Публичный runtime и serializer принимают только schema v3.
- Schema v2 читается отдельным migrator, а legacy Frame требует явного mapping в утверждённый template.
- `migrate-v3.mjs` поддерживает `--dry-run`, `--apply`, `--rollback`.
- Backup включает draft JSON, все draft assets и SHA-256 manifest; rollback сначала создаёт и проверяет отдельный v3 backup и pending journal, а при незавершённой операции безопасно останавливается.
- Sarafan migration сохраняет исходные generic Frame/gallery данные в backup, переносит известные Figma source URLs в Admin-only metadata, а active public draft получает named slots code-owned templates.

## Доказанный пользовательский контур

- Создание формирует уникальный неизменяемый slug и `catalog-only-v1`.
- Для галереи отклоняются несовпадающая с первым файлом пропорция, слишком маленький источник, неправильный MIME, файл свыше 20 MB или изображение свыше 40 MP; верхний pixel-range не применяется. Для code-owned composition продолжают отклоняться неправильная пропорция или размер. Правильный asset сохраняется без изменения visual rules.
- Section/gallery add-remove-reorder и global placement проходят общий strict preflight.
- `/`, `/projects` и project route используют настоящий Portfolio renderer с текущим draft overlay.
- Sandbox publish обновляет только локальный snapshot. После первого подтверждённого live bootstrap обычная live publish-кнопка изменяет production прежним real-time workflow.
