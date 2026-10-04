# Выпуск нового портфолио на art-des.ru

Version: 1.0, 2026-10-04. Status: IN_PROGRESS — Ready for execution; этап 2 содержит ограниченный Discovery.
Области: PORTFOLIO / ADMIN / SHARED / OPS. LARGE / HIGH / FULL.
Исходная линия: codex/redesign-portfolio; worktree: /Users/designer/.codex/worktrees/redesign-portfolio/Design-portfolio-site.
Baseline: e40f0b58eaff65dc6b5e479e10bbe37a486ec5f5.
Пользователь разрешил реализацию всего плана и создание Goal. Автономный режим отдельно не запрошен: согласованные Git-группы выполняются с проверкой, commit и показом результата; далее действует ручной режим AGENTS.md.

## Результат и источники истины

На существующем домене art-des.ru и существующем сервере старое портфолио заменено утверждённой новой сборкой: главная, Corvo, Сараффан.Радио, новая 404. До выпуска работает редактирование контента проектов и входных данных двух готовых Hero через существующую Admin. Предыдущий релиз защищён для быстрого отката; старые страницы недоступны посетителям. Архивирование происходит только после пользовательской приёмки нового сайта на production.

Актуальный исходник — tools/concept-v2/app, а public/concept-v2 — исторический снимок, не источник последней сборки. Новый runtime должен собираться из текущего исходника. Продакшен baseline определяется свежим read-only preflight по exact deployed SHA, не по предположению о main. Данные sandbox Admin не становятся canonical content, частью Git или production. Утверждённые новые материалы из code baseline имеют отдельную доказанную provenance и сохраняются при подключении данных.

## Зафиксированные границы

- /projects временно отвечает 307 на /#projects; после появления нового каталога переход заменяется без изменения ссылок. Старые адреса без новой замены отвечают настоящей новой 404. Старый дизайн недоступен также по прямым HTML/static URL.
- Текущие тексты, изображения, имя, описание и превью приняты. Резюме, контакты, Figma проверяются без аккаунта перед выпуском; пользователь предоставляет замену только при конкретной проблеме.
- Мобильную и планшетную адаптацию портфолио убрать; новую не разрабатывать и не принимать. Сохранить оба desktop Hero главной: small и large, порог large одновременно width >= 2313 и height >= 1300. В узком окне остаётся desktop canvas.
- Проектные Hero и сцены, включая Corvo Mobile/Tablet, не переделывать: геометрия, масштаб, анимация, drag/inertia/presets и взаимодействие уже утверждены. Разрешён только необходимый адаптер входных данных для Admin.
- Admin редактирует тексты, ссылки и согласованные изображения проектов. Управление всей главной, её секциями и размещением проектов не добавляется. Карточки главной используют согласованные значения того же проекта без расхождения.
- Оболочка «Верстка»: заменить готовый HTML/пакет вёрстки либо поддерживаемый источник, выбрать реально доступные адаптивы; внутренняя вёрстка задаёт собственное поведение. Упаковку, ресурсы и технический формат определяет исполнитель по действующему коду.
- Оболочка «Фикс адаптив»: desktop изображения, нечётные наборы 3, 5, 7 и больше; максимум пять видимых карточек и пять dots. Добавление, замена, удаление, порядок, подписи и начальный экран должны сохранять существующие формат/масштаб/движение Сараффана. Остальные адаптивы пока недоступны с действующими объяснениями.
- Нет покупки хостинга/домена, изменений Figma, чтения USERSPACE, самостоятельного восстановления экспериментов или удаления старых папок до приёмки. Название concept-v2 не переименовывать без технической необходимости.

## Уже выполнено

- [x] Сверка worktree, переносов и единой линии; реестр docs/exec-plans/redesign-portfolio-variant-registry.md. Девять HANDOFF исправлены в собственных checkout. Шесть отсутствующих папок зарегистрированы как исторические записи, их ветки/коммиты сохранены.
- [x] Названия двух оболочек перенесены в общий DESIGN_SYSTEM.md, commit 5391db5.
- [x] Desktop fade главной привязан к --cv2-container-neutral-bg-main (RGB 22/25/26), commit e40f0b5; browser 1920×1080 и 2751×1500. Формы и opacity stops сохранены. Повторная проверка включена в итоговую приёмку.
- [x] Adversarial review плана: уточнены planned Shared contract change, отдельная Admin-линия, изоляция HTML, исключение старого public snapshot из release artifact и сборка из актуального исходника вместо старого source.tar.gz.

## Этапы и Git-группы

### 1. Desktop-only портфолио

Target → главный runtime tools/concept-v2/app и только адаптация самого портфолио.
Change → установить provenance самовольно добавленных mobile/tablet правил, компонентов и runtime переключений; удалить их, сохранив точные desktop композиции, pointer/keyboard поведение и reduced-motion. Desktop fallback остаётся в узком окне; проектные Hero и их CSS/assets не изменяются.
Expected result → нет мобильного меню, мобильных копий AI/фактов, скрытия About или статической мобильной замены Experience; desktop обычный и широкий выглядят как baseline.
Verification → сравнение desktop computed geometry/снимков до и после, обычная/широкая композиции и обе стороны порога, fade, Projects, Process, Experience, About, header/navigation. Focused tests, lint; production build при изменении runtime. Проверка узкого viewport только доказывает отсутствие адаптивной подмены, не является мобильной приёмкой. Два последовательных review: completeness, затем regression/scope. Отдельный commit этапа.

### 2. Discovery интеграции Admin и Shared

Target → отдельный worktree/ветка от актуального redesign checkpoint (например codex/redesign-admin-integration), действующие SPEC, PROJECT_CONTENT, типы, validators, compiler, preview/publish и новый runtime.
Question → как сохранить все текущие материалы и подключить редактирование к обеим оболочкам без изменения их поведения и утечки sandbox данных?
Change → составить точную таблицу JSX → ProjectDocument для Corvo и Сараффана: title/description/categories, summary, sections, links, images, Hero. Согласованный выбор оболочки — запланированное расширение старого контракта, прежний запрет на выбор template не отменяет пользовательский запрос. Определить serialization, ownership assets, defaults, версии/обратную совместимость и миграцию только если необходима.
Investigation → проверить ближайшие producers/consumers/test; подготовить ограниченный spike HTML: standalone файл или пакет с entrypoint и относительными ресурсами, доступность ссылочного источника, isolation/origin/parent/scripts/network, ошибки загрузки. Сервер не исполняет произвольный HTML. Проверить, что безопасность нового импорта не ломает существующие сцены. Реальные доступные адаптивы и их диапазоны берутся из приложенного источника, а не выдумываются или копируются из Corvo.
Expected result / exit → письменный исполнимый contract и карта всех полей без потерь; путь draft → compile → новый preview → локальный release доказан fixture. Установлено, как новый runtime входит в действующий Next standalone host. Неиспользуемый fixed snapshot builder не считается сборкой текущего исходника.
Verification → один/два/три доступных адаптива, standalone HTML/пакет/ссылка в реально поддержанных формах и явные ошибки неподдерживаемых; dual-side contract proof. Неизвестные, способные изменить согласованные границы, фиксируются и требуют точечного решения; технический формат пользователь не обязан проектировать. Отдельный discovery checkpoint.

### 3. Интеграция Admin до выпуска

3.1 Target → Shared contract и content adapter.
Change → реализовать согласованную модель и единственный источник проектного контента; сохранить утверждённые code-origin материалы с доказанным происхождением. Не наполнять canonical sandbox черновиками.
Result → Corvo и Сараффан отображаются без потерь, карточки и страницы не расходятся; старые документы совместимы согласно этапу 2.
Verification → validators/serialization/compiler tests обеих сторон, сохранение/reopen, обратная совместимость и отсутствие случайных migrations. Отдельный commit.

3.2 Target → Admin входные данные «Верстка» и адаптер готовой оболочки.
Change → выбор оболочки, замена принятого источника/пакета, выбор доступных адаптивов; ошибки не заменяют последний корректный источник.
Result → приложенная вёрстка управляет поведением, оболочка сохраняет presets/resize/drag/inertia/scale/scenes; отсутствует fallback на Corvo для чужого проекта.
Verification → валидный источник, missing entrypoint/resources, отказ/недоступность ссылки, один/два/три адаптива; сравнение с текущим Corvo и все четыре сцены. Отдельный commit.

3.3 Target → Admin входные данные «Фикс адаптив» и адаптер готовой карусели.
Change → загрузка/замена/удаление/порядок/подписи/начальный экран, нечётная валидация и desktop-only availability.
Result → наборы 3/5/7/больше работают с существующим форматированием и анимацией, максимум пять видимых карточек/dots.
Verification → odd/even/empty invalid cases, arrows/dots/side clicks/wrap, быстрые и очередные переходы, reorder/remove/initial, unavailable Tablet/Mobile, reduced-motion. Отдельный commit.

3.4 Target → ingestion изображений по docs/requirements/admin-image-quality.md.
Change → сохранять оригиналы; для screen PNG применять lossless WebP только без resize/upscale/lossy/near-lossless и с сохранением decoded pixels, dimensions и профиля. Если качество или размер не выигрывает, сохранять исходный файл. Не применять этот режим вслепую к фото/SVG/неизвестным данным, не пережимать подготовленные assets.
Result → UI сообщает исходный/итоговый формат, размеры, вес и причину fallback; текущие Сараффан PNG/WebP 4096×2958 сохранены.
Verification → decode pixel/dimensions/profile сравнение и вес, transparent fixtures, prepared assets, fallback; локальные fixtures не попадают в canonical. Отдельный commit.

3.5 Target → реальный новый preview и существующий publish path.
Change → связать draft overlay с новым renderer, сохранить Save/Undo/Redo/reset/publish semantics, packaged Admin parity. Обновить проверку /projects с учётом временного redirect.
Result → Admin preview показывает тот же новый дизайн, а локальный release воспроизводит draft в изолированном fixture окружении.
Verification → полный draft→compile→preview→локальный publish, reopen, invalid сохраняет good state. Для проверок отдельный temp store без нормального AppSupport/live credentials. Два последовательных review с исправлениями между ними. Merge отдельной Admin-линии только после подтверждения exact source/target пользователем.

### 4. Публичный релизный кандидат

Target → routes/config/Next standalone host и build/package tooling.
Change → подключить актуальный новый renderer на /, /projects/corvo, /projects/sarafan-radio; /projects → 307 /#projects; неизвестные и старые без замены → новая 404 с HTTP404. Навигация, breadcrumbs, anchors, reload/history не выводят в старый дизайн. Исключить public/concept-v2 и другие старые демо из runtime artifact, сохранив исторический source до архива.
Result → одна актуальная сборка без старого дизайна и ссылок на localhost; fonts/SVG/images/scenes работают по публичным путям. Titles/description/canonical/OG/favicon/robots/sitemap соответствуют новым страницам; случайный noindex не переносится.
Verification → clean checkout production build точного HEAD, реальный standalone server, 200/307/404 для всех маршрутов и прямых старых HTML URL, все ресурсы и anonymous внешние ссылки. Release archive v2 с DEPLOY_SHA/manifest checksum, без sandbox/secrets/локальных черновиков. Отдельные coherent commits renderer/routing и packaging; два последовательных review.

### 5. Полная desktop приёмка состояний

Target → именно production candidate, не только dev server или preview demos.
Change → выполнить матрицу ниже с контролируемыми локальными fault fixtures/harness, которые не входят в production; исправления завершать отдельными commit и повторять затронутые проверки на окончательном состоянии.
Result → все согласованные сценарии подтверждены evidence exact SHA; сборка показана пользователю для приёмки.
Verification → focused/contract tests обеих сторон, lint, production build, отсутствие runtime/console/hydration ошибок; сначала completeness/fidelity review, затем regression/scope/risk review с исправлениями между ними.

Матрица:
- Главная: ordinary/wide desktop, границы large, fade, курсор, лупа/graph, hover проектов, Process, Experience entry/reentry/reset/pulses, About/lightbox, контакты/footer.
- Страницы проектов: direct entry, navigation, reload, back/forward, header/copy/link states и reset; материалы приняты, внешние CV/контакты/Figma доступны без авторизации.
- «Верстка»: four Corvo scenes, все существующие размеры внутри Hero, presets/drag/inertia/переходы, реально выбранные availability ranges; ошибки источника/ресурсов без повреждения good state.
- «Фикс адаптив»: 3/5/7/больше нечётных, быстрые очередные переходы, initial/order/captions, arrows/dots/side clicks/wrap, unavailable адаптивы, reduced-motion и качество assets.
- Прелоадер: cold/hot/fast initial load, короткая навигация <=200ms, slow >10s, минимальная фаза logo/reveal по действующему контракту (~1800ms/1.26), normal→slow, ошибки сети/fonts/images, retry 1/2/3+ и их сообщения, восстановление сети и успешный reveal, stale attempt/cancel/abort без зависания. Реальные ошибки загрузки и переходы состояний, не только девятишаговый PreloaderPreview.
- Routing: все новые routes, temporary redirect, неизвестные/старые HTML/static paths без утечки old UI, настоящий HTTP404.
- Admin: saved/reopened drafts, validation сохраняет good state, соответствие preview/release, локальный publish только fixtures, отсутствие sandbox в artifact.

### 6. Переключение production и проверяемый откат

Target → существующий art-des.ru/VPS, deploy-v2 и рабочая Admin.
Change → свежий read-only preflight: exact production SHA, Git/service state, доступные разрешения, capacity, origin/ownership; конкретно назвать недостающий доступ без секретов в чат. Защитить старую сборку отдельно от автоматической retention current+2, чтобы повторные публикации Admin не удалили её до приёмки. Сохранить manifest/checksum и проверенные инструкции восстановления.
Result → предыдущий релиз можно быстро вернуть; его совместимость с Admin/data/schema известна. Репетиция восстановления в изолированной папке, не пробный rollback production.
Verification → provenance всех canonical content/assets, protected previous release, локальное восстановление/проверки schema compatibility; readiness localhost127.0.0.1:3000 + deployed SHA; согласованное public/browser smoke.

Перед mutation → отдельные подтверждения exact merge target, push/release и deploy exact окончательного SHA после пользовательской приёмки сборки и выбора времени. После merge заново собрать exact merged HEAD. Пакет собирается локально, VPS получает release archive, не случайные директории и не старый source snapshot.
Во время deploy → фиксировать server operation id; при обрыве сети читать статус принятой операции, не повторять переключение вслепую. При readiness failure использовать штатный автоматический rollback; ручной rollback конкретного релиза отдельно согласовывается. Не чистить failure evidence.
После deploy → публичные новые страницы, /projects redirect, true404, ресурсы и фактический SHA проверены. Packaged Admin соответствует новой версии; реальные правки/публикация контента только по конкретному пользовательскому действию, не synthetic fixtures на production.

Admin state → сначала установить, уже ли это live state (marker/управляемый checkout), не выбирать bootstrap вслепую. Существующий live store сохраняется. Если это первый live transition и есть sandbox, до archive/bootstrap спросить пользователя: clean exact production baseline или production baseline + sandbox authoring overlay только в локальные drafts. Jobs/runtime/previews не переносятся; такой bootstrap не публикует данные. Реальная необходимая migration требует dry-run, backup, rollback и отдельного подтверждения.

### 7. Приёмка production и архив

Target → старый сайт, страховочная Git история, worktree registry и документация.
Change → только после явного подтверждения пользователя, что новый сайт на production работает как нужно, архивировать старую рабочую сборку вне публичных маршрутов с SHA/checksum/инструкцией восстановления. Сохранить нужные original assets и историю. Проверить архивное восстановление отдельно.
Result → посетители не попадают в old design, история и способ восстановления сохранены; актуальная линия/worktree однозначна.
Verification → перед любым cleanup проверить writer/dirty/untracked/ignored originals; удаление только отдельно разрешённых папок через сохранение snapshot. Шесть phantom worktree registrations очищать только после проверки refs/сохранности и разрешения. 29 страховочных refs и десять reflog states не восстанавливать в runtime и не уничтожать. Не трогать неизвестные архивы, реальный Admin store или USERSPACE. Обновить HANDOFF/PROJECT_HISTORY/текущий DESIGN_QA и этот стабильный ExecPlan со ссылками на evidence. Отдельный archival commit/checkpoint.

## Завершение Goal

Цель завершена только когда весь выпуск работает на art-des.ru, ограниченная Admin обслуживает оба проекта и входные данные оболочек, полный согласованный state matrix пройден, пользователь принял exact production version, откат проверен и архивный этап выполнен с отдельным разрешением. Подготовка или первая Git-группа не являются завершением всего Goal. При approval gate продолжается только независимая безопасная работа, соответствующий этап остаётся pending.

## Progress / evidence

- 2026-10-04: Goal active; clean baseline e40f0b5 подтверждён. План сохранён до реализации. Других active writer в проверенном списке чатов нет.
- [x] 1 Desktop-only — implementation/checks complete, пользовательская приёмка pending
- [ ] 2 Admin/Shared Discovery
- [ ] 3 Admin integration
- [ ] 4 Release candidate
- [ ] 5 Desktop state matrix / user acceptance
- [ ] 6 Exact production switch / rollback
- [ ] 7 Production acceptance / archive

- 2026-10-04: этап 1 реализован; 208/208 tests, lint 93 sources, Vite production build и два последовательных review. Evidence: design-reference/desktop-only-2026-10-04/ACCEPTANCE.md. Следующий этап 2 — Admin/Shared Discovery в отдельной линии после показа группы пользователю.
