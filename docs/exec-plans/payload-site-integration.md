# Полное подключение Payload к опубликованному редизайну

Версия 1.0, 2026-10-05. Статус: IN_PROGRESS — Ready for execution.
Область ADMIN + SHARED + PORTFOLIO + OPS; LARGE / HIGH / FULL.
Ветка codex/cms-integration; base b0ec4de4c50dd9fe5b557cd1de842cd55637c6f5.
Production baseline b44946021d55fb1cc8a4430c3bafd62e342714c9, PR #54.
Исполнение автономно по запросу пользователя «составь план ... и реализуй ... продолжай».

## Результат и источник истины

Пользователь редактирует проекты в существующей локальной Payload, сохраняет
черновик, видит его в тех же компонентах, что production, затем отдельно публикует
выбранную проверенную версию на art-des.ru. После перезапуска редактора данные,
версии и originals сохраняются; ошибочный материал/экспорт/сборка/деплой сохраняет
последнюю рабочую версию сайта и возможность отката.

Готовое переиспользовать: native Payload 3.89.0/SQLite/auth/versions/media/storage,
releaseContent/releaseAssets JSON boundary, release-export validation/full decode,
project-snapshot/snapshot-directory, Vite renderer и обе оболочки Hero, root
Next standalone/build stamp/archive/deploy-v2 и rollback. Старый Des-art Admin
не является источником данных, правил или authoring UI.

Native editor, image quality ingest и layout package upload реализованы;
API/persistence/export tests PASS, browser acceptance pending. Незавершённые
участки: legacy preview, initial-only prepare-site, site publication workflow,
bootstrap/sourceHash и ограничение dynamic-root tracing.

## Продуктовый контракт и ограничения

Аудитория — один владелец портфолио. CMS остаётся локальной с входом;
публичный сайт использует immutable snapshot и работает при выключенной CMS.
Новый cloud CMS/DB/открытый admin на VPS не требуются.

- Редактировать тексты, ссылки, agreed project images, секции существующих
  Corvo/Sarafan templates; не превращать главную или Hero geometry в конструктор.
- «Верстка»: четыре существующие сцены, замена готового HTML с ресурсами либо
  публичного HTTPS URL, выбор доступных adaptives и начальной сцены. Поведение
  внутри iframe задаёт приложенная верстка; shell/CSS/physics не переписывать.
- «Фикс адаптив»: desktop-only, 3/5/7/9 изображений, порядок/подписи/начальный
  экран, согласованные scale/формат/geometry. Mobile/Tablet оставить disabled.
- Native drafts/versions и JSON schema-v3/redesign-v1 сохраняются; custom field
  заменяет отображение releaseContent, не вводит второй store.
- Originals неизменяемы; prepared assets immutable, привязаны к версиям.
  UI/screens/diagrams → pixel-equivalent lossless, без resize/upscale/near-lossless;
  unknown context → original. Quality report показывает формат/размеры/вес/причину.
- Preview authenticated/no-store/noindex. Uploaded HTML никогда не исполняется
  в origin CMS: sandboxed preview boundary без allow-same-origin, как production.
- Initial CMS bootstrap только из exact deployed approved snapshot и ресурсов,
  не из temporary proof, old Admin или чужого личного .local.
- Архив старого production отдельно, только после пользовательской приёмки.

## Порядок Git-групп

### 1. Native редактор без изменения SQL schema

Target → release-content.ts, collections.ts, custom client Field/importMap,
client-safe authoring helpers и tests.
Change → понятные поля для project copy/sections/metrics/links/notice, card images,
выбор Hero, scene titles/source/available adaptives; raster order/caption/initial.
Неполный draft допустим; publish проверяет полный контракт. Смена Hero сохраняет
данные предыдущего выбора до явного пользовательского удаления.
Expected result → типичные изменения делаются без ручного JSON; сохранение,
повторное открытие и history используют native Payload.
Verification → helpers negative/preservation tests; real temporary DB save/reopen,
обе Hero, incomplete draft и publish errors; browser editing, typecheck/lint/build.

### 2. Materials ingest и сохранность ресурсов

Target → native media/project-files, releaseAssets binding, quality pipeline,
layout package preparation, upload UI и tests.
Change → upload/replace/remove/reorder не перезаписывает original. Приготовить
lossless candidate, full decode/pixel compare и report, выбрать original если
кандидат хуже/не легче. Готовая верстка: файлы + относительные пути + entry,
manifest hashes/limits/dependency closure, безопасный immutable assetBase.
Expected result → пользователь не вводит hashes/public paths вручную; missing,
corrupt, traversal, oversized, unsupported resources не попадают в good snapshot.
Verification → реальные PNG/JPEG/WebP/alpha, не легче/failure fallback, повторный
upload; package HTML/CSS/images/fonts и forbidden paths; versions deletion guards.

### 3. Единый preview/export mapping

Target → release-export/readPreviewProject и same-renderer preview boundary.
Change → один mapper для selected authenticated draft/published project; preview
рендерит compiled Vite components и scoped assets из immutable snapshot.
Legacy preview обслуживает только legacy записи без releaseContent.
Expected result → видны exactly saved draft и отдельно published revision;
CMS auth/cookies недоступны коду приложенного layout, draft не выходит публично.
Verification → browser оба templates/Hero/scenes; anonymous/unauthorized asset,
HEAD/404/no-store/noindex; failed validation сохраняет последний good preview.

### 4. Последующие site builds из выбранного CMS snapshot

Target → prepare-site/approvedContentPlugin/build-stamp/package/host.
Change → явно выбрать approved Git initial source либо validated Payload export;
один immutable snapshot фиксирует весь build, provenance/content digest входит
в stamp/archive. Экспорт и draft preview не меняют canonical Git files.
Generalize route selection по supported template, если slug изменён; URL/metadata,
/project redirect/new404 и approved main сохраняются.
Expected result → archive содержит именно выбранную revision, без CMS/store/secrets;
сайт не требует запущенной CMS после сборки.
Verification → temporary native save/export→clean actual build/archive/unpack→
HTTP/render/assets и остановленная CMS; stale/incomplete/cross-snapshot build rejection.

### 5. Понятная публикация и восстановление

Target → Payload UI action, authenticated local operation endpoint/worker,
neutral release deployment transport (без old Admin state), status persistence.
Change → «Сохранить черновик», local revision и «Опубликовать на сайт» различимы.
Workflow фиксирует exact content/build/archive, проводит проверки, предоставляет
preview и запускает только разрешённую публикацию. Один writer/job; повторный
клик, disconnect, timeout и неизвестный результат не запускают второй deploy.
Expected result → видны этап/результат/ошибка и опубликованная версия; retry
наблюдает тот же operation; last-good защищён. Secrets не попадают в docs/log/UI.
Verification → isolated deploy-v2 success/failure/rollback, restart/reopen operation,
concurrent/retry tests и authenticated endpoint checks; отдельно live smoke.

### 6. Рабочая установка и bootstrap

Target → launcher/run/source hash/schema/storage + CLI bootstrap текущего production.
Change → полноценный clean initial state из exact deployed snapshot; согласованная
папка локальных данных с backup/restore, schema checks, instructions и account flow.
Личный existing .local не читать и не изменять автоматически.
Expected result → reproducible install/start/restart, проекты совпадают с prod,
учётная запись создаётся пользователем, backup действительно восстановим.
Verification → temporary installation from actual approved snapshot, storage
backup/verify/restore/reopen, schema mismatch/stale build guards; затем gate real bootstrap.

### 7. Сквозная приёмка и выпуск интеграции

Target → final exact branch/build/runtime и actual deployment.
Change → сохранить draft, изменить copy/link/image, заменить layout source и enabled
adaptives, изменить raster order/initial; увидеть preview и только выбранную
published revision в archive/site. После каждого failure site остаётся рабочим.
Expected result → законченный authoring→preview→publication pipeline, не только proof.
Verification → focused + native integration + typecheck/lint/build, public routes,
451-equivalent asset inventory, оба Hero, preload retry и regression desktop;
два последовательных review completeness, затем scope/security/data/rollback.
Публичные реальные content changes не заменять тестовыми fixture.

## Границы разрешений и решения

План/обычная реализация уже разрешены, промежуточного согласования не требуется.
Real data bootstrap/migration, secrets/access expansion и реальная CMS content
publication требуют отдельного конкретного решения после готового reviewable
результата. Предыдущее разрешение site deploy учитывается для release tooling,
но не разрешает перенос temporary CMS fixtures или чтение личного .local.
При необходимости SQL schema/public contract expansion описать migration и
согласовать material изменение до dependent work; пока сохраняем schema.

## Приёмка и evidence

Не объявлять завершение по коду/tests alone: сохранение/reopen и реальный browser
в native Payload обязательны; same-renderer draft preview и exact archive/site
после остановки CMS обязательны; обе Hero и quality failure обязательны.
Для каждой группы записывать commit, ближайшие итоговые checks и пределы evidence.
До actual integration acceptance UI не обещает «подключено к сайту».

План review: устранены hidden legacy preview, initial-only release restriction и
неполный source hash; real bootstrap/publish выделены из sandbox implementation.
Ready for execution локальных групп1–5; real transition после explicit gate.

Sources: текущие native код/типы/tests; docs/requirements/admin-image-quality.md;
Payload custom field/useField: https://payloadcms.com/docs/fields/json,
https://payloadcms.com/docs/admin/react-hooks. Точные API сверять с installed3.89.0.

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
