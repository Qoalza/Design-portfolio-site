# Implementation Plan: независимый выпуск Portfolio и Payload Admin

**Статус:** In progress — реализация разрешена 2026-10-06; G0 подтверждён, G1 в работе.  
**Версия:** 1.0 · 2026-10-06.  
**Классификация:** PORTFOLIO + ADMIN + SHARED + OPS · LARGE · HIGH · FULL.  
**Репозиторий:** Qoalza/Design-portfolio-site.  
**Baseline:** `ce3e80fd4c45d1f16c808f80c1f3e1686702e99c`, ветка `codex/cms-integration`.  
**Стабильный путь плана при исполнении:** `docs/exec-plans/portfolio-payload-separation.md`.

При подготовке исходного плана разрешалось только планирование. При его подготовке код, Git-ветки, CMS и production не изменялись; сборки и тесты не запускались. Текущая реализация разрешена пользователем; фактический checkpoint ниже. Готовность плана не означает разрешение на реализацию или production-переключение.

## Execution checkpoint — 2026-10-06

- Пользователь явно разрешил реализацию в `payload-admin`; запись проверкой разрешений допущена.
- G0: чистая `codex/cms-integration`, exact исходный HEAD `ce3e80fd4c45d1f16c808f80c1f3e1686702e99c`; другой active writer не обнаружен. Свежий server preflight ещё не выполнен; он не блокирует isolated G1–G6.
- G1: добавлены public-delivery-v1, typed public DTO/reader boundary, детерминированный digest, scoped URLs/renditions, empty/no-detail collection, manifest/byte MIME/closure validation, строгий readiness и last-good reader. Existing snapshot v1 сохраняет прежние ограничения.
- Synthetic fixtures не читают sandbox/production; fixture bitmap bytes проверяют transport signatures, а не CMS image-quality/dimensions. Полное decoding остаётся в прежнем CMS ingest и будет проверено G3/G6.
- Review 1 fidelity/completeness: исправлены mapping текстовых значений, byte MIME proof, package reference tests и strict readiness.
- Review 2 regression/scope/risk: ограничено повторное чтение ресурсов; медленный старый request не заменяет новый last-good. Private roots/secret/DB и текущие routes/build/publish ещё не изменены.
- Проверки G1: 21/21 focused + existing snapshot/public-host tests; root `npm run lint` PASS; declarations strict TypeScript PASS (`--ignoreConfig --types node` для установленного compiler); standalone reader esbuild + import PASS. Root legacy build не запускался по запрету плана.
- Далее: G2 — Node host и content-independent public/preview builds; G3–G7 не выполнены. Production switch требует exact release/service/proxy gate из G7.

## 1. Результат и подтверждённая база

Нужно получить два независимо собираемых и выпускаемых приложения. Portfolio обслуживает текущий сайт и успешно опубликованные материалы, Payload — редактор, аккаунты, черновики, версии и приватный предпросмотр. Изменение сайта не требует сборки или перезапуска CMS; изменение оформления Admin не требует сборки или перезапуска сайта. Обычный Publish обновляет контент и файлы без Git, PR и сборки приложений.

Источник требований — [portfolio-payload-separation.md на exact commit][requirements]. Приложенные `AGENTS.md`, `PLAN_RULES.md` и `PLAN_RULES_GUIDE.md` прочитаны. Planning Rules в репозитории совпадают с вложением по содержанию; отличается завершающий перевод строки. Архитектурные сведения приложенного AGENTS устарели: текущие [AGENTS][agents] и [HANDOFF][handoff] уже фиксируют Payload вместо Des-art Admin и CMS вместо Git JSON как авторский источник. В плане используются эти актуальные сведения; общие правила планирования, проверок и Git сохраняются.

В исходном запросе подписи ссылок остались от прежней задачи. Подтверждено через GitHub ref: `codex/cms-integration` указывает именно на `ce3e80f…`. Подписи `codex/concept-v2-figma-delta-3ec86f0` и `5955fde…` не являются baseline этого плана.

| Проверено в исходниках | Что это меняет в плане |
| --- | --- |
| Public UI — Vite/React в `tools/concept-v2/app/src`. Payload Next catch-all оборачивает `createReleaseHandler` из `tools/portfolio-release/release-host.mjs`. | Сохранять текущий renderer; не переносить старый UI из root `src/app`. |
| Public readers в `tools/payload-admin/src/site` обращаются к Payload за документами и файлами. | Нужна самостоятельная опубликованная копия данных **и bytes ресурсов**, а не только отдельный процесс. |
| `tools/payload-admin/scripts/run.mjs` при build собирает public site и preview; его start/sourceHash также зависит от исходников Portfolio. | Разделить не только команды build, но и runtime imports, start checks и состав артефактов. |
| Publish — native сохранение Payload с `beforeChange: validateReleaseProject`. Отдельного подтверждения public activation нет. | Добавить delivery coordinator; не считать native `_status` доказательством доставки на сайт. |
| Preview уже использует подготовленный browser bundle; runtime loader не компилирует renderer. | Перенести сборку preview к Portfolio, сохранив private serving внутри CMS. |
| `validateProjectSnapshot` запрещает пустую коллекцию; browser runtime имеет fallback к bundled Git content. | Ввести отдельный serving envelope и исключить Git fallback из действующих public/preview режимов. |

Основание: [CMS build/start][cms-run], [public host][host], [public readers][reader], [publication mapper][export], [preview loader][preview-artifacts], [snapshot validator][snapshot], [runtime injection][runtime-documents].

Зафиксированный в документах deployed SHA — `c735f3151a297eccb2885e69c0a215143c2dfe2f`. Сравнение Git object hashes подтвердило равенство с baseline для `tools/concept-v2/app/src`, `tools/portfolio-release`, всего `tools/payload-admin`, root `src` и проверенных root package/lock/tsconfig. Это подтверждает совпадение исследованных исполняемых областей, а не всего репозитория.

Факт развёртывания и прежние проверки взяты из [сохранённого отчёта][production-report] и [PAYLOAD.md][payload-ops]. Свежий доступ к серверу в этой сессии не выполнялся. В отчёте — два проекта и 163 ресурса; это историческая контрольная точка, не запрет на последующие пользовательские публикации. Перед переходом сравнивать с **новым actual production baseline**.

## 2. Границы работы

Включены:

- независимые public/CMS build, package, start, health и code rollback;
- общий versioned delivery contract, целая активация контента и ресурсов, подтверждённый Publish;
- актуальный preview renderer без сборки/перезапуска CMS;
- необходимые изменения URL resolution, кэшей, native publication controls и private API guards;
- fixture-проверки отказов, совместимости, существующего UI и сохранности данных;
- подготовка эксплуатационных команд, rehearsal и отдельного production-перехода.

Не включены: редизайн сайта/Admin, новые типы контента и редакторские возможности, смена CMS/БД, изменение SQLite schema, повторный bootstrap, перенос sandbox, новая инфраструктура или платные сервисы, обновление зависимостей ради актуальности, очистка legacy-кода, автоматическая интеграция соседних веток. Figma не изменять; для технического переноса без визуальной дельты источником сравнения служит текущий renderer. Если потребуется визуальное изменение, сначала точный Figma source и отдельная фиксация scope.

Единственный рабочий контекст Admin — `/Users/designer/.codex/worktrees/payload-admin/Design-portfolio-site`. Не читать/менять `redesign-admin-integration`, пользовательский `.local`, `USERSPACE/**` или содержимое соседних worktree. Существующий Portfolio worktree не использовать как площадку параллельной записи.

## 3. Выбранное техническое решение

Это проектируемая архитектура, не описание уже готового кода.

### 3.1. Два процесса и один renderer source

**Portfolio:** небольшой Node HTTP host вокруг существующего `createReleaseHandler` и текущего Vite browser bundle. Второй Next runtime не нужен: актуальный сайт уже обслуживается этим handler, а Next сейчас является его транспортной оболочкой. Новый host размещается в `tools/portfolio-runtime`, использует Node built-ins и существующие зависимости сборки.

**CMS:** существующее Next/Payload приложение `tools/payload-admin`. В нём остаются native API, auth, editor, materials, private preview и coordinator. Public catch-all и живое обслуживание public материалов удаляются из действующей CMS после проверки новой границы.

**Portfolio artifact:** public bundle, prebuilt preview bundle, code-owned ресурсы, host и manifest. Оба browser bundle собираются из одной точной версии компонентов/CSS; preview bundle не входит в публичную HTTP allowlist. CMS получает read-only доступ к нему через проверенный active renderer descriptor, без обращения к исходникам/Vite.

**Derived published store:** целые неизменяемые поколения контента с проверенными файлами, доступные public процессу только на чтение. Приватные operation journal, native-ID mapping и staging принадлежат CMS и не находятся в public read root. SQLite, raw uploads и secret остаются в текущем CMS data root.

~~~mermaid
flowchart TD
    N["Nginx: art-des.ru"] --> P["Portfolio: Node host"]
    N --> C["Payload: editor и private API"]
    P --> S["Активный public snapshot и файлы"]
    C --> D["Приватная SQLite и uploads"]
    C -->|"Подтверждённая публикация"| S
    A["Portfolio artifact: public + preview"] --> P
    A -->|"Read-only preview bundle"| C
~~~

Новых production домена и внешнего API не требуется. Служебная проверка public readiness использует только loopback и безопасные identities; public runtime не получает CMS credentials. Проектируемые ОС-права и маршрутизация вводятся только на отдельном production gate.

### 3.2. Идентичности и совместимость

| Идентификатор | Что фиксирует |
| --- | --- |
| `portfolioBuildId` | Exact Git SHA, hash артефакта и manifest конкретного public code build. |
| `cmsBuildId` | Независимый exact SHA/hash CMS artifact и его runtime dependencies. |
| `rendererId` | Hash согласованных public/preview renderer inputs и их manifest; не просто текущий HEAD репозитория. |
| `contractVersion` | Новый `public-delivery-v1`: versioned envelope, transport mapping и capabilities поверх существующего ProjectDocument v3 / redesign v1. |
| `contentId` | SHA-256 нормализованных canonical public документов и полного manifest ресурсов; без циклического включения собственного ID. |
| `activationSeq` | Монотонный номер активации для CAS, конкуренции и восстановления. Это не version ID Payload. |

Source SHA и build digest хранить раздельно. Private journal дополнительно хранит native project ID, operation ID, source digest, отдельно выбранную saved/historical revision и фактически committed native revision. Для restore различать `selectedVersionId/sourceDigest` и `expectedCurrentRevision`: историческая версия — выбранное содержимое, а текущее состояние — защита от конкурентного изменения. Эти служебные значения не входят в public DTO.

Producer, public reader и preview проверяют одну поддерживаемую версию контракта и capabilities. Неизвестные блоки/поля, неподдерживаемые Hero или несовместимое сочетание версий отклоняются **до активации**. Code release проверяет совместимость с активным контентом и соседним приложением; несовместимость не исправляется фильтрацией полей или автоматической миграцией.

Новый envelope — производная delivery-структура. `releaseContent`, native bindings, SQLite schema и формат существующих authoring документов не мигрируют. Это запланированное изменение SHARED delivery boundary, не разрешение на произвольную смену ProjectDocument.

### 3.3. Public данные и ресурсы

Каждый public request фиксирует один active descriptor. Маршруты, navigation, SEO, sitemap, injected JSON и ссылки ресурсов формируются из одной generation. Cache key включает `contentId` и `rendererId`; бессрочное кеширование «по пути каталога» исключается.

Canonical документы проходят существующие строгие валидаторы **до** presentation mapping. Отдельный typed `RenderedProjectDTO` преобразует только manifest-owned resource URLs:

`/__content/<contentId>/assets/projects/<slug>/<исходный-путь>`

Authoring path validators не ослабляются. Transport validator проверяет обратимое соответствие scoped URL исходному пути, его наличие в manifest и запрет выхода из generation. HTML/CSS packages сохраняют оригинальные bytes: relative references остаются внутри scoped package base. Допустимые absolute-root ссылки внутри digest package base обслуживаются только как immutable aliases уже активированных удерживаемых поколений; конфликт bytes/MIME одного immutable alias запрещает публикацию.

Legacy `/assets/projects/...` aliases отражают активный manifest с revalidation/no-cache. Исключение — упомянутые immutable digest package aliases. Неизвестный путь не получает fallback из Git, upload root или bundled project content. Старые public страницы остаются на прежних URL.

Prepared AVIF/srcSet и image fallback должны scope-иться через один resolver, учитывающий canonical path. Текущий anchored regex в `src/lib/project-image-source.mjs` и специальная строковая подмена preview иначе потеряют renditions после добавления URL prefix. Существующие image ingest/quality/decoding и ограничения HTML/SVG не менять и не заменять повторным сжатием. [Источники: image policy][image-policy], [renditions][image-source], [package policy][package-policy].

Доставка проверяет actual bytes, SHA-256, размер, MIME, принадлежность и полный граф ресурсов; metadata-only validation недостаточна. Private staging недоступен public host. HTTP reader обслуживает только manifests активированных поколений, никогда staging, journal, raw blobs вне manifest или произвольный файловый путь.

На первом этапе сохранять все успешно активированные content generations и их ссылки на ресурсы; одинаковые immutable bytes можно переиспользовать по hash. Автоматическую очистку опубликованных файлов не вводить. Это сохраняет ранее открытые страницы и исключает удаление rollback/preview ресурсов. Нехватка места останавливает новую доставку до активации. Очистка временных build-каталогов не затрагивает content store.

### 3.4. Пустое состояние, скрытие и порядок

| Событие | Наблюдаемое поведение |
| --- | --- |
| Нет ни одного опубликованного проекта | Валидная empty generation: `projects: []`, текущая главная без карточек/fixture content; проектные маршруты — 404. Остальная оболочка сохраняется. |
| Отсутствующий/повреждённый descriptor после успешной публикации | Последний проверенный результат, если он доступен; иначе fail readiness/503. Не выдавать ошибку хранилища за новый пустой сайт. |
| Save draft / restore-as-draft | Активная generation и public URL не меняются. |
| Publish проекта | Заменяется только целевой проект; остальные берутся из последней успешно активированной generation. |
| Unpublish | Целевой проект исчезает из активных страниц, navigation и sitemap. Это механизм скрытия; новый Trash не вводится. |
| Delete | Существующее намеренное удаление в CMS плюс удаление из активной public коллекции через coordinator. История delivery остаётся доступной оператору. |
| Новый slug | После успешной публикации работает новый URL; старый получает нынешнее not-found поведение. Историю редиректов не добавлять. |
| Order / placement | Сохранять текущую collection policy: named home placement primary/secondary, существующие catalog-order правила, уникальность slug и допустимость всей коллекции. Не добавлять скрытые сейчас editor controls. |
| `detailAvailable: false` в допустимом документе | Не создавать detail route/sitemap URL. Не подменять допустимый документ Git-версией ради ограничений старого snapshot helper. |

Canonical пустые значения, удаления и visibility не заполнять прежними данными. Полная collection validation выполняется после overlay целевого проекта. Для стабильного порядка использовать существующие validated ordering fields и фиксированный tie-break по публичной идентичности там, где равенство разрешено контрактом; не полагаться на порядок выдачи SQLite. Проверить, что исходные два проекта не меняются местами.

Unpublish/delete убирают **активные страницы и ссылки**; уже опубликованные immutable bytes сохраняются для удерживаемых поколений. Это не механизм отзыва ранее опубликованного файла. Приватные draft-материалы не становятся частью этой истории.

### 3.5. Publish: один пользовательский шаг, проверяемая доставка

В Payload 3.89.0 `afterChange` и `afterOperation` выполняются до окончательного `commitTransaction`. Поэтому переключать public pointer в этих hooks нельзя. Использовать отдельный coordinator вокруг **завершённой** native операции. [Upstream update operation][payload-update], [restore operation][payload-restore].

В существующей Admin подключить `PublishButton`, `UnpublishButton` и `Status` через поддерживаемые Payload component slots. Сохранить знакомые действия и общий editor layout. Edit view, список и уведомления показывают delivery status; native `_status` сам по себе не означает «опубликовано на сайте». Private статус удалённой записи остаётся доступен через узкий список операций, без нового контентного раздела. [Extension contract][payload-slots], [current collections][collections].

Сохранённые native действия должны иметь рабочий bridge, а не просто упираться в новый guard:

| Действие | Разрешённый путь |
| --- | --- |
| Publish новой/существующей записи, Unpublish | Component adapter вызывает authenticated `/api/publications` с exact saved target. |
| Native Delete и восстановление выбранной версии с public эффектом | Узкий adapter существующего Payload REST catch-all распознаёт штатный запрос этих affordances и передаёт его coordinator; сохраняет native dialog, выбранную version ID и ожидаемый native response shape. Прочие запросы делегируются штатному REST handler. |
| Bulk public mutations, если они уже доступны | Тот же adapter принимает только явно выбранные IDs и выполняет отдельные идемпотентные target operations в общей очереди, возвращая результат по каждой записи; не публикует всю коллекцию. Новые bulk-возможности не добавляются. |
| Save draft и restore-as-draft | Штатный native путь без public activation; корректный draft restore не блокируется guard. |

Только adapter/coordinator устанавливает доверенный server-only context. Проверки auth/Origin/Host выполняются до передачи управления; прямой вызов guarded native operation с поддельным context отклоняется.

Новая операция и возобновление доставки различаются. **Retry сначала читает journal/receipt.** Если native commit уже подтверждён, повторно сохранять форму или выполнять native publish/restore/delete нельзя: возобновляются только проверка и доставка зафиксированного результата этой операции. Если успешная активация уже подтверждена, возвращается её receipt с актуальным delivery status, даже когда после неё появился новый draft; это не повторная активация старого контента. Для ещё не активированной операции изменение source другим действием остаётся конфликтом.

Порядок новой операции:

1. **Одно нажатие Publish** автоматически сохраняет именно текущие значения изменённой формы штатной draft-операцией, получает exact saved revision/source digest и продолжает публикацию. Отдельное предварительное нажатие Save draft не требуется. При ошибке сохранения публикация прекращается. Для version restore используется только явно выбранная историческая версия при совпадающем expected current state. Unpublish/Delete не сохраняют форму ради доставки. Более новая конкурентная revision не подхватывается неявно.
2. Authenticated `POST /api/publications` принимает target, operation, expected revision и idempotency key; сохраняет private intent с монотонным sequence. Повтор ключа с другим target/operation/source digest возвращает conflict. Сохраняются Origin/Host и native access checks.
3. Один CMS writer, защищённый lifetime data-root lock, последовательно выполняет public-changing операции. Сборка candidate начинается с **последней активной project map плюс целевое изменение**. Нельзя делать обычный Publish через полный `exportPayloadPublished`: он способен захватить чужую native-публикацию, чья доставка ранее не удалась.
4. Для Publish/restore-to-published выбранный target нормализуется через `releaseProjectDocument` / `prepareRecordAssets`. Для Unpublish/Delete candidate получается удалением stable target ID из active project map: проверяются оставшаяся коллекция и её resource closure, а не готовность целевого черновика к публикации. Неполный draft или отсутствующий новый draft asset не мешает снять опубликованный проект; такие материалы не экспортируются. Native auth/concurrency/delete guards сохраняются. Во всех случаях проверяются полный candidate contract и совместимость с активным renderer; candidate подготавливается в private staging и durably flush-ится до возможности активации.
5. В короткой native transaction повторно проверяются expected current revision/source digest и доверенный operation context. Выполняется native publish/unpublish/delete/restore; coordinator ждёт actual commit и фиксирует его фактическую committed revision/result отдельно от исходной выбранной версии. Собственный новый native version ID не считается внешним конфликтом при retry. Тяжёлая обработка assets остаётся вне этой транзакции.
6. Завершённый native-public candidate проверяет **тот же public reader с правами public процесса до смены active pointer**: через внутренний loopback candidate probe по content ID, без произвольных путей. Probe проверяет runtime/renderer compatibility, manifest и доступность/целостность файлов. Private draft staging не монтируется в public процесс; подготовленный к доставке canonical результат после native commit отделён от raw/private данных. Candidate не входит в public HTTP allowlist, а внутренний probe закрыт внешним proxy. Пока проверка не пройдена, посетитель получает прежнюю generation.
7. Под общей activation lock повторно проверяются base content ID, sequence, renderer identity и identity успешно проверенного candidate. Active descriptor заменяется атомарным rename на том же filesystem с flush файлов и родительского каталога. Затем reader подтверждает active content ID; journal получает receipt, UI — успех. Потеря ответа после успешного CAS сначала разрешается сверкой фактического pointer/readiness, а не слепым откатом. При подтверждённом отказе допускается только условный возврат last-good через CAS, без перезаписи более новой активации.
8. SQLite и filesystem не притворяются одной транзакцией: native revision может быть сохранена, но ещё не доставлена. Не откатывать authoring данные автоматически, чтобы скрыть такую ситуацию.

Guard в server-only context запрещает обход coordinator через прямой REST/Local API, bulk mutations, публикацию новой записи, restore-to-published и delete. Client JSON не может установить доверенный context. Обычные draft save и restore-as-draft сохраняются; отдельно учесть, что native restore устанавливает final draft status после beforeChange, чтобы guard не заблокировал корректное восстановление в черновик.

Для native version restore сохраняются оба эффекта: restore-as-draft ничего не публикует; операция с public эффектом доставляет ровно выбранную историческую версию через тот же coordinator. Никакого автоматического revert всей БД.

| Сбой / повтор | Обязательная реакция |
| --- | --- |
| Неполный upload, decoding, validation, disk или staging failure | Native публикация и active pointer не выполняются; рабочий сайт остаётся прежним. |
| Ошибка native commit | Prepared результат не активируется. |
| Commit есть, candidate readiness не пройдена или activation нет | Last-good pointer не меняется; private pending/error допускает явный retry той же revision. Старт CMS не публикует автоматически. |
| Pointer переключён, HTTP receipt потерян | Retry проверяет pointer/readiness и возвращает тот же результат; не создаёт лишнюю native version. |
| Более новая операция того же проекта уже активна | Незавершённый старый запрос получает superseded/conflict; прежний snapshot не активируется. Уже завершённый запрос возвращает свой receipt без повторного применения. |
| Успешно опубликован другой проект | Валидный явный retry пересобирает свой delta поверх нового base; чужое изменение сохраняется. |
| Draft изменился после запроса | Conflict/stale revision; нужен новый Publish выбранной версии. |
| Crash в неопределённом месте native commit | Сверить exact native revision/digest или факт delete; не выполнять операцию повторно вслепую. |

Publication lock и code activation используют согласованный lock/CAS protocol: смена renderer между проверкой и активацией не может включить несовместимую пару. Сохранять доступность обычного draft editing; не держать длительную SQLite transaction во время build или копирования файлов.

### 3.6. Preview с той же версией renderer

Native auth, `/preview` shell, private artifacts и capability delivery остаются в CMS. `preparePreviewRelease` берёт выбранный saved draft и **остальные проекты из active public generation**, а не из последних native `_status=published`. Private stable-ID mapping заменяет нужный проект даже при переименованном slug.

CMS читает active renderer descriptor и загружает exact prebuilt directory. Сохранить запрет symlink roots/entries: указатель — доверенный atomic descriptor, а не подмена root через `current` symlink. Cache/reuse key: `rendererId + baseContentId + savedRevision + owner + mode`.

После Portfolio release новый preview использует новый renderer без CMS restart. Старый artifact показывает свой renderer ID и явно отмечается устаревшим; его нельзя молча выдавать за актуальную проверку. При несовместимости — объяснимый отказ. Не подменять draft опубликованным проектом.

Сохранить 30-minute capability TTL, no-store/no-referrer/noindex, iframe sandbox без allow-same-origin, действующий CSP и проверки файлов. Токены, cookies и private IDs не включать в public JSON, внешние URL или логи. Preview compiler tests перемещаются к владельцу renderer; runtime artifact/privacy tests остаются у CMS. [Preview pipeline][preview], [private loader][preview-artifacts], [compiler][preview-compiler].

### 3.7. Маршрутизация

Единственное Next приложение после разделения — CMS, поэтому `assetPrefix`/`basePath` для разведения двух Next сборок не нужны. Точные CMS shell fonts перевести с пересекающегося `/fonts/*` на `/payload-assets/fonts/*`, сохранив bytes и вид.

| Внешний путь | Upstream / правило |
| --- | --- |
| `/`, `/projects`, `/projects/*`, `/404`, unknown public URL, robots/sitemap | Portfolio; существующий redirect `/projects`, правильные HTTP 404/noindex сохраняются. |
| `/assets/*`, `/__content/*`, `/fonts/*`, `/figma/*`, `/cursors/*`, approved favicon/social assets | Portfolio manifest allowlist. |
| Exact `/api/site-content` | Portfolio read-only active DTO; доступность не зависит от CMS. |
| `/admin` и дочерние, `/preview` и дочерние | CMS. |
| `/api/*`, кроме exact `/api/site-content` | CMS; native private APIs не открываются анонимно. |
| `/_next/*`, `/payload-assets/*` | CMS code assets. |
| Internal health/status, store files, arbitrary backend paths | Только loopback/оператор; public proxy не раскрывает внутренние endpoints. |

Для public upstream удалять Cookie/Authorization; authenticated CMS endpoints сохраняют Host/Origin и secure cookies. Capability artifact serving не требует и не получает CMS cookie. Preview token paths не писать в access logs. Unknown private API не превращать в public HTML fallback.

## 4. Последовательность исполнения и Git-группы

Одна coherent ветка/workstream, один writer. **По умолчанию ручной режим:** завершить Git-группу, выполнить достаточные проверки, создать commit, показать результат и ждать пользователя перед следующей группой. Отдельные группы не означают deploy после каждой. Переходить без ожидания можно только при последующем явном разрешении автономного исполнения.

Каждая группа наследует applicable implementation reviews из AGENTS. Для этого FULL/SHARED workstream нужны два последовательных review реализации с исправлениями: fidelity/completeness, затем regression/scope/risk. Два ревью данного плана их не заменяют. Не повторять зелёные проверки без изменения соответствующих inputs или найденного риска.

### G0. Подтвердить рабочую базу — preflight без реализации

**Target:** правильный checkout, exact baseline, свежие instructions и production metadata.

**Change:** после разрешения на исполнение проверить cwd, branch, HEAD, status с исключением USERSPACE, index и `git worktree list`. Dirty/untracked чужие файлы не трогать. Если Admin worktree занят, создать отдельный worktree/ветку от exact согласованной линии; не переносить работу через main или соседний Redesign. Сохранить этот план по стабильному пути вместе с первым содержательным commit.

**Expected result:** зафиксирована принадлежащая задаче область записи и исходная совместимость. Source baseline — ce3e80f; данные и deployed SHA перед выпуском подтверждаются отдельно.

**Verification:** match Git SHA/ref; ownership свободного worktree; текущие AGENTS/HANDOFF. Свежий read-only production preflight выполнить при доступности штатного OPS-контекста, не читая credentials. Если live code уже отличается materially от зафиксированного baseline, заблокировать зависимый перенос до согласования обновлённой базы; не делать автоматический merge. Невозможность сейчас связаться с VPS не мешает fixture-реализации G1–G6.

### G1. Зафиксировать delivery contract и pure snapshot reader

**Target:** `src/lib/project-contract.ts` / redesign contract как неизменяемая authoring граница; `tools/portfolio-release/project-snapshot.mjs`, `snapshot-directory.mjs`; новые `tools/portfolio-delivery/{contract,reader,asset-resolution}.mjs` и focused tests.

**Change:** реализовать public-delivery-v1, typed transport mapping, identities/capabilities, empty generation, manifest/bytes validation, trusted descriptor reader и generation-scoped resources. Повторно использовать узкие existing validators; не ослаблять старый v1 snapshot только ради empty state. Сформировать synthetic fixtures с двумя проектами, приватной меткой и конфликтующими/недостающими ресурсами, не копируя пользовательский sandbox.

**Expected result:** один immutable generation описывает всё необходимое public renderer; reader не импортирует Payload и не знает CMS secrets. Неизвестный блок, неправильный hash, path traversal, symlink, отсутствующий ресурс и несовместимый contract отвергаются до serving/activation.

**Verification:** producer/reader roundtrip; empty vs corrupt descriptor; deterministic digest; URL↔canonical mapping; AVIF/srcSet/package references; безопасная whole-collection validation. Focused tests на обоих концах shared boundary, lint затронутой логики. Наблюдаемый результат для ревью — accepted/rejected fixtures и пример безопасного DTO, без реальных данных.

### G2. Отделить public runtime и content-independent Portfolio build

**Target:** `tools/portfolio-release/release-host.mjs`, `prepare-site.mjs`, `content-source.mjs`, `tools/concept-v2/app/src/main-release.jsx` / `project-page/runtime-documents.mjs`, preview compiler, новые `tools/portfolio-runtime` entry points.

**Change:** обернуть handler в Node HTTP transport с корректными GET/HEAD, status, redirects, headers, stream/error handling и graceful shutdown. Подключить read-only generation reader. Убрать Git fallback из public/preview режима, оставив fixture input только в тестовом harness. Собирать public и preview shells без CMS data/secret и без встроенных проектов; сохранить отдельную подтверждённую allowlist code-owned fonts/icons/Corvo shell SVG.

Перенести сборку preview shell во владение Portfolio. Добавить явные root `portfolio:build`, `portfolio:start`, `portfolio:package`; root `build` направить на действующую public pipeline. Другие legacy файлы не удалять ради уборки. Артефакт содержит готовый host/bundles; start не вызывает Next/Vite/tsx compiler или сборку CMS.

**Expected result:** public приложение запускается из своего артефакта без Payload, CMS node_modules, SQLite и private mounts. Публикационная generation меняется без изменения JS/build ID. Подготовлен одновременно совместимый preview bundle.

**Verification:** адаптировать existing host/injection tests; запустить public artifact отдельно на fixtures; GET/HEAD главной/проектов/404/robots/sitemap/assets и missing routes. Проверить package CSP и no stale fallback. На одном renderer показать две content generations при неизменных bundle hashes, включая страницу A с последующей активацией B: её generation-A ресурсы сохраняют bytes A. Portfolio build/lint + затронутые renderer tests. CMS пока не перевыпускается.

### G3. Сделать подтверждённый Publish и защитить все обходные пути

**Target:** `tools/payload-admin/src/collections.ts`, `release-content.ts`, `release-export.ts`, native editor slots и существующий Payload REST catch-all adapter, новые `src/publication/*` и authenticated publication/status endpoints; fixture test runner.

**Change:** реализовать coordinator, private journal, revision/idempotency checks, serial public mutations, short native transaction и atomic activation protocol из раздела 3.5. Перевести Publish/Unpublish/публичное восстановление/Delete на этот путь, draft operations оставить native. Delivery status отразить в edit/list/toasts и для удалённой записи. Подключить чистый target mapper; обычный Publish не вызывает whole-CMS export.

**Expected result:** пользователь сохраняет черновик, проверяет и нажимает ту же Publish. Успех означает наблюдаемый целый public результат. Ошибка одной публикации не мешает сайту и не попадает на него через успешную публикацию другого проекта.

**Verification:** на temp native Payload пройти save/reopen/preview-preparation/publish/unpublish/delete/restore-as-draft/restore-to-published через реальные native UI affordances, включая уже имеющиеся bulk actions. Изменить поле и сразу нажать Publish: доставляется именно это значение; ошибка draft save не публикует прежнее. У опубликованного проекта сохранить неполный draft с отсутствующим новым asset: Unpublish/Delete убирают проект без экспорта этого draft и без потери остальных файлов. Проверить denial обхода coordinator и поддельного operation context. Fault injection по таблице раздела 3.5: candidate-reader/readiness failure при неизменном old pointer; same/different-project concurrency; draft-save race; retry после lost receipt/restart. Сценарий «native commit завершился → readiness упала → retry» не создаёт дополнительной native version; выбранная historical version восстанавливается при неизменном expected current state. CMS typecheck/lint и затронутые native/contract tests; весь suite только если изменена общая fixture инфраструктура.

### G4. Подключить активный preview renderer и закончить изоляцию CMS

**Target:** `src/preview.ts`, `preview-artifacts.ts`, preview page/CSS, CMS `scripts/run.mjs` / `state.mjs` / runtime settings / `next.config.mjs`; CMS public catch-all и site-content routing.

**Change:** CMS загружает Portfolio-owned preview shell через versioned descriptor; cache/artifact key включает identities из `3.6`. Остальные проекты preview берутся из active generation, selected draft overlay идёт по private stable-ID mapping. Включить актуальные/устаревшие/error состояния preview.

Убрать вызовы public/preview compiler из CMS build и их source dependencies из CMS start validation. Build/generate всегда используют собственный disposable fixture root и временный secret, даже если в shell заданы server env; не захватывают lock живой CMS. Start проверяет собственный готовый artifact + unchanged schema contract и удерживает единственный writer lock.

Удалить действующее public serving из CMS routes; `/api/site-content` передать public маршрутизации. CMS shell fonts выделить в `/payload-assets`. Существующие private media/delete guards, headers/CSP и native routes сохранить.

**Expected result:** CMS build/start не нуждаются в исходниках/полной сборке Portfolio. При Portfolio-only release CMS PID/build/session остаются теми же, а новый preview использует новый renderer. Приватные данные не выходят из CMS.

**Verification:** existing preview-runtime/http-session scenarios с новой base-generation моделью; native login/cookies, TTL, no-store, sandbox, token/referrer checks. Выполнить Portfolio-only update при работающем editor, получить новый preview и явный stale у старого. Проверить renamed slug overlay и чужой pending publish. Собрать/запустить CMS в отдельной распакованной директории без renderer исходников/Vite и без production data.

### G5. Упаковать независимые releases и подготовить безопасную эксплуатацию

**Target:** новые public/CMS package/verify tools; `tools/portfolio-release/package-runtime.mjs` — только подходящие reusable проверки; `docs/ops/PAYLOAD.md`, актуальная часть DEPLOY, новые шаблоны service/proxy и read-only preflight.

**Change:** сформировать два allowlisted артефакта с отдельными identities, checksums, health и start. Public — Node/Vite artifact; CMS — Linux-compatible Next standalone с необходимыми Sharp/libSQL native modules. Старый public packager, который удаляет `.node`/native dependencies, **не применять к CMS**. Packaged start не требует Git checkout, sourceHash соседнего приложения или build tools.

Ввести раздельные prepared-release/active descriptors и code rollback commands. Code activation под lock проверяет active content/renderer/CMS compatibility до переключения. Сохранить минимум два предыдущих совместимых code artifacts и все renderer bundles, на которые ещё ссылаются живые preview. Code rollback не выбирает прошлый content snapshot и не восстанавливает SQLite.

Подготовить proxy matrix `3.7`, минимальные права отдельного public service user и read-only public mount. CMS user остаётся единственным writer. Секрет и persistent data вне code releases. Не менять существующий SSH доступ.

**Expected result:** один artifact можно проверить, запустить, сменить и откатить независимо; файлы другой части, active content ID и данные не меняются. Build never Publish/seed/migrate.

**Verification:** после распаковки запустить каждый artifact без инструментов сборки другой части; проверить allowlists и отсутствие fixtures/private paths/secrets. CMS build на Linux той же архитектуры, что целевой runtime; не переносить Mac native binaries. Провести независимый code rollback на fixtures, включая отказ несовместимому артефакту. Измерить build wall time/peak RSS, idle runtime RSS, artifact/disk sizes **раздельно**. Шаблоны proxy/service проверить локально; production пока не менять.

Место сборки: public artifact можно готовить локально. CMS собирается в изолированном Linux окружении; использовать уже доступный внешний builder, если он есть. Иначе допустима отдельная fixture-сборка на текущем VPS только после OPS gate и resource preflight. Если RAM/disk недостаточно — остановить build; не покупать сервер, не менять swap и не рисковать работающим runtime автоматически. Измерения G5 делают последующий выбор конкретным.

### G6. Проверить систему целиком и подготовить release candidate

**Target:** единый disposable two-process fixture harness, текущие renderer/browser checks, final source/artifact manifests и эксплуатационный runbook.

**Change:** адаптировать существующие CMS release-proof/smoke session helpers к раздельным процессам и тестовой маршрутизации. Добавить только проверки нового blast radius из раздела 5. Завершить два review итоговой реализации, исправления и повтор затронутых проверок. Привязать evidence к exact финальному SHA/build identities; docs не должны описывать промежуточный combined runtime как итог.

**Expected result:** готов проверяемый кандидат, у которого подтверждены независимость выпусков, отказоустойчивость published сайта, private preview, публикация и code rollback. Production действие остаётся отдельным этапом.

**Verification:** обе code-only смены, остановка CMS, publication failures/retries/concurrency, данные и URL semantics, browser parity и regression matrix раздела 5. На final candidate — соответствующие build/lint/typecheck, focused/native/renderer suites один раз после последних изменений. Для пользовательской приёмки показать актуальные fixture runtime URLs, identities и конкретные сценарии. Зафиксировать остаточные ограничения только если они не нарушают acceptance.

**Commit и остановка:** предоставить exact candidate SHA, hashes двух artifacts, manifest compatibility, ресурсный отчёт, local rollback proof и готовый G7 runbook. Не выполнять push/PR/merge/deploy автоматически.

### G7. Перевести production — отдельный защищённый этап

Этот раздел делает переход исполнимым, но не разрешает его. Выполняется только после отдельной прямой команды пользователя на exact release targets и production действия. Merge/push согласуются по реальному Git-состоянию отдельно; не считать ce3e80f уже разрешённым main/release source.

**Target:** current VPS, actual Nginx config, существующий CMS data root и два проверенных code artifacts.

**Change / порядок:**

1. Read-only preflight: actual deployed SHA и service WorkingDirectory, безопасные hashes active public DTO/assets, schema fingerprint, aggregate metadata drafts/versions/accounts, свободные RAM/disk/loopback ports, exact включённый Nginx config. По текущему runbook активен regular file `/etc/nginx/sites-enabled/art-des`, не sites-available; подтвердить это заново. Текущий CMS порт 3001; новый public loopback порт выбрать из подтверждённо свободных, не перезапуская legacy standby.
2. До мутаций предъявить пользователю exact candidate/artifact hashes, port/user/path/proxy delta, совместимость, backup/rollback команды и короткое окно переключения. Новые OS-права, service/port/proxy и запись derived storage входят в это конкретное разрешение. Secrets не показывать и не ротировать.
3. Выполнить согласованный приватный consistent backup. На короткое окно остановить authoring mutations/старый writer, получить maintenance lock. Никогда не запускать два CMS writer. Проверить backup digest/closure; реальный restore ради теста не выполнять.
4. Из текущих **production published revisions и их native verified файлов** создать начальную derived public generation. Это read-only projection имеющейся CMS, не bootstrap/import в неё. Одноразовый helper работает под lock и не создаёт accounts/projects/versions/schema. Сравнить нормализованные public документы и все hashes материалов с fresh baseline; private mapping/journal не включать в artifact/Git.
5. Подготовить новый public процесс и CMS artifact с тем же data root/secret/schema. Проверить loopback readiness и идентичности до proxy switch. CMS startup не генерирует публикации и не обновляет контент. При отсутствии согласованного backup, parity или готовности не переключать маршрут.
6. Атомарно применить exact Nginx routing после config test и backup; выполнить reload. Public и CMS работают раздельно, при этом старые releases/config сохраняются. Если разрешение включает автоматический rollback при неудаче переключения — восстановить прежний combined code/proxy, **без DB/content restore**.
7. Проверить actual HTTPS главную/текущие проекты/404/robots/sitemap/assets, admin login и private API denials. Подтвердить неизменность нормализованного public содержимого, bytes и приватных aggregate digests, с учётом явно разрешённых operational session изменений. Не создавать тестовые проекты/материалы в production.
8. Обновить HANDOFF и актуальные ops docs exact identities и next action. Остановку CMS, fault injection и destructive проверки не повторять на production: это уже evidence G6. Реальный Publish или изменение пользовательского контента выполнять только по отдельной команде пользователя.

**Expected result:** прежний сайт и данные продолжают работать, но code lifecycle двух частей независим; current code/content/renderer однозначно идентифицируются.

**Verification:** actual HTTPS + parity + private aggregate proof + независимые service identities. При изменившемся production code, schema, provenance, secret или неоднозначной live-data дельте остановиться и обновить план перехода. Не переносить sandbox и не применять старый Des-art publisher/rollback data workflow.

## 5. Матрица приёмки и достаточные проверки

Все сценарии сначала выполняются на **новых явно изолированных fixtures**. Исторические PASS не считаются проверками нового кода.

| ID | Наблюдаемый критерий | Где подтвердить |
| --- | --- | --- |
| A1 | Portfolio-only изменение не запускает CMS build/restart; CMS PID, session, draft и cmsBuildId сохраняются. | G4/G6: process/build counters, browser editor и новый preview. |
| A2 | Admin-only изменение не запускает Portfolio build/restart и не меняет contentId/resources. | G5/G6: artifacts/PID/HTTP hashes. |
| A3 | При остановленной CMS public HTML, все опубликованные assets, sitemap/robots и 404 доступны; public restart также работает. | G6: два реальных процесса и manifest resource walk. |
| A4 | Save/reopen draft приватен; Publish target обновляет только его, без Git/build и чужого pending draft/publication. | G3/G6: native HTTP + public reader. |
| A5 | Partial upload, invalid contract/block, disk/native commit/activation/readiness failure сохраняют предыдущий целый результат и честный статус. | G3/G6: deterministic fault injection. |
| A6 | Retry, lost response, concurrent same/different targets, restart и stale completion не создают дублей и не возвращают старое состояние. | G3/G6: journal/native versions/active sequence. |
| A7 | Unpublish/delete/slug/order/placement, удаление последнего проекта и initial empty согласованно меняют routes/navigation/sitemap. | G1/G3/G6: source-contract + HTTP, no Git fallback. |
| A8 | Public и preview при одинаковых данных/renderer/viewport совпадают; новый public renderer появляется в preview без CMS build. | G4/G6: browser parity + IDs + Hero/adaptives. |
| A9 | Anonymous raw APIs/files/drafts недоступны; preview expires/no-store/sandbox, токены/cookies не утекли во внешний запрос или log. | G4/G6: auth/session/network/header checks. |
| A10 | Страница generation A продолжает получать ресурсы A после публикации B; image quality, AVIF и HTML package bytes сохраняются. | G2/G6: old-page assets, hashes, decoder/renderer tests. |
| A11 | Каждый artifact стартует самостоятельно; code rollback каждой части не меняет другую часть, БД и contentId. | G5/G6: clean unpack/start/release/rollback. |
| A12 | Перед/после production transition совпадают актуальные normalized public данные и asset hashes; drafts/versions/accounts сохраняются. | G7: свежие приватные aggregates и actual HTTPS. |
| A13 | Кодовая сборка без production root/secret/DB, без bootstrap/migration/Publish; RAM/disk failure не меняет active pointer. | G4–G6: fixture isolation, side-effect checks, resource gate. |
| A14 | Изменения визуально/поведенчески не регрессировали текущий Portfolio. | G6: перечисленный ниже focused browser маршрут. |

### Сохранение текущего интерфейса

Проверить главную на обычной и короткой высоте, оба текущих кейса и авторскую 404:

- Bg-main `#17191A`; Thin line отсутствует у resting home header и есть у pinned.
- Compact Experience, отступ от header, скрытие полосы, stopper непрерывного wheel до паузы, повторный вход без фантомного кадра.
- Собственное Experience smoothing: `smoothWheel: true`, `lerp: 0.1`, `wheelMultiplier: 1`; геометрия/travel/скорости сохранены. Проверить мышь и trackpad, а не только синтетический wheel.
- Единый Corvo hatch на двух сторонах без наложенного SVG; существующие другие штрих-блоки сохранены.
- Hero/scenes/adaptives, tooltip, morphs/copy-button width, contact animation, fixed-layout preloader и повторные тексты.
- Главная/кейсы индексируются; авторская `/404` и неизвестные public URL возвращают HTTP 404/noindex; нет missing images/fonts или нарушенного CSP.

Эти проверки следуют текущим [требованиям][requirements] и [regression evidence c735][production-report]. Не проводить общий редизайн-аудит и не менять старые визуальные решения «по ходу».

### Реальные entry points и новые команды

Уже существуют:

~~~sh
node --experimental-strip-types --test tests/payload-runtime-content.test.mjs tests/redesign-release-host.test.mjs
npm --prefix tools/concept-v2/app run lint
npm --prefix tools/concept-v2/app test
npm --prefix tools/payload-admin run typecheck
npm --prefix tools/payload-admin run lint
npm --prefix tools/payload-admin test
~~~

CMS `test` сам создаёт disposable root через `scripts/test.mjs`. Отдельные `*-session.ts` не запускать как самостоятельные тесты без их fixture/server wrapper. `test:smoke` и `scripts/release-proof.mjs` адаптируются к новой схеме; им нужны заранее подготовленные artifact/fixture окружения.

В G1–G6 добавить явные `portfolio:build/start/package`, CMS package/verify и один `separation:test` harness, который сам создаёт temp data roots, запускает два процесса на тестовых loopback ports и гарантированно завершает только собственные процессы. Имена новых команд — часть плана, **в baseline их ещё нет**. Harness не читает production env/.local и не обращается к VPS.

Запускать ближайшие проверки по затронутой группе; complete integration matrix — на финальном candidate. Не запускать root legacy build, старую Des-art Admin или повторный bootstrap как проверку разделения.

## 6. Stop-lines, возврат и условия завершения

Зависимый этап останавливается, если:

- нужен новый authoring/schema формат, DB migration, CMS upgrade, источник данных или неописанное изменение публикационного поведения;
- нельзя доказать exact revision/provenance, полный resource closure или совместимость renderer;
- actual production code уже другой и перенос может потерять изменения; чужой worktree занят;
- не обеспечен один CMS writer либо public процесс получает private data/secret access;
- для выпуска нужны неподтверждённые OS/service/port/access/secret/data изменения;
- failed publication/rollback может активировать старое состояние поверх нового;
- ресурсов не хватает для безопасной сборки/доставки без изменения активных приложений.

Независимую fixture-работу можно продолжать, если она остаётся полезной и не обходит блокировку. Не превращать такую остановку в автоматический merge, новый сервер, тест на реальной БД или подмену контента.

**Code rollback:** выбрать удерживаемый совместимый artifact только нужного приложения, проверить active contract/content, переключить code descriptor и перезапустить только его. Data roots, secret, native history и active content остаются прежними. Public rollback также переключает согласованный preview renderer descriptor; CMS заново определяет stale previews без rebuild. **Content rollback** — отдельная пользовательская публикация выбранной native historical revision через coordinator, не эффект возврата кода.

Для начального технического перехода сохраняется возможность вернуть прежний combined code/proxy без восстановления БД. После перехода не заявлять безопасность возврата к древнему combined runtime при любой будущей schema/contract дельте: сначала совместимость и отдельное разрешение.

**Локальная реализация завершена**, когда G1–G6 приняты, A1–A11/A13/A14 подтверждены на exact candidate, два implementation reviews закрыты, artifacts/runbook готовы и нет скрытых продуктовых/архитектурных решений. **Production переход завершён** только после отдельного разрешённого G7 и A12; до этого статус выпуска — «кандидат проверен локально, production не переключён».

При передаче Codex достаточно этого файла, указанного exact baseline и доступных repo instructions. Не создавать Goal и не назначать token budget по факту наличия плана.

## Источники

Все ссылки на репозиторий ниже закреплены на исследованном commit, кроме явно указанного исторического production report. Кодовые решения раздела 3 — предложения этого плана; наличие исходников не означает, что новые механизмы уже реализованы.

[requirements]: https://github.com/Qoalza/Design-portfolio-site/blob/ce3e80fd4c45d1f16c808f80c1f3e1686702e99c/docs/requirements/portfolio-payload-separation.md
[agents]: https://github.com/Qoalza/Design-portfolio-site/blob/ce3e80fd4c45d1f16c808f80c1f3e1686702e99c/AGENTS.md
[handoff]: https://github.com/Qoalza/Design-portfolio-site/blob/ce3e80fd4c45d1f16c808f80c1f3e1686702e99c/HANDOFF.md
[payload-ops]: https://github.com/Qoalza/Design-portfolio-site/blob/ce3e80fd4c45d1f16c808f80c1f3e1686702e99c/docs/ops/PAYLOAD.md
[production-report]: https://github.com/Qoalza/Design-portfolio-site/blob/4967a94876086ef26a03a07f81b0ec140e259e60/design-reference/payload-portfolio-fixes-2026-10-06/REPORT.md
[cms-run]: https://github.com/Qoalza/Design-portfolio-site/blob/ce3e80fd4c45d1f16c808f80c1f3e1686702e99c/tools/payload-admin/scripts/run.mjs
[host]: https://github.com/Qoalza/Design-portfolio-site/blob/ce3e80fd4c45d1f16c808f80c1f3e1686702e99c/tools/portfolio-release/release-host.mjs
[reader]: https://github.com/Qoalza/Design-portfolio-site/blob/ce3e80fd4c45d1f16c808f80c1f3e1686702e99c/tools/payload-admin/src/site/read-content.ts
[export]: https://github.com/Qoalza/Design-portfolio-site/blob/ce3e80fd4c45d1f16c808f80c1f3e1686702e99c/tools/payload-admin/src/release-export.ts
[collections]: https://github.com/Qoalza/Design-portfolio-site/blob/ce3e80fd4c45d1f16c808f80c1f3e1686702e99c/tools/payload-admin/src/collections.ts
[snapshot]: https://github.com/Qoalza/Design-portfolio-site/blob/ce3e80fd4c45d1f16c808f80c1f3e1686702e99c/tools/portfolio-release/project-snapshot.mjs
[runtime-documents]: https://github.com/Qoalza/Design-portfolio-site/blob/ce3e80fd4c45d1f16c808f80c1f3e1686702e99c/tools/concept-v2/app/src/project-page/runtime-documents.mjs
[preview]: https://github.com/Qoalza/Design-portfolio-site/blob/ce3e80fd4c45d1f16c808f80c1f3e1686702e99c/tools/payload-admin/src/preview.ts
[preview-artifacts]: https://github.com/Qoalza/Design-portfolio-site/blob/ce3e80fd4c45d1f16c808f80c1f3e1686702e99c/tools/payload-admin/src/preview-artifacts.ts
[preview-compiler]: https://github.com/Qoalza/Design-portfolio-site/blob/ce3e80fd4c45d1f16c808f80c1f3e1686702e99c/tools/payload-admin/scripts/preview/compiler.mjs
[image-policy]: https://github.com/Qoalza/Design-portfolio-site/blob/ce3e80fd4c45d1f16c808f80c1f3e1686702e99c/tools/payload-admin/src/materials/image-quality.ts
[image-source]: https://github.com/Qoalza/Design-portfolio-site/blob/ce3e80fd4c45d1f16c808f80c1f3e1686702e99c/src/lib/project-image-source.mjs
[package-policy]: https://github.com/Qoalza/Design-portfolio-site/blob/ce3e80fd4c45d1f16c808f80c1f3e1686702e99c/tools/payload-admin/src/materials/layout-package.ts
[payload-update]: https://github.com/payloadcms/payload/blob/v3.89.0/packages/payload/src/collections/operations/updateByID.ts
[payload-restore]: https://github.com/payloadcms/payload/blob/v3.89.0/packages/payload/src/collections/operations/restoreVersion.ts
[payload-slots]: https://github.com/payloadcms/payload/blob/v3.89.0/packages/payload/src/collections/config/types.ts
