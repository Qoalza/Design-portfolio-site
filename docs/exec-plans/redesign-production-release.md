# Выпустить новый сайт с заранее проверенным подключением Payload

Version: 3.1, 2026-10-05. Status: IN_PROGRESS — Ready for execution.
Области: PORTFOLIO / ADMIN (Payload) / SHARED / OPS. LARGE / HIGH / FULL.
Рабочая линия: codex/redesign-portfolio, /Users/designer/.codex/worktrees/redesign-portfolio/Design-portfolio-site.
Утверждённый визуальный и контентный baseline: 258e95b2a7720499c7a74ec7602c8608b8c58200.
План заменяет прежнее требование закончить Admin до выпуска. Пользователь разрешил реализацию и новую Goal. Пользователь отдельно разрешил автономно пройти согласованные локальные группы до готовой сборки (2026-10-05); commit/checks сохраняются. Production, exact merge, real-data/secrets и cleanup gates действуют отдельно.

## Результат и источники истины

Подготовить и после отдельных разрешений заменить сайт на art-des.ru новым портфолио на том же сервере: главная, Corvo, Сараффан.Радио, новая 404. До выпуска доказать на настоящем существующем Payload, что опубликованные записи и файлы преобразуются в тот же интерфейс данных, который использует новый сайт. Полный удобный редактор Payload завершается после выпуска; публичный сайт работает из проверенного снимка без запущенной CMS.

Актуальный интерфейс — tools/concept-v2/app. public/concept-v2 — исторический снимок, исключаемый из релиза. Первые production материалы берутся только из утверждённого Git baseline, с hashes источников и ресурсов. Временные записи Payload служат доказательством, никогда источником первого production. Реальный предыдущий релиз определяется свежим read-only preflight сервера по exact deployed SHA.

Существующий Payload находится в tools/payload-admin линии codex/payload-local-foundation (d21f7a3ffa1e7fa11738f20e4a9e7ea4d664cc30; существенный checkpoint fd2e79d). Переносится его код, auth, SQLite, drafts/versions и защита media, без личного .local. Не создавать другую CMS. Предыдущая интеграция в codex/redesign-admin-integration, checkpoint c85c3065cadaad68064f1a1060972744c25c8c5c, сохраняется с незавершёнными файлами. Выборочно переиспользовать только проверенные публичный renderer, контракт, экспорт утверждённых материалов и адаптеры Hero. Старую Des-art Admin не продолжать и не включать в релиз; по прямому уточнению пользователя её правила, store/compiler/live bootstrap/undo/publish semantics и архитектуру не использовать как требования для Payload. Исполнитель самостоятельно выбирает подходящие Payload модели и lifecycle в рамках согласованного результата; существующий deploy-v2 — инфраструктурный инструмент, а не целевая CMS.

## Зафиксированные границы

- /projects временно 307 → /#projects; после появления нового каталога маршрут заменяется без изменения ссылок. Старые адреса без замены и неизвестные маршруты дают новую настоящую HTTP404. Старый дизайн недоступен по прямым HTML/static URL.
- Материалы, имя, описание и превью приняты. CV, контакты и Figma проверяются без авторизации; замена нужна только при найденной проблеме.
- Мобильную/планшетную адаптацию портфолио не разрабатывать и не принимать. Сохранить оба desktop варианта главной и совместный порог width >= 2313 && height >= 1300. Desktop canvas в узком окне.
- Проектные Hero, Corvo сцены и внутренние Mobile/Tablet, геометрия, масштабы, presets, drag/inertia и анимации сохраняются. Разрешены только необходимые адаптеры данных, не переделка оболочек.
- Payload редактирует проектные тексты, ссылки, изображения и входные данные двух оболочек. Главная и её структура не управляются CMS; карточки читают согласованные поля проекта.
- «Верстка»: готовый файл/пакет либо поддерживаемый ссылочный источник, выбор доступных адаптивов, внутренняя верстка задаёт поведение. Файлы/entrypoint/manifest/scenes/ranges сохраняются. Сервер не исполняет загруженный HTML; iframe isolation сохраняется.
- «Фикс адаптив»: только desktop, нечётные наборы 3/5/7/больше, максимум пять видимых карточек и dots; порядок/подписи/начальный экран. Формат, масштаб и движение как в Сараффане. Другие адаптивы позже.
- Качество изображения по docs/requirements/admin-image-quality.md: сохранить оригинал; lossless PNG → WebP лишь при доказанных одинаковых pixels/dimensions/profile/orientation и меньшем весе, без resize/upscale/lossy/near-lossless. Подготовленные файлы не пережимать. Fallback и отчёт сохраняются; удобный UI после выпуска.
- USERSPACE, личные CMS данные, неизвестные локальные файлы, чужие изменения и рабочие Hero вне изменения. Старые worktree/эксперименты не удалять и автоматически не вливать. Новый домен/хостинг не покупать. Figma read-only.

## Подтверждённые результаты до нового плана

- Сверка worktree и переносов: docs/exec-plans/redesign-portfolio-variant-registry.md; девять HANDOFF исправлены. Шесть отсутствующих папок — исторические записи, ветки и коммиты сохранены; старые reflog состояния в страховочной копии.
- Названия оболочек в общей DESIGN_SYSTEM.md, commit 5391db5.
- Fade главной использует --cv2-container-neutral-bg-main (RGB 22/25/26), commit e40f0b5. Сохраняется и повторно проверяется в релизе.
- Desktop-only портфолио, commit 258e95b; evidence design-reference/desktop-only-2026-10-04/ACCEPTANCE.md. Проектные Hero не изменены. Итоговая приёмка нужна на release candidate.
- Старые интеграционные checkpoints не доказывают готовность Payload или production. Полезные части переносятся выборочно и проверяются на новой рабочей линии.

## Этапы и зависимости

### 1. Общий снимок проектных данных и файлов

Target → Shared contract, approved Git exporter, neutral release boundary.
Change → перенести проверенное optional redesign v1 расширение schema-v3 без изменения старых документов, извлечь полные Corvo/Сараффан из baseline, добавить проверяемый переносимый snapshot. Отделить экспорт от старой Admin. Карта всех текстов/ссылок/карточек/секций/images/двух Hero без потерь; hashes и полный package manifest.
Expected result → единый вход публичного renderer и будущего Payload export. В пакете нет .local, секретов, private URLs, локальных путей или sandbox контента. Неверные документы/отсутствующие ресурсы/несовпадающие hashes отклоняются до замены последнего good snapshot.
Verification → roundtrip, legacy compatibility, source literal mapping, полный manifest и ссылки HTML/CSS, byte parity четырёх сцен, размеры подготовленных images; missing/corrupt/duplicate/draft/path-negative tests. Два последовательных review. Эта группа сама по себе не доказывает Payload compatibility или готовность production.

### 2. Доказать настоящий путь Payload → snapshot → renderer до выпуска

Target → существующие tools/payload-admin, общий адаптер, выборочно перенесённый публичный renderer.
Change → дополнить модель Payload всеми полями Corvo/Сараффана, карточками, секциями, обеими Hero и assets. Сохранить auth/private media/drafts/versions. HTML packages хранить через соответствующую границу файлов, не объявлять HTML изображением. Определить ссылки media в новых полях и расширить защиту удаления с учётом опубликованных записей и версий. Экспорт переносит bytes в публичный artifact; никаких запросов публичного сайта к localhost или закрытым CMS URL. Preview использует те же компоненты, меняется только источник данных.
Expected result → реальная временная SQLite содержит полные проекты; опубликованный export и preview проходят тот же validator/renderer, что первый релиз. Публичный сайт работает при выключенном тестовом Payload. Полного authoring UI перед выпуском не требуется.
Verification → отдельный временный PAYLOAD_LOCAL_ROOT (без чтения личного .local): сохранить два полных проекта и оба Hero; закрыть/reopen DB; получить опубликованные записи и отрендерить; изменить текст/ссылку/image/порядок raster/layout source metadata и увидеть правильное изменение без переписывания компонентов; новый draft не изменяет published snapshot; реальный media export и build, остановить Payload, открыть страницы/ресурсы. Invalid/missing сохраняют последний good snapshot. Модель и migrations проверять только на временной БД, включая существующие auth/media/draft tests. Рукописный JSON в обход Payload не считается доказательством. Focused tests, lint/typecheck/build по затронутой границе; два последовательных review.

### 3. Production host и релизный artifact

Target → existing Next standalone, актуальный Vite runtime, сборка/упаковка.
Change → production build собирает новый Vite сайт и валидированный snapshot; standalone host отдаёт его на / и проектных маршрутах, без переписывания утверждённого дизайна в Next. Исключить обязательный old Admin build. Входной /#projects сохраняется (текущий main очищает hash — исправить); остальные reload/reset/history проверить. Корректные /, /projects/corvo, /projects/sarafan-radio (200), /projects (307), /404 и неизвестные/старые без замены (404). Удалить тестовые/lab/preview routes только из выпуска, необходимые scene resources сохраняются.
Expected result → архив содержит именно новый сайт и ресурсы, без public/concept-v2, old Admin, Payload runtime/database, тестовых stores, секретов и Mac paths. Metadata title/description/canonical/OG/favicon/robots/sitemap соответствует реальным страницам, нет случайного noindex. Соблюдены target platform, deploy-v2 manifest/checksums, полная DEPLOY_SHA и лимит 75 MiB.
Verification → build exact HEAD, unpack и запуск настоящего standalone вне CMS; статусы и все прямые URL, anchor/navigation/reload/history, byte hashes, ссылки и доступность ресурсов, artifact inventory allowlist. После merge build повторить на фактическом merged SHA. Два последовательных review: полнота, затем регрессии/риски. Не считать старый root Next build доказательством нового релиза.

### 4. Проверка всех согласованных состояний и быстрый откат

Target → окончательный production candidate и существующий сервер (до разрешения только read-only).
Change → выполнить матрицу ниже, устранять подтверждённые дефекты отдельными coherent commits. Собрать свежие exact server SHA/process/routes/access/capacity. Защитить предыдущий exact release от rotation current+2; checksum backup и воспроизвести возврат в изолированной копии, не переключая production.
Expected result → evidence относится к итоговому SHA; сборка и способ быстрого возврата проверены, пользователь видит именно кандидат для сервера.
Verification → focused tests/контракт обеих сторон/lint/build и реальные desktop browser checks; два последовательных review с исправлениями и повтором затронутых checks после последнего изменения. Нет повторов уже успешных checks без новой причины.

Матрица приёмки:
- Главная: ordinary/large desktop и порог с двух сторон, fade, cursor, graph/лупа, карточки/hover, Process, Experience entry/reentry/reset/pulses, About/lightbox, контакты/footer.
- Проекты: direct entry, переходы, reload, back/forward, breadcrumbs/header, copy/link states и reset, все изображения и шрифты.
- Corvo: четыре сцены, внутренние adaptives, presets/drag/inertia/cancellation, enabled ranges/source metadata, ошибки ресурсов без повреждения good state.
- Raster: нечётные 3/5/7/больше, initial/order/captions, arrows/dots/sideclick/wrap, быстрые очередные переходы, reduced-motion, unavailable другие adaptives, качество assets.
- Прелоадер: cold/hot cache, fast/slow >10 s, отказы font/image/network, retry 1/2/3+, восстановление и отмена stale callbacks. Контролируемые test harness не входят в release.
- HTTP 200/307/404, /#projects, старые URL, отсутствие старого UI/labs/broken resources/localhost. CV/контакты/Figma без авторизации. Отсутствие ошибок console/runtime/hydration.
- Rollback: предыдущий релиз сохранён и защищён, возврат проверен изолированно; без разрешения production не переключается.

### 5. Приёмка, разрешённое переключение и архив

Target → конкретный кандидат, merge/upload/deploy, подтверждённый production.
Change → показать кандидат и evidence пользователю. После приёмки получить отдельное разрешение exact source/target merge и публикации exact SHA. После merge собрать/упаковать фактический merged SHA, затем только разрешённые upload/activation. Проверить публичный DEPLOY_SHA, страницы, assets и ключевые состояния; откат готов.
Expected result → старый сайт заменён утверждённой сборкой на том же домене/хостинге. Предыдущая версия остаётся готовой к возврату до подтверждения пользователя.
Verification → fresh production smoke и пользователю реальный новый production. Только после его подтверждения «всё работает как нужно» архивировать старый сайт вне публичных маршрутов; исторические источники/эксперименты не удалять без отдельного разрешения.

### 6. Закончить удобное управление через Payload после выпуска

Target → тот же Payload, доказанный контракт/export/renderer, существующие две Hero.
Change → полноценное редактирование текстов/ссылок/images, выбор Hero, замена layout file/package/source и доступных adaptives, raster upload/replace/remove/reorder/captions/initial. Подключить сохранение originals и quality reports, валидированные draft preview и пользовательскую публикацию через тот же snapshot/release pipeline. Главную/геометрию Hero не превращать в конструктор. Initial real CMS state только из exact deployed approved content, не из proof fixtures; real migrations/bootstrap/credentials требуют отдельных gates.
Expected result → проекты обновляются через Payload без повторной сборки архитектуры или смены дизайна; ошибки не повреждают good state.
Verification → реальный end-to-end authoring → draft preview → отдельно разрешённая публикация, reopening/published-vs-draft/versions/media protection, обе Hero и invalid cases, quality fallback reports; проверки текущего shared/public blast radius и два последовательных review. Не объявлять этот этап завершённым на основании технического proof этапа 2.

## Текущий checkpoint и следующие действия

- [x] Создана новая Goal без token budget; прежней Goal в механизме больше нет.
- [x] Группа 1: neutral approved-content snapshot реализован; 2 проекта, 163 assets (4 849 130 bytes), 171 source hashes. Итоговые 34/34 tests, scoped source lint и Next compatibility build прошли; commit этой группы содержит только код/docs/tests.
- [x] Группа 2: настоящий Payload compatibility proof завершён: save/reopen/export, обе Hero, draft separation и renderer после остановки CMS; native tests/typecheck/lint/build прошли.
- [x] Новый standalone release, packaging и локальная desktop/edge приёмка: docs/ops/REDESIGN_ACCEPTANCE.md.
- [ ] Read-only production/rollback preflight и показ кандидата.
- [ ] Отдельные пользовательские gates merge/deploy; post-deploy smoke; подтверждение и архив.
- [ ] Удобный Payload authoring после выпуска.

Главные stop-lines: нет разрешения на production switch, merge/push, Figma write, личные secrets/state, real migration/bootstrap и destructive cleanup. При незапланированном существенном изменении контракта остановить зависимую работу. Goal остаётся активной до реального достижения результата, не закрывается после одного checkpoint.


## Evidence первой Git-группы (2026-10-05)

Базовые materials/scenes читаются только из утверждённых Git objects; content/projects и public/assets не изменялись. Общий snapshot покрывает ресурсы только нового renderer: redesign, logo, prepared renditions. Сохраняемые legacy v3 поля — только совместимость формы документа; старые visual/content поверхности не являются inputs нового сайта и их старые ресурсы не входят в новый artifact.
Проверены отрицательные сценарии: draft, unknown fields/private provenance, unsafe paths/terminal DNS dot, duplicate slug/file, отсутствующие cards/AVIF/HTML/CSS, checksum и manifest mismatch. Проверка HTML/CSS dependency closure требует bytes и выполняется в createProjectSnapshot; validateProjectSnapshot отдельно не доказывает bytes/полную динамическую работу произвольного JS, которую дополнительно проверяет runtime приёмка.
Первый completeness review: missing AVIF closure исправлен через общий mapping. Второй risk review: private hostname terminal dot и удалённый одновременно из manifest/asset CSS исправлены; legacy surface completeness явно ограничен новым renderer. Corrected-part review: оставшихся конкретных дефектов в проверенных границах нет.
Проверки: focused snapshot/export/public-v3 и historical legacy compatibility/provenance tests; scoped npm run lint исходников; Next production build без scripts старой Admin. Старый root build проверяет только совместимость, не готовность нового release. Глобальный npm run lint падает на ранее существующем generated Vite dist; targeted source lint проходит, release integration установит корректную build/lint boundary. Реального Payload proof и нового production artifact пока нет.


## Evidence группы 2 (2026-10-05)

Перенесён tracked foundation Payload d21f7a3, без личного .local. Native releaseContent/releaseAssets/project-files используют существующие SQLite/auth/versions; удобный editor остаётся после выпуска. Public renderer перенесён выборочно из c85c3065, рабочие CSS/geometry/physics Hero сохранены.

Real proof: 2 полных проекта и 163 bindings, save/reopen новым процессом, byte parity с approved Git; затем изменения текста/ссылки/image/raster order/initial/layout source/enabled adaptives. Draft отличается от published. После остановки CMS экспорт читается и отображается тем же renderer. Неверные размеры, отсутствующие и truncated изображения отвергаются; last-good snapshot не повреждается. Полностью декодируются bitmap/AVIF, backup включает project-files. Fixture никогда не становится canonical/первым production.

Два последовательных review: geometry fix, затем full-pixel decode fix с отрицательным тестом truncated PNG. Native migration исправляет lock relation cascade; schema fingerprint сравнивает именованные колонки, сохраняя constraints/defaults/index/trigger и прежний legacy hash. Suite отвергает неизвестную схему и подтверждает совпадение migrated/fresh config. Общий turbopack.root обеспечивает native build с Shared validation. Build fingerprint учитывает Shared source.

Проверки: native npm test/typecheck/lint/build на temporary root; real migration/seed/reopen/export/renderer proof; root lint, отдельные Vite source check/tests/build, focused public adapter/snapshot checks. Git whitespace check сообщает унаследованную от native generated migrations SQL indentation; это не дефект исполнения, native lint и schema equality проходят. Новый public standalone, artifact и production/rollback preflight ещё не выполнены.


## Checkpoint группы 3 (2026-10-05)

Реализованы root Next catchall host и production Vite entry без labs; прежние src/app и historical public сохранены в Git, но не входят в новый runtime. Первый site собирается из approved Git baseline (2 проекта, 452 runtime resources), meta/robots/sitemap и /projects307/#projects/new404 обслуживаются host. Anchor применяется после завершения FirstVisit. Pipeline не запускает old Admin или Payload.

Scratch Next build прошёл, root lint и 222/222 Vite check прошли, focused HTTP/CSP/HEAD/stale-runtime guards прошли. Completeness review выявил возможность подписать старый standalone новым SHA — исправлено postbuild success stamp+fingerprints и equality исходного/скопированного site; отрицательные interrupted/static/runtime checks проходят. Второй risk review не выявил конкретных оставшихся findings. Браузер выявил неверный порядок entry transform и недостающий code.svg — исправлены release pre-transform и approved UI-resource allowlist (включая SVG оболочки Corvo). Эти проверки ещё не являются полной desktop приёмкой.

Следующее действие: commit → чистая exact HEAD сборка → archive/unpack/validator/реальный standalone smoke; затем матрица desktop и read-only production/rollback. Полная готовность/разрешение production ещё не подтверждены. Документ сборки: docs/ops/REDESIGN_RELEASE.md.


## Artifact/browser checkpoint и font-retry fix (2026-10-05)

Exact clean 62529509444773f7279f6f9411faba23853a7350 build/package/unpack/deploy-v2 manifest validation прошли: 21 824 805 bytes, 1510 entries, archive SHA256 d7d47706dd5e20fcff05c5bd84868d0f4964a8372d6501b415839a093cfa6c00. Unpacked runtime без CMS проверен HTTP: 451 публичный ресурс byte/hash equality, / и проекты200, /projects307/#projects, old/unknown/labs404, robots/sitemap200, HEAD200 empty.

Browser: ordinary и large Hero, точный порог 2312×1300 small / 2313×1299 small / 2313×1300 large; fade совпадает с body rgb(22,25,26). Anchor применяется после readiness (projectsTop24). Четыре Corvo scene источника переключаются, iframe rendered/sandboxallow-scripts; internal presets выбираются. Sarafan next3 wrap, desktop-only, reload reset; новая404 и back/forward проверены, обычные страницы без brokenimages/consoleerrors. Это часть матрицы, не вся приёмка.

Контролируемый отказ шрифтов выявил реальный defect: browser хранит failed CSS font face, обычный fonts.load на retry повторно отвергается даже после восстановления сети. Исправление обновляет src только отказавших critical Onest/Google Sans при retry; остальные CSS/descriptors/Hero не меняются. Unit regression и весь Vite check (224 tests) прошли. Browser scratch proof: блокировкаwoff → connection → снять блокировку → Повторить → fontsloaded, loaderhidden, inertfalse, brokenimages[]. Две последовательные ограниченные review: completeness (failed-only, successful unchanged, retry3 unique cache key), regression/scope (same descriptors, same-origin styles, no Hero/layout/sourceCSS edits; stale gate cancellation сохраняется).

HTTP read-only production marker a44efab5830a8dda5a1fd1348f644358f047672c/root200; restricted SSH/current/capacity/platform/backup/rollback ещё не подтверждены. Evidence pointers: /private/tmp/redesign-release-verification-checkpoint-20261005.md и /private/tmp/redesign-unpacked-http-smoke-20261005.json. Новый font-retry commit требует новой exact HEAD сборки/архива и повторной затронутой browser проверки; старый архив больше не финальный кандидат.

## Edge QA и зарезервированный /404 (2026-10-05)

На actual unpacked a514243 проверены raster 5/7/9 и reduced-motion на disposable harness с тем же компонентом; font/image/network failure → retry → recovery; slow >10 s с retry1/2/3 и последующим открытием; галерея все3/wrap/focus return; Hero graph pulse/arrival; Corvo scene-resource failure → good scene → recovery и drag → новый preset; signed-out Figma, anonymous CV PDF, публичный Telegram. Детальные внешние результаты: /private/tmp/redesign-release-verification-checkpoint-20261005.md, /private/tmp/redesign-cv-anonymous-proof.json. Тестовые данные/доставка не входят в release.

Найден integration defect: /404 на Next runtime перехватывался встроенной страницей, хотя handler-test проходил. beforeFiles rewrite направляет этот адрес в тот же release renderer; verify-runtime.mjs проверяет реальные GET/HEAD/status/title/exactSHA/noindex/redirect. Новый guard воспроизводит ошибку на a514243 и проходит на исправленном dev runtime. Необходимо новый clean exact build/archive/unpack/HTTP/browser check; прежний архив больше не является финальным кандидатом.

Review completeness: изменение только маршрута /404 и HTTP guard, visitor URL/status сохраняются; renderer/Hero/materials не меняются. Review regression/risk: beforeFiles exact-match не перехватывает assets/projects/unknown routes; GET/HEAD, 307 и noindex проверены через actual Next. lint и focused host test прошли. Финальный build/package check следует после commit.

Остаётся завершить финальную desktop приёмку и серверный preflight: SSH metadata пока не получена, exact restricted deployed SHA/platform/capacity/protected real backup не подтверждены. Isolated rollback fixture не заменяет проверку реального сервера. Merge/upload/deploy/архив не разрешены.

## Итог локальной приёмки

f28c461 cleanbuild/archive/validator/realHTTP451assets и исправленная404 в браузере прошли. docs/ops/REDESIGN_ACCEPTANCE.md фиксирует покрытие и пределы доказательств. Следующая Git-группа только evidence/docs; её exactHEAD пересобирается для показа. Все451publicasset hashes одинаковы с a514243. Серверная проверка и защищённый настоящийpreviousrelease остаются открытыми; production/action gates и postlaunchPayload не закрыты.

## Production checkpoint 2026-10-05

Пользователь разрешил дальнейшие публикацию/деплой. PR #54 merged; production
SHA b44946021d55fb1cc8a4430c3bafd62e342714c9 выпущен после clean build/package
и проверенного protected previous backup. VPS service active, public HTTPS guard
и все451 assets hash/bytes прошли; desktop browser smoke прошёл.
Подробности exact artifact/backup/операции: docs/ops/REDESIGN_ACCEPTANCE.md.
Группы1–5 выполнены в части подготовки/выпуска. Приёмка пользователя и последующее
архивирование previous ещё ожидаются; группа6 full Payload остаётся открытой.
