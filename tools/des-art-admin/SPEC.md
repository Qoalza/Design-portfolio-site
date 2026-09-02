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

До первого live bootstrap действует абсолютная граница: **`production → новая локальная Admin`; никогда `sandbox → production`.** Изолированная копия, включая local drafts, draft-assets, preview overlays, jobs, snapshots, backups и sandbox acceptance, не может стать source для Git, `main`, canonical content/assets, publish или deploy. Первый valid live start требует exact deployed SHA, равный `origin/main`, и транзакционно архивирует эту копию. Только после marker v4 Admin становится live: её последующие пользовательские правки — это рабочие изменения, которые прежняя кнопка «Опубликовать» публикует через защищённый live workflow.

`verify-production-content-provenance.mjs` — read-only evidence только для начальной интеграции `main → Admin-v3 candidate`: он доказывает, что три v2→v3 migration не внесли sandbox-данные. Он не применяется как запрет на последующие намеренные content changes, опубликованные live Admin.

### Выбор пути при первом переходе в live

До первого live bootstrap Admin не выбирает путь самостоятельно. По запросу пользователя Codex сначала фиксирует локальный одноразовый `live-transition-request-v1`: либо `clean` — чистый production baseline, либо `delta` — перенос только неопубликованной разницы в local live drafts. Сам request не запускает migration, не архивирует данные и не публикует сайт.

Для нового sandbox сохраняется immutable `sandbox-origin-v1` только после совпадения полного публичного `data-build-sha` и `origin/main`: baseline-проекты с `adminId` и manifest хэшей исходных assets. При `delta` semantic three-way merge накладывает изменённые поля и секции sandbox поверх свежего production; неизменённое остаётся production. Удаления, unpublish, пустые значения, `catalogOrder` и `homePlacement` не переносятся; новый проект остаётся local draft. Одновременное изменение одной semantic unit (поле, visual surface, section или gallery) останавливает перенос до archive и staging.

Если origin отсутствует, Admin показывает локальную проверку переноса и принимает только явно выбранные поля, visual surfaces и секции. Каждый выбранный unit получает hash exact production-цели, показанной во время проверки; изменение или исчезновение этой цели до live bootstrap останавливает перенос без частичного draft. Секции без доказанного совпадения считаются добавлением, а не заменой. Staging, archive и activation защищены journal: при любой ошибке marker live не создаётся, а частично активированные drafts возвращаются в staging; повторный запуск останавливается на journal, не выполняя второй перенос.

## Черновик и preview

- Изменение страхуется в `localStorage`, затем атомарно сохраняется локальным server process.
- Перед сменой проекта и preview выполняется flush.
- Неполный authoring draft разрешено сохранять; preview и publish компилируют его в строгий `ProjectDocument` v3.
- Preview открывает настоящие Portfolio routes: `/`, `/projects`, `/projects/[slug]`.
- Homepage и catalog читают merged canonical + partial draft overlay; коллекция валидируется после merge.
- Draft asset URL переписывается только в env-gated preview runtime. Canonical JSON/assets не перезаписываются.
- Каждый preview-порт использует отдельный `.next-admin-preview-<port>`.

## Интерфейс и контент

- Центр содержит вкладки `Карточка` и `Страница проекта`; публикация и global placement остаются в боковых панелях.
- Визуальная поверхность показывает утверждённый шаблон read-only и одно поле ссылки на Figma Frame; внутренние content slots не выставляются пользователю отдельными файлами.
- После успешного импорта Admin показывает preview целого исходного Frame: карточка — в квадратном контейнере, hero и интерактивный блок — в собственной пропорции, уменьшенной до ширины редактора. Preview является только подтверждением выбранного source и не задаёт layout Portfolio.
- Секция редактирует заголовок, rich text, текст notice и может добавить один интерактивный блок из совместимых с профилем шаблонов. После вставки ссылки importer проверяет целый Frame, автоматически определяет допустимый section template по профилю и геометрии source и атомарно создаёт или обновляет `visual` block. Пользователь не выбирает template.
- Notice использует фиксированный `notice.info-v1`; ширина не редактируется.
- Rich text поддерживает только утверждённый подзаголовок `h3`; разрывы ритма хранятся как semantic `hardBreak`.
- Галерея одна. Admin управляет только устройством и изображениями (`add/remove/reorder`); рамка, иконка, подпись и размеры принадлежат `gallery.devices-v1`. До первого файла действуют независимые диапазоны ширины и высоты: Desktop `1480–2960 × 1024–2048 px`, Tablet `800–1600 × 1132–2266 px`, Mobile `360–1080 × 640–1920 px`. Первый файл фиксирует точные `Ш×В` для своего device-пула; все следующие обязаны совпадать. Portfolio вписывает изображение через `contain` в фиксированную рамку без обрезки и изменения лейаута.
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
- Выходящий за pixel-range, не совпадающий с первым размером пула, слишком маленький, неправильной пропорции для code-owned composition или MIME asset отклоняется до записи; правильный сохраняется без изменения visual rules.
- Section/gallery add-remove-reorder и global placement проходят общий strict preflight.
- `/`, `/projects` и project route используют настоящий Portfolio renderer с текущим draft overlay.
- Sandbox publish обновляет только локальный snapshot. После первого подтверждённого live bootstrap обычная live publish-кнопка изменяет production прежним real-time workflow.
