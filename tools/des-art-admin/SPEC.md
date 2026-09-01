# Контракт Des-art Admin

## Роль Admin

Admin редактирует данные в заранее объявленных слотах, но не проектирует визуал. Геометрия, фон, паттерн, рамка, радиус, тень, clipping, позиционирование и responsive behavior принадлежат Portfolio-компонентам и общему registry `src/lib/project-visual-registry.ts`.

- Пользователь не выбирает и не создаёт визуальные шаблоны.
- `templateId` показывается read-only; другой профиль или шаблон назначается изменением кода.
- Для карточки, hero и интерактивного блока Admin принимает одну ссылку на утверждённый Figma Frame. Read-only importer раскладывает его содержимое по скрытым именованным слотам registry; пользователь не управляет этими частями отдельно.
- Обычная загрузка изображения разрешена только галерее; логотип имеет отдельное SVG-поле. Неподходящий Frame или asset отклоняется до записи с русскоязычной ошибкой.
- Новые проекты получают безопасный `catalog-only-v1` и только `catalog.browser`.

## Локальная граница

Admin работает только на `127.0.0.1`, использует отдельный bundle Radix Themes и не импортируется публичным App Router. Черновики, draft-assets, preview overlays, jobs, snapshots и migration backups хранятся в `~/Library/Application Support/Des-art Admin`, а не в рабочем Git-дереве.

Packaged Admin может использовать другую checkout-версию. После schema migration реального store его нельзя запускать до попадания v3-кода в managed checkout; при локальной приёмке используется Admin из текущей workspace-ветки с sandbox publish mode.

### Одностороннее направление данных

При интеграции или обновлении Admin действует абсолютная граница: **`production → новая локальная Admin`; никогда `sandbox → production`.** Новая Admin получает исходное состояние только из подтверждённого production baseline (exact deployed SHA и canonical content/assets). Local drafts, draft-assets, preview overlays, jobs, snapshots, backups и результаты sandbox acceptance не могут быть source для Git, `main`, canonical content/assets, publish или deploy. Перед merge/release provenance каждого затронутого canonical content/assets должен быть доказан; недоказанный sandbox-derived материал блокирует операцию.

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

Публикация всегда sandbox-only. Sandbox state не может быть использован для наполнения или обновления production: Admin не содержит live workflow, PR/merge/deploy, SSH или GitHub CLI. Любая non-sandbox job отклоняется до записи файлов. Release выполняется отдельным OPS-процессом после явного подтверждения.

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
- Sandbox publish обновляет только локальный snapshot и не меняет GitHub, VPS или production.
