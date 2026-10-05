# Онлайн-Payload и прямое подключение сайта

Версия 2.0, 2026-10-05. Статус: IN_PROGRESS — Ready for execution, online runtime implementation.
Область ADMIN + SHARED + PORTFOLIO + OPS; LARGE / HIGH / FULL.
Worktree /Users/designer/.codex/worktrees/payload-1939/Design-portfolio-site,
ветка codex/cms-integration; checkpoint 06bd7f7da7d5e393f26772c9b1b4e5d134d33d1a.

## Исправленный результат — прямое требование пользователя

«Мне нужна онлайн админка — перешел сделал применил».
Payload работает на сервере. Пользователь открывает его в браузере, входит,
редактирует проект, сохраняет черновик/проверяет его и применяет опубликованную
версию. Следующий запрос сайта получает эти изменения без локального запуска,
Git commit/PR, сборки, архива, SSH upload или code deploy на каждую правку.
Обычная native Payload публикация является применением контента.

Версия1.0 ошибочно закрепляла локальный CMS и выпуск контента через полный
runtime archive. Это больше НЕ целевой сценарий. Нельзя продолжать эту группу
по старым Next/checkpoint ниже. Предыдущая оценка готовности к нему не является
оценкой готовности онлайн-Payload.

## Сохраняем и используем

- Native Payload3.89.0, установленный Next16.3.4, SQLite migrations, auth,
  Projects drafts/versions и существующий custom ReleaseEditor.
- Поля copy/links/sections/metrics; обе оболочки Hero и переключение доступных
  adaptives; immutable originals, lossless ingest, layout packages/URLs и проверки.
- Public ProjectDocument schema-v3/redesign-v1 и готовые компоненты главной,
  Corvo, Сараффан.Радио, 404. Geometry/physics/scenes/CSS Hero не менять.
- Проверенные validators, asset closure/digests и sandbox policy для HTML.
- Production source только exact deployed approved контент/ресурсы. Личный
  .local и USERSPACE не читать; disposable fixtures не переносить в production.
- Сайт desktop-only. Главная не становится конструктором в CMS.

## Техническая граница и ближайшая проверка

Предпочтительный минимальный путь: один Next/Payload runtime обслуживает
/admin, private /api и публичные страницы. Native published records читаются
сервером после завершённой DB transaction. Скомпилированные React/Vite компоненты
получают validated documents при запросе HTML; JS/CSS собираются только при
выпуске кода. HTML metadata/routes/sitemap и allowlisted published assets берутся
из той же версии данных. Удалить постоянную привязку runtime к bundled documents.

Не вводить отдельный Apply/deploy job поверх штатной публикации без доказанной
необходимости. Не переключать public pointer из afterChange/afterOperation:
в installed Payload эти hooks выполняются до commitTransaction. Прямой read
published данных после commit устраняет этот внешний transaction race.

Read-only VPS discovery: прежний SSH control socket уже отсутствует. Это
не блокирует код/fixture work; server credentials/config не изменялись.
До реального запуска перепроверить доступ, service/proxy/storage/resources.
Текущий static production остаётся рабочим до проверенного code release.

## Упорядоченные группы

### 1. Контракт runtime и серверной конфигурации

Target → native config/state/run/Next routes + current release host.
Change → явные development/fixture/server режимы; server URL, persistent data root,
secret из защищённого окружения, HTTPS cookies/CSRF, default-deny private APIs.
Проверить single-runtime маршрут без конфликтов /admin,/api,/preview и public.
Expected → online deployment не привязан к папке Mac/localhost и не открывает
черновики/оригиналы/аккаунты анонимному посетителю.
Verification → конфигурационные negative tests, auth/route checks на fixture,
installed Payload sources + официальные deployment/auth docs.

### 2. Данные сайта читаются из Payload без сборки

Target → release-host, virtual document input, main-release and native public reader.
Change → безопасная runtime JSON injection вместо build-only documents;
published-only reader, metadata/routes/sitemap из того же результата; узкий
cache by committed revision, invalid/error не раскрывает draft/private state.
Expected → native publish меняет HTML/data на следующем запросе при неизменных
build SHA/JS/CSS. Никакие npm/Git/archive/SSH процессы при content edit не стартуют.
Verification → настоящий native save draft → public unchanged → publish → public
updated; title/slug/link/copy/both templates, unpublish/restore, concurrent reads.

### 3. Изображения и HTML-пакеты в онлайн-режиме

Target → существующие asset bindings/validation/public asset responses.
Change → публично отдавать только ресурсы опубликованных project revisions;
immutable bytes и package MIME/CSP сохранять; draft assets остаются private.
Publish полностью проверяет ссылки/closure до успешного завершения native save.
Expected → загрузил/применил — ресурс доступен сайту без пересборки; повреждённый
или неполный проект не заменяет рабочую published версию.
Verification → PNG/JPEG/WebP/layout package/URL, slug change, HEAD/digest/404,
private draft denial, native transaction failure и versions/deletion protections.

### 4. Предпросмотр и native редактор

Target → существующие editor/preview routes и runtime data boundary.
Change → переиспользовать готовые поля/загрузки/versions; preview с saved draft
в том же renderer без compilation на изменение контента; authenticated/capability
изоляция и sandboxed HTML. Удалить вводящие в заблуждение local-only описания.
Expected → пользователь входит онлайн, редактирует, проверяет и штатно применяет;
нет отдельного UI подготовки архива/публикации кода.
Verification → API/auth + native browser editing/reopen, оба Hero и failure states.
Ранее browser action denied; не обходить/не повторять без изменившейся авторизации.

### 5. Развёртывание кода и постоянные данные

Target → online service packaging/start/migrations/proxy and backup tooling.
Change → code release отдельно от persistent DB/media/project-files, single
instance SQLite для текущего объёма; schema migration только явно, backup/restore
до смены кода. Установка новых dependency/DB не нужна без доказанной причины.
Initial content импортируется только из exact deployed approved snapshot.
Expected → сайт и админка доступны при выключенном Mac; restart/code rollback
не стирает контент/файлы. Существующий static runtime можно быстро вернуть.
Verification → isolated Linux-compatible packaging/start, temporary bootstrap,
restart, consistent backup/restore, schema failure, existing production preflight.

### 6. Сквозная проверка и запуск

Target → готовый exact code candidate и online site/Payload.
Change → удалить из активного маршрута obsolete archive-content publication APIs,
worker/UI/config; историю и согласованные старые worktrees сохранить. Полезное
pure code release tooling не выдавать за content publication.
Verification → без build/deploy: login → edit → draft → preview → native apply →
public update; image/layout/raster/order/slug/version restore и error/restart.
Types/lint/build, две последовательные reviews и actual browser/native acceptance.
Production bootstrap/code release только после готового проверяемого результата
с учётом имеющейся авторизации. Никаких fixture content или старой Admin логики.

## Приёмка

- Редактор доступен по HTTPS в обычном браузере, Mac выключен.
- Черновик приватен и не меняет публичный сайт.
- Native применение корректной версии меняет сайт без code build/deploy.
- Code SHA и compiled asset digests сохраняются при content-only изменении.
- Корректны оба project templates/Hero, asset quality, публичные ссылки, 404,
  temporary /projects redirect; прежний дизайн недоступен по public routes.
- Failed save/upload/publish и restart сохраняют рабочий опубликованный контент.
- Backup/restore и возврат предыдущего code release проверены.
- Ни сохранённые тестовые данные, ни credentials/private drafts не публичны.

Sources: installed native Payload transaction code; официальный deployment
https://payloadcms.com/docs/production/deployment, drafts
https://payloadcms.com/docs/versions/drafts, SQLite
https://payloadcms.com/docs/database/sqlite. Конкретные параметры сверять с
установленной3.89.0, без обновления dependencies ради этого перехода.

## Checkpoint версии2.0: native publish → public runtime

Один native Next/Payload runtime теперь содержит публичный catchall handler.
Он читает committed published Projects через фиксированный server-side запрос
(draft:false, _status:published) и пропускает только validated ProjectDocument,
без editor metadata/raw native records. Native коллекции остаются private.
Сервер инъектирует inert escaped JSON; уже собранный main-release получает эти
данные в прежние App/Corvo/Sarafan компоненты. HTML title/canonical/sitemap/routes
и content revision обновляются при запросе. Detail eligibility использует тот же
projectDetailForPath, что клиент; detailAvailable:false →404 и нет sitemap entry.
Публичная форма контента доступна через GET /api/site-content, без write/draft API.

Из native Payload удалены obsolete publication store/service/worker/prepare/status/
cancel и только их tests. Они доступны в истории06bd7f7, временные данные/архивы
и старые worktrees не удалялись. Pure OPS code-release helpers остались отдельно.
Local-only описания editor/preview заменены: native publish применяется сайтом.

Evidence: unit fixed published filter/private stripping/fresh revision PASS;
actual native DB для обоих templates — draft invisible, Publish updates DTO,
BUILD_ID неизменен PASS. Actual HTTP на итоговом Next production build — native
PATCH publish меняет public HTML/data/title обоих проектов, compiled JS digest и
BUILD_ID остаются прежними; draft private, anonymous native API403; fixture titles
восстановлены. Старые archive endpoints404. Root runtime/XSS/route/legacy tests,
full native suite, native typecheck/lint/build, renderer lint и one-time renderer
build PASS. Два последовательных review; исправлен detail route eligibility.
Browser visual acceptance не выполнялась; production не изменялся.

ОБЯЗАТЕЛЬНО дальше до online activation: dynamic published assets и закрытие
build-file fallback, полная asset/closure validation до native publish commit,
static JS/CSS без CMS query, prebuilt private preview, server configuration/
persistent storage/HTTPS/bootstrap/backup. Текущий public handler ещё отдаёт
build assets: новая загрузка не считается завершённой online-интеграцией.
Не возвращаться к archive-content publication, не продолжать исторические Next.

## Историческое evidence версии1.0 — не действующий план

Ниже сохранены уже выполненные проверки. Local archive publication и её next
steps отменены требованием online-Payload; их наличие не разрешает продолжение.
Последний new prepare HTTP probe на06bd7f7 завершился PREPARATION_FAILED. Это
не объявлено успехом; отладка этого obsolete пути остановлена после коррекции цели.

## Checkpoint 2026-10-05: native editor, первая проверенная часть группы1

Реализован custom Field releaseContent: copy/links/metrics/sections существующих
шаблонов, initial scene/slide, enabled layout adaptives, перестановка экранов,
выбор оболочки. Legacy native fields скрыты для redesign records.
Payload-only `_payloadEditor.version=1.heroes` хранит ранее выбранные Hero в том же
JSON и native versions. Publish нормализует public contract и сохраняет этот cache;
releaseProjectDocument удаляет metadata перед общей public validation. SQL schema
и public ProjectDocument не изменены; native versions остаются единственным store.
Новый вариант без ресурсов сохраняется как draft, publish отклоняется.

Evidence: 6 authoring helper tests; native test suite (database/content/media/account/
CLI/storage/persistence); native typecheck/lint/build PASS. Browser disposable DB:
описание и initial=delivery сохранены/reloaded; raster→layout save/reload; публикация
незаполненной URL-сцены вернула400 с понятной ошибкой; возврат восстановил3 экрана;
перестановка delivery/home сохранила initial ID. Fresh process `editor-session.ts
browser` подтвердил сохранение, неизменённый previous published, native publication
с cache и public export без него, восстановил только disposable baseline.
Build имеет существующее предупреждение о tracing dynamic PAYLOAD_LOCAL_ROOT;
native local app не является production archive публичного сайта.

Review1 completeness: исправлены лишние legacy JSON поля и legacy editor sections,
ошибочный enum in-progress→in_progress, доступное имя Hero select. Ещё нужны upload/
replace/remove image/package, rich-text add/remove и удобное редактирование optional
полей; группа1 полностью не закрыта. Review2 regression/risk: native auth/drafts/
versions/deletion/storage tests PASS; no public renderer/CSS or personal store edits.
В группе2 выбирать closure только используемых public assets: прошлые материалы
нужны native versions, но не должны экспортироваться автоматически из cache.

## Checkpoint: группа2, pure quality boundary

`materials/image-quality.ts` принимает bounded bitmap и установленное назначение;
возвращает immutable original/prepared selection и version1 quality report с
форматом, разрешением, весом, hashes и причиной. Текущее оригинальное хранилище
ещё не подключено к helper: это проверенная основа ingest, а не готовая upload UI.
WebP уже подготовлен — не перекодируется; неизвестное назначение, animation,
unsupported depth/orientation сохраняют исходник. Candidate: lossless WebP с
metadata, полный decode, exact RGBA (sRGB) и ICC/orientation equivalence; только
меньший подтверждённый кандидат заменяет selected bytes. Invalid original refused.

6 focused real image tests PASS: transparency/pixels/dimensions, неизвестный context,
encoding failure, larger result, lossy/resized/corrupt candidate, repeated WebP,
ICC/oriented JPEG и malformed/oversized original. Native typecheck/lint PASS.
RED был missing helper; первая реализация выявила безопасный false rejection:
Sharp создаёт EXIF orientation1 там, где input orientation отсутствует. Исправлена
нормализация identity orientation, не ослаблено pixel/profile сравнение.
Review completeness: no resize/upscale/near-lossless; report включает обе версии.
Review regression/scope: helper ещё не импортируется renderer/UI/server endpoint,
no writes/SQL/dependency/new runtime changes; оригиналы не удаляются.
Next: authenticated bounded ingest, immutable native original/prepared relations,
quality report в native versions, safe slot mapping/upload UI/deletion guards;
public asset closure исключает originals и unused cached materials.
Official installed-compatible API sources: https://sharp.pixelplumbing.com/api-output/#keepmetadata,
https://sharp.pixelplumbing.com/api-output/#webp, https://sharp.pixelplumbing.com/api-input/#metadata.

## Checkpoint: группа2, authenticated image ingest

Реализованы bounded multipart endpoint с native auth/origin/host checks, immutable
original/prepared native relations и automatic public asset binding, upload/replace/
append/remove raster controls, quality report в native JSON/versions. Existing
Hero geometry, renderer и персональное хранилище не изменены. Максимум9 экранов;
publish сохраняет общий odd-screen validation. Изображения исторических версий
защищены от удаления. Public export выбирает только requiredAssets closure;
immutable upload basename проверяется против фактического SHA256.

HTTP проверка на disposable native DB PASS: anonymous401, foreign origin403,
authenticated upload200, lossless report, save/reopen draft, automatic relation,
previous published unchanged, original/prepared delete409. Fresh-process export
PASS: draft upload не экспортируется; после native test publication prepared image
экспортируется один раз, original/replaced bitmap/private metadata исключены;
только disposable baseline восстановлен. Файловый диалог браузера не завершился;
успешной UI загрузки этим evidence не заявляем. Проверка продолжена через API.

Review1 completeness нашёл повторное преобразование WebP внутри Payload:
installed generateFileData считает любой WebP animated-capable и с config.sharp
перекодирует его. Убрано встроенное преобразование; установленный Sharp остаётся
в explicit validation/quality pipeline. Native Media теперь сохраняет байты
как есть; probeImageSize измеряет размеры, beforeOperation fully decodes bitmap.
Новый real WebP storage regression и повторные HTTP/export tests PASS.
Review2 regression/scope: native auth/drafts/history/delete/storage tests PASS,
original не публичный, no SQL/dependency/production/personal data changes.
Native full test suite, typecheck/lint/build PASS; прежний dynamic-root tracing
warning сохраняется. Layout package ingest и UI upload acceptance ещё не закрыты.

## Checkpoint: группа1, действия для текстов и optional fields

Native editor теперь добавляет/удаляет абзацы, inline text/link, Corvo headings/list/
hardBreak и tags. Marks доступны даже если их раньше не было; subtitle, card tag,
Figma URL и metric secondaryValue добавляются/очищаются без JSON. Локальные href
редактируются как text, HTML URL validity больше не отклоняет /path и anchors.
Фиксированные sections/scenes/metrics не получают произвольный CRUD; системное
примечание Corvo защищено. Public schema/geometry не меняются.

2 focused helper tests PASS; native copy-session проверил оба templates: additions,
relative link, marks/optional field save/reopen, previous published/Hero preservation,
восстановление только disposable baseline. Full native tests/typecheck/lint/build
PASS. Review1 completeness: optional fields появились независимо от старого JSON;
Review2 regression/scope: path whitelists, source immutability, fixed slot/notice
guards, unchanged native publication/history tests.

Browser auto-review отклонил открытие localhost из-за пользовательского запрета
запрашивать browser access; не повторять это действие и не обходить через другую
browser surface. Visual/UI acceptance остаётся непроверенной; API/CLI implementation
и проверки продолжаются независимо. Layout file/package upload, same-renderer
preview и site publication ещё не завершены.

## Checkpoint: native layout file download boundary

До package upload закрыта CMS-origin execution boundary: native project-files/file
GET/HEAD получает attachment + CSP sandbox/default-src none + nosniff/private
no-store/noindex. Policy использует decoded route segments: encoded collection
name не обходит защиту. Collection JSON/media/auth/preview не меняются.

HTTP integration на existing disposable HTML PASS: anonymous403, authenticated
GET200 и byte-for-byte file equality, encoded collection same behavior, HEAD200
с теми же заголовками и пустым body, collection JSON без attachment. Обнаруженный
HEAD404 исправлен explicit HEAD→authenticated GET mapping без ответа body.
2 policy unit tests/full native suite/typecheck/lint/build PASS.
Review1 completeness: native download изолирован независимо от будущего preview.
Review2 regression/risk: access не расширяется, response bytes/status сохраняются,
no user data/public renderer change. Same-renderer sandbox preview ещё требуется.

## Checkpoint: группа2, layout package ingest

Authenticated bounded multipart endpoint принимает HTML + ресурсы или выбранную
папку с сохранением внутренних путей. Native Field предоставляет выбор HTML entry,
URL, загрузку/повторный выбор package; source binding не меняет scenes/adaptives/
geometry. Versioned `_payloadEditor.packages` хранит manifest/bindings; automatic
releaseAssets/external font dependencies и native deletion guards защищают оригиналы.
Никакие файлы не трансформируются. SQL/public schema/dependencies не менялись.

До первой записи проверяются512 files/20MB each/64MB total, normalized relative
paths/case duplicates, UTF8/JSON, bitmap full decode, supported format/signatures,
HTML/CSS/static JS dependencies; remote URLs не fetch. Внешние ресурсы допускаются
только для двух approved font hosts в рамках existing sandbox CSP. Dynamic JS
behavior подтверждать в runtime приёмке; static closure test это не заменяет.

Review1 completeness: actual approved Corvo package выявил JPEG под именем.png.
Исправлено определение MIME по bytes, пути/байты сохраняются. Actual approved
package теперь принимается; отдельный real JPEG-under-PNG regression PASS.
Выбор папки убирает только её внешний basename (может содержать пробелы), сохраняет
nested resource paths и даёт выбрать entry.
Review2 scope/security: auth401/foreign403, unsafe package400 создаёт0 файлов,
no remote fetch, private native downloads remain attachment/sandbox. Draft save/
reopen, automatic HTML/CSS/JS/bitmap relations, unchanged published, original
version deletion409 PASS. Fresh process test publication/export сохраняет все
original bytes/manifest/adaptives; unpublished package исключён; private editor
metadata исключена. Только disposable baseline восстановлен.

4 package helper +2 binding/selection tests, native full regression suite,
typecheck/lint/build PASS. HTTP/upload UI browser acceptance pending per denied
browser access; request не повторять. Next: authenticated same-renderer preview
(group3), subsequent CMS snapshot builds/publish workflow/bootstrap (groups4–7).


## Checkpoint: группа3, общий producer preview/release

prepareReleaseRecords проверяет одинаковые documents, image bytes/dimensions и
полную asset/package manifest closure. Private preparePreviewRelease подменяет
только выбранный сохранённый draft, остальные проекты остаются published.
Режим, author status и revision находятся в private metadata; draft не получает
publication provenance. Published export сохраняет прежний snapshot contract.

Оба templates: auth, invalid id, draft/published revision, unpublished isolation,
private editor metadata exclusion, missing binding rejection PASS. Native full
suite/typecheck/lint/build PASS. Review1: closure проверяется до compile. Review2:
public snapshot/SQL/Hero/CSS/personal data неизменны. UI пока legacy, группа3
не завершена. Далее compiled immutable scoped artifact, sandboxed same-renderer
frame и HTTP guards. Browser action не повторять и не обходить.


## Checkpoint: группа3, compiled private same-renderer preview

Native auth выбирает сохранённый draft/published и запускает isolated Vite compiler.
Он использует existing App/project templates/FirstVisit/Hero/styles, approved shell
assets и проверенный private asset closure. Local document/static resource paths
получают отдельный namespace; bytes/layout geometry/adaptives не меняются. Private
renderer input не получает public publication provenance. Legacy Payload records
без releaseContent сохраняют прежний native preview; Des-art Admin не используется.

Frame имеет sandbox allow-scripts без allow-same-origin. Внутри используется
256-bit read-only capability на exact manifest, TTL30min; native auth нужен для
создания, CMS session/JWT/secret frame/compiler не получает. Routes/GET/HEAD ограничены
manifest, digest/size проверяются при чтении; no-store/noindex/nosniff/no-referrer,
opaque module CORS. Package HTML сохраняет approved sandbox CSP. Manifest/DB/unknown
asset/unknown namespace недоступны. Incoming request logging выключен, чтобы ссылки
предпросмотра не попадали в terminal logs. Cache shared process-global across route
bundles/HMR, one compiler, count/byte budgets. Links invalid after server restart;
очистку abandoned derived cache после restart ещё включить в группу6.

Failed producer/compiler показывает previous good artifact этого user/project/mode.
API/HTTP на итоговом production build: auth redirect, оба template frames, module
assets without CMS credentials, sandbox/CORS/no-store, HEAD empty body, invalid
namespace/missing files/private manifest exclusion и repeated revision reuse PASS.
Pure real renderer compiler/path mapping/original bytes и native full suite PASS;
typecheck/lint/build PASS. Dynamic-root tracing warnings сняты documented ignore
annotations на runtime paths, runtime root/symlink guards сохранены.

Review1 completeness исправил Vite transform order и route literal prefix mismatch;
legacy-only fallback сохранён. Review2 security/scope: full closure до compile,
private/public provenance разделены, child secret исключён, bounded manifest serving,
no personal state/production/browser changes. Browser visual/runtime interaction
acceptance всё ещё pending; HTTP build не заменяет проверку animation/scenes.

Next: группа4 explicit published CMS snapshot builds + actual slug/template routing;
затем publication workflow, sourceHash coverage/derived cache cleanup/bootstrap,
failed-draft fallback/expiry HTTP checks и final acceptance. Не повторять и не обходить
denied browser action. Goal не завершён.


## Checkpoint: группа4, explicit published content build

prepare-site выбирает approved-git-code (default, не принимает CMS path) либо
explicit payload-published с directory + expected snapshot SHA256. Validated input
фиксируется один раз, передаётся Vite producer напрямую; snapshot/digest bundled
в site, provenance/content digest входят в Next stamp и archive result. Public host
не выдаёт snapshot.json, он исключён из public manifest. Packaging CMS требует
exact expected content hash; clean HEAD и build fingerprints сохраняются.

Release entry выбирает страницу по actual slug + supported designProfile. Native
public aliases следуют новому slug, original files/relations/version metadata не
переезжают. Перед publication нормализуются только public references; retained
immutable private materials/packages допускаются только при exact equality с
предыдущим native record. Identical public aliases deduplicate; conflicting bytes
reject. Prepared AVIF mapping больше не привязан к буквальному corvo slug.

Review1 выявил native publish failure при slug change из-за package ownership;
исправлены derived aliases и retained-history guard. Actual native publish/export
обоих templates с previously uploaded image/layout PASS, original published baseline
восстановлен только в disposable DB. Review2: no SQL/public schema change, private
metadata stripped, no file overwrite, expected digest protects cross-snapshot build,
CMS data отсутствуют в публичном runtime. Snapshot/host/route focused tests и root
lint/build PASS; native full tests/typecheck/lint PASS. Scratch actual CMS-source
Next build/stamp PASS; clean exact HEAD build/archive/unpack verification — next.

Next: завершить offline archive proof группы4, затем группа5 native publication
workflow. SourceHash expansion/cache cleanup/bootstrap/final browser acceptance
остаются в плане. Temporary fixtures никогда не публиковать. Goal active.


## Evidence: группа4 offline clean archive

Exact clean HEAD717f711bf8fda312fd2eb12badd725852b99db5a: actual published
Payload snapshot → public Next build/stamp → runtime archive PASS, CMS stopped.
Content hash160df0605cce1b42bbd37067b4ea01cb176e2b9c34102453d44341e73362923a.
Archive /private/tmp/payload-site-runtime-proof.tar.gz, SHA256
 e8fe3a0da56ed926f0f5622eea4f396e486d18d7da8b1cff0894eec3f435f65d,
20711270bytes/1511entries. /private/tmp/payload-site-offline-proof.json фиксирует
result; /private/tmp/payload-site-archive-check.mjs — executable offline HTTP proof.

Unpack/start без CMS: оба project routes/title/build SHA, all163 selected asset
checksums, HEAD, temporary /projects redirect, new404, private snapshot404 PASS.
No CMS/store/project-source files in archive allowlist. Missing/wrong expected
CMS digest packaging reject PASS. Review дополнительно связал bundled private
snapshot с исходным exact content bytes; actual standalone snapshot tampering
reject/restore/reverify и focused lint PASS. Эта дополнительная проверка добавлена
после archive build; следующий final artifact требует свежего build на новом HEAD.

Group4 implementation/CLI proof готовы; browser render/motion acceptance остаётся
pending. Далее группа5 native site-publication operation/UI, не повторный manual
initial release. Production и personal state не менялись; fixture archive не deploy.


## Checkpoint: группа5, durable operation/neutral transport foundation

OperationStore v1 хранит derived status в dataRoot/site-publication, не второй
контентный store/SQL. Frozen codeSha/contentHash, UUID request identity, owner,
archive hash/bytes, server operation ID; strict fields/states/errors. Atomic files
и independent filesystem reservation/update locks. Global active nonterminal job
не заменяется новым. Повторное requestId возвращает прежний job даже после нового
active job; payload с тем же requestId и другим content/code reject. Archive identity
не меняется после ready. Unknown deploy result допускает только observation recovery,
не повторный upload/start; stale lock автоматически новый deploy не разрешает.
Worker/restart recovery/partial-write handling ещё нужны, foundation не является
завершённым publication pipeline.

Neutral tools/portfolio-release/deploy-transport.mjs использует только restricted
upload-v2/start-v2/status-v2. Ни imports, ни данные/правила old Admin не используются.
Archive size/full digest before upload, bounded response/progress/hard deadlines,
exact SHA/archive-derived operation ID, exact status identity; generic errors без
key/config/SSH stderr в UI. Реальные SSH/deploy команды не выполнялись.

2 durable state tests: reopen, full transitions, same request after completed jobs,
concurrent reservations, owner boundary, wrong identity/state, immutable archive,
unknown-result duplicate block PASS. 2 neutral transport tests: forced commands,
wrong status/response identity, archive corruption, non-progress timeout PASS.
Native typecheck/lint + root focused lint/diff checks PASS.
Review1 исправил replay старого requestId после другого active job. Review2 добавил
immutable archive binding и очищает previous transient error при recovery. No native
schema/source ownership/UI/public runtime/production changes.

Next: authenticated prepare/status/deploy actions, bounded snapshot-freezing worker,
clean code checkout/build/archive/validation, exact prepared preview, live-config
boundary, unknown-result reconciliation + UI. Затем isolated end-to-end deploy-v2
failure/rollback/restart checks; group6 installation/bootstrap и final acceptance.


## Checkpoint: public readiness binds content revision

Release host добавляет data-content-sha256 рядом с code SHA, только для valid
snapshot digest; historical manifest без поля сохраняет прежний output. Neutral
verifyPublishedSite проверяет exact code/content markers на root и project routes,
all snapshot asset sizes/digests, bounded response/per-request/total deadlines.
Одинаковый code SHA с прежним content больше не проходит readiness. Внешний результат
или timeout нельзя трактовать как permission на повторный deploy; worker должен
сохранять unknown и наблюдать прежний server operation.

3 transport tests + actual host/transport integration PASS: correct revision,
stale content under same SHA, corrupt asset, hung request deadline, historical
manifest compatibility; focused root lint/diff checks PASS. Review1: generation
и consumer проверены вместе; Review2: no visual/source/SQL changes, identity fields
строго hex, responses bounded, no secret errors. Worker/API/UI остаются следующим
обязательным этапом; publication на сервер не запускалась. Final runtime artifact
потребует build exact нового HEAD, предыдущая717f711 proof не текущий release.


## Checkpoint: группа5, подготовка через authenticated API

Реализованы prepare/status/cancel и detached preparation worker. Подготовка
замораживает published snapshot, exact clean code HEAD и собирает отдельный
временный checkout через offline npm cache. Archive/code/content identity
проверяются до ready; личные данные и dirty code не копируются. Повторный
requestId читает прежнюю операцию до обращения к текущим данным/коду. Готовую
подготовку можно снять без удаления архива/данных, после отправки cancel запрещён.

Full native suite PASS; own temporary snapshot → actual detached build/archive/
cleanup/replay PASS; authenticated HTTP auth/origin/body bounds, owner isolation,
frozen replay/status/ready-only cancel PASS. Updated native build/typecheck/lint
и focused operation/request/failure tests PASS. Fresh end-to-end API launch после
clean commit — ближайшая проверка; worker/deploy/UI ещё не завершены.

Review1: post-reservation setup failures теперь переводят operation в failed;
специальный тест блокирует inputs обычным файлом и доказывает новый запрос после
ошибки. Worker ожидает atomic dispatch descriptor до начала сборки. Review2:
каждая build command имеет собственную process group, timeout/output overflow
завершают descendants и дожидаются их выхода. Неподтверждённая остановка сохраняет
checkout. Реальный child с игнорированием SIGTERM проверен. Prepared return и
persisted JSON идентичны; terminal чужого owner не блокирует следующий запрос.
Restart reconciliation/partial-write recovery, release review, deploy/UI/live
config и installation остаются обязательным продолжением, не закрыты этим шагом.

## Checkpoint версии2.0: опубликованные ресурсы

Server asset reader выбирает только committed published records; внутренний
resolver читает только связанные native upload IDs. Имена файлов из присланного
populated relation не используются. Проверяется regular/O_NOFOLLOW, размер,
immutable digest, полное декодирование bitmap, image dimensions и package closure.
Native beforeChange выполняет те же проверки с req transaction до публикации.
Неполный черновик сохраняется, ошибочная публикация не меняет рабочий контент.
Public host не выдаёт старые bundled content assets при отсутствии published
binding. Static JS/CSS/fonts доступны без запроса БД. HTML packages сохраняют
MIME/CSP, GET/HEAD/ETag; cache ограничен текущим native published revision.

Evidence: missing-image test RED (native Publish ошибочно принимался) → GREEN;
actual native DB: draft upload404 → Publish exact bytes200, смена slug aliases,
BUILD_ID unchanged, fixture restored. Actual Next HTTP: anonymous raw upload403,
draft public404, published image byte-identical, HEAD/ETag304, полный required
asset closure200; missing image Publish400 сохраняет прежний DTO; восстановление
baseline убирает новый ресурс. Public HTML/title checks для обоих templates PASS.
Full native suite/typecheck/lint/build; root host checks; renderer build PASS.
Две последовательные selfreviews: fidelity/completeness, затем regression/access/
transaction/scope. Production и Hero не менялись. Далее: no-build private preview.

## Checkpoint версии2.0: no-build private preview

Предпросмотр переиспользует prebuilt renderer с фиксированным внутренним namespace.
Code build один раз компилирует shell; создание saved-draft preview подставляет
escaped runtime DTO, выдаёт только verified draft assets и меняет namespace
статических JS/CSS. HTML packages сохраняют точные bytes без переписывания.
Ни compiler, ни Git, ни subprocess больше не вызываются на content/preview path.
Native authentication создаёт expiring read-only capability, frame sandbox,
CORS/no-store/robots/no-referrer. Raw DB/manifest/unknown files404. Failed preview
сохраняет прошлый успешный frame с его собственным slug, даже после invalid rename.
Cache имеет лимит8/384MB и проверку capacity после async shell load.
Build freshness теперь покрывает renderer/shared image helper/host/tooling.

Evidence: no-build preview fixture RED→GREEN; actual Next HTTP обеих templates,
новый saved draft title в runtime JSON, public DTO неизменен, BUILD_ID/prebuilt
shell digest unchanged, anonymous creation denied, HEAD/CSP/CORS/no-store and
unknown namespaces404. Missing-file renamed draft показывает previous successful
frame; fixture восстановлен. Native suite/types/lint/build PASS; два selfreview
с исправлениями capacity race/fallback slug до final HTTP check. Browser не запускался.
Далее server environment/permanent storage/HTTPS/code packaging/bootstrap/deploy.
